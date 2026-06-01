"""Complaints API — submit, track, route, and manage road complaints."""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
import uuid, os, math
from datetime import datetime

from db.database import get_db
from db.models import Complaint, ComplaintStatus, ComplaintType, LedgerEntry, Authority, RoadSegment, WorkUpdate, User, UserRole
from services.ml.severity_scorer import score_image_severity
from services.routing.complaint_router import route_complaint
from services.ledger.audit_chain import append_ledger_entry
from core.config import settings

router = APIRouter()


def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.asin(math.sqrt(a))


def generate_ticket_number() -> str:
    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    return f"RW-{ts[:4]}-{str(uuid.uuid4())[:6].upper()}"


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
    # 1. Save images
    image_urls = []
    for img in images:
        if img.filename:
            ext = os.path.splitext(img.filename)[1].lower()
            if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
                raise HTTPException(status_code=400, detail=f"Unsupported format: {ext}")
            filename = f"{uuid.uuid4()}{ext}"
            filepath = os.path.join(settings.UPLOAD_DIR, filename)
            os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
            content = await img.read()
            with open(filepath, "wb") as f:
                f.write(content)
            image_urls.append(f"/uploads/{filename}")

    # 2. AI severity scoring
    ai_severity = ai_confidence = ai_damage_description = None
    if image_urls:
        first_path = os.path.join(settings.UPLOAD_DIR, os.path.basename(image_urls[0]))
        result = await score_image_severity(first_path)
        ai_severity = result["severity"]
        ai_confidence = result["confidence"]
        ai_damage_description = result["description"]

    # 3. Find nearest road segment (plain distance math)
    nearest_road = None
    seg_result = await db.execute(select(RoadSegment))
    all_segs = seg_result.scalars().all()
    min_dist = float("inf")
    for seg in all_segs:
        if seg.center_lat and seg.center_lon:
            d = haversine_km(latitude, longitude, seg.center_lat, seg.center_lon)
            if d < min_dist:
                min_dist = d
                nearest_road = seg

    # 4. Smart routing
    routing = await route_complaint(
        latitude=latitude, longitude=longitude,
        road_type=nearest_road.road_type if nearest_road else None,
        country_code=country_code, db=db,
    )

    # 5. Create complaint
    ticket = generate_ticket_number()
    complaint = Complaint(
        ticket_number=ticket,
        reporter_name=reporter_name, reporter_phone=reporter_phone,
        reporter_email=reporter_email, latitude=latitude, longitude=longitude,
        address=address,
        road_segment_id=nearest_road.id if nearest_road else None,
        complaint_type=complaint_type, description=description,
        image_urls=image_urls, ai_severity=ai_severity,
        ai_confidence=ai_confidence, ai_damage_description=ai_damage_description,
        routed_authority_id=routing.get("authority_id"),
        routing_reason=routing.get("reason"),
        status=ComplaintStatus.PENDING,
        status_history=[{"status": "PENDING", "timestamp": datetime.utcnow().isoformat(), "note": "Submitted"}],
        submitted_offline=submitted_offline, country_code=country_code,
    )
    db.add(complaint)
    await db.flush()

    # 6. Ledger entry
    ledger_hash = await append_ledger_entry(
        complaint_id=str(complaint.id), action="SUBMITTED",
        actor=reporter_email or "ANONYMOUS",
        data={"ticket": ticket, "type": str(complaint_type), "severity": ai_severity,
              "routed_to": routing.get("authority_name")},
        db=db,
    )
    complaint.ledger_hash = ledger_hash
    await db.commit()

    return {
        "success": True, "ticket_number": ticket,
        "complaint_id": str(complaint.id),
        "ai_severity": ai_severity, "ai_confidence": ai_confidence,
        "routed_to": routing.get("authority_name"),
        "routing_reason": routing.get("reason"),
        "message": f"Complaint submitted. Ticket: {ticket}",
    }


@router.get("/track/{ticket_number}")
async def track_complaint(ticket_number: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Complaint).where(Complaint.ticket_number == ticket_number.upper())
    )
    complaint = result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

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
    lat: float = Query(...), lon: float = Query(...),
    radius_km: float = Query(10.0),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Complaint))
    all_complaints = result.scalars().all()

    severity_weight = {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 5}
    points = []
    for c in all_complaints:
        dist = haversine_km(lat, lon, c.latitude, c.longitude)
        if dist <= radius_km:
            points.append({
                "lat": c.latitude, "lon": c.longitude,
                "weight": severity_weight.get(str(c.ai_severity), 1),
                "type": str(c.complaint_type), "status": str(c.status),
            })

    return {"points": points[:500], "count": len(points)}


@router.patch("/{complaint_id}/status")
async def update_complaint_status(
    complaint_id: str, new_status: ComplaintStatus,
    note: str = "", actor: str = "AUTHORITY",
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Complaint).where(Complaint.id == complaint_id))
    complaint = result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    old_status = complaint.status
    complaint.status = new_status
    history = complaint.status_history or []
    history.append({"status": str(new_status), "timestamp": datetime.utcnow().isoformat(),
                    "note": note, "actor": actor})
    complaint.status_history = history

    ledger_hash = await append_ledger_entry(
        complaint_id=complaint_id, action="STATUS_CHANGED", actor=actor,
        data={"from": str(old_status), "to": str(new_status), "note": note}, db=db,
    )
    complaint.ledger_hash = ledger_hash
    await db.commit()
    return {"success": True, "new_status": new_status, "ledger_hash": ledger_hash}


@router.get("/public/feed")
async def get_public_complaints_feed(
    skip: int = Query(0), limit: int = Query(20),
    status_filter: Optional[str] = Query(None),
    severity_filter: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Public API — list all complaints with progress for public visibility."""
    query = select(Complaint)
    
    if status_filter:
        query = query.where(Complaint.status == status_filter)
    if severity_filter:
        query = query.where(Complaint.ai_severity == severity_filter)
    
    query = query.order_by(Complaint.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    complaints = result.scalars().all()
    
    feed = []
    for c in complaints:
        contractor_name = None
        if c.assigned_contractor_id:
            cont_result = await db.execute(
                select(User).where(User.id == c.assigned_contractor_id)
            )
            cont = cont_result.scalar_one_or_none()
            contractor_name = cont.name if cont else "Unknown"
        
        feed.append({
            "id": str(c.id),
            "ticket_number": c.ticket_number,
            "type": str(c.complaint_type),
            "status": str(c.status),
            "severity": str(c.ai_severity) if c.ai_severity else "UNKNOWN",
            "address": c.address or "Location not specified",
            "progress_percentage": c.progress_percentage,
            "assigned_contractor": contractor_name,
            "image_urls": c.image_urls,
            "submitted_at": c.created_at.isoformat(),
            "updated_at": c.updated_at.isoformat(),
        })
    
    return {"complaints": feed, "total": len(feed), "skip": skip, "limit": limit}


@router.get("/{complaint_id}/work-updates")
async def get_work_updates(complaint_id: str, db: AsyncSession = Depends(get_db)):
    """Get timeline of work updates on a complaint."""
    result = await db.execute(
        select(WorkUpdate)
        .where(WorkUpdate.complaint_id == complaint_id)
        .order_by(WorkUpdate.created_at.asc())
    )
    updates = result.scalars().all()
    
    timeline = []
    for update in updates:
        user_result = await db.execute(
            select(User).where(User.id == update.updated_by_user_id)
        )
        user = user_result.scalar_one_or_none()
        
        timeline.append({
            "id": str(update.id),
            "progress": update.progress_percentage,
            "note": update.update_note,
            "before_image": update.before_image_url,
            "after_image": update.after_image_url,
            "updated_by": user.name if user else "Unknown",
            "updated_by_role": str(user.role) if user else "UNKNOWN",
            "timestamp": update.created_at.isoformat(),
        })
    
    return {"complaint_id": complaint_id, "updates": timeline, "total": len(timeline)}


@router.post("/{complaint_id}/work-updates")
async def add_work_update(
    complaint_id: str,
    progress_percentage: int = Form(...),
    update_note: str = Form(""),
    updated_by_email: str = Form(...),
    before_image: Optional[UploadFile] = File(None),
    after_image: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
):
    """Admin/Contractor adds work progress update on a complaint."""
    # Verify user is admin or contractor
    user_result = await db.execute(
        select(User).where(User.email == updated_by_email)
    )
    user = user_result.scalar_one_or_none()
    if not user or user.role not in [UserRole.ADMIN, UserRole.CONTRACTOR]:
        raise HTTPException(status_code=403, detail="Only admins and contractors can add work updates")
    
    # Verify complaint exists
    complaint_result = await db.execute(
        select(Complaint).where(Complaint.id == complaint_id)
    )
    complaint = complaint_result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    # Save images if provided
    before_url = after_url = None
    if before_image and before_image.filename:
        ext = os.path.splitext(before_image.filename)[1].lower()
        if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
            raise HTTPException(status_code=400, detail=f"Unsupported image format: {ext}")
        filename = f"before_{uuid.uuid4()}{ext}"
        filepath = os.path.join(settings.UPLOAD_DIR, filename)
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        content = await before_image.read()
        with open(filepath, "wb") as f:
            f.write(content)
        before_url = f"/uploads/{filename}"
    
    if after_image and after_image.filename:
        ext = os.path.splitext(after_image.filename)[1].lower()
        if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
            raise HTTPException(status_code=400, detail=f"Unsupported image format: {ext}")
        filename = f"after_{uuid.uuid4()}{ext}"
        filepath = os.path.join(settings.UPLOAD_DIR, filename)
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        content = await after_image.read()
        with open(filepath, "wb") as f:
            f.write(content)
        after_url = f"/uploads/{filename}"
    
    # Create work update
    work_update = WorkUpdate(
        complaint_id=complaint_id,
        updated_by_user_id=user.id,
        progress_percentage=progress_percentage,
        update_note=update_note,
        before_image_url=before_url,
        after_image_url=after_url,
    )
    db.add(work_update)
    
    # Update complaint progress
    complaint.progress_percentage = progress_percentage
    
    # Auto-mark as resolved if progress is 100%
    if progress_percentage >= 100:
        complaint.status = ComplaintStatus.RESOLVED
        history = complaint.status_history or []
        history.append({
            "status": "RESOLVED",
            "timestamp": datetime.utcnow().isoformat(),
            "note": "Auto-resolved: 100% complete",
            "actor": user.name,
        })
        complaint.status_history = history
    elif progress_percentage > 0 and complaint.status == ComplaintStatus.PENDING:
        complaint.status = ComplaintStatus.IN_PROGRESS
        history = complaint.status_history or []
        history.append({
            "status": "IN_PROGRESS",
            "timestamp": datetime.utcnow().isoformat(),
            "note": "Work started",
            "actor": user.name,
        })
        complaint.status_history = history
    
    await db.commit()
    
    return {
        "success": True,
        "work_update_id": str(work_update.id),
        "complaint_id": complaint_id,
        "new_progress": progress_percentage,
        "status": str(complaint.status),
    }


@router.patch("/{complaint_id}/assign-contractor")
async def assign_contractor(
    complaint_id: str,
    contractor_email: str,
    assigned_by_email: str,
    db: AsyncSession = Depends(get_db),
):
    """Admin assigns a contractor to a complaint."""
    # Verify admin
    admin_result = await db.execute(
        select(User).where(User.email == assigned_by_email)
    )
    admin = admin_result.scalar_one_or_none()
    if not admin or admin.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can assign contractors")
    
    # Get contractor
    contractor_result = await db.execute(
        select(User).where(User.email == contractor_email)
    )
    contractor = contractor_result.scalar_one_or_none()
    if not contractor or contractor.role != UserRole.CONTRACTOR:
        raise HTTPException(status_code=404, detail="Contractor not found or invalid role")
    
    # Update complaint
    complaint_result = await db.execute(
        select(Complaint).where(Complaint.id == complaint_id)
    )
    complaint = complaint_result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    complaint.assigned_contractor_id = contractor.id
    await db.commit()
    
    return {
        "success": True,
        "complaint_id": complaint_id,
        "assigned_to": contractor.name,
        "assigned_to_email": contractor.email,
    }
