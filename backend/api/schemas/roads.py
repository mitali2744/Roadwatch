"""Pydantic schemas for road-related API responses."""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class RoadProjectSummary(BaseModel):
    id: Optional[str] = None
    title: Optional[str] = None
    contractor_name: Optional[str] = None
    budget_sanctioned: Optional[float] = None
    budget_spent: Optional[float] = None
    last_relaying_date: Optional[datetime] = None
    status: Optional[str] = None
    is_anomalous: bool = False

    class Config:
        from_attributes = True


class RoadSegmentSummary(BaseModel):
    id: str
    name: str
    road_number: Optional[str] = None
    road_type: str
    condition_score: Optional[float] = None
    deterioration_risk: Optional[str] = None
    last_survey_date: Optional[datetime] = None
    predicted_failure_date: Optional[datetime] = None
    project: Optional[RoadProjectSummary] = None

    class Config:
        from_attributes = True


# Alias used by roads.py
RoadSegmentResponse = RoadSegmentSummary


class NearbyRoadsResponse(BaseModel):
    roads: List[dict]
    count: int
    radius_km: float


class RoadProjectResponse(BaseModel):
    segment: dict
    projects: list

    class Config:
        from_attributes = True
