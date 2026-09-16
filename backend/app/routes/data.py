from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..auth import get_current_user
from ..db import query


router = APIRouter()


class DiseaseRecord(BaseModel):
    farm_id: int
    disease_name: str
    confidence: float | None = None
    image_name: str | None = None
    recommendation: str | None = None


class RecommendationRecord(BaseModel):
    farm_id: int
    recommendation: str
    reason: str | None = None
    confidence: float | None = None


def verify_farm_owner(farm_id: int, user_id: int):
    farms = query(
        """
        SELECT id
        FROM farms
        WHERE id = %s AND user_id = %s
        """,
        (farm_id, user_id),
        fetch=True,
    )

    if not farms:
        raise HTTPException(
            status_code=404,
            detail="Farm not found",
        )


@router.post("/disease")
def save_disease_result(
    data: DiseaseRecord,
    current_user=Depends(get_current_user),
):
    verify_farm_owner(data.farm_id, current_user["id"])

    record_id = query(
        """
        INSERT INTO disease_predictions (
            farm_id,
            disease_name,
            confidence,
            image_name,
            recommendation
        )
        VALUES (%s, %s, %s, %s, %s)
        """,
        (
            data.farm_id,
            data.disease_name,
            data.confidence,
            data.image_name,
            data.recommendation,
        ),
    )

    return {
        "message": "Disease result saved successfully",
        "id": record_id,
    }


@router.post("/recommendation")
def save_recommendation(
    data: RecommendationRecord,
    current_user=Depends(get_current_user),
):
    verify_farm_owner(data.farm_id, current_user["id"])

    record_id = query(
        """
        INSERT INTO ai_recommendations (
            farm_id,
            recommendation,
            reason,
            confidence
        )
        VALUES (%s, %s, %s, %s)
        """,
        (
            data.farm_id,
            data.recommendation,
            data.reason,
            data.confidence,
        ),
    )

    return {
        "message": "AI recommendation saved successfully",
        "id": record_id,
    }