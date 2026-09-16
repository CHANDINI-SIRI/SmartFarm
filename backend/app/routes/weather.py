import httpx
from fastapi import APIRouter,HTTPException,Query
router=APIRouter()
@router.get('')
async def weather(latitude:float=Query(...,ge=-90,le=90),longitude:float=Query(...,ge=-180,le=180)):
 url='https://api.open-meteo.com/v1/forecast';params={'latitude':latitude,'longitude':longitude,'current':'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,wind_speed_10m','daily':'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,uv_index_max','timezone':'auto','forecast_days':7}
 try:
  async with httpx.AsyncClient(timeout=12) as c:
   r=await c.get(url,params=params);r.raise_for_status();return r.json()
 except Exception as e: raise HTTPException(502,detail=f'Weather provider unavailable: {e}')
