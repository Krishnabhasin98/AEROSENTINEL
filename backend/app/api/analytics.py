from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.drone import Drone
from app.models.mission import Mission
from app.models.airspace import AirspaceObservation
from app.models.depot import Depot

router = APIRouter()

@router.get("/analytics/summary")
def get_analytics_summary(db: Session = Depends(get_db)):
    drones = db.query(Drone).all()
    missions = db.query(Mission).all()
    depots = db.query(Depot).all()
    observations = db.query(AirspaceObservation).all()

    # 1. Fleet Status Distribution
    status_counts = {}
    for d in drones:
        status_counts[d.status] = status_counts.get(d.status, 0) + 1

    fleet_distribution = [
        {"name": "Available", "value": status_counts.get("AVAILABLE", 0), "color": "#15803D"},
        {"name": "In Flight", "value": status_counts.get("IN_FLIGHT", 0), "color": "#2563EB"},
        {"name": "Charging", "value": status_counts.get("CHARGING", 0), "color": "#008C95"},
        {"name": "Maintenance", "value": status_counts.get("MAINTENANCE", 0), "color": "#D97706"},
        {"name": "Offline", "value": status_counts.get("OFFLINE", 0), "color": "#64748B"}
    ]

    # 2. Simulated Daily Flight Hours Trend (Past 7 days)
    flight_trend = [
        {"day": "Mon", "flightHours": 14.2, "energyKwh": 48.5, "missions": 12},
        {"day": "Tue", "flightHours": 18.5, "energyKwh": 62.1, "missions": 16},
        {"day": "Wed", "flightHours": 16.0, "energyKwh": 54.0, "missions": 14},
        {"day": "Thu", "flightHours": 22.4, "energyKwh": 76.2, "missions": 19},
        {"day": "Fri", "flightHours": 25.1, "energyKwh": 85.8, "missions": 23},
        {"day": "Sat", "flightHours": 19.8, "energyKwh": 67.4, "missions": 17},
        {"day": "Sun", "flightHours": 21.0, "energyKwh": 71.3, "missions": 18}
    ]

    # 3. Charging Efficiency by Depot Hub
    depot_utilization = []
    for dep in depots:
        tot_st = len(dep.stations)
        occ_st = sum(1 for s in dep.stations if s.status in ("OCCUPIED", "CHARGING"))
        util_pct = round((occ_st / max(tot_st, 1)) * 100.0, 1)
        depot_utilization.append({
            "name": dep.name.replace(" Hub", "").replace(" Depot", ""),
            "utilizationPct": util_pct,
            "totalStations": tot_st,
            "occupiedStations": occ_st
        })

    # 4. Airspace Obstacle Risk Breakdown
    risk_categories = {
        "OBSTACLE": 0,
        "BIRD_HOTSPOT": 0,
        "RESTRICTED_ZONE": 0
    }
    for obs in observations:
        if obs.category in risk_categories:
            risk_categories[obs.category] += 1

    risk_breakdown = [
        {"category": "Infrastructure Obstacles", "count": risk_categories["OBSTACLE"], "color": "#D97706"},
        {"category": "Bird Migration Hotspots", "count": risk_categories["BIRD_HOTSPOT"], "color": "#008C95"},
        {"category": "Restricted DGCA Zones", "count": risk_categories["RESTRICTED_ZONE"], "color": "#DC2626"}
    ]

    # 5. Battery Health Breakdown across Fleet
    battery_health_data = [
        {"drone": d.drone_code, "health": d.health_pct, "battery": d.battery_pct, "model": d.model}
        for d in drones
    ]

    return {
        "fleet_distribution": fleet_distribution,
        "flight_trend": flight_trend,
        "depot_utilization": depot_utilization,
        "risk_breakdown": risk_breakdown,
        "battery_health_data": battery_health_data,
        "total_missions_executed": len(missions),
        "total_fleet_size": len(drones)
    }
