import requests
from datetime import datetime
from zoneinfo import ZoneInfo
from fastapi import APIRouter, HTTPException
router = APIRouter()
AGMARKNET_FILTERS = (
    "https://api.agmarknet.gov.in/v1/daily-price-arrival/filters"
)
AGMARKNET_REPORT = (
    "https://api.agmarknet.gov.in/v1/"
    "prices-and-arrivals/date-wise/specific-commodity"
)
HEADERS = {
    "Accept": "application/json, text/plain, */*",
    "Origin": "https://agmarknet.gov.in",
    "Referer": "https://agmarknet.gov.in/",
    "User-Agent": "Mozilla/5.0"
}
CROP_MAP = {
    "paddy": "Paddy(Common)",
    "rice": "Rice",
    "tomato": "Tomato",
    "cotton": "Cotton",
    "maize": "Maize",
    "chilli": "Chilli",
    "wheat": "Wheat"
}
def get_filters():
    response = requests.get(
        AGMARKNET_FILTERS,
        headers=HEADERS,
        timeout=20
    )
    response.raise_for_status()
    data = response.json()
    if not data.get("status"):
        raise RuntimeError("AGMARKNET filters unavailable")
    return data.get("data", {})
def find_commodity_id(crop):
    requested = (crop or "").strip().lower()
    wanted = CROP_MAP.get(
        requested,
        crop
    )
    filters = get_filters()
    commodities = filters.get("cmdt_data", [])
    wanted_lower = str(wanted).lower()
    # Exact match first
    for item in commodities:
        name = str(item.get("cmdt_name", "")).lower()
        if name == wanted_lower:
            return item["cmdt_id"], item["cmdt_name"]
    # Fallback partial match
    for item in commodities:
        name = str(item.get("cmdt_name", "")).lower()
        if wanted_lower in name or name in wanted_lower:
            return item["cmdt_id"], item["cmdt_name"]
    return None, wanted
@router.get("/prices")
def prices(crop: str = ""):
    if not crop:
        return {
            "source": "AGMARKNET 2.0",
            "live": False,
            "items": [],
            "message": "No crop was supplied."
        }
    try:
        commodity_id, commodity_name = find_commodity_id(crop)
        if commodity_id is None:
            return {
                "source": "AGMARKNET 2.0",
                "live": False,
                "items": [],
                "message": (
                    f"No AGMARKNET commodity was found for '{crop}'."
                )
            }
        now = datetime.now(
            ZoneInfo("Asia/Kolkata")
        )
        year = now.year
        month = now.month
        # AGMARKNET uses stateId=2 for Andhra Pradesh,
        # confirmed through the working public endpoint.
        state_id = 2
        response = requests.get(
            AGMARKNET_REPORT,
            headers=HEADERS,
            params={
                "year": year,
                "month": month,
                "stateId": state_id,
                "commodityId": commodity_id,
                "includeExcel": "false"
            },
            timeout=20
        )
        response.raise_for_status()
        data = response.json()
        markets = data.get("markets", [])
        items = []
        for market in markets:
            market_name = market.get(
                "marketName",
                "Unknown market"
            )
            for day in market.get("dates", []):
                arrival_date = day.get(
                    "arrivalDate",
                    ""
                )
                for row in day.get("data", []):
                    items.append({
                        "market": market_name,
                        "commodity": commodity_name,
                        "variety": row.get(
                            "variety",
                            ""
                        ),
                        "date": arrival_date,
                        "arrivals": row.get(
                            "arrivals"
                        ),
                        "min_price": row.get(
                            "minimumPrice"
                        ),
                        "max_price": row.get(
                            "maximumPrice"
                        ),
                        "modal_price": row.get(
                            "modalPrice"
                        ),
                        "price": row.get(
                            "modalPrice"
                        ),
                        "unit": "Rs./quintal"
                    })
        # Newest dates first
        items.sort(
            key=lambda x: x.get("date", ""),
            reverse=True
        )
        return {
            "source": "AGMARKNET 2.0",
            "live": True,
            "commodity": commodity_name,
            "state": "Andhra Pradesh",
            "year": year,
            "month": month,
            "items": items[:30],
            "message": (
                f"Latest AGMARKNET records for "
                f"{commodity_name}."
            )
        }
    except requests.RequestException as e:
        raise HTTPException(
            status_code=502,
            detail=f"AGMARKNET unavailable: {e}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Market data error: {e}"
        )
