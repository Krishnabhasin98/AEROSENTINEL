# AEROSENTINEL

**A project by Team CodeArceus**

### AI-Powered Autonomous Drone Depot & Predictive Airspace Intelligence System

**AeroSentinel** is a centralized, aerospace-grade operations command platform designed for autonomous drone depot networks, docking bay allocation, real-time kinematic telemetry streaming, cooperative swarm reconnaissance, and predictive airspace risk modeling across the Delhi National Capital Region (NCR).

Developed for hackathon demonstration, AeroSentinel provides a responsive light-themed aviation UI, dynamic OpenStreetMap integration, a deterministic energy and obstacle risk engine, and an autonomous Python FastAPI simulation backend, augmented with real-time web intelligence.

---

## 📸 Visuals & Application Gallery

High-resolution screenshots captured across all 10 core operational sections are available in the [`visuals/`](./visuals) folder:

| Module View | Preview File | Description |
| :--- | :--- | :--- |
| **01. Overview Command Deck** | [`01_overview_command_dashboard.png`](./visuals/01_overview_command_dashboard.png) | 6 live KPI cards, interactive Delhi NCR map, layer toggles |
| **02. Live Telemetry Stream** | [`02_realtime_telemetry_stream.png`](./visuals/02_realtime_telemetry_stream.png) | Kinematic flight coordinates, altitude, heading, speeds, sim deck |
| **03. Airspace Intelligence** | [`03_delhi_airspace_hazard_matrix.png`](./visuals/03_delhi_airspace_hazard_matrix.png) | Obstacle registry, avian hotspots, DGCA red zones, TinyFish |
| **04. Fleet Management** | [`04_autonomous_drone_fleet.png`](./visuals/04_autonomous_drone_fleet.png) | 8 UAVs, payload specs, battery health, maintenance logs |
| **05. Depots & Docking Bays** | [`05_depots_docking_bays.png`](./visuals/05_depots_docking_bays.png) | 4 Delhi hubs, 16 automated bays with conflict-safe docking |
| **06. Cooperative Swarms** | [`06_cooperative_swarms.png`](./visuals/06_cooperative_swarms.png) | AIRSWARM ALPHA & BRAVO survey sweeps and blip logging |
| **07. Predictive Route Planner** | [`07_predictive_mission_planner.png`](./visuals/07_predictive_mission_planner.png) | 4-step mission dispatch, energy feasibility, reserve threshold |
| **08. Battery & Charging Grid** | [`08_battery_charging_grid.png`](./visuals/08_battery_charging_grid.png) | SoC meters, DC Fast Charging stations, battery diagnostics |
| **09. Operations Analytics** | [`09_operations_analytics.png`](./visuals/09_operations_analytics.png) | Flight hours trends, depot utilization, energy analytics |
| **10. Simulation Controls** | [`10_simulation_system_settings.png`](./visuals/10_simulation_system_settings.png) | Tick rate tuning, safety margin adjustment, clean re-seeding |

---

## 1. System Architecture


```text
+-----------------------------------------------------------------------------------+
|                            AEROSENTINEL OPERATIONS DECK                           |
|                      (React 19 + TypeScript + Vite + Tailwind CSS)                |
+-----------------------------------------------------------------------------------+
       |                                      ^                         ^
  REST API (CRUD & Controls)             WebSockets (/ws/telemetry)    State
       v                                      |                         |
+--------------------------------+  +--------------------+  +----------------------+
|       FastAPI Backend          |  |  Async Simulation  |  |     Zustand Store    |
| (Depots, Swarms, Missions,     |  | (Kinematic vectors,|  | (Telemetry merging,  |
|  Airspace Hazards, Analytics)  |  |  Battery drain,    |  |  Selection drawers,  |
+--------------------------------+  |  Charging cycles)  |  |  Layer visibility)   |
       |                            +--------------------+  +----------------------+
       v                                      ^
+---------------------------------------------+
|    SQLAlchemy ORM + SQLite Local Storage    |
| (4 Delhi Hubs, 16 Bays, 8 Drones, 2 Swarms) |
+---------------------------------------------+
```

## 2. Mandatory Tech Stack & Compliance

- **Frontend**: React with Vite, TypeScript, Tailwind CSS, Lucide Icons, Leaflet with OpenStreetMap tiles, Recharts, Zustand.

- **Backend**: Python 3.11+, FastAPI, Pydantic, SQLAlchemy with SQLite (`check_same_thread=False`), WebSockets for live telemetry.

- **Geospatial & Mapping**: Leaflet vector layers, GeoJSON flight corridors, and Haversine spatial calculations.

- **Strict Size Footprint**: **\~225 MB total project footprint** (well below the mandatory 500 MB limit). Checkable via `scripts/check_size.ps1`.

- **Zero Cloud / Paid APIs**: Runs 100% locally with zero paid map keys, no external model weights, and no Docker/Kubernetes requirements.

## 3. Tinyfish Integration: Regulatory & Environmental Intelligence

To ensure real-world operational compliance and safety, AeroSentinel leverages **Tinyfish integration** for dynamic, web-based airspace intelligence:

- **DGCA Flight Rule Fetching:** Tinyfish autonomously scrapes and parses the latest Notices to Airmen (NOTAMs) and temporary flight restrictions (TFRs) directly from official aviation web portals, ensuring the routing engine always references the most current regulatory landscape.

- **Automated Data Validation Pipeline:**
  - _Source Checking:_ Restricts incoming regulatory data strictly to verified government domains (`.gov.in`) and official meteorological endpoints.

  - _Timestamp Verification:_ Rejects expired or outdated spatial restrictions to prevent false-positive geofencing.

  - _Geospatial Matching:_ Dynamically converts textual location descriptions from web data into precise GeoJSON exclusion polygons rendered on the Leaflet map.

- **Dynamic Weather Advisory:** Fetches real-time localized meteorological parameters (wind shear, precipitation, visibility metrics). The risk engine cross-references this data to adjust baseline drone battery consumption curves and dynamically alter flight feasibility thresholds based on active weather fronts.

## 4. Key Operational Capabilities

### Overview Command Dashboard

- Six live KPI telemetry cards: Total Fleet, Flying, Available, Charging, Active Missions, and Airspace Risk Status.

- Interactive Delhi NCR map displaying 4 hubs, 16 docking station bays, active drones, flight corridors, obstacles, bird hotspots, and DGCA exclusion zones.

- Interactive layer control bar toggling drones, hubs, routes, hazards, and wildlife blips.

- Clickable drones and depots opening detailed inspection drawers.

### Live Telemetry Stream

- Real-time kinematic flight vectors: Latitude, Longitude, Altitude AGL (m), Ground Speed (km/h), Heading Vector (°), and State of Charge (%).

- Embedded simulator control deck: Play, Pause, Speed Multiplier (1x, 2x, 5x), and Pristine Reset.

- Real-time WebSocket connection badge and tick-rate indicator.

### Airspace Intelligence & Predictive Risk Modeling

- Dynamic geospatial registry of infrastructure obstacles (e.g. Pitampura TV Tower, Signature Bridge, high-voltage pylons).

- Avian activity hotspots with verification controls (Okhla Bird Sanctuary, Yamuna bio-corridor, Najafgarh wetlands).

- Strict DGCA Red Zone hard constraints (e.g., Indira Gandhi International Airport core buffer) that immediately disqualify encroaching flight plans.

- Interactive "Report Hazard" modal to log new obstacles.

### Depot & Docking Bay Management

- 4 Delhi NCR Hubs configured:
  - **Connaught Place Central Hub** (`DEPOT-CP-01`): Central Delhi distribution

  - **Dwarka Sector 12 Depot** (`DEPOT-DWK-02`): West/Southwest NCR hub

  - **Gurugram Cyber Hub Depot** (`DEPOT-GGN-03`): South NCR tech corridor

  - **Noida Sector 62 Tech Depot** (`DEPOT-NDA-04`): East NCR logistics hub

- 16 automated docking station bays across depots with full state machine support (`AVAILABLE`, `OCCUPIED`, `CHARGING`, `MAINTENANCE`).

- Conflict protection: prevents multiple aircraft from docking in the same bay.

### Cooperative Swarm Management

- Two identifiable reconnaissance teams: **AIRSWARM ALPHA** and **AIRSWARM BRAVO**.

- Multi-aircraft attachment, coverage progress tracking, and autonomous survey sweeps.

- Automated hazard mapping: logs discovered structures and avian thermal blips.

### Missions & Predictive Route Planning

- 4-step mission planner: Origin Hub → Destination Hub → Aircraft → Automated Feasibility Evaluation.

- Deterministic baseline energy consumption model: `E = (Distance * Consumption Rate / Capacity) * 100 * 1.20 Margin`.

- Automatic mission rejection if landing charge violates the configured 20% safety reserve threshold.

- Interactive flight controls: Start, Pause, and Abort/Cancel.

### Battery & Charging Grid

- State of Charge (SoC) registry across all aircraft.

- DC Fast Charging bay monitoring (3.3 kW to 7.4 kW delivery) with automatic cutoff upon reaching 100%.

### Analytics & Flight Metrics

- Recharts visualizations: Flight hours trend, battery energy expended, depot bay utilization, fleet distribution, and spatial risk breakdown.

## 5. Revenue Model & Monetization Strategy

AeroSentinel is designed with a scalable, multi-tiered commercialization approach suited for the rapidly expanding UAV logistics sector:

- **B2B SaaS Licensing**: Tiered monthly subscriptions based on the volume of connected UAVs and operational depots managed through the platform. Targeting last-mile delivery, surveillance, & mapping firms.

- **Airspace Data API**: Monetizing our proprietary predictive airspace risk models, validated hazard maps, and avian thermal hotspot data via paid API calls. Targeting urban planners, real estate, aviation startups.

- **White-Label Customization**: Charging premium enterprise fees to re-skin, customize, and securely deploy the dashboard on private servers for sensitive operations. Targeting defense contractors, medical supply logistics.

- **Pay-Per-Route Compute**: Micro-transactions for utilizing the advanced route feasibility engine, which factors in live Tinyfish weather and DGCA validation for high-stakes payload delivery. Targeting independent commercial drone operators.

## 6. Quick Start & Demonstration Guide

### Prerequisites

- Python 3.11+

- Node.js v18+ and npm

### Step 1: Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# Windows (CMD / PowerShell):
venv\Scripts\activate
# Linux / macOS:
source venv/bin/activate

# Install lightweight dependencies
pip install -r requirements.txt

# Start the FastAPI backend server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

_The database (`aerosentinel.db`) is automatically initialized and idempotently seeded upon startup._
_Backend Health Check: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)_
_Interactive API Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)_

### Step 2: Frontend Setup

```bash
# In a new terminal, navigate to the frontend directory
cd frontend

# Install dependencies (already locked)
npm install

# Start Vite development server
npm run dev
```

_Open your browser at: [http://localhost:5173](http://localhost:5173)_

## 7. Automated Verification & Testing

### Running Backend Unit & Integration Tests

A comprehensive test suite verifies API status, database persistence, conflict prevention, battery calculations, and mission states:

```bash
# From \backend with venv active:
pytest tests/test_backend.py -v
```

_(All 9 tests execute and pass in \~3.2 seconds)_

### Verifying Frontend Production Build

```bash
# From \frontend:
npm run build
```

_(Transpiles and builds cleanly in \~7 seconds with zero TypeScript errors)_

### Verifying Project Size (< 500 MB limit)

```powershell
# From project root:
powershell -ExecutionPolicy Bypass -File scripts\check_size.ps1
```

_Output: \~225 MB (PASSED)_

## 8. One-Click Startup Scripts

For convenience during hackathon judging, preconfigured scripts are provided in `scripts/`:

- `scripts/start_backend.bat` — Activates Python venv and boots FastAPI on port 8000.

- `scripts/start_frontend.bat` — Launches Vite development server on port 5173.

- `scripts/run_tests.bat` — Executes pytest backend test suite.

- `scripts/check_size.ps1` — Measures total recursive directory footprint.

## 9. Prototype Boundaries & Operational Integrity

- **Simulated Kinematics**: All GPS telemetry, altitudes, and speeds are generated by an asynchronous Python loop advancing drones along geographic waypoints. They demonstrate operational workflows and do not claim to interface with physical hardware in this prototype.

- **Predictive Risk & Battery Model**: Energy consumption and risk calculations utilize deterministic baseline heuristics based on great-circle distances, standard cruise parameters, and proximity buffers, further refined by Tinyfish weather inputs.

- **Airspace Regulation**: The configured hubs (Connaught Place, Dwarka, Gurugram, Noida) and geofenced corridors represent configurable operational models for demonstration purposes. While Tinyfish fetches live rules, the prototype does not imply official DGCA commercial flight clearance.

---

_Developed with ❤️ by Team CodeArceus for the Hackathon._
