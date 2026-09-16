import json
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
router = APIRouter()
class Rec(BaseModel):
    crop_type: str
    growth_stage: str | None = None
    farm_size: float
    soil_moisture: float
    temperature: float | None = None
    rain_probability: float | None = None
    humidity: float | None = None
    disease: str | None = None
    disease_confidence: float | None = None
@router.post("/recommendation")
def recommendation(x: Rec):
    growth_stage = (
        str(x.growth_stage).strip()
        if x.growth_stage is not None
        else "Vegetative"
    )
    if not growth_stage:
        growth_stage = "Vegetative"
    factors = []
    score = 0
    soil = float(x.soil_moisture)
    if soil <= 25:
        score += 40
        factors.append({
            "factor": "Soil condition",
            "detail": (
                "The farmer assessed the field as dry, "
                "so crop water stress may be more urgent."
            )
        })
    elif soil <= 45:
        score += 20
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
                "so immediate water stress is less urgent."
            )
        })
    elif soil <= 82:
        score -= 10
        factors.append({
            "factor": "Soil condition",
            "detail": (
                "The farmer assessed the field as wet, "
                "so unnecessary irrigation should be avoided."
            )
        })
    else:
        score -= 25
        factors.append({
            "factor": "Soil condition",
            "detail": (
                "The farmer assessed the field as waterlogged, "
                "so additional irrigation should be avoided."
            )
        })
    if x.temperature is not None and x.temperature > 32:
        score += 20
        factors.append({
            "factor": "Weather",
            "detail": (
                f"Temperature is high at "
                f"{x.temperature} degrees C."
            )
        })
    if x.rain_probability is not None:
        if x.rain_probability >= 60:
            score -= 30
            factors.append({
                "factor": "Rain forecast",
                "detail": (
                    f"Rain probability is {x.rain_probability}%, "
                    "so waiting may save water."
                )
            })
        else:
            factors.append({
                "factor": "Rain forecast",
                "detail": (
                    f"Rain probability is {x.rain_probability}%, "
                    "so little rainfall relief is expected."
                )
            })
    if x.humidity is not None and x.humidity > 75:
        factors.append({
            "factor": "Humidity",
            "detail": (
                f"High humidity ({x.humidity}%) can increase "
                "fungal-disease risk."
            )
        })
    if (
        x.disease
        and x.disease_confidence is not None
        and x.disease_confidence >= 70
    ):
        factors.append({
            "factor": "Disease",
            "detail": (
                f"AI screening found {x.disease} with "
                f"{x.disease_confidence}% confidence."
            )
        })
    if score >= 45:
        if (x.rain_probability or 0) < 60:
            rec = "Consider irrigation today"
        else:
            rec = "Delay irrigation and reassess after rainfall"
        benefit = (
            "Reduce crop water stress while avoiding "
            "unnecessary irrigation."
        )
    elif score <= -10:
        rec = (
            "Avoid unnecessary irrigation and "
            "monitor field moisture."
        )
        benefit = (
            "Reduce waterlogging risk and avoid wasted water."
        )
    else:
        rec = (
            "Monitor crop conditions and avoid "
            "unnecessary irrigation"
        )
        benefit = "Save water and avoid over-irrigation."
    priority = (
        "High"
        if score >= 70
        else "Medium"
        if score >= 45
        else "Low"
    )
    confidence = min(
        95,
        max(
            60,
            70 + abs(score - 45) // 2
        )
    )
    return {
        "recommendation": rec,
        "priority": priority,
        "confidence": confidence,
        "reason": (
            "The recommendation combines the farmer-assessed "
            "soil condition with crop stage, current weather "
            "context, and available crop observations."
        ),
        "expected_benefit": benefit,
        "risk": (
            "Weather can change quickly and the soil condition "
            "is farmer-assessed, so reassess before taking action."
        ),
        "factors": factors,
        "context": {
            "crop_type": x.crop_type,
            "growth_stage": growth_stage,
            "farm_size": x.farm_size,
            "soil_condition_internal": soil,
            "temperature": x.temperature,
            "rain_probability": x.rain_probability,
            "humidity": x.humidity
        }
    }
class Chat(BaseModel):
    message: str
    farm_context: dict | None = None
@router.post("/chat")
async def chat(x: Chat):
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        return {
            "answer": (
                "Gemini is not configured yet. Add "
                "GEMINI_API_KEY to backend/.env. "
                "Meanwhile, SmartFarm can still provide "
                "rule-based irrigation and weather decision support."
            )
        }
    try:
        from google import genai
        client = genai.Client(api_key=key)
        prompt = (
            "You are SmartFarm AI, a cautious agricultural "
            "decision-support assistant.\n\n"
            "Answer simply and clearly.\n"
            "Explain your reasoning.\n"
            "Do not invent live weather, market, or scheme data.\n"
            "Use only the supplied farm context.\n"
            "Treat soil condition as farmer-assessed, not as "
            "a sensor measurement.\n"
            "Tell the farmer when local agricultural expert "
            "confirmation is needed.\n\n"
            f"Farm context:\n"
            f"{json.dumps(x.farm_context or {}, ensure_ascii=False)}\n\n"
            f"Farmer question:\n{x.message}"
        )
        interaction = client.interactions.create(
            model="gemini-3.6-flash",
            input=prompt
        )
        answer = interaction.output_text
        return {
            "answer": answer or "Please try again."
        }
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Gemini unavailable: {str(e)}"
        )
