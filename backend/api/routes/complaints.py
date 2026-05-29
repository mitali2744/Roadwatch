"""
Complaints API — submit, track, route, and manage road complaints.
Includes AI severity scoring, smart routing, and immutable ledger.
"""

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from geoalchemy2.functions import ST_DWithin, ST_GeomFromText, ST_AsGeoJSON
from typing import Optional, List
import uuid
import os
import hashlib
import json
from datetime import datetime

from db.database import get_db
from db.models import Complaint, ComplaintStatus, ComplaintType, LedgerEntry, Authority, RoadSegment
from services.ml.severity_scorer import score_image_severity
from services.routing.complaint_router import route_complaint
from services.ledger.audit_chain import append_ledger_entry
from core.config import settings

router = APIRouter()


def generate_ticket_number() -> str:
    """Generate a human-readable ticket number like RW-2026-00001."""
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    short_id = str(uuid.uuid4())[:6].upper()
    return f"RW-{timestamp[:4]}-{short_id}"


@router.post("/submit")
async def submit_complaint(
    complaint_type: ComplaintType = Form(...),
    description: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    address: str = Form(""),
    reporter_name: str = Form("Anonymous"),
    reporter_phone: str = Form(""),
    reporter_email: str = Form(""),
    country_code: str = Form("IN"),
    submitted_offline: bool = Form(False),
    images: List[UploadFile] = File(default=[]),
    db: AsyncSession = Depends(get_db),
):
    """
    Submit a road complaint with optional image upload.
    - AI scores severity from uploaded images
    - Smart router assigns to correct authority
    - Ledger entry created for audit trail
    """
    # 1. Save uploaded images
    image_urls = []
    for img in images:
        if img.filename:
            ext = os.path.splitext(img.filename)[1].lower()
            if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
                raise HTTPException(status_code=400, detail=f"Unsupported image format: {ext}")
            filename = f"{uuid.uuid4()}{ext}"
            filepath = os.path.join(settings.UPLOAD_DIR, filename)
            os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
            content = await img.read()
            if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
                raise HTTPException(status_code=400, detail="Image too large")
            with open(filepath, "wb") as f:
                f.write(content)
            image_urls.append(f"/uploads/{filename}")

    # 2. AI Severity Scoring from first image
    ai_severity = None
    ai_confidence = None
    ai_damage_description = None
    if image_urls:
        first_image_path = os.path.join(settings.UPLOAD_DIR, os.path.basename(image_urls[0]))
        severity_result = await score_image_severity(first_image_path)
        ai_severity = severity_result["severity"]
        ai_confidence = severity_result["confidence"]
        ai_damage_description = severity_result["description"]

    # 3. Find nearest road segment
    point_wkt = f"POINT({longitude} {latitude})"
    road_result = await db.execute(
        select(RoadSegment)
        .where(
            ST_DWithin(
                RoadSegment.geometry,
                ST_GeomFromText(point_wkt, 4326),
                0.05,  # ~5.5 km
            )
        )
        .limit(1)
    )
    nearest_road = road_result.scalar_one_or_none()

    # 4. Smart complaint routing
    routing = await route_complaint(
        latitude=latitude,
        longitude=longitude,
        road_type=nearest_road.road_type if nearest_road else None,
        country_code=country_code,
        db=db,
    )

    # 5. Create complaint record
    ticket = generate_ticket_number()
    complaint = Complaint(
        ticket_number=ticket,
        reporter_name=reporter_name,
        reporter_phone=reporter_phone,
        reporter_email=reporter_email,
        latitude=latitude,
        longitude=longitude,
        location_point=f"SRID=4326;POINT({longitude} {latitude})",
        address=address,
        road_segment_id=nearest_road.id if nearest_road else None,
        complaint_type=complaint_type,
        description=description,
        image_urls=image_urls,
        ai_severity=ai_severity,
        ai_confidence=ai_confidence,
        ai_damage_description=ai_damage_description,
        routed_authority_id=routing.get("authority_id"),
        routing_reason=routing.get("reason"),
        status=ComplaintStatus.PENDING,
        status_history=[{
            "status": "PENDING",
            "timestamp": datetime.utcnow().isoformat(),
            "note": "Complaint submitted",
        }],
        submitted_offline=submitted_offline,
        country_code=country_code,
    )
    db.add(complaint)
    await db.flush()  # Get the ID

    # 6. Append to immutable ledger
    ledger_hash = await append_ledger_entry(
        complaint_id=str(complaint.id),
        action="SUBMITTED",
        actor=reporter_email or "ANONYMOUS",
        data={
            "ticket": ticket,
            "type": complaint_type,
            "severity": ai_severity,
            "routed_to": routing.get("authority_name"),
        },
        db=db,
    )
    complaint.ledger_hash = ledger_hash
    await db.commit()

    return {
        "success": True,
        "ticket_number": ticket,
        "complaint_id": str(complaint.id),
        "ai_severity": ai_severity,
        "ai_confidence": ai_confidence,
        "routed_to": routing.get("authority_name"),
        "routing_reason": routing.get("reason"),
        "message": f"Complaint submitted successfully. Ticket: {ticket}",
    }


@router.get("/track/{ticket_number}")
async def track_complaint(ticket_number: str, db: AsyncSession = Depends(get_db)):
    """Track complaint status by ticket number."""
    result = await db.execute(
        select(Complaint).where(Complaint.ticket_number == ticket_number.upper())
    )
    complaint = result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Get authority details
    authority = None
    if complaint.routed_authority_id:
        auth_result = await db.execute(
            select(Authority).where(Authority.id == complaint.routed_authority_id)
        )
        authority = auth_result.scalar_one_or_none()

    return {
        "ticket_number": complaint.ticket_number,
        "status": complaint.status,
        "complaint_type": complaint.complaint_type,
        "description": complaint.description,
        "ai_severity": complaint.ai_severity,
        "ai_damage_description": complaint.ai_damage_description,
        "image_urls": complaint.image_urls,
        "address": complaint.address,
        "routed_to": {
            "name": authority.name if authority else None,
            "type": authority.authority_type if authority else None,
            "contact": authority.contact_phone if authority else None,
            "engineer": authority.executive_engineer_name if authority else None,
        },
        "status_history": complaint.status_history,
        "ledger_hash": complaint.ledger_hash,
        "submitted_at": complaint.created_at,
    }


@router.get("/nearby/heatmap")
async def get_complaint_heatmap(
    lat: float = Query(...),
    lon: float = Query(...),
    radius_km: float = Query(10.0),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns complaint coordinates for heatmap rendering.
    Used by the live crowdsourced heatmap feature.
    """
    radius_deg = radius_km / 111.0
    point_wkt = f"POINT({lon} {lat})"

    result = await db.execute(
        select(
            Complaint.latitude,
            Complaint.longitude,
            Complaint.ai_severity,
            Complaint.complaint_type,
            Complaint.status,
        )
        .where(
            ST_DWithin(
                Complaint.location_point,
                ST_GeomFromText(point_wkt, 4326),
                radius_deg,
            )
        )
        .limit(500)
    )
    rows = result.all()

    # Weight by severity for heatmap intensity
    severity_weight = {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 5}
    points = [
        {
            "lat": r.latitude,
            "lon": r.longitude,
            "weight": severity_weight.get(r.ai_severity, 1),
            "type": r.complaint_type,
            "status": r.status,
        }
        for r in rows
    ]
    return {"points": points, "count": len(points)}


@router.patch("/{complaint_id}/status")
async def update_complaint_status(
    complaint_id: str,
    new_status: ComplaintStatus,
    note: str = "",
    actor: str = "AUTHORITY",
    db: AsyncSession = Depends(get_db),
):
    """Update complaint status (for authority use). Appends to ledger."""
    result = await db.execute(
        select(Complaint).where(Complaint.id == complaint_id)
    )
    complaint = result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    old_status = complaint.status
    complaint.status = new_status
    history = complaint.status_history or []
    history.append({
        "status": new_status,
        "timestamp": datetime.utcnow().isoformat(),
        "note": note,
        "actor": actor,
    })
    complaint.status_history = history

    # Append to immutable ledger
    ledger_hash = await append_ledger_entry(
        complaint_id=complaint_id,
        action="STATUS_CHANGED",
        actor=actor,
        data={"from": old_status, "to": new_status, "note": note},
        db=db,
    )
    complaint.ledger_hash = ledger_hash
    await db.commit()

    return {"success": True, "new_status": new_status, "ledger_hash": ledger_hash}
