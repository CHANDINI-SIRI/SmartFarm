from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..auth import get_current_user
from ..db import query


router = APIRouter()


class FarmCreate(BaseModel):
    farm_name: str
    location_name: str
    crop_type: str
    farm_size_acres: float
    latitude: float | None = None
    longitude: float | None = None
    planting_date: str | None = None
    farm_type: str | None = None
    crop_growth_stage: str | None = None
    soil_moisture: float | None = None


@router.get("/mine")
def get_my_farms(current_user=Depends(get_current_user)):
    farms = query(
        """
        SELECT *
        FROM farms
        WHERE user_id = %s
        ORDER BY id DESC
        """,
        (current_user["id"],),
        fetch=True,
    )

    return {"farms": farms}


@router.post("")
def create_farm(
    data: FarmCreate,
    current_user=Depends(get_current_user),
):
    farm_id = query(
        """
        INSERT INTO farms (
            user_id,
            farm_name,
            location_name,
            crop_type,
            farm_size_acres,
            latitude,
            longitude,
            planting_date,
            farm_type,
            growth_stage,
            soil_moisture
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            current_user["id"],
            data.farm_name,
            data.location_name,
            data.crop_type,
            data.farm_size_acres,
            data.latitude,
            data.longitude,
            data.planting_date,
            data.farm_type,
            data.crop_growth_stage,
            data.soil_moisture,
        ),
    )

    query(
    """
    INSERT INTO farm_events (
        farm_id,
        event_type,
        title,
        description
    )
    VALUES (%s, %s, %s, %s)
    """,
    (
        farm_id,
        "farm_updated",
        "Farm Updated",
        "Farm profile updated",
    ),
)

    return {
    "message": "Farm updated successfully",
    "farm_id": farm_id,
}
@router.put("/{farm_id}")
def update_farm(
    farm_id: int,
    data: FarmCreate,
    current_user=Depends(get_current_user),
):
    existing = query(
        """
        SELECT id
        FROM farms
        WHERE id = %s AND user_id = %s
        """,
        (farm_id, current_user["id"]),
        fetch=True,
    )

    if not existing:
        raise HTTPException(
            status_code=404,
            detail="Farm not found",
        )

    query(
        """
        UPDATE farms
        SET
            farm_name = %s,
            location_name = %s,
            crop_type = %s,
            farm_size_acres = %s,
            latitude = %s,
            longitude = %s,
            planting_date = %s,
            farm_type = %s,
            growth_stage = %s,
            soil_moisture = %s
        WHERE id = %s AND user_id = %s
        """,
        (
            data.farm_name,
            data.location_name,
            data.crop_type,
            data.farm_size_acres,
            data.latitude,
            data.longitude,
            data.planting_date,
            data.farm_type,
            data.crop_growth_stage,
            data.soil_moisture,
            farm_id,
            current_user["id"],
        ),
    )

    query(
        """
        INSERT INTO farm_events (
    farm_id,
    event_type,
    title,
    description
)
VALUES (%s, %s, %s, %s)
""",
(
    farm_id,
    "farm_updated",
    "Farm Updated",
    "Farm profile updated",
),
    )

    return {
    "message": "Farm updated successfully",
    "farm_id": farm_id,
}

@router.get("/{farm_id}/events")
def get_farm_events(
    farm_id: int,
    current_user=Depends(get_current_user),
):
    existing = query(
        """
        SELECT id
        FROM farms
        WHERE id = %s AND user_id = %s
        """,
        (farm_id, current_user["id"]),
        fetch=True,
    )

    if not existing:
        raise HTTPException(
            status_code=404,
            detail="Farm not found",
        )

    events = query(
        """
        SELECT *
        FROM farm_events
        WHERE farm_id = %s
        ORDER BY event_date DESC
        """,
        (farm_id,),
        fetch=True,
    )

    return {"events": events}


