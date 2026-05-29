"""Pydantic schemas for road-related API responses."""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class RoadProjectSummary(BaseModel):
    id: Optional[str]
    title: Optional[str]
    contractor_name: Optional[str]
    budget_sanctioned: Optional[float]
    budget_spent: Optional[float]
    last_relaying_date: Optional[datetime]
    status: Optional[str]
    is_anomalous: bool = False

    class Config:
        from_attributes = True


class RoadSegmentSummary(BaseModel):
    id: str
    name: str
    road_number: Optional[str]
    road_type: str
    condition_score: Optional[float]
    deterioration_risk: Optional[str]
    last_survey_date: Optional[datetime]
    predicted_failure_date: Optional[datetime]
    project: Optional[RoadProjectSummary]

    class Config:
        from_attributes = True


class NearbyRoadsResponse(BaseModel):
    roads: List[RoadSegmentSummary]
    count: int
    radius_km: float


class RoadProjectResponse(BaseModel):
    segment: dict
    projects: list

    class Config:
        from_attributes = True
