"""SQLAlchemy ORM models for RoadWatch."""

from sqlalchemy import (
    Column, String, Float, Integer, DateTime, Boolean,
    Text, ForeignKey, Enum, JSON, func
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from geoalchemy2 import Geometry
import uuid
import enum

from db.database import Base


# ── Enums ─────────────────────────────────────────────────────────────────────

class RoadType(str, enum.Enum):
    NH = "NH"       # National Highway
    SH = "SH"       # State Highway
    MDR = "MDR"     # Major District Road
    ODR = "ODR"     # Other District Road
    VR = "VR"       # Village Road
    LOCAL = "LOCAL" # Local/Municipal Road
    EXPRESSWAY = "EXPRESSWAY"


class ComplaintStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    ESCALATED = "ESCALATED"
    REJECTED = "REJECTED"


class SeverityLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ComplaintType(str, enum.Enum):
    POTHOLE = "POTHOLE"
    CRACK = "CRACK"
    WATERLOGGING = "WATERLOGGING"
    MISSING_SIGNAGE = "MISSING_SIGNAGE"
    BROKEN_DIVIDER = "BROKEN_DIVIDER"
    POOR_LIGHTING = "POOR_LIGHTING"
    ENCROACHMENT = "ENCROACHMENT"
    OTHER = "OTHER"


# ── Models ────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_authority = Column(Boolean, default=False)  # Government official
    country_code = Column(String(3), default="IN")
    preferred_language = Column(String(10), default="en")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    complaints = relationship("Complaint", back_populates="user")


class Contractor(Base):
    __tablename__ = "contractors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    registration_number = Column(String(100), unique=True)
    contact_email = Column(String(255))
    contact_phone = Column(String(20))
    country_code = Column(String(3), default="IN")
    state = Column(String(100))

    # Accountability scorecard (computed)
    trust_score = Column(Float, default=50.0)          # 0-100
    on_time_rate = Column(Float, default=0.0)          # %
    re_complaint_rate = Column(Float, default=0.0)     # % roads re-complained within 6mo
    budget_adherence = Column(Float, default=0.0)      # % within budget
    citizen_rating = Column(Float, default=0.0)        # avg 1-5
    total_projects = Column(Integer, default=0)
    completed_projects = Column(Integer, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    road_projects = relationship("RoadProject", back_populates="contractor")


class Authority(Base):
    __tablename__ = "authorities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    authority_type = Column(String(100))  # NHAI, PWD, Municipal Corp, etc.
    jurisdiction_level = Column(String(50))  # national, state, district, local
    country_code = Column(String(3), default="IN")
    state = Column(String(100))
    district = Column(String(100))
    contact_email = Column(String(255))
    contact_phone = Column(String(20))
    executive_engineer_name = Column(String(255))
    executive_engineer_email = Column(String(255))
    executive_engineer_phone = Column(String(20))

    # Geo boundary (polygon)
    jurisdiction_boundary = Column(Geometry("POLYGON", srid=4326), nullable=True)

    road_projects = relationship("RoadProject", back_populates="authority")
    complaints = relationship("Complaint", back_populates="routed_authority")


class RoadSegment(Base):
    __tablename__ = "road_segments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    road_number = Column(String(50))  # e.g., NH-48, SH-12
    road_type = Column(Enum(RoadType), nullable=False)
    country_code = Column(String(3), default="IN")
    state = Column(String(100))
    district = Column(String(100))

    # Geometry
    geometry = Column(Geometry("LINESTRING", srid=4326), nullable=True)
    length_km = Column(Float)

    # Condition
    condition_score = Column(Float, default=50.0)  # 0-100 (100=perfect)
    last_survey_date = Column(DateTime(timezone=True))
    predicted_failure_date = Column(DateTime(timezone=True), nullable=True)
    deterioration_risk = Column(String(20), default="LOW")  # LOW/MEDIUM/HIGH

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    projects = relationship("RoadProject", back_populates="road_segment")
    complaints = relationship("Complaint", back_populates="road_segment")


class RoadProject(Base):
    __tablename__ = "road_projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    road_segment_id = Column(UUID(as_uuid=True), ForeignKey("road_segments.id"))
    contractor_id = Column(UUID(as_uuid=True), ForeignKey("contractors.id"))
    authority_id = Column(UUID(as_uuid=True), ForeignKey("authorities.id"))

    # Budget
    budget_sanctioned = Column(Float, nullable=False)  # in local currency
    budget_spent = Column(Float, default=0.0)
    currency = Column(String(3), default="INR")

    # Timeline
    start_date = Column(DateTime(timezone=True))
    planned_end_date = Column(DateTime(timezone=True))
    actual_end_date = Column(DateTime(timezone=True), nullable=True)
    last_relaying_date = Column(DateTime(timezone=True), nullable=True)
    next_maintenance_date = Column(DateTime(timezone=True), nullable=True)

    # Status
    status = Column(String(50), default="PLANNED")  # PLANNED/ONGOING/COMPLETED/DELAYED
    is_anomalous = Column(Boolean, default=False)    # Budget anomaly flag
    anomaly_reason = Column(Text, nullable=True)

    # Metadata
    data_source = Column(String(255))  # Source of data (govt portal, etc.)
    country_code = Column(String(3), default="IN")
    extra_data = Column(JSON, default={})  # Country-specific fields

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    road_segment = relationship("RoadSegment", back_populates="projects")
    contractor = relationship("Contractor", back_populates="road_projects")
    authority = relationship("Authority", back_populates="road_projects")


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_number = Column(String(20), unique=True, nullable=False)  # RW-2026-00001

    # Reporter
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reporter_name = Column(String(255))
    reporter_phone = Column(String(20))
    reporter_email = Column(String(255))

    # Location
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_point = Column(Geometry("POINT", srid=4326))
    address = Column(Text)
    road_segment_id = Column(UUID(as_uuid=True), ForeignKey("road_segments.id"), nullable=True)

    # Issue details
    complaint_type = Column(Enum(ComplaintType), nullable=False)
    description = Column(Text)
    image_urls = Column(JSON, default=[])  # List of uploaded image URLs

    # AI Analysis
    ai_severity = Column(Enum(SeverityLevel), nullable=True)
    ai_confidence = Column(Float, nullable=True)  # 0-1
    ai_damage_description = Column(Text, nullable=True)

    # Routing
    routed_authority_id = Column(UUID(as_uuid=True), ForeignKey("authorities.id"), nullable=True)
    routing_reason = Column(Text)

    # Status tracking
    status = Column(Enum(ComplaintStatus), default=ComplaintStatus.PENDING)
    status_history = Column(JSON, default=[])  # [{status, timestamp, note}]

    # Audit trail (immutable ledger hash)
    ledger_hash = Column(String(64))  # SHA-256 hash chain

    # Offline support
    submitted_offline = Column(Boolean, default=False)
    synced_at = Column(DateTime(timezone=True), nullable=True)

    country_code = Column(String(3), default="IN")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="complaints")
    road_segment = relationship("RoadSegment", back_populates="complaints")
    routed_authority = relationship("Authority", back_populates="complaints")


class LedgerEntry(Base):
    """Immutable audit trail for complaints — tamper-proof chain."""
    __tablename__ = "ledger_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    complaint_id = Column(UUID(as_uuid=True), ForeignKey("complaints.id"), nullable=False)
    action = Column(String(100), nullable=False)  # SUBMITTED, ROUTED, STATUS_CHANGED, etc.
    actor = Column(String(255))  # user email or "SYSTEM"
    data = Column(JSON)
    previous_hash = Column(String(64))
    current_hash = Column(String(64), unique=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
