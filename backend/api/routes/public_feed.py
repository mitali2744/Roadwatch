"""
Public Complaints Feed — anyone can see all complaints and their work progress.
No auth required for reading. Admin key required for updates.
"""

from fastapi import APIRouter, Depends, Query, HTTPException, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import Optional
from datetime import datetime

from db.database import get_db
from db.models import Complaint, ComplaintStatus, Authority
from services.ledger.audit_chain import append_ledger_entry
from core.config import settings

router = APIRouter()

# Simple admin key check (set ADMIN_KEY env var on Render)
def verify_admin(x_admin_key: str = Header(None)):
    admin_key = getattr(settings, "ADMIN_KEY", "roadwatch-admin-2026")
    if x_admin_key != admin_key:
        raise HTTPException(status_code=403, detail="Invalid admin key")
    return True


@router.get("/feed")
async def get_public_feed(
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=50),
    status: Optional[str] = Query(None),
    country_code: str = Query("IN"),
    db: AsyncSession = Depends(get_db),
):
    """
    Public feed of all complaints — visible to everyone.
    Shows ticket, type, location, status, work progress, and updates.
    """
    offset = (page - 1) * limit

    query = select(Complaint).where(Complaint.country_code == country_code)
    if status:
        query = query.where(Complaint.status == status)
    query = query.order_by(desc(Complaint.created_at)).offset(offset).limit(limit)

    result = await db.execute(query)
    complaints = result.scalars().all()

    # Count total
    count_result = await db.execute(
        select(func.count(Complaint.id)).where(Complaint.country_code == country_code)
    )
    total = count_result.scalar() or 0

    feed = []
    for c in complaints:
        # Get authority name
        authority_name = None
        if c.routed_authority_id:
            auth_result = await db.execute(
                select(Authority).where(Authority.id == c.routed_authority_id)
            )
            auth = auth_result.scalar_one_or_none()
            authority_name = auth.name if auth else None

        feed.append({
            "ticket_number": c.ticket_number,
            "complaint_type": str(c.complaint_type).replace("ComplaintType.", ""),
            "description": c.description,
            "address": c.address,
            "latitude": c.latitude,
            "longitude": c.longitude,
            "status": str(c.status).replace("ComplaintStatus.", ""),
            "ai_severity": str(c.ai_severity).replace("SeverityLevel.", "") if c.ai_severity else None,
            "image_urls": c.image_urls or [],
            "work_progress": (c.work_progress or 0) if c.status and "RESOLVED" in str(c.status) and not c.work_progress else (c.work_progress or 0),
            "work_updates": c.work_updates_json if hasattr(c, "work_updates_json") else [],
            "routed_to": authority_name,
            "submitted_at": c.created_at,
            "updated_at": c.updated_at,
        })

    return {
        "complaints": feed,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit,
    }


@router.get("/feed/{ticket_number}")
async def get_complaint_detail(ticket_number: str, db: AsyncSession = Depends(get_db)):
    """Public detail view of a single complaint with full work history."""
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
        "complaint_type": str(complaint.complaint_type),
        "description": complaint.description,
        "address": complaint.address,
        "latitude": complaint.latitude,
        "longitude": complaint.longitude,
        "status": str(complaint.status),
        "ai_severity": str(complaint.ai_severity) if complaint.ai_severity else None,
        "ai_damage_description": complaint.ai_damage_description,
        "image_urls": complaint.image_urls or [],
        "work_progress": getattr(complaint, "work_progress", 0),
        "work_updates": getattr(complaint, "work_updates", []),
        "status_history": complaint.status_history or [],
        "routed_to": {
            "name": authority.name if authority else None,
            "type": authority.authority_type if authority else None,
            "contact": authority.contact_phone if authority else None,
            "engineer": authority.executive_engineer_name if authority else None,
        },
        "ledger_hash": complaint.ledger_hash,
        "submitted_at": complaint.created_at,
        "updated_at": complaint.updated_at,
    }


@router.patch("/admin/{ticket_number}/progress")
async def update_work_progress(
    ticket_number: str,
    progress: int = Query(..., ge=0, le=100, description="Work progress 0-100%"),
    update_note: str = Query("", description="What work was done"),
    new_status: Optional[str] = Query(None),
    actor: str = Query("AUTHORITY"),
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin),
):
    """
    Admin endpoint — update work progress on a complaint.
    progress: 0-100 (percentage of work done)
    update_note: description of what was done
    new_status: optionally change status
    """
    result = await db.execute(
        select(Complaint).where(Complaint.ticket_number == ticket_number.upper())
    )
    complaint = result.scalar_one_or_none()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Update work progress
    complaint.work_progress = progress

    # Add work update entry
    work_updates = getattr(complaint, "work_updates", None) or []
    work_updates.append({
        "progress": progress,
        "note": update_note,
        "actor": actor,
        "timestamp": datetime.utcnow().isoformat(),
    })
    complaint.work_updates_json = work_updates

    # Update status if provided
    if new_status:
        old_status = str(complaint.status)
        complaint.status = new_status
        history = complaint.status_history or []
        history.append({
            "status": new_status,
            "timestamp": datetime.utcnow().isoformat(),
            "note": update_note,
            "actor": actor,
        })
        complaint.status_history = history

    # Auto-set status based on progress
    if progress == 100 and not new_status:
        complaint.status = ComplaintStatus.RESOLVED
        history = complaint.status_history or []
        history.append({
            "status": "RESOLVED",
            "timestamp": datetime.utcnow().isoformat(),
            "note": f"Work completed: {update_note}",
            "actor": actor,
        })
        complaint.status_history = history
    elif progress > 0 and progress < 100 and not new_status:
        complaint.status = ComplaintStatus.IN_PROGRESS

    # Ledger entry
    ledger_hash = await append_ledger_entry(
        complaint_id=str(complaint.id),
        action="WORK_PROGRESS_UPDATED",
        actor=actor,
        data={"progress": progress, "note": update_note, "status": str(complaint.status)},
        db=db,
    )
    complaint.ledger_hash = ledger_hash
    await db.commit()

    return {
        "success": True,
        "ticket_number": ticket_number,
        "work_progress": progress,
        "status": str(complaint.status),
        "message": f"Progress updated to {progress}%",
    }


@router.get("/admin/all")
async def admin_get_all_complaints(
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_admin),
):
    """Admin view — all complaints with full details for management."""
    query = select(Complaint).order_by(desc(Complaint.created_at)).limit(100)
    if status:
        query = query.where(Complaint.status == status)

    result = await db.execute(query)
    complaints = result.scalars().all()

    return [
        {
            "id": str(c.id),
            "ticket_number": c.ticket_number,
            "complaint_type": str(c.complaint_type).replace("ComplaintType.", ""),
            "description": c.description,
            "address": c.address,
            "status": str(c.status).replace("ComplaintStatus.", ""),
            "ai_severity": str(c.ai_severity).replace("SeverityLevel.", "") if c.ai_severity else None,
            "work_progress": getattr(c, "work_progress", 0) or 0,
            "reporter_name": c.reporter_name,
            "reporter_phone": c.reporter_phone,
            "submitted_at": c.created_at,
        }
        for c in complaints
    ]
