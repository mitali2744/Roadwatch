"""Roads API — road segment info, geo-fenced lookup, project details."""

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from geoalchemy2.functions import ST_DWithin, ST_GeomFromText, ST_AsGeoJSON
from typing import Optional, List
import json

from db.database import get_db
from db.models import RoadSegment, RoadProject, Contractor, Authority
from api.schemas.roads import (
    RoadSegmentResponse, RoadProjectResponse, NearbyRoadsResponse
)

router = APIRouter()


@router.get("/nearby", response_model=NearbyRoadsResponse)
async def get_nearby_roads(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    radius_km: float = Query(5.0, description="Search radius in km"),
    db: AsyncSession = Depends(get_db),
):
    """
    Geo-fenced lookup: returns roads within radius_km of the given coordinates.
    Includes road type, contractor, budget, last repair date, and condition score.
    """
    point_wkt = f"POINT({lon} {lat})"

    # Find road segments within radius (using PostGIS ST_DWithin)
    # 1 degree ≈ 111 km, so radius_km / 111 degrees
    radius_deg = radius_km / 111.0

    result = await db.execute(
        select(RoadSegment)
        .where(
            ST_DWithin(
                RoadSegment.geometry,
                ST_GeomFromText(point_wkt, 4326),
                radius_deg,
            )
        )
        .limit(20)
    )
    segments = result.scalars().all()

    roads_data = []
    for seg in segments:
        # Get latest project for this segment
        proj_result = await db.execute(
            select(RoadProject)
            .where(RoadProject.road_segment_id == seg.id)
            .order_by(RoadProject.created_at.desc())
            .limit(1)
        )
        project = proj_result.scalar_one_or_none()

        roads_data.append({
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
        })

    return {"roads": roads_data, "count": len(roads_data), "radius_km": radius_km}


@router.get("/{road_id}", response_model=RoadProjectResponse)
async def get_road_detail(road_id: str, db: AsyncSession = Depends(get_db)):
    """Full detail for a road segment including all projects, contractor scorecard, authority."""
    result = await db.execute(
        select(RoadSegment).where(RoadSegment.id == road_id)
    )
    segment = result.scalar_one_or_none()
    if not segment:
        raise HTTPException(status_code=404, detail="Road segment not found")

    # Get all projects
    proj_result = await db.execute(
        select(RoadProject)
        .where(RoadProject.road_segment_id == segment.id)
        .order_by(RoadProject.created_at.desc())
    )
    projects = proj_result.scalars().all()

    return {
        "segment": segment,
        "projects": projects,
    }


@router.get("/search/query")
async def search_roads(
    q: str = Query(..., min_length=2, description="Road name or number"),
    country: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Full-text search for roads by name or number."""
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
        {
            "id": str(s.id),
            "name": s.name,
            "road_number": s.road_number,
            "road_type": s.road_type,
            "state": s.state,
            "condition_score": s.condition_score,
        }
        for s in segments
    ]


@router.get("/projects/anomalies")
async def get_budget_anomalies(
    country: Optional[str] = Query("IN"),
    db: AsyncSession = Depends(get_db),
):
    """
    Budget Anomaly Detector — returns projects flagged as financially suspicious.
    Flags: cost > 3x regional average, repeated repairs within 6 months, etc.
    """
    result = await db.execute(
        select(RoadProject)
        .where(RoadProject.is_anomalous == True)
        .order_by(RoadProject.created_at.desc())
        .limit(50)
    )
    anomalies = result.scalars().all()
    return [
        {
            "id": str(p.id),
            "title": p.title,
            "budget_sanctioned": p.budget_sanctioned,
            "budget_spent": p.budget_spent,
            "anomaly_reason": p.anomaly_reason,
            "status": p.status,
        }
        for p in anomalies
    ]
