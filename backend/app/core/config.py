import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "AEROSENTINEL"
    PROJECT_TITLE: str = "AEROSENTINEL — AI-Powered Autonomous Drone Depot & Predictive Airspace Intelligence System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = "sqlite:///./aerosentinel.db"
    
    # Allowed CORS Origins
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000"
    ]
    
    # TinyFish.ai Configuration
    TINYFISH_API_KEY: str = os.getenv("TINYFISH_API_KEY", "")
    TINYFISH_API_BASE: str = "https://api.tinyfish.ai/v1"
    
    # Simulation defaults
    SIMULATION_TICK_SECONDS: float = 2.0
    MIN_BATTERY_RESERVE_PCT: float = 20.0
    CHARGING_RATE_PCT_PER_TICK: float = 4.0
    DEFAULT_CRUISE_SPEED_KMH: float = 60.0
    DEFAULT_CRUISE_ALTITUDE_M: float = 120.0

    # Delhi NCR Core Hub coordinates
    HUBS: dict = {
        "CONNAUGHT_PLACE": {
            "name": "Connaught Place Central Hub",
            "code": "DEPOT-CP-01",
            "lat": 28.6328,
            "lng": 77.2197,
            "address": "Inner Circle, Connaught Place, New Delhi",
            "capacity": 4
        },
        "DWARKA_SEC_12": {
            "name": "Dwarka Sector 12 Depot",
            "code": "DEPOT-DWK-02",
            "lat": 28.5921,
            "lng": 77.0460,
            "address": "Sector 12, Dwarka, New Delhi",
            "capacity": 4
        },
        "GURUGRAM_CYBER": {
            "name": "Gurugram Cyber Hub Depot",
            "code": "DEPOT-GGN-03",
            "lat": 28.4950,
            "lng": 77.0895,
            "address": "DLF Cyber City, Phase 2, Gurugram, Haryana",
            "capacity": 4
        },
        "NOIDA_SEC_62": {
            "name": "Noida Sector 62 Tech Depot",
            "code": "DEPOT-NDA-04",
            "lat": 28.6280,
            "lng": 77.3649,
            "address": "Electronic City, Sector 62, Noida, Uttar Pradesh",
            "capacity": 4
        }
    }

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
