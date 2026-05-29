"""
Predictions API — ML-powered road deterioration forecasting.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional

from db.database import get_db
from services.ml.deterioration_model import predict_road_deterioration, batch_predict_all_roads

router = APIRouter()


class PredictionRequest(BaseModel):
    road_segment_id: str
    force_refresh: bool = False


@router.post("/deterioration")
async def predict_deterioration(
    request: PredictionRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Predictive Road Deterioration Model.
    Predicts when a road segment is likely to fail based on:
    - Road age and last repair date
    - Historical complaint frequency
    - Weather patterns (rainfall, temperature)
    - Traffic load estimates
    - Contractor quality score
    
    Returns: predicted failure date, risk level, recommended action.
    """
    result = await predict_road_deterioration(
        road_segment_id=request.road_segment_id,
        db=db,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Road segment not found")
    return result


@router.post("/batch-update")
async def batch_update_predictions(db: AsyncSession = Depends(get_db)):
    """
    Run deterioration predictions for all road segments.
    Typically called by a scheduled job (cron).
    """
    count = await batch_predict_all_roads(db=db)
    return {"updated": count, "message": f"Updated predictions for {count} road segments"}
