"""
Budget Anomaly Detector — flags suspicious road project spending.
Uses statistical analysis to identify:
1. Projects costing 3x+ the regional average
2. Same road repaired multiple times within 6 months
3. Budget spent > 150% of sanctioned amount
4. Projects with zero spending but marked complete
"""

import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from loguru import logger

from db.models import RoadProject, RoadSegment


async def run_anomaly_detection(db: AsyncSession, country_code: str = "IN") -> Dict:
    """
    Run full anomaly detection on all road projects.
    Returns summary of flagged projects.
    """
    result = await db.execute(
        select(RoadProject).where(RoadProject.country_code == country_code)
    )
    projects = result.scalars().all()

    if not projects:
        return {"flagged": 0, "total": 0, "anomalies": []}

    flagged = []
    budgets = [p.budget_sanctioned for p in projects if p.budget_sanctioned > 0]
    mean_budget = np.mean(budgets) if budgets else 0
    std_budget = np.std(budgets) if budgets else 1

    for project in projects:
        reasons = []

        # Rule 1: Budget 3x above mean (z-score > 2.5)
        if std_budget > 0:
            z_score = (project.budget_sanctioned - mean_budget) / std_budget
            if z_score > 2.5:
                reasons.append(
                    f"Budget {project.budget_sanctioned:,.0f} is {z_score:.1f} standard deviations above regional average ({mean_budget:,.0f})"
                )

        # Rule 2: Overspending (spent > 150% of sanctioned)
        if project.budget_sanctioned > 0 and project.budget_spent > 0:
            spend_ratio = project.budget_spent / project.budget_sanctioned
            if spend_ratio > 1.5:
                reasons.append(
                    f"Overspending: {spend_ratio:.1%} of sanctioned budget used ({project.budget_spent:,.0f} vs {project.budget_sanctioned:,.0f})"
                )

        # Rule 3: Completed but zero spending
        if project.status == "COMPLETED" and project.budget_spent == 0:
            reasons.append("Project marked COMPLETED but no spending recorded")

        # Rule 4: Repeated repairs (check if same road has another project within 6 months)
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
                reasons.append(
                    f"Road repaired {repeat_count} time(s) within 6 months — possible quality issue or duplicate billing"
                )

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

    return {
        "flagged": len(flagged),
        "total": len(projects),
        "mean_budget": round(mean_budget, 2),
        "anomalies": flagged[:20],  # Return top 20
    }
