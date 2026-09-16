import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .auth import router as auth_router
from .routes.weather import router as weather_router
from .routes.ai import router as ai_router
from .routes.irrigation import router as irrigation_router
from .routes.market import router as market_router
from .routes.info import router as info_router
from .routes.farm import router as farm_router
from .routes.data import router as data_router


load_dotenv()


app = FastAPI(
    title="SmartFarm AI API",
    version="2.0.0"
)


origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Authentication
app.include_router(
    auth_router,
    prefix="/api/auth",
    tags=["Authentication"]
)


# Farm management
app.include_router(
    farm_router,
    prefix="/api/farms",
    tags=["Farms"]
)


# Database records
app.include_router(
    data_router,
    prefix="/api/data",
    tags=["Data"]
)


# Existing SmartFarm APIs
app.include_router(
    weather_router,
    prefix="/api/weather",
    tags=["Weather"]
)

app.include_router(
    ai_router,
    prefix="/api/ai",
    tags=["AI"]
)

app.include_router(
    irrigation_router,
    prefix="/api/irrigation",
    tags=["Irrigation"]
)

app.include_router(
    market_router,
    prefix="/api/market",
    tags=["Market"]
)

app.include_router(
    info_router,
    tags=["Information"]
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "SmartFarm AI API",
        "database": "MySQL"
    }