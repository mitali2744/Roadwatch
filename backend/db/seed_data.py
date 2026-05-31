"""
Seed script — populates the database with realistic sample data for demo.
Run: python -m db.seed_data
"""

import asyncio
import uuid
from datetime import datetime, timedelta
import random

from db.database import AsyncSessionLocal, init_db
from db.models import (
    RoadSegment, RoadProject, Contractor, Authority,
    Complaint, ComplaintType, ComplaintStatus, RoadType, SeverityLevel
)


SAMPLE_CONTRACTORS = [
    {"name": "Larsen & Toubro Infrastructure", "trust_score": 88.5, "on_time_rate": 92.0, "re_complaint_rate": 5.2, "budget_adherence": 95.0, "citizen_rating": 4.3},
    {"name": "Dilip Buildcon Ltd", "trust_score": 72.0, "on_time_rate": 78.0, "re_complaint_rate": 12.5, "budget_adherence": 88.0, "citizen_rating": 3.8},
    {"name": "GR Infraprojects", "trust_score": 65.0, "on_time_rate": 70.0, "re_complaint_rate": 18.0, "budget_adherence": 82.0, "citizen_rating": 3.5},
    {"name": "Ashoka Buildcon", "trust_score": 55.0, "on_time_rate": 60.0, "re_complaint_rate": 25.0, "budget_adherence": 75.0, "citizen_rating": 3.1},
    {"name": "KNR Constructions", "trust_score": 45.0, "on_time_rate": 50.0, "re_complaint_rate": 35.0, "budget_adherence": 68.0, "citizen_rating": 2.8},
]

SAMPLE_AUTHORITIES = [
    {
        "name": "National Highways Authority of India - Karnataka",
        "authority_type": "NHAI",
        "jurisdiction_level": "national",
        "state": "Karnataka",
        "contact_email": "nhai.karnataka@gov.in",
        "contact_phone": "080-22345678",
        "executive_engineer_name": "Rajesh Kumar",
        "executive_engineer_email": "ee.nhai.ka@gov.in",
        "executive_engineer_phone": "9876543210",
    },
    {
        "name": "Karnataka Public Works Department",
        "authority_type": "PWD",
        "jurisdiction_level": "state",
        "state": "Karnataka",
        "contact_email": "pwd.karnataka@gov.in",
        "contact_phone": "080-22334455",
        "executive_engineer_name": "Suresh Patil",
        "executive_engineer_email": "ee.pwd.ka@gov.in",
        "executive_engineer_phone": "9876543211",
    },
    {
        "name": "Bruhat Bengaluru Mahanagara Palike",
        "authority_type": "MUNICIPAL",
        "jurisdiction_level": "local",
        "state": "Karnataka",
        "contact_email": "bbmp@gov.in",
        "contact_phone": "080-22660000",
        "executive_engineer_name": "Anitha Rao",
        "executive_engineer_email": "ee.bbmp@gov.in",
        "executive_engineer_phone": "9876543212",
    },
]

SAMPLE_ROADS = [
    {"name": "Bangalore-Mysore Highway", "road_number": "NH-275", "road_type": RoadType.NH, "state": "Karnataka", "length_km": 139.0, "lat": 12.9716, "lon": 77.5946},
    {"name": "Outer Ring Road Bangalore", "road_number": "SH-35", "road_type": RoadType.SH, "state": "Karnataka", "length_km": 62.0, "lat": 12.9352, "lon": 77.6245},
    {"name": "Hosur Road", "road_number": "NH-44", "road_type": RoadType.NH, "state": "Karnataka", "length_km": 40.0, "lat": 12.8456, "lon": 77.6603},
    {"name": "Sarjapur Road", "road_number": "MDR-123", "road_type": RoadType.MDR, "state": "Karnataka", "length_km": 18.0, "lat": 12.9010, "lon": 77.6960},
    {"name": "Whitefield Main Road", "road_number": "LOCAL-001", "road_type": RoadType.LOCAL, "state": "Karnataka", "length_km": 8.0, "lat": 12.9698, "lon": 77.7500},
]


async def seed():
    await init_db()
    async with AsyncSessionLocal() as db:
        print("🌱 Seeding database...")

        # Contractors
        contractors = []
        for c_data in SAMPLE_CONTRACTORS:
            c = Contractor(
                name=c_data["name"],
                registration_number=f"REG-{uuid.uuid4().hex[:8].upper()}",
                country_code="IN",
                state="Karnataka",
                trust_score=c_data["trust_score"],
                on_time_rate=c_data["on_time_rate"],
                re_complaint_rate=c_data["re_complaint_rate"],
                budget_adherence=c_data["budget_adherence"],
                citizen_rating=c_data["citizen_rating"],
                total_projects=random.randint(10, 50),
                completed_projects=random.randint(5, 40),
            )
            db.add(c)
            contractors.append(c)
        await db.flush()
        print(f"  ✅ {len(contractors)} contractors added")

        # Authorities
        authorities = []
        for a_data in SAMPLE_AUTHORITIES:
            a = Authority(country_code="IN", **a_data)
            db.add(a)
            authorities.append(a)
        await db.flush()
        print(f"  ✅ {len(authorities)} authorities added")

        # Road Segments + Projects
        roads = []
        for r_data in SAMPLE_ROADS:
            lat, lon = r_data.pop("lat"), r_data.pop("lon")
            seg = RoadSegment(
                country_code="IN",
                condition_score=random.uniform(30, 90),
                last_survey_date=datetime.utcnow() - timedelta(days=random.randint(30, 365)),
                center_lat=lat,
                center_lon=lon,
                **r_data,
            )
            db.add(seg)
            roads.append((seg, lat, lon))

        await db.flush()

        # Projects for each road
        for seg, lat, lon in roads:
            contractor = random.choice(contractors)
            authority = random.choice(authorities)
            budget = random.uniform(5_000_000, 500_000_000)
            spent = budget * random.uniform(0.6, 1.4)  # Some overspend for anomaly detection
            project = RoadProject(
                title=f"Repair and Maintenance of {seg.name}",
                road_segment_id=seg.id,
                contractor_id=contractor.id,
                authority_id=authority.id,
                budget_sanctioned=round(budget, 2),
                budget_spent=round(spent, 2),
                currency="INR",
                start_date=datetime.utcnow() - timedelta(days=random.randint(100, 500)),
                planned_end_date=datetime.utcnow() + timedelta(days=random.randint(30, 200)),
                last_relaying_date=datetime.utcnow() - timedelta(days=random.randint(30, 730)),
                status=random.choice(["PLANNED", "ONGOING", "COMPLETED"]),
                country_code="IN",
                data_source="Karnataka PWD Portal",
            )
            db.add(project)

        await db.flush()
        print(f"  ✅ {len(roads)} road segments + projects added")

        # Sample Complaints
        complaint_types = list(ComplaintType)
        severities = list(SeverityLevel)
        for i in range(20):
            road_seg, lat, lon = random.choice(roads)
            lat_offset = random.uniform(-0.01, 0.01)
            lon_offset = random.uniform(-0.01, 0.01)
            complaint = Complaint(
                ticket_number=f"RW-2026-{str(i+1).zfill(5)}",
                reporter_name=f"Citizen {i+1}",
                reporter_phone=f"98765{str(i).zfill(5)}",
                latitude=lat + lat_offset,
                longitude=lon + lon_offset,
                address=f"Near {road_seg.name}, Karnataka",
                road_segment_id=road_seg.id,
                complaint_type=random.choice(complaint_types),
                description="Road has severe potholes causing accidents. Needs immediate repair.",
                ai_severity=random.choice(severities),
                ai_confidence=random.uniform(0.65, 0.97),
                routed_authority_id=random.choice(authorities).id,
                status=random.choice(list(ComplaintStatus)),
                status_history=[{"status": "PENDING", "timestamp": datetime.utcnow().isoformat(), "note": "Submitted"}],
                ledger_hash="genesis_hash_" + uuid.uuid4().hex[:16],
                country_code="IN",
            )
            db.add(complaint)

        await db.commit()
        print(f"  ✅ 20 sample complaints added")
        print("✅ Database seeded successfully!")


if __name__ == "__main__":
    asyncio.run(seed())
