import asyncio
import json
import logging
import datetime
from typing import Dict, List, Set, Optional
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.core.config import settings
from app.models.drone import Drone
from app.models.mission import Mission
from app.models.depot import Depot
from app.models.station import DockingStation
from app.models.swarm import SwarmTeam
from app.models.system_event import SystemEvent
from app.models.telemetry_log import TelemetryLog
from app.core.utils import get_utc_now

logger = logging.getLogger("aerosentinel.simulation")

class TelemetrySimulator:
    def __init__(self):
        self.is_running: bool = False
        self.is_paused: bool = False
        self.speed_multiplier: float = 1.0
        self.tick_rate: float = settings.SIMULATION_TICK_SECONDS
        self._task: Optional[asyncio.Task] = None
        self._lock = asyncio.Lock()
        self.active_websockets: Set[Any] = set()

    async def register_websocket(self, websocket):
        self.active_websockets.add(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_websockets)}")

    async def unregister_websocket(self, websocket):
        self.active_websockets.discard(websocket)
        logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_websockets)}")

    async def broadcast_telemetry(self, data: dict):
        if not self.active_websockets:
            return
        payload = json.dumps(data)
        disconnected = set()
        for ws in self.active_websockets:
            try:
                await ws.send_text(payload)
            except Exception:
                disconnected.add(ws)
        for ws in disconnected:
            self.active_websockets.discard(ws)

    async def start(self):
        async with self._lock:
            if self.is_running:
                self.is_paused = False
                return
            self.is_running = True
            self.is_paused = False
            self._task = asyncio.create_task(self._simulation_loop())
            logger.info("AeroSentinel Telemetry Simulator started.")

    async def pause(self):
        self.is_paused = True
        logger.info("Simulation paused.")

    async def resume(self):
        self.is_paused = False
        logger.info("Simulation resumed.")

    async def stop(self):
        async with self._lock:
            self.is_running = False
            self.is_paused = False
            if self._task and not self._task.done():
                self._task.cancel()
                try:
                    await self._task
                except asyncio.CancelledError:
                    pass
            self._task = None
            logger.info("Simulation stopped.")

    def set_speed(self, multiplier: float):
        self.speed_multiplier = max(0.5, min(multiplier, 10.0))

    async def _simulation_loop(self):
        while self.is_running:
            try:
                if not self.is_paused:
                    await self._tick()
                sleep_time = max(0.2, self.tick_rate / self.speed_multiplier)
                await asyncio.sleep(sleep_time)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in simulation loop: {e}", exc_info=True)
                await asyncio.sleep(2.0)

    async def _tick(self):
        db: Session = SessionLocal()
        try:
            telemetry_snapshot = []
            
            # 1. Update In-Flight Missions & Drones
            active_missions = db.query(Mission).filter(Mission.status == "IN_PROGRESS").all()
            for mission in active_missions:
                drone = db.query(Drone).filter(Drone.id == mission.drone_id).first()
                if not drone:
                    continue

                waypoints = []
                try:
                    waypoints = json.loads(mission.route_geometry_geojson)
                except Exception:
                    waypoints = []

                if not waypoints or len(waypoints) < 2:
                    continue

                total_points = len(waypoints)
                current_idx = mission.current_waypoint_index

                # Step advancement based on speed multiplier
                step_increment = 1
                new_idx = current_idx + step_increment

                if new_idx < total_points:
                    mission.current_waypoint_index = new_idx
                    mission.current_progress_pct = round((new_idx / (total_points - 1)) * 100.0, 1)
                    
                    target_coords = waypoints[new_idx]
                    prev_coords = waypoints[new_idx - 1]
                    
                    # Update drone position
                    drone.latitude = target_coords[0]
                    drone.longitude = target_coords[1]
                    drone.altitude_m = settings.DEFAULT_CRUISE_ALTITUDE_M + (new_idx % 3) * 5
                    drone.speed_kmh = settings.DEFAULT_CRUISE_SPEED_KMH
                    
                    # Calculate heading angle
                    dlat = target_coords[0] - prev_coords[0]
                    dlng = target_coords[1] - prev_coords[1]
                    angle = (57.2958 * math_atan2(dlng, dlat)) % 360
                    drone.heading_deg = round(angle, 1)
                    
                    # Battery consumption per waypoint tick
                    # Approx 0.4% per step
                    drain = (0.4 * self.speed_multiplier)
                    drone.battery_pct = max(5.0, round(drone.battery_pct - drain, 1))
                    drone.status = "IN_FLIGHT"
                    drone.last_telemetry_at = get_utc_now()
                else:
                    # Mission Completed!
                    mission.current_waypoint_index = total_points - 1
                    mission.current_progress_pct = 100.0
                    mission.status = "COMPLETED"
                    mission.completed_at = get_utc_now()

                    dest_depot = db.query(Depot).filter(Depot.id == mission.destination_depot_id).first()
                    drone.latitude = dest_depot.latitude if dest_depot else waypoints[-1][0]
                    drone.longitude = dest_depot.longitude if dest_depot else waypoints[-1][1]
                    drone.altitude_m = 0.0
                    drone.speed_kmh = 0.0
                    drone.status = "AVAILABLE"
                    drone.current_depot_id = mission.destination_depot_id
                    drone.assigned_mission_id = None
                    drone.last_telemetry_at = get_utc_now()

                    # Try to dock at an available station in destination depot
                    avail_station = db.query(DockingStation).filter(
                        DockingStation.depot_id == mission.destination_depot_id,
                        DockingStation.status == "AVAILABLE"
                    ).first()
                    if avail_station:
                        avail_station.status = "OCCUPIED"
                        avail_station.current_drone_id = drone.id
                        drone.current_station_id = avail_station.id
                        # If battery is low, auto-commence charging
                        if drone.battery_pct < 45.0:
                            avail_station.status = "CHARGING"
                            drone.status = "CHARGING"

                    event = SystemEvent(
                        event_type="MISSION_COMPLETED",
                        severity="SUCCESS",
                        title=f"Mission {mission.mission_code} Completed",
                        message=f"Drone {drone.drone_code} safely arrived at destination hub {dest_depot.name if dest_depot else 'Hub'}.",
                        entity_id=mission.mission_code
                    )
                    db.add(event)

            # 2. Update Docked Charging Drones
            charging_drones = db.query(Drone).filter(Drone.status == "CHARGING").all()
            for drone in charging_drones:
                charge_delta = settings.CHARGING_RATE_PCT_PER_TICK * self.speed_multiplier
                new_charge = min(100.0, round(drone.battery_pct + charge_delta, 1))
                drone.battery_pct = new_charge
                drone.last_telemetry_at = get_utc_now()
                
                if new_charge >= 100.0:
                    drone.status = "AVAILABLE"
                    if drone.current_station_id:
                        st = db.query(DockingStation).filter(DockingStation.id == drone.current_station_id).first()
                        if st and st.status == "CHARGING":
                            st.status = "OCCUPIED"
                    
                    event = SystemEvent(
                        event_type="CHARGING_COMPLETE",
                        severity="SUCCESS",
                        title=f"{drone.drone_code} Fully Charged",
                        message=f"Battery charged to 100% capacity. Docked and ready for mission assignment.",
                        entity_id=drone.drone_code
                    )
                    db.add(event)

            # 3. Update Swarm Survey Progress
            surveying_swarms = db.query(SwarmTeam).filter(SwarmTeam.status == "SURVEYING").all()
            for swarm in surveying_swarms:
                prog = min(100.0, swarm.coverage_progress_pct + (4.0 * self.speed_multiplier))
                swarm.coverage_progress_pct = round(prog, 1)
                swarm.last_report_at = get_utc_now()
                if prog >= 100.0:
                    swarm.status = "IDLE"
                    event = SystemEvent(
                        event_type="SWARM_SURVEY_COMPLETE",
                        severity="INFO",
                        title=f"{swarm.name} Recon Complete",
                        message=f"100% coverage achieved for sector '{swarm.survey_area}'.",
                        entity_id=swarm.code
                    )
                    db.add(event)

            # Commit updates
            db.commit()

            # Compile telemetry payload for all active drones
            all_drones = db.query(Drone).all()
            for d in all_drones:
                telemetry_snapshot.append({
                    "id": d.id,
                    "drone_code": d.drone_code,
                    "model": d.model,
                    "latitude": d.latitude,
                    "longitude": d.longitude,
                    "altitude_m": d.altitude_m,
                    "speed_kmh": d.speed_kmh,
                    "heading_deg": d.heading_deg,
                    "battery_pct": d.battery_pct,
                    "health_pct": d.health_pct,
                    "status": d.status,
                    "current_depot_id": d.current_depot_id,
                    "current_station_id": d.current_station_id,
                    "assigned_mission_id": d.assigned_mission_id,
                    "assigned_swarm_id": d.assigned_swarm_id,
                    "last_telemetry_at": d.last_telemetry_at.isoformat() if d.last_telemetry_at else None
                })

            # Broadcast over WebSockets
            ws_payload = {
                "type": "TELEMETRY_UPDATE",
                "timestamp": get_utc_now().isoformat(),
                "simulation": {
                    "is_running": self.is_running,
                    "is_paused": self.is_paused,
                    "speed_multiplier": self.speed_multiplier,
                },
                "drones": telemetry_snapshot
            }
            await self.broadcast_telemetry(ws_payload)

        except Exception as err:
            db.rollback()
            logger.error(f"Error executing simulation tick: {err}", exc_info=True)
        finally:
            db.close()

def math_atan2(y, x):
    import math
    return math.atan2(y, x)

simulator = TelemetrySimulator()
