"""
Smart Complaint Router — automatically routes complaints to the correct authority.
Routing logic based on:
- Road type (NH → NHAI, SH → PWD, Local → Municipal Corp)
- Geographic jurisdiction (PostGIS boundary lookup)
- Country-specific authority hierarchy
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from geoalchemy2.functions import ST_Contains, ST_GeomFromText
from typing import Optional, Dict, Any
from loguru import logger

from db.models import Authority, RoadType


# Road type → authority type mapping (India)
INDIA_ROUTING_RULES = {
    "NH": "NHAI",           # National Highways Authority of India
    "EXPRESSWAY": "NHAI",
    "SH": "PWD",            # Public Works Department
    "MDR": "PWD",
    "ODR": "DISTRICT_PWD",  # District PWD
    "VR": "PANCHAYAT",      # Gram Panchayat
    "LOCAL": "MUNICIPAL",   # Municipal Corporation
}

# Country-specific routing rules
ROUTING_RULES = {
    "IN": INDIA_ROUTING_RULES,
    "US": {
        "NH": "FHWA",       # Federal Highway Administration
        "SH": "STATE_DOT",  # State Department of Transportation
        "LOCAL": "CITY_DPW", # Department of Public Works
    },
    "GB": {
        "NH": "NATIONAL_HIGHWAYS",
        "SH": "COUNTY_COUNCIL",
        "LOCAL": "LOCAL_AUTHORITY",
    },
}


async def route_complaint(
    latitude: float,
    longitude: float,
    road_type: Optional[RoadType],
    country_code: str,
    db: AsyncSession,
) -> Dict[str, Any]:
    """
    Determine the correct authority for a complaint.
    
    Priority:
    1. Geo-boundary match (most precise)
    2. Road type + country rules
    3. Default fallback authority
    """
    point_wkt = f"POINT({longitude} {latitude})"

    # 1. Try geo-boundary match
    try:
        geo_result = await db.execute(
            select(Authority)
            .where(
                ST_Contains(
                    Authority.jurisdiction_boundary,
                    ST_GeomFromText(point_wkt, 4326),
                )
            )
            .order_by(Authority.jurisdiction_level.asc())  # Most specific first
            .limit(1)
        )
        authority = geo_result.scalar_one_or_none()
        if authority:
            return {
                "authority_id": str(authority.id),
                "authority_name": authority.name,
                "authority_type": authority.authority_type,
                "contact": authority.contact_phone,
                "engineer": authority.executive_engineer_name,
                "reason": f"Geo-boundary match: {authority.name} has jurisdiction over this location",
            }
    except Exception as e:
        logger.warning(f"Geo-boundary routing failed: {e}")

    # 2. Road type based routing
    if road_type:
        road_type_str = road_type.value if hasattr(road_type, 'value') else str(road_type)
        country_rules = ROUTING_RULES.get(country_code, ROUTING_RULES["IN"])
        target_authority_type = country_rules.get(road_type_str, "MUNICIPAL")

        type_result = await db.execute(
            select(Authority)
            .where(
                Authority.authority_type == target_authority_type,
                Authority.country_code == country_code,
            )
            .limit(1)
        )
        authority = type_result.scalar_one_or_none()
        if authority:
            return {
                "authority_id": str(authority.id),
                "authority_name": authority.name,
                "authority_type": authority.authority_type,
                "contact": authority.contact_phone,
                "engineer": authority.executive_engineer_name,
                "reason": f"Road type {road_type_str} → routed to {authority.authority_type}",
            }

    # 3. Fallback: any authority in the country
    fallback_result = await db.execute(
        select(Authority)
        .where(Authority.country_code == country_code)
        .limit(1)
    )
    authority = fallback_result.scalar_one_or_none()
    if authority:
        return {
            "authority_id": str(authority.id),
            "authority_name": authority.name,
            "authority_type": authority.authority_type,
            "contact": authority.contact_phone,
            "engineer": authority.executive_engineer_name,
            "reason": "Default routing — no specific jurisdiction match found",
        }

    return {
        "authority_id": None,
        "authority_name": "Pending Assignment",
        "authority_type": "UNKNOWN",
        "contact": None,
        "engineer": None,
        "reason": "No authority found — complaint will be manually assigned",
    }
