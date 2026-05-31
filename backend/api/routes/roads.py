"""Roads API — road segment info, geo lookup, project details."""

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
import math

from db.database import get_db
from db.models import RoadSegment, RoadProject, Contractor, Authority
from api.schemas.roads import RoadSegmentResponse, RoadProjectResponse, NearbyRoadsResponse

router = APIRouter()


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in km between two lat/lon points."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.asin(math.sqrt(a))


@router.get("/nearby", response_model=NearbyRoadsResponse)
async def get_nearby_roads(
    lat: float = Query(...),
    lon: float = Query(...),
    radius_km: float = Query(5.0),
    db: AsyncSession = Depends(get_db),
):
    """Returns roads within radius_km of the given coordinates."""
    result = await db.execute(select(RoadSegment))
    all_segments = result.scalars().all()

    nearby = []
    for seg in all_segments:
        if seg.center_lat is None or seg.center_lon is None:
            continue
        dist = haversine_km(lat, lon, seg.center_lat, seg.center_lon)
        if dist <= radius_km:
            proj_result = await db.execute(
                select(RoadProject)
                .where(RoadProject.road_segment_id == seg.id)
                .order_by(RoadProject.created_at.desc())
                .limit(1)
            )
            project = proj_result.scalar_one_or_none()
            nearby.append({
                "id": str(seg.id),
                "name": seg.name,
                "road_number": seg.road_number,
                "road_type": seg.road_type,
                "condition_score": seg.condition_score,
                "deterioration_risk": seg.deterioration_risk,
                "last_survey_date": seg.last_survey_date,
                "predicted_failure_date": seg.predicted_failure_date,
                "project": {
                    "id": str(project.id) if project else None,
                    "title": project.title if project else None,
                    "contractor_name": None,
                    "budget_sanctioned": project.budget_sanctioned if project else None,
                    "budget_spent": project.budget_spent if project else None,
                    "last_relaying_date": project.last_relaying_date if project else None,
                    "status": project.status if project else None,
                    "is_anomalous": project.is_anomalous if project else False,
                } if project else None,
                "distance_km": round(dist, 2),
            })

    nearby.sort(key=lambda x: x["distance_km"])
    return {"roads": nearby[:20], "count": len(nearby[:20]), "radius_km": radius_km}


@router.get("/search/query")
async def search_roads(
    q: str = Query(..., min_length=2),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(RoadSegment)
        .where(
            RoadSegment.name.ilike(f"%{q}%")
            | RoadSegment.road_number.ilike(f"%{q}%")
        )
        .limit(10)
    )
    segments = result.scalars().all()
    return [
        {"id": str(s.id), "name": s.name, "road_number": s.road_number,
         "road_type": s.road_type, "state": s.state, "condition_score": s.condition_score}
        for s in segments
    ]


@router.get("/projects/anomalies")
async def get_budget_anomalies(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(RoadProject).where(RoadProject.is_anomalous == True).limit(50)
    )
    anomalies = result.scalars().all()
    return [
        {"id": str(p.id), "title": p.title, "budget_sanctioned": p.budget_sanctioned,
         "budget_spent": p.budget_spent, "anomaly_reason": p.anomaly_reason, "status": p.status}
        for p in anomalies
    ]


@router.get("/{road_id}", response_model=RoadProjectResponse)
async def get_road_detail(road_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RoadSegment).where(RoadSegment.id == road_id))
    segment = result.scalar_one_or_none()
    if not segment:
        raise HTTPException(status_code=404, detail="Road segment not found")

    proj_result = await db.execute(
        select(RoadProject)
        .where(RoadProject.road_segment_id == segment.id)
        .order_by(RoadProject.created_at.desc())
    )
    projects = proj_result.scalars().all()

    return {
        "segment": {
            "id": str(segment.id), "name": segment.name,
            "road_number": segment.road_number, "road_type": segment.road_type,
            "condition_score": segment.condition_score,
            "deterioration_risk": segment.deterioration_risk,
        },
        "projects": [
            {"id": str(p.id), "title": p.title, "budget_sanctioned": p.budget_sanctioned,
             "budget_spent": p.budget_spent, "last_relaying_date": p.last_relaying_date,
             "status": p.status, "is_anomalous": p.is_anomalous, "anomaly_reason": p.anomaly_reason}
            for p in projects
        ],
    }
