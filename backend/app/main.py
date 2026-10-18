import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import engine, Base, SessionLocal
from app.db.seed import seed_database
from app.simulation.simulator import simulator
from app.api import depots, drones, missions, swarms, airspace, dashboard, simulation, analytics, events, ws, tinyfish

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("aerosentinel")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables, seed initial demonstration data, start telemetry simulator
    logger.info("Initializing AeroSentinel core services and database...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    
    # Auto-start telemetry simulator loop
    await simulator.start()
    logger.info("AeroSentinel Telemetry Engine active and ready.")
    
    yield

    # Shutdown: gracefully terminate simulation loop and WebSocket connections
    logger.info("Shutting down AeroSentinel telemetry background services...")
    await simulator.stop()
    logger.info("AeroSentinel shutdown complete.")

app = FastAPI(
    title=settings.PROJECT_TITLE,
    version=settings.VERSION,
    description="Centralized autonomous drone depot and predictive airspace intelligence control platform.",
    lifespan=lifespan
)

# Enable CORS for local Vite dev server and production frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# Health endpoint
@app.get("/api/health")
def health_check():
    return {
        "status": "HEALTHY",
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "simulator_running": simulator.is_running,
        "hubs_configured": len(settings.HUBS)
    }

# Register API Routers
app.include_router(dashboard.router, prefix=settings.API_V1_STR, tags=["Dashboard"])
app.include_router(depots.router, prefix=settings.API_V1_STR, tags=["Depots & Stations"])
app.include_router(drones.router, prefix=settings.API_V1_STR, tags=["Fleet"])
app.include_router(missions.router, prefix=settings.API_V1_STR, tags=["Missions & Routing"])
app.include_router(swarms.router, prefix=settings.API_V1_STR, tags=["Swarms"])
app.include_router(airspace.router, prefix=settings.API_V1_STR, tags=["Airspace Intelligence"])
app.include_router(simulation.router, prefix=settings.API_V1_STR, tags=["Simulation"])
app.include_router(analytics.router, prefix=settings.API_V1_STR, tags=["Analytics"])
app.include_router(events.router, prefix=settings.API_V1_STR, tags=["System Events"])
app.include_router(tinyfish.router, prefix=settings.API_V1_STR, tags=["TinyFish Intelligence"])
app.include_router(ws.router, tags=["WebSockets"])
