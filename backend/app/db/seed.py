import json
import datetime
from sqlalchemy.orm import Session
from app.db.database import Base, engine, SessionLocal
from app.core.config import settings
from app.models.depot import Depot
from app.models.station import DockingStation
from app.models.drone import Drone
from app.models.swarm import SwarmTeam
from app.models.mission import Mission
from app.models.airspace import AirspaceObservation
from app.models.system_event import SystemEvent
from app.services.route_service import generate_flight_corridor_waypoints, haversine_distance_km
from app.core.utils import get_utc_now

def seed_database(db: Session):
    # Ensure tables are created
    Base.metadata.create_all(bind=engine)

    # 1. Seed Delhi NCR Depots
    existing_depots = db.query(Depot).count()
    if existing_depots == 0:
        depot_objects = []
        for key, hub in settings.HUBS.items():
            d = Depot(
                code=hub["code"],
                name=hub["name"],
                latitude=hub["lat"],
                longitude=hub["lng"],
                address=hub["address"],
                total_capacity=hub["capacity"],
                status="OPERATIONAL"
            )
            db.add(d)
            depot_objects.append(d)
        db.commit()

        # 2. Seed Docking Stations for each Depot (4 per depot = 16 total)
        for d in db.query(Depot).all():
            for bay in range(1, 5):
                st = DockingStation(
                    depot_id=d.id,
                    station_code=f"{d.code}-BAY-0{bay}",
                    bay_number=bay,
                    status="AVAILABLE",
                    power_output_kw=3.3 if bay <= 2 else 7.4 # Fast charging on bays 3 & 4
                )
                db.add(st)
        db.commit()

    # Retrieve depots and stations
    depots = {d.code: d for d in db.query(Depot).all()}
    stations = db.query(DockingStation).all()

    # 3. Seed Swarm Teams
    existing_swarms = db.query(SwarmTeam).count()
    if existing_swarms == 0:
        s1 = SwarmTeam(
            name="AIRSWARM ALPHA",
            code="SWRM-ALPHA",
            status="IDLE",
            survey_area="Delhi Northern Airway Corridor",
            mission_objective="Cooperative structural obstacle mapping & microwave tower verification",
            coverage_progress_pct=65.0,
            detected_obstacles_count=3,
            bird_observations_count=1
        )
        s2 = SwarmTeam(
            name="AIRSWARM BRAVO",
            code="SWRM-BRAVO",
            status="IDLE",
            survey_area="Yamuna Basin & Eco-Hotspot Buffer",
            mission_objective="Seasonal migratory bird tracking & low-altitude risk classification",
            coverage_progress_pct=82.0,
            detected_obstacles_count=1,
            bird_observations_count=4
        )
        db.add(s1)
        db.add(s2)
        db.commit()

    swarms = {s.code: s for s in db.query(SwarmTeam).all()}

    # 4. Seed Fleet of Drones
    existing_drones = db.query(Drone).count()
    if existing_drones == 0:
        cp_depot = depots.get("DEPOT-CP-01")
        dwk_depot = depots.get("DEPOT-DWK-02")
        ggn_depot = depots.get("DEPOT-GGN-03")
        nda_depot = depots.get("DEPOT-NDA-04")

        cp_st1 = db.query(DockingStation).filter(DockingStation.depot_id == cp_depot.id, DockingStation.bay_number == 1).first()
        cp_st2 = db.query(DockingStation).filter(DockingStation.depot_id == cp_depot.id, DockingStation.bay_number == 2).first()
        dwk_st1 = db.query(DockingStation).filter(DockingStation.depot_id == dwk_depot.id, DockingStation.bay_number == 1).first()
        ggn_st1 = db.query(DockingStation).filter(DockingStation.depot_id == ggn_depot.id, DockingStation.bay_number == 1).first()
        nda_st1 = db.query(DockingStation).filter(DockingStation.depot_id == nda_depot.id, DockingStation.bay_number == 1).first()
        nda_st2 = db.query(DockingStation).filter(DockingStation.depot_id == nda_depot.id, DockingStation.bay_number == 2).first()

        fleet = [
            Drone(
                drone_code="AERO-X1",
                model="SkyRanger Pro",
                serial_number="SR-PRO-2026-901",
                latitude=cp_depot.latitude,
                longitude=cp_depot.longitude,
                battery_pct=96.0,
                health_pct=99.0,
                status="AVAILABLE",
                current_depot_id=cp_depot.id,
                current_station_id=cp_st1.id if cp_st1 else None,
                assigned_swarm_id=swarms["SWRM-ALPHA"].id
            ),
            Drone(
                drone_code="AERO-X2",
                model="SkyRanger Pro",
                serial_number="SR-PRO-2026-902",
                latitude=cp_depot.latitude,
                longitude=cp_depot.longitude,
                battery_pct=42.0,
                health_pct=97.0,
                status="CHARGING",
                current_depot_id=cp_depot.id,
                current_station_id=cp_st2.id if cp_st2 else None
            ),
            Drone(
                drone_code="AERO-V1",
                model="Valkyrie VTOL Long-Range",
                serial_number="VK-VTOL-2026-441",
                latitude=28.6100,
                longitude=77.1350,
                altitude_m=125.0,
                speed_kmh=62.0,
                heading_deg=84.0,
                battery_pct=78.0,
                health_pct=98.0,
                status="IN_FLIGHT",
                current_depot_id=None,
                current_station_id=None
            ),
            Drone(
                drone_code="AERO-V2",
                model="Valkyrie VTOL Long-Range",
                serial_number="VK-VTOL-2026-442",
                latitude=ggn_depot.latitude,
                longitude=ggn_depot.longitude,
                battery_pct=91.0,
                health_pct=99.0,
                status="AVAILABLE",
                current_depot_id=ggn_depot.id,
                current_station_id=ggn_st1.id if ggn_st1 else None,
                assigned_swarm_id=swarms["SWRM-BRAVO"].id
            ),
            Drone(
                drone_code="AERO-S1",
                model="Sentinel Reconnaissance Mk IV",
                serial_number="SEN-MK4-2026-108",
                latitude=dwk_depot.latitude,
                longitude=dwk_depot.longitude,
                battery_pct=88.0,
                health_pct=96.0,
                status="AVAILABLE",
                current_depot_id=dwk_depot.id,
                current_station_id=dwk_st1.id if dwk_st1 else None,
                assigned_swarm_id=swarms["SWRM-ALPHA"].id
            ),
            Drone(
                drone_code="AERO-S2",
                model="Sentinel Reconnaissance Mk IV",
                serial_number="SEN-MK4-2026-109",
                latitude=nda_depot.latitude,
                longitude=nda_depot.longitude,
                battery_pct=34.0,
                health_pct=94.0,
                status="CHARGING",
                current_depot_id=nda_depot.id,
                current_station_id=nda_st1.id if nda_st1 else None,
                assigned_swarm_id=swarms["SWRM-BRAVO"].id
            ),
            Drone(
                drone_code="AERO-H1",
                model="HeavyLifter Cargo Carrier",
                serial_number="HL-CARGO-2026-701",
                latitude=nda_depot.latitude,
                longitude=nda_depot.longitude,
                battery_pct=100.0,
                health_pct=100.0,
                status="AVAILABLE",
                current_depot_id=nda_depot.id,
                current_station_id=nda_st2.id if nda_st2 else None
            ),
            Drone(
                drone_code="AERO-H2",
                model="HeavyLifter Cargo Carrier",
                serial_number="HL-CARGO-2026-702",
                latitude=dwk_depot.latitude,
                longitude=dwk_depot.longitude,
                battery_pct=18.0,
                health_pct=89.0,
                status="MAINTENANCE",
                current_depot_id=dwk_depot.id,
                current_station_id=None
            )
        ]

        for drone in fleet:
            db.add(drone)
        db.commit()

        # Update station statuses to reflect docked drones
        if cp_st1:
            cp_st1.current_drone_id = fleet[0].id
            cp_st1.status = "OCCUPIED"
        if cp_st2:
            cp_st2.current_drone_id = fleet[1].id
            cp_st2.status = "CHARGING"
        if ggn_st1:
            ggn_st1.current_drone_id = fleet[3].id
            ggn_st1.status = "OCCUPIED"
        if dwk_st1:
            dwk_st1.current_drone_id = fleet[4].id
            dwk_st1.status = "OCCUPIED"
        if nda_st1:
            nda_st1.current_drone_id = fleet[5].id
            nda_st1.status = "CHARGING"
        if nda_st2:
            nda_st2.current_drone_id = fleet[6].id
            nda_st2.status = "OCCUPIED"
        db.commit()

    # 5. Seed Airspace Intelligence Observations (Obstacles, Bird Hotspots, Restricted Zones)
    existing_obs = db.query(AirspaceObservation).count()
    if existing_obs == 0:
        obs_data = [
            AirspaceObservation(
                category="RESTRICTED_ZONE",
                name="IGI Airport Airspace Core Buffer",
                latitude=28.5562,
                longitude=77.1000,
                radius_m=4200.0,
                altitude_min_m=0.0,
                altitude_max_m=1200.0,
                severity="CRITICAL",
                confidence_pct=100.0,
                verified=True,
                is_hard_constraint=True,
                details="Strict Indian Directorate General of Civil Aviation (DGCA) Red Zone. Zero drone flight tolerance."
            ),
            AirspaceObservation(
                category="RESTRICTED_ZONE",
                name="Central Vista VIP Flight Restriction Zone",
                latitude=28.6143,
                longitude=77.2005,
                radius_m=750.0,
                altitude_min_m=0.0,
                altitude_max_m=900.0,
                severity="HIGH",
                confidence_pct=100.0,
                verified=True,
                is_hard_constraint=True,
                details="High-security sovereign zone. Strict automated corridor avoidance required."
            ),
            AirspaceObservation(
                category="OBSTACLE",
                name="Pitampura Telecommunication Tower",
                latitude=28.6998,
                longitude=77.1438,
                radius_m=350.0,
                altitude_min_m=0.0,
                altitude_max_m=235.0,
                severity="HIGH",
                confidence_pct=99.0,
                verified=True,
                is_hard_constraint=False,
                details="235m broadcast lattice mast with guy wires and aviation red warning beacons."
            ),
            AirspaceObservation(
                category="OBSTACLE",
                name="Signature Bridge Cable Pylon",
                latitude=28.7180,
                longitude=77.2285,
                radius_m=300.0,
                altitude_min_m=0.0,
                altitude_max_m=154.0,
                severity="MEDIUM",
                confidence_pct=98.0,
                verified=True,
                is_hard_constraint=False,
                details="154m asymmetrically inclined steel cable-stayed pylon over Yamuna River."
            ),
            AirspaceObservation(
                category="OBSTACLE",
                name="Noida-Dadri High Voltage Transmission Grid",
                latitude=28.6150,
                longitude=77.3400,
                radius_m=450.0,
                altitude_min_m=0.0,
                altitude_max_m=85.0,
                severity="MEDIUM",
                confidence_pct=92.0,
                verified=True,
                is_hard_constraint=False,
                details="400kV overhead transmission cables spanning East NCR logistics corridor."
            ),
            AirspaceObservation(
                category="BIRD_HOTSPOT",
                name="Okhla Bird Sanctuary Wetland Cluster",
                latitude=28.5350,
                longitude=77.3050,
                radius_m=1400.0,
                altitude_min_m=20.0,
                altitude_max_m=180.0,
                severity="HIGH",
                confidence_pct=88.0,
                verified=True,
                is_hard_constraint=False,
                details="Heavy dawn/dusk migratory bird concentrations (flamingos, pelicans). High collision risk below 150m."
            ),
            AirspaceObservation(
                category="BIRD_HOTSPOT",
                name="Yamuna Bio-Corridor Thermal Roosting Area",
                latitude=28.6650,
                longitude=77.2400,
                radius_m=900.0,
                altitude_min_m=30.0,
                altitude_max_m=160.0,
                severity="MEDIUM",
                confidence_pct=79.0,
                verified=False,
                is_hard_constraint=False,
                details="Observation logged by AIRSWARM BRAVO: black kites utilizing thermal updrafts."
            ),
            AirspaceObservation(
                category="BIRD_HOTSPOT",
                name="Najafgarh Drain Eco-Flight Crossing",
                latitude=28.5150,
                longitude=76.9950,
                radius_m=1100.0,
                altitude_min_m=25.0,
                altitude_max_m=140.0,
                severity="LOW",
                confidence_pct=72.0,
                verified=False,
                is_hard_constraint=False,
                details="Unverified sensor blips indicating seasonal avian movement across Southwest NCR corridor."
            )
        ]
        for obs in obs_data:
            db.add(obs)
        db.commit()

    # 6. Seed Sample Active and Completed Missions
    existing_missions = db.query(Mission).count()
    if existing_missions == 0:
        dwk = depots.get("DEPOT-DWK-02")
        cp = depots.get("DEPOT-CP-01")
        ggn = depots.get("DEPOT-GGN-03")
        nda = depots.get("DEPOT-NDA-04")

        v1_drone = db.query(Drone).filter(Drone.drone_code == "AERO-V1").first()

        # In-Progress Mission for AERO-V1 from Dwarka to Connaught Place
        if v1_drone and dwk and cp:
            wps = generate_flight_corridor_waypoints(dwk.latitude, dwk.longitude, cp.latitude, cp.longitude, 20)
            dist = 0.0
            for i in range(len(wps) - 1):
                dist += haversine_distance_km(wps[i][0], wps[i][1], wps[i+1][0], wps[i+1][1])
            dist = round(dist, 2)
            
            half_idx = len(wps) // 2
            v1_drone.latitude = wps[half_idx][0]
            v1_drone.longitude = wps[half_idx][1]

            m_active = Mission(
                mission_code="MSN-DEL-801",
                name="Inter-Depot Express Medical Logistics",
                drone_id=v1_drone.id,
                origin_depot_id=dwk.id,
                destination_depot_id=cp.id,
                status="IN_PROGRESS",
                distance_km=dist,
                estimated_duration_min=18.5,
                battery_required_pct=26.4,
                current_progress_pct=50.0,
                current_waypoint_index=half_idx,
                risk_score=24.5,
                risk_level="LOW",
                risk_factors_json=json.dumps([
                    {"category": "CORRIDOR", "description": "Safe bypass north of IGI exclusion buffer", "severity": "LOW", "impact_pct": 5.0}
                ]),
                route_geometry_geojson=json.dumps(wps),
                started_at=get_utc_now() - datetime.timedelta(minutes=9)
            )
            db.add(m_active)
            db.commit()
            v1_drone.assigned_mission_id = m_active.id
            db.commit()

        # Completed mission for historical record
        if cp and nda:
            wps_comp = generate_flight_corridor_waypoints(cp.latitude, cp.longitude, nda.latitude, nda.longitude, 15)
            m_comp = Mission(
                mission_code="MSN-DEL-799",
                name="Cyber City Routine Avionics Transport",
                drone_id=None,
                origin_depot_id=cp.id,
                destination_depot_id=nda.id,
                status="COMPLETED",
                distance_km=16.8,
                estimated_duration_min=17.0,
                battery_required_pct=22.0,
                current_progress_pct=100.0,
                current_waypoint_index=len(wps_comp) - 1,
                risk_score=18.0,
                risk_level="LOW",
                risk_factors_json=json.dumps([]),
                route_geometry_geojson=json.dumps(wps_comp),
                started_at=get_utc_now() - datetime.timedelta(hours=2),
                completed_at=get_utc_now() - datetime.timedelta(hours=1, minutes=42)
            )
            db.add(m_comp)
            db.commit()

    # 7. Seed System Events
    existing_events = db.query(SystemEvent).count()
    if existing_events == 0:
        events = [
            SystemEvent(
                event_type="SYSTEM_BOOT",
                severity="SUCCESS",
                title="AeroSentinel Centralized Command Online",
                message="Delhi NCR Regional Airspace Management System initialized with 4 autonomous hubs and 16 docking stations.",
                entity_id="SYS-CORE"
            ),
            SystemEvent(
                event_type="TELEMETRY_LINK",
                severity="INFO",
                title="Telemetry Link Synchronized",
                message="High-frequency telemetry stream operational across 8 active fleet drones.",
                entity_id="AERO-X1"
            ),
            SystemEvent(
                event_type="MISSION_START",
                severity="INFO",
                title="Mission MSN-DEL-801 En Route",
                message="Drone AERO-V1 airborne from Dwarka Sec 12 bound for Connaught Place Central Hub.",
                entity_id="MSN-DEL-801"
            ),
            SystemEvent(
                event_type="OBSTACLE_ALERT",
                severity="WARNING",
                title="Airspace Proximity Warning",
                message="Okhla Bird Sanctuary active warning zone flagged for flight path planning.",
                entity_id="OBS-OKHLA"
            )
        ]
        for ev in events:
            db.add(ev)
        db.commit()

    print("AeroSentinel database initialized and seeded successfully.")
