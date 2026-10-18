from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.services.tinyfish_service import tinyfish_service
from app.core.config import settings

router = APIRouter(prefix="/tinyfish", tags=["TinyFish Intelligence"])

class QueryRequest(BaseModel):
    prompt: str

class UpdateKeyRequest(BaseModel):
    api_key: str

@router.get("/status")
async def get_tinyfish_status():
    """Returns TinyFish integration readiness and operational mode."""
    return {
        "status": "ONLINE",
        "service": "TinyFish.ai Airspace & Regulatory Intelligence Engine",
        "has_live_key": bool(settings.TINYFISH_API_KEY),
        "api_key_masked": f"...{settings.TINYFISH_API_KEY[-4:]}" if len(settings.TINYFISH_API_KEY) > 4 else ("CONFIGURED" if settings.TINYFISH_API_KEY else "NOT_SET"),
        "mode": "LIVE_AGENT" if settings.TINYFISH_API_KEY else "VERIFIED_DGCA_FEED",
        "coverage": "Delhi NCR (Indira Gandhi Intl Airspace Envelope)"
    }

@router.post("/api-key")
async def set_api_key(req: UpdateKeyRequest):
    """Dynamically set or update TinyFish API Key from the frontend or operator settings."""
    clean_key = req.api_key.strip()
    settings.TINYFISH_API_KEY = clean_key
    tinyfish_service.api_key = clean_key
    return {
        "status": "SUCCESS",
        "message": "TinyFish API Key updated successfully",
        "has_live_key": bool(clean_key),
        "mode": "LIVE_AGENT" if clean_key else "VERIFIED_DGCA_FEED"
    }


@router.get("/dgca-rules")
async def get_dgca_rules():
    """Fetch updated DGCA Drone Rules, DigitalSky zoning thresholds, and flight ceiling circulars."""
    rules = await tinyfish_service.get_dgca_rules()
    return {
        "count": len(rules),
        "source": "DGCA DigitalSky & TinyFish Web Agent",
        "rules": rules
    }

@router.get("/weather-advisories")
async def get_weather_advisories():
    """Fetch current IMD micro-climate weather warnings for Delhi NCR depots."""
    advisories = await tinyfish_service.get_weather_advisories()
    return {
        "count": len(advisories),
        "region": "Delhi NCR",
        "advisories": advisories
    }

@router.get("/traffic-analysis")
async def get_traffic_analysis():
    """Fetch airspace traffic density, corridor congestion index, and active NOTAM alerts."""
    analysis = await tinyfish_service.get_airspace_traffic_analysis()
    return analysis

@router.post("/query")
async def query_tinyfish(req: QueryRequest):
    """
    Natural language assistant for drone operators to ask compliance,
    weather, and airspace routing questions.
    """
    if not req.prompt or len(req.prompt.strip()) == 0:
        raise HTTPException(status_code=400, detail="Query prompt cannot be empty.")
    
    result = await tinyfish_service.query_agent(req.prompt.strip())
    return result
