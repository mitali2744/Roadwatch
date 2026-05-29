"""
Immutable Complaint Ledger — tamper-proof audit trail using hash chaining.
Each entry contains a SHA-256 hash of (previous_hash + current_data),
creating a blockchain-like chain that detects any tampering.
"""

import hashlib
import json
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from db.models import LedgerEntry


async def append_ledger_entry(
    complaint_id: str,
    action: str,
    actor: str,
    data: Dict[str, Any],
    db: AsyncSession,
) -> str:
    """
    Append an immutable entry to the complaint audit ledger.
    Returns the hash of the new entry.
    
    The hash chain: each entry's hash includes the previous entry's hash,
    making it impossible to alter history without breaking the chain.
    """
    # Get the last entry for this complaint (for hash chaining)
    last_result = await db.execute(
        select(LedgerEntry)
        .where(LedgerEntry.complaint_id == complaint_id)
        .order_by(LedgerEntry.timestamp.desc())
        .limit(1)
    )
    last_entry = last_result.scalar_one_or_none()
    previous_hash = last_entry.current_hash if last_entry else "GENESIS"

    # Build the entry payload
    payload = {
        "complaint_id": complaint_id,
        "action": action,
        "actor": actor,
        "data": data,
        "timestamp": datetime.utcnow().isoformat(),
        "previous_hash": previous_hash,
    }

    # Compute SHA-256 hash
    payload_str = json.dumps(payload, sort_keys=True, default=str)
    current_hash = hashlib.sha256(payload_str.encode()).hexdigest()

    # Store the entry
    entry = LedgerEntry(
        complaint_id=complaint_id,
        action=action,
        actor=actor,
        data=data,
        previous_hash=previous_hash,
        current_hash=current_hash,
    )
    db.add(entry)
    # Note: caller is responsible for commit

    return current_hash


async def verify_ledger_chain(complaint_id: str, db: AsyncSession) -> Dict[str, Any]:
    """
    Verify the integrity of the audit chain for a complaint.
    Returns whether the chain is intact or has been tampered with.
    """
    result = await db.execute(
        select(LedgerEntry)
        .where(LedgerEntry.complaint_id == complaint_id)
        .order_by(LedgerEntry.timestamp.asc())
    )
    entries = result.scalars().all()

    if not entries:
        return {"valid": True, "entries": 0, "message": "No ledger entries found"}

    previous_hash = "GENESIS"
    for i, entry in enumerate(entries):
        # Recompute hash
        payload = {
            "complaint_id": str(entry.complaint_id),
            "action": entry.action,
            "actor": entry.actor,
            "data": entry.data,
            "timestamp": entry.timestamp.isoformat(),
            "previous_hash": previous_hash,
        }
        payload_str = json.dumps(payload, sort_keys=True, default=str)
        expected_hash = hashlib.sha256(payload_str.encode()).hexdigest()

        if expected_hash != entry.current_hash:
            return {
                "valid": False,
                "entries": len(entries),
                "tampered_at": i,
                "message": f"⚠️ Chain integrity broken at entry {i+1}. Data may have been tampered with.",
            }
        previous_hash = entry.current_hash

    return {
        "valid": True,
        "entries": len(entries),
        "latest_hash": entries[-1].current_hash,
        "message": "✅ Audit chain is intact. No tampering detected.",
    }
