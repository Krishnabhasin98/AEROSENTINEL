import math
import json
from typing import List, Tuple, Dict, Any
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.depot import Depot
from app.models.drone import Drone
from app.models.airspace import AirspaceObservation

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two GPS points in kilometers."""
    R = 6371.0 # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2.0)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def generate_flight_corridor_waypoints(
    origin_lat: float, origin_lng: float,
    dest_lat: float, dest_lng: float,
    num_intermediate_points: int = 15
) -> List[List[float]]:
    """
    Generates a flight corridor with waypoints between two Delhi hubs.
    If the straight line crosses the IGI Airport buffer (around 28.556, 77.100),
    we introduce a safety detour waypoint to route along an airspace corridor.
    """
    waypoints = [[origin_lat, origin_lng]]
    
    # Check if trajectory intersects near IGI Airport (Lat 28.53 to 28.59, Lng 77.06 to 77.14)
    # E.g. Dwarka / Gurugram to Connaught Place or Noida
    mid_lat = (origin_lat + dest_lat) / 2.0
    mid_lng = (origin_lng + dest_lng) / 2.0
    igi_center = (28.5562, 77.1000)
    dist_to_igi = haversine_distance_km(mid_lat, mid_lng, igi_center[0], igi_center[1])
    
    detour_needed = dist_to_igi < 4.5
    
    if detour_needed:
        # Route via Northern Ridge / Dhaula Kuan corridor bypass
        bypass_lat = mid_lat + 0.035
        bypass_lng = mid_lng + 0.025
        
        # Segment 1: Origin to Bypass
        half_pts = num_intermediate_points // 2
        for i in range(1, half_pts):
            t = i / half_pts
            lat = origin_lat + t * (bypass_lat - origin_lat)
            lng = origin_lng + t * (bypass_lng - origin_lng)
            waypoints.append([round(lat, 5), round(lng, 5)])
            
        waypoints.append([round(bypass_lat, 5), round(bypass_lng, 5)])
        
        # Segment 2: Bypass to Destination
        for i in range(1, half_pts + 1):
            t = i / (half_pts + 1)
            lat = bypass_lat + t * (dest_lat - bypass_lat)
            lng = bypass_lng + t * (dest_lng - bypass_lng)
            waypoints.append([round(lat, 5), round(lng, 5)])
    else:
        # Direct smooth corridor with minor gentle curvature simulating navigational airway
        for i in range(1, num_intermediate_points + 1):
            t = i / (num_intermediate_points + 1)
            # Add slight lateral deviation (sine arch) for realistic flight airway
            lat = origin_lat + t * (dest_lat - origin_lat)
            lng = origin_lng + t * (dest_lng - origin_lng)
            curve = math.sin(t * math.pi) * 0.008
            waypoints.append([round(lat + curve, 5), round(lng, 5)])
            
    waypoints.append([dest_lat, dest_lng])
    return waypoints

def evaluate_route_plan(
    db: Session,
    origin_depot_id: int,
    destination_depot_id: int,
    drone_id: int
) -> Dict[str, Any]:
    """
    Evaluates candidate route, distance, battery feasibility against reserve margins,
    and calculates transparent predictive risk factors.
    """
    origin = db.query(Depot).filter(Depot.id == origin_depot_id).first()
    destination = db.query(Depot).filter(Depot.id == destination_depot_id).first()
    drone = db.query(Drone).filter(Drone.id == drone_id).first()

    if not origin or not destination:
        raise ValueError("Invalid origin or destination depot ID")
    if not drone:
        raise ValueError("Drone not found")
    if origin.id == destination.id:
        raise ValueError("Origin and destination depots must be different")

    # Generate waypoints and calculate cumulative distance
    waypoints = generate_flight_corridor_waypoints(
        origin.latitude, origin.longitude,
        destination.latitude, destination.longitude
    )
    
    total_dist_km = 0.0
    for i in range(len(waypoints) - 1):
        total_dist_km += haversine_distance_km(
            waypoints[i][0], waypoints[i][1],
            waypoints[i+1][0], waypoints[i+1][1]
        )
    total_dist_km = round(total_dist_km, 2)

    # Duration estimate at default cruise speed (60 km/h) + 2 min for takeoff/landing
    speed_kmh = drone.speed_kmh if drone.speed_kmh > 0 else settings.DEFAULT_CRUISE_SPEED_KMH
    estimated_duration_min = round((total_dist_km / speed_kmh) * 60.0 + 2.0, 1)

    # Energy calculations
    # Energy required = (Distance * consumption_rate / battery_capacity) * 100 * safety_factor(1.20)
    kwh_needed = total_dist_km * drone.consumption_rate_kwh_per_km
    battery_required_pct = round((kwh_needed / max(drone.battery_capacity_kwh, 0.5)) * 100.0 * 1.20, 1)
    
    current_drone_battery_pct = drone.battery_pct
    remaining_battery_pct = round(current_drone_battery_pct - battery_required_pct, 1)
    
    # Check battery feasibility against safety reserve (20%)
    feasible = True
    rejection_reason = None
    if remaining_battery_pct < settings.MIN_BATTERY_RESERVE_PCT:
        feasible = False
        rejection_reason = (
            f"Battery depletion risk: estimated landing charge ({remaining_battery_pct}%) "
            f"violates safety reserve threshold ({settings.MIN_BATTERY_RESERVE_PCT}%). "
            f"Requires at least {round(battery_required_pct + settings.MIN_BATTERY_RESERVE_PCT, 1)}% prior to dispatch."
        )

    # Evaluate predictive airspace risk factors
    observations = db.query(AirspaceObservation).all()
    risk_factors = []
    base_risk = 12.0 # Baseline low air risk for standard corridor

    for obs in observations:
        # Check closest distance from any corridor waypoint to this observation
        min_distance_to_obs = min(
            haversine_distance_km(wp[0], wp[1], obs.latitude, obs.longitude)
            for wp in waypoints
        )
        hard_threshold_km = obs.radius_m / 1000.0
        advisory_threshold_km = hard_threshold_km + 1.0
        
        if obs.is_hard_constraint and min_distance_to_obs < hard_threshold_km:
            feasible = False
            rejection_reason = f"Flight corridor breaches strict Hard Airspace Constraint: {obs.name}"
            risk_factors.append({
                "category": obs.category,
                "description": f"Encroaches restricted buffer for {obs.name} (closest approach: {round(min_distance_to_obs, 2)} km)",
                "severity": "CRITICAL",
                "impact_pct": 50.0
            })
            base_risk += 50.0
        elif min_distance_to_obs <= advisory_threshold_km:
            if obs.category == "BIRD_HOTSPOT":
                impact = 18.0 if obs.severity == "HIGH" else 10.0
                risk_factors.append({
                    "category": "BIRD_ACTIVITY",
                    "description": f"Proximity to active bird hotspot: {obs.name} (closest: {round(min_distance_to_obs, 2)} km)",
                    "severity": obs.severity,
                    "impact_pct": impact
                })
                base_risk += impact
            elif obs.category == "OBSTACLE":
                impact = 22.0 if obs.severity == "HIGH" else 12.0
                risk_factors.append({
                    "category": "OBSTACLE",
                    "description": f"Known structure {obs.name} at {round(min_distance_to_obs, 2)} km lateral offset",
                    "severity": obs.severity,
                    "impact_pct": impact
                })
                base_risk += impact

    # Weather/thermal factor baseline
    if total_dist_km > 25.0:
        base_risk += 8.0
        risk_factors.append({
            "category": "DISTANCE_EXPOSURE",
            "description": f"Extended cross-NCR transit ({total_dist_km} km) exposed to urban wind shears",
            "severity": "MEDIUM",
            "impact_pct": 8.0
        })

    final_risk_score = min(round(base_risk, 1), 99.0)
    if final_risk_score >= 65.0:
        risk_level = "CRITICAL" if not feasible else "HIGH"
    elif final_risk_score >= 40.0:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    return {
        "origin_depot_id": origin_depot_id,
        "destination_depot_id": destination_depot_id,
        "drone_id": drone_id,
        "distance_km": total_dist_km,
        "estimated_duration_min": estimated_duration_min,
        "battery_required_pct": battery_required_pct,
        "current_drone_battery_pct": current_drone_battery_pct,
        "remaining_battery_pct": remaining_battery_pct,
        "feasible": feasible,
        "rejection_reason": rejection_reason,
        "risk_score": final_risk_score,
        "risk_level": risk_level,
        "risk_factors": risk_factors,
        "route_waypoints": waypoints
    }
