"""
Budget Anomaly Detector — flags suspicious road project spending.
Pure Python implementation (no numpy/pandas dependency).
"""

import statistics
from datetime import datetime, timedelta
from typing import List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from loguru import logger

from db.models import RoadProject


async def run_anomaly_detection(db: AsyncSession, country_code: str = "IN") -> Dict:
    result = await db.execute(
        select(RoadProject).where(RoadProject.country_code == country_code)
    )
    projects = result.scalars().all()

    if not projects:
        return {"flagged": 0, "total": 0, "anomalies": []}

    budgets = [p.budget_sanctioned for p in projects if p.budget_sanctioned and p.budget_sanctioned > 0]
    mean_budget = statistics.mean(budgets) if budgets else 0
    stdev_budget = statistics.stdev(budgets) if len(budgets) > 1 else 1

    flagged = []
    for project in projects:
        reasons = []

        # Rule 1: Budget 3x above mean (z-score > 2.5)
        if stdev_budget > 0 and project.budget_sanctioned:
            z_score = (project.budget_sanctioned - mean_budget) / stdev_budget
            if z_score > 2.5:
                reasons.append(
                    f"Budget {project.budget_sanctioned:,.0f} is {z_score:.1f} std deviations above average ({mean_budget:,.0f})"
                )

        # Rule 2: Overspending > 150%
        if project.budget_sanctioned and project.budget_spent and project.budget_sanctioned > 0:
            ratio = project.budget_spent / project.budget_sanctioned
            if ratio > 1.5:
                reasons.append(f"Overspending: {ratio:.1%} of sanctioned budget used")

        # Rule 3: Completed but zero spending
        if project.status == "COMPLETED" and (not project.budget_spent or project.budget_spent == 0):
            reasons.append("Project marked COMPLETED but no spending recorded")

        # Rule 4: Repeated repairs within 6 months
        if project.road_segment_id and project.start_date:
            six_months_before = project.start_date - timedelta(days=180)
            repeat_result = await db.execute(
                select(func.count(RoadProject.id))
                .where(
                    RoadProject.road_segment_id == project.road_segment_id,
                    RoadProject.id != project.id,
                    RoadProject.start_date >= six_months_before,
                    RoadProject.start_date <= project.start_date,
                )
            )
            repeat_count = repeat_result.scalar() or 0
            if repeat_count > 0:
                reasons.append(f"Road repaired {repeat_count} time(s) within 6 months")

        if reasons:
            project.is_anomalous = True
            project.anomaly_reason = " | ".join(reasons)
            flagged.append({
                "project_id": str(project.id),
                "title": project.title,
                "budget_sanctioned": project.budget_sanctioned,
                "budget_spent": project.budget_spent,
                "reasons": reasons,
            })

    await db.commit()
    logger.info(f"Anomaly detection: {len(flagged)}/{len(projects)} projects flagged")
    return {"flagged": len(flagged), "total": len(projects), "mean_budget": round(mean_budget, 2), "anomalies": flagged[:20]}
