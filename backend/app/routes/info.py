import httpx
from fastapi import APIRouter, Query
router = APIRouter()
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
NOMINATIM_HEADERS = {
    "User-Agent": "SmartFarm-AI/1.0 agricultural decision support"
}
@router.get("/api/schemes")
def schemes():
    return [
        {
            "name": "PM-KISAN",
            "description": "Income support scheme information for eligible landholding farmer families.",
            "eligibility": "See current official eligibility rules.",
            "official_source": "https://pmkisan.gov.in/",
            "apply_url": "https://www.pmkisan.gov.in/RegistrationFormupdated.aspx"
        },
        {
            "name": "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
            "description": "Crop insurance scheme information for eligible farmers and notified crops/areas.",
            "eligibility": "Eligibility and notified crops vary by season and state.",
            "official_source": "https://pmfby.gov.in/",
            "apply_url": "https://pmfby.gov.in/farmerRegistrationForm"
        },
        {
            "name": "eNAM",
            "description": "National Agriculture Market information and trading platform.",
            "eligibility": "Market participation depends on applicable market arrangements.",
            "official_source": "https://www.enam.gov.in/",
            "apply_url": "https://enam.gov.in/web/"
        }
    ]
@router.get("/api/procurement/nearby")
async def procurement(
    latitude: float = Query(...),
    longitude: float = Query(...)
):
    queries = [
        "mandi",
        "agricultural market",
        "procurement center",
        "collection center",
        "market"
    ]
    results = []
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            for query in queries:
                response = await client.get(
                    NOMINATIM_URL,
                    params={
                        "q": query,
                        "format": "jsonv2",
                        "limit": 10,
                        "lat": latitude,
                        "lon": longitude,
                        "addressdetails": 1,
                        "countrycodes": "in"
                    },
                    headers=NOMINATIM_HEADERS
                )
                response.raise_for_status()
                results.extend(response.json())
        unique = {}
        for place in results:
            lat = place.get("lat")
            lon = place.get("lon")
            if not lat or not lon:
                continue
            name = place.get(
                "name"
            ) or place.get(
                "display_name",
                "Mapped agricultural/market location"
            ).split(",")[0]
            display_name = place.get(
                "display_name",
                ""
            )
            key = (
                name,
                lat,
                lon
            )
            unique[key] = {
                "name": name,
                "address": display_name,
                "latitude": float(lat),
                "longitude": float(lon),
                "directions_url": (
                    "https://www.google.com/maps/dir/?api=1"
                    f"&destination={lat},{lon}"
                )
            }
        items = list(unique.values())[:30]
        return {
            "source": "OpenStreetMap / Nominatim",
            "items": items,
            "count": len(items),
            "message": (
                "Mapped locations from OpenStreetMap. "
                "These are not automatically verified "
                "government procurement centres."
            )
        }
    except httpx.HTTPStatusError as e:
        return {
            "source": "OpenStreetMap / Nominatim",
            "items": [],
            "count": 0,
            "error": (
                f"Nominatim returned HTTP "
                f"{e.response.status_code}"
            )
        }
    except Exception as e:
        return {
            "source": "OpenStreetMap / Nominatim",
            "items": [],
            "count": 0,
            "error": str(e)
        }
