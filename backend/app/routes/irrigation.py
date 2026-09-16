from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter()


class Input(BaseModel):
    crop_type: str
    growth_stage: str | None = None
    farm_size: float = Field(gt=0)
    soil_moisture: float = Field(ge=0, le=100)
    temperature: float | None = None
    humidity: float | None = None
    rain_probability: float = Field(ge=0, le=100)


@router.post("/recommendation")
def irrigation(x: Input):
    growth_stage = (
        str(x.growth_stage).strip()
        if x.growth_stage is not None
        else "Vegetative"
    )

    if not growth_stage:
        growth_stage = "Vegetative"

    score = 0
    factors = []

    soil = float(x.soil_moisture)

    if soil <= 25:
        score += 45
        factors.append({
            "factor": "Soil condition",
            "detail": (
                "The farmer assessed the field as dry, "
                "so irrigation may require attention."
            )
        })

    elif soil <= 45:
        score += 25
        factors.append({
            "factor": "Soil condition",
            "detail": (
                "The farmer assessed the field as slightly dry, "
                "so irrigation may need attention."
            )
        })

    elif soil <= 65:
        factors.append({
            "factor": "Soil condition",
            "detail": (
                "The farmer assessed the field as moist, "
                "so immediate irrigation pressure is lower."
            )
        })

    elif soil <= 82:
        score -= 15
        factors.append({
            "factor": "Soil condition",
            "detail": (
                "The farmer assessed the field as wet, "
                "so unnecessary irrigation should be avoided."
            )
        })

    else:
        score -= 35
        factors.append({
            "factor": "Soil condition",
            "detail": (
                "The farmer assessed the field as waterlogged, "
                "so irrigation should be avoided."
            )
        })

    if (
        x.temperature is not None
        and x.temperature > 32
    ):
        score += 20

        factors.append({
            "factor": "Temperature",
            "detail": (
                f"High temperature ({x.temperature}°C) "
                "can increase crop water demand."
            )
        })

    if x.rain_probability >= 60:
        score -= 35

        factors.append({
            "factor": "Rain forecast",
            "detail": (
                f"Rain probability is {x.rain_probability}%, "
                "reducing the need for immediate irrigation."
            )
        })

    elif x.rain_probability < 25:
        score += 10

        factors.append({
            "factor": "Rain forecast",
            "detail": (
                "Low rain probability means little natural "
                "water is expected."
            )
        })

    if (
        x.humidity is not None
        and x.humidity > 80
    ):
        factors.append({
            "factor": "Humidity",
            "detail": (
                f"Humidity is high at {x.humidity}%, "
                "so avoid unnecessary watering."
            )
        })

    score = max(
        0,
        min(100, score)
    )

    required = score >= 45

    priority = (
        "High"
        if score >= 70
        else "Medium"
        if score >= 45
        else "Low"
    )

    timing = (
        "Today / next suitable irrigation window"
        if required
        else "Monitor and reassess after the next weather update"
    )

    if score >= 70:
        recommendation = (
            "Irrigation may be needed soon."
        )

    elif score >= 45:
        recommendation = (
            "Consider irrigation during the next suitable window."
        )

    elif soil > 82:
        recommendation = (
            "Do not irrigate now. "
            "The field is assessed as waterlogged."
        )

    elif soil > 65:
        recommendation = (
            "Avoid unnecessary irrigation. "
            "The field is assessed as wet."
        )

    else:
        recommendation = (
            "Irrigation is not urgently required. "
            "Continue monitoring."
        )

    soil_condition = (
        "Dry"
        if soil <= 25
        else "Slightly dry"
        if soil <= 45
        else "Moist"
        if soil <= 65
        else "Wet"
        if soil <= 82
        else "Waterlogged"
    )

    return {
        "required": required,
        "priority": priority,
        "score": score,
        "timing": timing,
        "recommendation": recommendation,
        "growth_stage": growth_stage,
        "soil_condition": soil_condition,
        "factors": factors,
        "water_saving_tip": (
            "If rain is likely, avoid unnecessary irrigation. "
            "Use a crop-appropriate efficient irrigation method "
            "and reassess the field condition before watering again."
        )
    }