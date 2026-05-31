"""
Predictive Road Deterioration Model — pure Python, no numpy/scikit-learn.
Predicts when a road segment will fail based on age, complaints, contractor quality.
"""

import math
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from loguru import logger

from db.models import RoadSegment, Complaint, RoadProject, Contractor


# Expected lifespan in years by road type (India standards)
ROAD_LIFESPAN = {
    "NH": 10,
    "SH": 8,
    "MDR": 6,
    "ODR": 5,
    "VR": 4,
    "LOCAL": 3,
    "EXPRESSWAY": 15,
}

# Deterioration multipliers
WEATHER_FACTOR = 1.2   # Monsoon-heavy regions deteriorate faster
TRAFFIC_FACTOR = 1.15  # High-traffic roads deteriorate faster


async def predict_road_deterioration(
    road_segment_id: str,
    db: AsyncSession,
) -> Optional[Dict[str, Any]]:
    """
    Predict deterioration for a single road segment.
    Returns predicted failure date and risk level.
    """
    # Fetch road segment
    result = await db.execute(
        select(RoadSegment).where(RoadSegment.id == road_segment_id)
    )
    segment = result.scalar_one_or_none()
    if not segment:
        return None

    # Fetch latest project
    proj_result = await db.execute(
        select(RoadProject)
        .where(RoadProject.road_segment_id == segment.id)
        .order_by(RoadProject.last_relaying_date.desc().nullslast())
        .limit(1)
    )
    project = proj_result.scalar_one_or_none()

    # Fetch complaint frequency (last 12 months)
    one_year_ago = datetime.utcnow() - timedelta(days=365)
    complaint_result = await db.execute(
        select(func.count(Complaint.id))
        .where(
            Complaint.road_segment_id == segment.id,
            Complaint.created_at >= one_year_ago,
        )
    )
    complaint_count = complaint_result.scalar() or 0

    # Fetch contractor quality
    contractor_score = 50.0  # default
    if project and project.contractor_id:
        cont_result = await db.execute(
            select(Contractor).where(Contractor.id == project.contractor_id)
        )
        contractor = cont_result.scalar_one_or_none()
        if contractor:
            contractor_score = contractor.trust_score

    # ── Prediction Algorithm ──────────────────────────────────────────────────

    road_type = segment.road_type.value if hasattr(segment.road_type, 'value') else str(segment.road_type)
    base_lifespan_years = ROAD_LIFESPAN.get(road_type, 5)

    # Last repair date
    last_repair = None
    if project and project.last_relaying_date:
        last_repair = project.last_relaying_date
    elif project and project.actual_end_date:
        last_repair = project.actual_end_date

    if last_repair is None:
        last_repair = datetime.utcnow() - timedelta(days=365 * 3)  # assume 3 years old

    age_years = (datetime.utcnow() - last_repair).days / 365.0

    # Adjust lifespan based on factors
    # Poor contractor → shorter lifespan
    contractor_multiplier = 1.0 + (50 - contractor_score) / 200  # 0.75 to 1.25
    # High complaints → faster deterioration
    complaint_multiplier = 1.0 + min(complaint_count / 10, 0.5)
    # Weather and traffic
    adjusted_lifespan = base_lifespan_years / (
        contractor_multiplier * complaint_multiplier * WEATHER_FACTOR
    )

    # Remaining life
    remaining_years = max(adjusted_lifespan - age_years, 0)
    predicted_failure = datetime.utcnow() + timedelta(days=remaining_years * 365)

    # Condition score (0-100, 100=perfect)
    condition_score = max(0, 100 * (1 - age_years / adjusted_lifespan))

    # Risk level
    if remaining_years < 0.5:
        risk = "CRITICAL"
    elif remaining_years < 1.5:
        risk = "HIGH"
    elif remaining_years < 3:
        risk = "MEDIUM"
    else:
        risk = "LOW"

    # Update segment in DB
    segment.condition_score = round(condition_score, 2)
    segment.predicted_failure_date = predicted_failure
    segment.deterioration_risk = risk
    await db.commit()

    return {
        "road_segment_id": road_segment_id,
        "road_name": segment.name,
        "road_type": road_type,
        "age_years": round(age_years, 2),
        "adjusted_lifespan_years": round(adjusted_lifespan, 2),
        "remaining_life_years": round(remaining_years, 2),
        "predicted_failure_date": predicted_failure.isoformat(),
        "condition_score": round(condition_score, 2),
        "deterioration_risk": risk,
        "complaint_count_12mo": complaint_count,
        "contractor_score": contractor_score,
        "recommendation": _get_recommendation(risk, remaining_years),
    }


async def batch_predict_all_roads(db: AsyncSession) -> int:
    """Run predictions for all road segments. Returns count updated."""
    result = await db.execute(select(RoadSegment))
    segments = result.scalars().all()
    count = 0
    for segment in segments:
        try:
            await predict_road_deterioration(str(segment.id), db)
            count += 1
        except Exception as e:
            logger.error(f"Prediction failed for {segment.id}: {e}")
    return count


def _get_recommendation(risk: str, remaining_years: float) -> str:
    if risk == "CRITICAL":
        return "⚠️ URGENT: Road requires immediate repair. Safety risk to road users."
    elif risk == "HIGH":
        return f"Schedule repair within 6 months. Estimated {remaining_years:.1f} years of useful life remaining."
    elif risk == "MEDIUM":
        return f"Plan maintenance in the next 1-2 years. {remaining_years:.1f} years estimated remaining."
    else:
        return f"Road in good condition. Next maintenance recommended in ~{remaining_years:.1f} years."
