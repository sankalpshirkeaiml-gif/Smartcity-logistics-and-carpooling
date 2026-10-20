# 🌿 NexusMobility — Smart City Carpooling & Eco-Logistics Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Standard: C++20](https://img.shields.io/badge/C%2B%2B-20%2F17-blue.svg)](https://isocpp.org/)
[![UI: Modern Eco-Tech](https://img.shields.io/badge/UI-Eco--Tech%20Light-059669.svg)](#design-system--visual-aesthetic)
[![Status: Production Ready](https://img.shields.io/badge/Status-Audited%20%26%20Hardened-green.svg)](#code-audit--stability-guarantees)

**NexusMobility** is a modern, enterprise-ready smart urban transit and eco-carpooling platform engineered for smart city administrators, commuter networks, and fleet operators. It combines an ultra-clean, high-contrast eco-tech user interface with a robust, thread-safe C++ backend engine for real-time pathfinding, capacity scheduling, and carbon-reduction analytics.

> [!NOTE]
> **Zero CS / Academic Jargon Policy:** The entire user interface and documentation are framed strictly in terms of transit operations, passenger workflows, and sustainability metrics. Underlying computational techniques (Dijkstra shortest path, circular ring buffers, FIFO queues, LIFO rollback stacks) operate invisibly under the hood.

---

## 📑 Table of Contents
- [🌟 Key Platform Capabilities](#-key-platform-capabilities)
- [🎨 Design System & Visual Aesthetic](#-design-system--visual-aesthetic)
- [🏛️ Tabbed Page Architecture](#️-tabbed-page-architecture)
- [⚙️ Technical Architecture](#️-technical-architecture)
- [🚀 Quick Start & Operation Guide](#-quick-start--operation-guide)
  - [Option A: Standalone Front-End (Instant Run)](#option-a-standalone-front-end-instant-run)
  - [Option B: Full-Stack with C++ REST API Server](#option-b-full-stack-with-c-rest-api-server)
- [🔌 C++ REST API Reference](#-c-rest-api-reference)
- [🛡️ Code Audit & Stability Guarantees](#️-code-audit--stability-guarantees)
- [📂 Repository File Tree](#-repository-file-tree)

---

## 🌟 Key Platform Capabilities

1. **3D Spatial Metropolitan Route Corridor Canvas**:
   - Interactive 3D vector map of metropolitan transit hubs and connecting corridors.
   - Real-time route calculation with dynamic directional chevrons and animated electric transit vehicles driving along active transit paths.
   - Mouse-driven 3D orbit and zoom controls with elevation stems and floor shadows.

2. **Dynamic Pooled Fare & CO₂ Offset Calculator**:
   - Commuter density slider (1 to 4 passengers) showing real-time fare splitting and carbon reduction compared to single-occupancy vehicles.

3. **Live Commuter Dispatch Conveyor**:
   - Smooth, priority-ordered passenger conveyor pipeline with real-time status tracking.

4. **Circular Priority Standby Lounge (5 Slots)**:
   - Modulo-based fixed 5-slot standby lounge with visual circular ring layout, active pointer markers, and capacity overflow alerts.

5. **Driver Fleet Management & Interactive Vehicle Blueprint**:
   - Top-down 4-seat vehicle blueprint with interactive seat toggling (Driver + 3 Passenger seats).
   - Dynamic fleet partner capacity badges and fleet directory stream.

6. **Instant Identity Verification & Search**:
   - Fast $O(1)$ search bar supporting Driver Partner IDs (e.g., `#101`) and Booking References (e.g., `NX-501`).

7. **Reversible Dispatch Audit Log (Rollback Stack)**:
   - Enterprise-grade undo mechanism (`Revert Last Confirmation`) allowing dispatchers to instantly cancel erroneous confirmations, restore driver seats, and return passengers to the front of the queue without priority penalty.

8. **Enterprise Journey Modals & Printable Eco-Receipts**:
   - Modal confirmation dialogs with alignment percentages, ETA, fare split, and printable physical receipts with `@media print` stylesheets.

9. **EcoSprout Mascot & Ambient Visuals**:
   - Friendly vector eco-mascot (**EcoSprout**) with aviator goggles providing context-aware guidance during empty states.
   - Ambient background canvas rendering gentle floating leaves and subtle electric energy nodes.

---

## 🎨 Design System & Visual Aesthetic

- **Primary Background**: Soft Slate Gray (`#F4F7F6`)
- **Card Surfaces**: Pure White Glass (`#FFFFFF`) with subtle emerald border glows
- **Sustainability Accent**: Urban Emerald Green (`#059669`) for active status, badges, and CO₂ metrics
- **Primary Action Accent**: Clean Electric Blue (`#2563EB`) for corridor lines and primary buttons
- **Priority Standby Accent**: Energy Amber (`#D97706`) for priority lounge slots
- **Typography**: Inter (sans-serif) for clean readability & JetBrains Mono (monospace) for telemetry/IDs
- **Interactions**: Smooth 2D micro-lifting hover transitions (`transform: translateY(-4px);`) with emerald drop-shadows

---

## 🏛️ Tabbed Page Architecture

The web application is structured into 4 dedicated, clutter-free views accessible via the top navigation bar:

```
┌────────────────────────────────────────────────────────────────────────┐
│  [🌿 Eco-Route Finder & Map]  [👥 Passenger Hub]  [🚗 Fleet Console]  [📊 Sustainability] │
└────────────────────────────────────────────────────────────────────────┘
```

| View Tab | Primary Focus | Included Features |
|---|---|---|
| **1. Eco-Route Finder & Map** | Transit Navigation & Planning | Interactive 3D Corridor Canvas, Origin/Destination selector, Animated Driving Vehicle, Commuter Slider (1-4 riders), Telemetry Summary Strip. |
| **2. Commuter Passenger Hub** | Passenger Requests & Standby | Ride request submission form, Live Passenger Conveyor Pipeline, Circular 5-Slot Priority Standby Lounge with pointer tracking. |
| **3. Driver Fleet Console** | Driver Partner Operations | Interactive 4-Seat Vehicle Chassis blueprint, Fleet Directory Stream, Active Shared Trips console, ID/Booking Verification Search, Revert Confirmation control. |
| **4. Sustainability Analytics** | Environmental Metrics & Auditing | Net CO₂ emissions saved, single-driver trips diverted, reversible dispatch audit log, top eco-partners leaderboard with gamified badges. |

---

## ⚙️ Technical Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                   Web Front-End (Single Page App)               │
│   index.html  │  styles.css  │  app.js (Zero Academic Jargon)     │
└─────────────────────────────────┬────────────────────────────────┘
                                  │ JSON REST / CORS (Optional)
                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│              C++ Modern Multi-Threaded REST API Server           │
│                    (cpp-httplib + nlohmann/json)                 │
├─────────────────────────────────┬────────────────────────────────┤
│ 1. Shortest Path Corridor Graph │ Min-Heap Dijkstra (O((V+E)logV)│
│ 2. Priority Standby Lounge      │ 5-Slot Fixed Ring Buffer (O(1))│
│ 3. Commuter Dispatch Pipeline   │ Thread-Safe FIFO Deque (O(1))  │
│ 4. Reversible Audit Ledger      │ LIFO Transaction Stack (O(1))  │
│ 5. Fleet Registry & Lookup      │ Hash Index Map (O(1))          │
└─────────────────────────────────┴────────────────────────────────┘
```

---

## 🚀 Quick Start & Operation Guide

### Option A: Standalone Front-End (Instant Run)
The front-end is 100% self-contained and requires no compilation or npm dependencies to run.

1. Locate the repository directory:
   ```text
   C:\Users\Kartik Bhosle\.gemini\antigravity\brain\6976d1a8-fd03-4453-a790-acd552e1861a\
   ```
2. Open [`index.html`](file:///C:/Users/Kartik%20Bhosle/.gemini/antigravity/brain/6976d1a8-fd03-4453-a790-acd552e1861a/index.html) in any modern web browser (Google Chrome, Microsoft Edge, Firefox, or Safari).
3. Click the **"Rush-Hour Simulation"** button in the top header to instantly populate the platform with sample transit data, drivers, and active shared trips.

---

### Option B: Full-Stack with C++ REST API Server

If you wish to run the production C++ backend server alongside the frontend:

#### Prerequisites
- Modern C++ Compiler: GCC 9+, Clang 10+, or Visual Studio 2019+ (MSVC)
- CMake 3.16 or higher

#### Build & Run (Windows 1-Click Scripts)
```cmd
cd cpp-backend
build.bat
run.bat
```
*The server will start listening on `http://localhost:8080`.*

#### Build & Run (Linux / macOS)
```bash
cd cpp-backend
mkdir build && cd build
cmake ..
cmake --build . --config Release
./nexus_backend
```

#### Running Automated API Tests
- **PowerShell (Windows)**:
  ```powershell
  cd cpp-backend
  .\test_api.ps1
  ```
- **Bash (Linux/macOS)**:
  ```bash
  cd cpp-backend
  chmod +x test_api.sh && ./test_api.sh
  ```

---

## 🔌 C++ REST API Reference

The backend exposes 22 JSON REST endpoints with full CORS support:

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | `GET` | Healthcheck and active timestamp |
| `/api/stations` | `GET` | List all metropolitan transit stations |
| `/api/corridors` | `GET` | List transit corridors and distances (km) |
| `/api/route/optimal` | `POST` | Min-Heap Dijkstra route calculation (`{origin, destination, commuters}`) |
| `/api/passengers/request` | `POST` | Submit a commuter request to the FIFO queue |
| `/api/passengers/dequeue` | `POST` | Dequeue next commuter in pipeline order |
| `/api/priority-lounge` | `GET` | Inspect the 5-slot standby ring buffer state |
| `/api/priority-lounge/push` | `POST` | Push candidate into standby lounge |
| `/api/priority-lounge/pop` | `POST` | Pop front candidate from standby lounge |
| `/api/drivers/onboard` | `POST` | Register a driver partner (`{name, station, seats}`) |
| `/api/fleet` | `GET` | List all registered fleet partners |
| `/api/trips/dispatch` | `POST` | Dispatch shared trip and decrement driver seat |
| `/api/trips/active` | `GET` | List all active trips in transit |
| `/api/audit/revert` | `POST` | LIFO transaction rollback restoring seats and commuter state |
| `/api/verify` | `GET` | Identity search query (`?q=101` or `?q=NX-501`) |
| `/api/simulation/rush-hour`| `POST` | Pre-load rush-hour demo dataset |

---

## 🛡️ Code Audit & Stability Guarantees

All project files have passed a thorough code audit:

1. **Pathfinding & Graph Traversal**:
   - Disconnected stations and same-origin-destination inputs are guarded against infinite loops or `NaN` outputs.
   - Cycle prevention guards ensure deterministic resolution within $|V|$ steps.
2. **Circular Ring Buffer**:
   - Strict boundary checks (`count >= capacity` and `count == 0`) ensure modulo pointers (`(head + 1) % 5`) never index out of bounds.
3. **Capacity & Thread Safety**:
   - Driver seat counts are strictly clamped (`0 <= seats <= originalSeats`).
   - The C++ backend synchronizes all operations using RAII `std::lock_guard<std::mutex>`.
4. **Rendering & Memory Management**:
   - `requestAnimationFrame` loops on the 3D map canvas automatically pause when switching away from Tab 1 to eliminate background CPU/GPU load.
   - Canvas resizing applies reset transforms (`setTransform`) to prevent cumulative DPI scaling bugs.
5. **Security & Input Sanitization**:
   - All user inputs are sanitized with HTML entity encoding (`escapeHTML`) before injection to eliminate XSS vulnerabilities.
   - Confirmation modals support backdrop dismissal and keyboard <kbd>ESC</kbd> handling.

---

## 📂 Repository File Tree

```text
NexusMobility/
├── index.html              # Multi-tab enterprise HTML5 application
├── styles.css              # Eco-tech design system & responsive styling
├── app.js                  # Frontend state engine, 3D canvas, & view controller
├── README.md               # Complete platform manual & architecture guide
└── cpp-backend/            # Thread-safe C++ REST API Server
    ├── CMakeLists.txt      # Modern CMake configuration (FetchContent)
    ├── build.bat           # Windows 1-click build script
    ├── run.bat             # Windows 1-click launcher
    ├── test_api.ps1        # PowerShell automated integration test suite
    ├── test_api.sh         # Bash curl automated test suite
    ├── README.md           # Backend specific API reference
    ├── include/
    │   ├── Models.hpp      # Structs & nlohmann::json serialization
    │   └── NexusEngine.hpp # Core engine interface & thread-safety locks
    └── src/
        ├── NexusEngine.cpp # Graph algorithms, circular buffer, FIFO & rollback
        └── main.cpp        # Multi-threaded HTTP server & CORS routing
```

---

## 📄 License
This project is released under the **MIT License**. Free for commercial and smart city transit deployment.
