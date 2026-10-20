# Implementation Plan: C++ Backend Server for NexusMobility Platform

Implement a production-grade, modern C++ REST API server for the **NexusMobility — Smart City Eco-Logistics** platform. The backend mirrors and extends the logistics logic previously in `app.js`, delivering thread-safe pathfinding, queue dispatching, 5-slot priority ring buffer, fleet management, and rollback stack auditing.

---

## 🏗️ Architecture & Component Design

### 1. Project Directory Structure
All C++ backend files will be placed in a dedicated, clean directory structure:
```text
cpp-backend/
├── CMakeLists.txt          # Modern CMake 3.16+ configuration
├── README.md               # Build, run, and API test guide
├── include/
│   ├── Models.hpp          # Data structures & nlohmann::json serialization
│   ├── NexusEngine.hpp     # Thread-safe core logistics engine
│   └── httplib.h / crow    # Modern single-header / lightweight C++ HTTP server
└── src/
    ├── NexusEngine.cpp     # Graph routing, Dijkstra, queues, fleet & audit logic
    └── main.cpp            # HTTP server setup, REST route dispatchers, CORS headers
```

### 2. Core Modules
- **`Models.hpp`**:
  - `Station`, `Corridor`, `Passenger`, `Driver`, `Trip`, `AuditAction`, `RouteResult`, `EcoLeader`
  - Integrated `to_json` and `from_json` using `nlohmann/json`
- **`NexusEngine.hpp` / `NexusEngine.cpp`**:
  - `findOptimalEcoRoute(startId, endId, commuterDensity)`: Dijkstra algorithm with Min-Heap priority queue (`std::priority_queue`), distance, travel time, pooled fare splitting, and CO₂ offset calculations.
  - `submitRideRequest()` & `dequeueNextRequest()`: Thread-safe FIFO dispatch queue (`std::queue<Passenger>` protected by `std::mutex`).
  - `pushToStandby()` & `popFromStandby()`: Fixed 5-slot circular buffer (`std::array<std::optional<Passenger>, 5>`) with modular arithmetic (`(index + 1) % 5`), overflow/underflow safeguards.
  - `onboardDriver()`, `getDriverById()`, `getBookingByRef()`: Fleet directory with O(1) lookup map.
  - `dispatchSharedTrip()`: Route alignment scoring (85-98%), driver seat decrement, trip recording, and LIFO audit logging.
  - `revertLatestConfirmation()`: LIFO rollback popping the latest dispatch, restoring driver seats, and re-inserting commuter to the head of the dispatch queue.
  - `loadRushHourDemo()`: One-click simulation scenario loader.
- **`main.cpp`**:
  - REST API server on port `8080` (or user-configurable).
  - Clean CORS support (`Access-Control-Allow-Origin: *`, `OPTIONS` preflight handling) so the web frontend can seamlessly connect.

### 3. REST API Endpoint Mapping

| Method | Endpoint | Request Body | Response JSON |
|:---|:---|:---|:---|
| `GET` | `/api/stations` | None | Array of station objects |
| `GET` | `/api/corridors` | None | Array of corridor segments with distances |
| `POST` | `/api/route/calculate` | `{"origin": "ALPHA", "destination": "HORIZON", "density": 2}` | Route path, distance, time, fare, CO₂ offset, solo cars saved |
| `POST` | `/api/passengers/request` | `{"name": "...", "pickup": "...", "drop": "..."}` | Created passenger object with ID |
| `POST` | `/api/passengers/dequeue` | None | Dequeued passenger object |
| `GET` | `/api/passengers/queue` | None | Array of all waiting queue passengers |
| `POST` | `/api/standby/push` | `{"passenger": {...}}` (optional) | Success status, slot index |
| `POST` | `/api/standby/pop` | None | Popped passenger object |
| `GET` | `/api/standby/status` | None | Array of 5 slots with occupation & pointers |
| `POST` | `/api/drivers/onboard` | `{"name": "...", "station": "...", "seats": 3}` | Onboarded driver object with ID |
| `GET` | `/api/drivers` | None | List of driver partners and available seats |
| `GET` | `/api/verify` | `?query=101` or `?query=NX-501` | Matching driver or trip verification record |
| `POST` | `/api/trips/dispatch` | `{"passengerId": "...", "driverId": 101}` | Dispatched trip object, route match % |
| `GET` | `/api/trips/active` | None | List of currently active trips |
| `POST` | `/api/trips/complete` | `{"tripRef": "NX-501"}` | Success status |
| `POST` | `/api/trips/revert` | None | Reverted trip details, restored capacity |
| `GET` | `/api/sustainability` | None | Total CO₂ avoided, distance, seat efficiency, leaderboard |
| `POST` | `/api/simulation/rushhour` | None | Pre-populated rush-hour scenario confirmation |

---

## 🛠️ Build & Execution Instructions
- Single-header lightweight HTTP server (`httplib` or Crow-compatible) and `json.hpp` included directly in the repo so zero complex package manager setup is needed.
- Works with standard C++17/20 compilers (GCC, Clang, MSVC) and CMake.
- Complete `curl` test script and instructions included.
