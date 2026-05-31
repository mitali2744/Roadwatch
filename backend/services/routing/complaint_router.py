"""Smart Complaint Router — routes complaints to correct authority by road type."""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, Dict, Any
from db.models import Authority, RoadType

ROUTING_RULES = {
    "IN": {"NH": "NHAI", "EXPRESSWAY": "NHAI", "SH": "PWD", "MDR": "PWD",
           "ODR": "DISTRICT_PWD", "VR": "PANCHAYAT", "LOCAL": "MUNICIPAL"},
    "US": {"NH": "FHWA", "SH": "STATE_DOT", "LOCAL": "CITY_DPW"},
    "GB": {"NH": "NATIONAL_HIGHWAYS", "SH": "COUNTY_COUNCIL", "LOCAL": "LOCAL_AUTHORITY"},
}


async def route_complaint(
    latitude: float, longitude: float,
    road_type: Optional[RoadType],
    country_code: str,
    db: AsyncSession,
) -> Dict[str, Any]:
    """Route complaint to correct authority based on road type and country."""

    # Try road type based routing
    if road_type:
        road_type_str = road_type.value if hasattr(road_type, "value") else str(road_type)
        country_rules = ROUTING_RULES.get(country_code, ROUTING_RULES["IN"])
        target_type = country_rules.get(road_type_str, "MUNICIPAL")

        result = await db.execute(
            select(Authority)
            .where(Authority.authority_type == target_type,
                   Authority.country_code == country_code)
            .limit(1)
        )
        authority = result.scalar_one_or_none()
        if authority:
            return {
                "authority_id": str(authority.id),
                "authority_name": authority.name,
                "authority_type": authority.authority_type,
                "contact": authority.contact_phone,
                "engineer": authority.executive_engineer_name,
                "reason": f"Road type {road_type_str} → routed to {authority.authority_type}",
            }

    # Fallback: any authority in country
    result = await db.execute(
        select(Authority).where(Authority.country_code == country_code).limit(1)
    )
    authority = result.scalar_one_or_none()
    if authority:
        return {
            "authority_id": str(authority.id),
            "authority_name": authority.name,
            "authority_type": authority.authority_type,
            "contact": authority.contact_phone,
            "engineer": authority.executive_engineer_name,
            "reason": "Default routing",
        }

    return {
        "authority_id": None, "authority_name": "Pending Assignment",
        "authority_type": "UNKNOWN", "contact": None, "engineer": None,
        "reason": "No authority found",
    }
