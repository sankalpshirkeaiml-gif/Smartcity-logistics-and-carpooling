# 🚀 NexusMobility — C++ Backend REST API Server

Modern, thread-safe C++17/20 REST API backend server for the **NexusMobility Smart City Eco-Logistics Platform**. It handles all pathfinding algorithms (Dijkstra with Min-Heap), custom data structures (circular buffers, FIFO queues, LIFO rollback stack), driver partner onboarding, route matching, and real-time sustainability calculations.

---

## 🛠️ Architecture & Tech Stack
- **Standard**: C++17 / C++20
- **Framework**: `cpp-httplib` (High performance multi-threaded HTTP server)
- **Serialization**: `nlohmann/json`
- **Build System**: CMake (≥ 3.16)
- **Port**: `8080` (Default, customizable via CLI argument)

---

## 📂 Project Structure

```text
cpp-backend/
├── CMakeLists.txt          # Modern CMake build configuration
├── README.md               # Architecture and execution manual
├── build.bat               # Windows 1-click build script
├── run.bat                 # Windows 1-click run script
├── test_api.ps1            # Comprehensive API test script in PowerShell
├── test_api.sh             # Bash curl test script
├── include/
│   ├── Models.hpp          # Structs & JSON serializers (Station, Driver, Trip, etc.)
│   └── NexusEngine.hpp     # Thread-safe core engine interface
└── src/
    ├── NexusEngine.cpp     # Pathfinding, circular buffer, FIFO queue & audit logic
    └── main.cpp            # HTTP server endpoints & CORS headers
```

---

## ⚙️ Building and Running

### Prerequisites
- Modern C++ Compiler: GCC 9+, Clang 10+, or Visual Studio 2019+ (MSVC)
- CMake 3.16+

### Option 1: Using CMake (Cross-Platform)

```bash
cd cpp-backend
mkdir build && cd build
cmake ..
cmake --build . --config Release
```

Run the server:
```bash
# On Windows
./Release/nexus_server.exe 8080

# On Linux/macOS
./nexus_server 8080
```

### Option 2: 1-Click Scripts (Windows)
Double-click `build.bat` then `run.bat`.

---

## 🌐 Complete REST API Endpoint Documentation

All endpoints return and accept `Content-Type: application/json` with CORS preflight enabled (`Access-Control-Allow-Origin: *`).

### 1. Network & Routing

#### `GET /api/stations`
Returns all 6 metropolitan stations with 3D spatial coordinates and transit zones.

#### `GET /api/corridors`
Returns network corridors and distance weights (km).

#### `POST /api/route/calculate`
Calculates optimal route using Dijkstra's algorithm, travel time, pooled fare splitting, and CO₂ offset.
- **Request Body:**
  ```json
  {
    "origin": "ALPHA",
    "destination": "HORIZON",
    "density": 2
  }
  ```
- **Response:**
  ```json
  {
    "path": ["ALPHA", "METRO", "SKYPORT", "HORIZON"],
    "totalDist": 26.6,
    "estTime": 59,
    "co2Offset": 7.28,
    "fare": 27.44,
    "soloCarsSaved": 1
  }
  ```

---

### 2. Commuter Pipeline Queue (FIFO)

#### `POST /api/passengers/request`
Enqueues a new commuter request to the dispatch pipeline.
- **Request Body:**
  ```json
  {
    "name": "Dr. Aris Thorne",
    "pickup": "ALPHA",
    "drop": "HORIZON"
  }
  ```

#### `POST /api/passengers/dequeue`
Dequeues the front commuter from the pipeline.

#### `GET /api/passengers/queue`
Inspects all waiting commuters in the FIFO dispatch queue.

---

### 3. Priority Standby Lounge (5-Slot Circular Ring Buffer)

#### `POST /api/standby/push`
Admits a passenger to the 5-slot priority ring buffer using modulo pointer arithmetic. Returns `409 Conflict` if capacity (`5/5`) is reached.

#### `POST /api/standby/pop`
Pops the oldest waiting commuter from the circular standby buffer.

#### `GET /api/standby/status`
Returns full ring buffer diagnostic telemetry (`capacity`, `count`, `front`, `rear`, and `slots` array).

---

### 4. Driver Partner Fleet & Verification

#### `POST /api/drivers/onboard`
Onboards a new driver partner with vehicle seat availability.
- **Request Body:**
  ```json
  {
    "name": "Marcus Vance",
    "station": "ALPHA",
    "seats": 3
  }
  ```

#### `GET /api/drivers`
Returns live fleet directory with current and original seat counts.

#### `GET /api/verify?query={id_or_ref}`
Instant lookup supporting both numeric Driver IDs (e.g. `101`) and alphanumeric Booking References (e.g. `NX-501`, `BK-201`).

---

### 5. Active Trips & Reversal Rollback (LIFO Stack)

#### `POST /api/trips/auto-match`
Matches the next pending commuter (from queue or standby) with the first available driver partner with open seats, creates a trip with route alignment match score (85-98%), and records an audit frame.

#### `GET /api/trips/active`
Returns all currently in-transit shared carpool trips.

#### `POST /api/trips/complete`
Marks a trip as completed or cancelled.
- **Request Body:**
  ```json
  {
    "tripRef": "NX-501"
  }
  ```

#### `POST /api/trips/revert`
**Instant Reversal**: Pops the latest dispatch from the LIFO audit stack, removes the trip from active registry, restores the driver's seat count, and puts the passenger back to the front of the queue.

#### `GET /api/trips/audit`
Returns the complete LIFO audit history log.

---

### 6. Sustainability Analytics & Simulation

#### `GET /api/sustainability`
Returns net atmospheric CO₂ reduction (kg), collective pooled distance (km), corridor seat utilization rate (%), vehicles eliminated, and driver partner leaderboard.

#### `POST /api/simulation/rushhour`
Pre-loads a realistic metropolitan rush-hour traffic scenario with drivers, commuters, a standby passenger, and an active matched trip.

#### `POST /api/reset`
Resets engine to default initial state.
