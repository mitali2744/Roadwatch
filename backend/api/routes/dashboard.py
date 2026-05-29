"""
Dashboard API — transparency metrics, budget analysis, contractor scorecards.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from typing import Optional

from db.database import get_db
from db.models import RoadProject, Complaint, Contractor, Authority, ComplaintStatus

router = APIRouter()


@router.get("/overview")
async def get_dashboard_overview(
    country_code: str = Query("IN"),
    state: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Main dashboard overview — budget totals, complaint stats, project counts.
    """
    # Budget stats
    budget_result = await db.execute(
        select(
            func.sum(RoadProject.budget_sanctioned).label("total_sanctioned"),
            func.sum(RoadProject.budget_spent).label("total_spent"),
            func.count(RoadProject.id).label("total_projects"),
            func.sum(case((RoadProject.is_anomalous == True, 1), else_=0)).label("anomalous_count"),
        ).where(RoadProject.country_code == country_code)
    )
    budget_row = budget_result.one()

    # Complaint stats
    complaint_result = await db.execute(
        select(
            func.count(Complaint.id).label("total"),
            func.sum(case((Complaint.status == ComplaintStatus.PENDING, 1), else_=0)).label("pending"),
            func.sum(case((Complaint.status == ComplaintStatus.RESOLVED, 1), else_=0)).label("resolved"),
            func.sum(case((Complaint.status == ComplaintStatus.IN_PROGRESS, 1), else_=0)).label("in_progress"),
        ).where(Complaint.country_code == country_code)
    )
    complaint_row = complaint_result.one()

    return {
        "budget": {
            "total_sanctioned": float(budget_row.total_sanctioned or 0),
            "total_spent": float(budget_row.total_spent or 0),
            "utilization_pct": round(
                (float(budget_row.total_spent or 0) / max(float(budget_row.total_sanctioned or 1), 1)) * 100, 2
            ),
            "total_projects": budget_row.total_projects or 0,
            "anomalous_projects": budget_row.anomalous_count or 0,
        },
        "complaints": {
            "total": complaint_row.total or 0,
            "pending": complaint_row.pending or 0,
            "in_progress": complaint_row.in_progress or 0,
            "resolved": complaint_row.resolved or 0,
            "resolution_rate": round(
                (int(complaint_row.resolved or 0) / max(int(complaint_row.total or 1), 1)) * 100, 2
            ),
        },
    }


@router.get("/contractors/scorecards")
async def get_contractor_scorecards(
    country_code: str = Query("IN"),
    limit: int = Query(20),
    db: AsyncSession = Depends(get_db),
):
    """
    Contractor Accountability Scorecards — ranked by trust score.
    Shows on-time rate, re-complaint rate, budget adherence, citizen rating.
    """
    result = await db.execute(
        select(Contractor)
        .where(Contractor.country_code == country_code)
        .order_by(Contractor.trust_score.desc())
        .limit(limit)
    )
    contractors = result.scalars().all()

    return [
        {
            "id": str(c.id),
            "name": c.name,
            "trust_score": c.trust_score,
            "on_time_rate": c.on_time_rate,
            "re_complaint_rate": c.re_complaint_rate,
            "budget_adherence": c.budget_adherence,
            "citizen_rating": c.citizen_rating,
            "total_projects": c.total_projects,
            "completed_projects": c.completed_projects,
            "grade": _score_to_grade(c.trust_score),
        }
        for c in contractors
    ]


@router.get("/budget/by-state")
async def get_budget_by_state(
    country_code: str = Query("IN"),
    db: AsyncSession = Depends(get_db),
):
    """Budget breakdown by state for bar/pie charts."""
    result = await db.execute(
        select(
            RoadProject.country_code,
            func.sum(RoadProject.budget_sanctioned).label("sanctioned"),
            func.sum(RoadProject.budget_spent).label("spent"),
            func.count(RoadProject.id).label("projects"),
        )
        .where(RoadProject.country_code == country_code)
        .group_by(RoadProject.country_code)
    )
    rows = result.all()
    return [
        {
            "region": r.country_code,
            "sanctioned": float(r.sanctioned or 0),
            "spent": float(r.spent or 0),
            "projects": r.projects,
        }
        for r in rows
    ]


@router.get("/complaints/by-type")
async def get_complaints_by_type(
    country_code: str = Query("IN"),
    db: AsyncSession = Depends(get_db),
):
    """Complaint breakdown by type for pie chart."""
    result = await db.execute(
        select(
            Complaint.complaint_type,
            func.count(Complaint.id).label("count"),
        )
        .where(Complaint.country_code == country_code)
        .group_by(Complaint.complaint_type)
    )
    rows = result.all()
    return [{"type": r.complaint_type, "count": r.count} for r in rows]


@router.get("/complaints/by-severity")
async def get_complaints_by_severity(
    country_code: str = Query("IN"),
    db: AsyncSession = Depends(get_db),
):
    """Complaint breakdown by AI-assessed severity."""
    result = await db.execute(
        select(
            Complaint.ai_severity,
            func.count(Complaint.id).label("count"),
        )
        .where(Complaint.country_code == country_code)
        .group_by(Complaint.ai_severity)
    )
    rows = result.all()
    return [{"severity": r.ai_severity, "count": r.count} for r in rows]


@router.get("/predictions/at-risk")
async def get_at_risk_roads(
    country_code: str = Query("IN"),
    db: AsyncSession = Depends(get_db),
):
    """Roads predicted to deteriorate in the next 90 days."""
    from db.models import RoadSegment
    from datetime import datetime, timedelta

    cutoff = datetime.utcnow() + timedelta(days=90)
    result = await db.execute(
        select(RoadSegment)
        .where(
            RoadSegment.predicted_failure_date <= cutoff,
            RoadSegment.country_code == country_code,
        )
        .order_by(RoadSegment.predicted_failure_date.asc())
        .limit(50)
    )
    roads = result.scalars().all()
    return [
        {
            "id": str(r.id),
            "name": r.name,
            "road_number": r.road_number,
            "road_type": r.road_type,
            "condition_score": r.condition_score,
            "deterioration_risk": r.deterioration_risk,
            "predicted_failure_date": r.predicted_failure_date,
        }
        for r in roads
    ]


def _score_to_grade(score: float) -> str:
    if score >= 85:
        return "A"
    elif score >= 70:
        return "B"
    elif score >= 55:
        return "C"
    elif score >= 40:
        return "D"
    else:
        return "F"
