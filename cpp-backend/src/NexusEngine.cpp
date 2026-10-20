#include "NexusEngine.hpp"
#include <chrono>
#include <ctime>
#include <iomanip>
#include <sstream>
#include <cmath>
#include <algorithm>
#include <cctype>

namespace Nexus {

NexusEngine::NexusEngine() {
    initDefaultNetwork();
}

void NexusEngine::initDefaultNetwork() {
    stations_ = {
        {"ALPHA", "Tech Park Alpha", -160.0, -70.0, 20.0, "North Industrial", "fa-microchip"},
        {"HARBOR", "Bayfront Terminal", -80.0, 110.0, -15.0, "Maritime District", "fa-anchor"},
        {"METRO", "Central Financial Core", 0.0, 0.0, 40.0, "Downtown Metro", "fa-building-columns"},
        {"SKYPORT", "AeroPort Interchange", 130.0, -90.0, 30.0, "Aviation Corridor", "fa-plane-departure"},
        {"QUANTUM", "Green Innovation Campus", 90.0, 100.0, -10.0, "Eco District", "fa-seedling"},
        {"HORIZON", "Waterfront Marina", 200.0, 30.0, 5.0, "East Residential", "fa-water"}
    };

    corridors_ = {
        {"ALPHA", "METRO", 8.2},
        {"ALPHA", "HARBOR", 11.5},
        {"HARBOR", "METRO", 6.4},
        {"HARBOR", "QUANTUM", 13.8},
        {"METRO", "SKYPORT", 9.6},
        {"METRO", "QUANTUM", 7.1},
        {"SKYPORT", "HORIZON", 8.8},
        {"QUANTUM", "HORIZON", 10.4}
    };

    adjList_.clear();
    for (const auto& s : stations_) {
        adjList_[s.id] = {};
    }
    for (const auto& c : corridors_) {
        adjList_[c.u].push_back({c.v, c.distance});
        adjList_[c.v].push_back({c.u, c.distance});
    }

    leaderboard_ = {
        {"Kaelen Chen", 42, "168.4 kg", 4.98, "Carbon Crusader"},
        {"Elena Rostova", 37, "142.1 kg", 4.95, "5-Star Commute"},
        {"Marcus Vance", 31, "128.0 kg", 4.92, "Zero-Emission Pioneer"},
        {"Siddharth Rao", 28, "115.6 kg", 4.89, "Master Navigator"}
    };

    standbyLounge_.fill(std::nullopt);
    standbyFront_ = 0;
    standbyRear_ = 0;
    standbyCount_ = 0;
}

std::string NexusEngine::getCurrentTimestamp() const {
    auto now = std::chrono::system_clock::now();
    std::time_t in_time_t = std::chrono::system_clock::to_time_t(now);
    std::tm buf{};
#if defined(_WIN32)
    localtime_s(&buf, &in_time_t);
#else
    localtime_r(&in_time_t, &buf);
#endif
    std::ostringstream ss;
    ss << std::put_time(&buf, "%H:%M");
    return ss.str();
}

std::vector<Station> NexusEngine::getStations() const {
    std::lock_guard<std::mutex> lock(mtx_);
    return stations_;
}

std::vector<Corridor> NexusEngine::getCorridors() const {
    std::lock_guard<std::mutex> lock(mtx_);
    return corridors_;
}

RouteResult NexusEngine::findOptimalEcoRoute(const std::string& startId, const std::string& endId, int commuterDensity) {
    std::lock_guard<std::mutex> lock(mtx_);

    if (commuterDensity < 1) commuterDensity = 1;
    if (commuterDensity > 4) commuterDensity = 4;

    std::unordered_map<std::string, double> dist;
    std::unordered_map<std::string, std::string> prev;

    for (const auto& s : stations_) {
        dist[s.id] = std::numeric_limits<double>::infinity();
        prev[s.id] = "";
    }

    dist[startId] = 0.0;

    // Min-heap: pair<distance, stationId>
    using Element = std::pair<double, std::string>;
    std::priority_queue<Element, std::vector<Element>, std::greater<Element>> pq;
    pq.push({0.0, startId});

    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();

        if (u == endId) break;
        if (d > dist[u]) continue;

        auto it = adjList_.find(u);
        if (it != adjList_.end()) {
            for (const auto& edge : it->second) {
                const std::string& v = edge.first;
                double weight = edge.second;
                if (dist[u] + weight < dist[v]) {
                    dist[v] = dist[u] + weight;
                    prev[v] = u;
                    pq.push({dist[v], v});
                }
            }
        }
    }

    std::vector<std::string> path;
    if (dist[endId] != std::numeric_limits<double>::infinity()) {
        std::string curr = endId;
        while (!curr.empty()) {
            path.push_back(curr);
            curr = prev[curr];
        }
        std::reverse(path.begin(), path.end());
    }

    RouteResult result;
    result.path = path;
    result.totalDist = (dist[endId] == std::numeric_limits<double>::infinity()) ? 0.0 : std::round(dist[endId] * 10.0) / 10.0;
    result.estTime = static_cast<int>(std::round(result.totalDist * 2.2));
    double baseCO2 = result.totalDist * 0.171;
    result.co2Offset = std::round((baseCO2 * (0.8 + commuterDensity * 0.4)) * 100.0) / 100.0;
    
    double baseTripCost = 4.0 + result.totalDist * 1.5;
    result.fare = std::round(((baseTripCost * (1.0 + (commuterDensity - 1) * 0.25)) / commuterDensity) * 100.0) / 100.0;
    result.soloCarsSaved = std::max(0, commuterDensity - 1);

    return result;
}

Passenger NexusEngine::submitRideRequest(const std::string& name, const std::string& pickup, const std::string& drop) {
    std::lock_guard<std::mutex> lock(mtx_);
    Passenger p;
    p.id = "BK-" + std::to_string(nextPassengerId_++);
    p.name = name.empty() ? ("Commuter_" + std::to_string(p.id.substr(3).empty() ? 999 : std::stoi(p.id.substr(3)))) : name;
    p.pickup = pickup;
    p.drop = drop;
    p.requestedAt = getCurrentTimestamp();
    p.status = "Pending Dispatch";

    dispatchQueue_.push_back(p);
    return p;
}

std::optional<Passenger> NexusEngine::dequeueNextRequest() {
    std::lock_guard<std::mutex> lock(mtx_);
    if (dispatchQueue_.empty()) {
        return std::nullopt;
    }
    Passenger p = dispatchQueue_.front();
    dispatchQueue_.pop_front();
    return p;
}

std::vector<Passenger> NexusEngine::getDispatchQueue() const {
    std::lock_guard<std::mutex> lock(mtx_);
    return {dispatchQueue_.begin(), dispatchQueue_.end()};
}

bool NexusEngine::pushToStandby(const Passenger& p, std::string& errorMsg) {
    std::lock_guard<std::mutex> lock(mtx_);
    if (standbyCount_ >= STANDBY_CAP) {
        errorMsg = "Priority Standby Lounge is currently at maximum capacity (5/5).";
        return false;
    }
    standbyLounge_[standbyRear_] = p;
    standbyRear_ = (standbyRear_ + 1) % STANDBY_CAP;
    standbyCount_++;
    return true;
}

std::optional<Passenger> NexusEngine::popFromStandby(std::string& errorMsg) {
    std::lock_guard<std::mutex> lock(mtx_);
    if (standbyCount_ == 0) {
        errorMsg = "Standby lounge is currently empty.";
        return std::nullopt;
    }
    std::optional<Passenger> p = standbyLounge_[standbyFront_];
    standbyLounge_[standbyFront_] = std::nullopt;
    standbyFront_ = (standbyFront_ + 1) % STANDBY_CAP;
    standbyCount_--;
    return p;
}

NexusEngine::StandbyStatus NexusEngine::getStandbyStatus() const {
    std::lock_guard<std::mutex> lock(mtx_);
    StandbyStatus s;
    s.capacity = static_cast<int>(STANDBY_CAP);
    s.count = static_cast<int>(standbyCount_);
    s.front = static_cast<int>(standbyFront_);
    s.rear = static_cast<int>(standbyRear_);
    s.slots.assign(standbyLounge_.begin(), standbyLounge_.end());
    return s;
}

Driver NexusEngine::onboardDriver(const std::string& name, const std::string& station, int seats) {
    std::lock_guard<std::mutex> lock(mtx_);
    Driver d;
    d.id = nextDriverId_++;
    d.name = name.empty() ? ("Partner_" + std::to_string(d.id)) : name;
    d.station = station.empty() ? "METRO" : station;
    d.seats = seats > 0 ? seats : 4;
    d.originalSeats = d.seats;
    d.tripsCompleted = 0;

    fleetPartners_.push_back(d);
    return d;
}

std::vector<Driver> NexusEngine::getFleet() const {
    std::lock_guard<std::mutex> lock(mtx_);
    return fleetPartners_;
}

std::optional<Driver> NexusEngine::getDriverById(int id) const {
    std::lock_guard<std::mutex> lock(mtx_);
    for (const auto& d : fleetPartners_) {
        if (d.id == id) return d;
    }
    return std::nullopt;
}

Trip NexusEngine::dispatchSharedTrip(const Passenger& passenger, int driverId, int matchScore) {
    std::lock_guard<std::mutex> lock(mtx_);

    Driver* matchedDriver = nullptr;
    for (auto& d : fleetPartners_) {
        if (d.id == driverId) {
            matchedDriver = &d;
            break;
        }
    }

    Trip trip;
    trip.tripRef = "NX-" + std::to_string(nextBookingRef_++);
    trip.passenger = passenger;
    trip.driverId = driverId;
    trip.driverName = matchedDriver ? matchedDriver->name : "Unknown Driver";
    trip.matchScore = matchScore;
    trip.dispatchedAt = getCurrentTimestamp();

    // Calculate Route
    // Internal unlocked route calculation
    std::unordered_map<std::string, double> dist;
    std::unordered_map<std::string, std::string> prev;
    for (const auto& s : stations_) {
        dist[s.id] = std::numeric_limits<double>::infinity();
        prev[s.id] = "";
    }
    dist[passenger.pickup] = 0.0;
    using Element = std::pair<double, std::string>;
    std::priority_queue<Element, std::vector<Element>, std::greater<Element>> pq;
    pq.push({0.0, passenger.pickup});

    while (!pq.empty()) {
        auto [d, u] = pq.top();
        pq.pop();
        if (u == passenger.drop) break;
        if (d > dist[u]) continue;
        auto it = adjList_.find(u);
        if (it != adjList_.end()) {
            for (const auto& edge : it->second) {
                if (dist[u] + edge.second < dist[edge.first]) {
                    dist[edge.first] = dist[u] + edge.second;
                    prev[edge.first] = u;
                    pq.push({dist[edge.first], edge.first});
                }
            }
        }
    }

    std::vector<std::string> path;
    if (dist[passenger.drop] != std::numeric_limits<double>::infinity()) {
        std::string curr = passenger.drop;
        while (!curr.empty()) {
            path.push_back(curr);
            curr = prev[curr];
        }
        std::reverse(path.begin(), path.end());
    }

    trip.corridorPath = path;
    trip.distance = (dist[passenger.drop] == std::numeric_limits<double>::infinity()) ? 0.0 : std::round(dist[passenger.drop] * 10.0) / 10.0;
    trip.time = static_cast<int>(std::round(trip.distance * 2.2));
    double baseCO2 = trip.distance * 0.171;
    trip.co2Saved = std::round((baseCO2 * 1.6) * 100.0) / 100.0;
    double baseTripCost = 4.0 + trip.distance * 1.5;
    trip.fare = std::round(((baseTripCost * 1.25) / 2.0) * 100.0) / 100.0;

    if (matchedDriver) {
        matchedDriver->seats = std::max(0, matchedDriver->seats - 1);
        matchedDriver->tripsCompleted++;
    }

    activeTrips_.push_back(trip);

    // Record LIFO Audit Frame
    AuditAction audit;
    audit.type = "DISPATCH_CONFIRMATION";
    audit.tripRef = trip.tripRef;
    audit.driverId = driverId;
    audit.passenger = passenger;
    audit.trip = trip;
    reversalAuditLog_.push_back(audit);

    return trip;
}

std::optional<Trip> NexusEngine::autoMatchTrip(int matchScore, std::string* errorMsg) {
    Passenger passenger;
    {
        std::lock_guard<std::mutex> lock(mtx_);
        if (!dispatchQueue_.empty()) {
            passenger = dispatchQueue_.front();
            dispatchQueue_.pop_front();
        } else if (standbyCount_ > 0) {
            passenger = *standbyLounge_[standbyFront_];
            standbyLounge_[standbyFront_] = std::nullopt;
            standbyFront_ = (standbyFront_ + 1) % STANDBY_CAP;
            standbyCount_--;
        } else {
            if (errorMsg) *errorMsg = "No pending commuter requests waiting to be dispatched.";
            return std::nullopt;
        }

        // Find available driver
        Driver* matchedDriver = nullptr;
        for (auto& d : fleetPartners_) {
            if (d.seats > 0) {
                matchedDriver = &d;
                break;
            }
        }

        if (!matchedDriver) {
            // Restore passenger to queue
            dispatchQueue_.push_front(passenger);
            if (errorMsg) *errorMsg = "All driver partners are currently at maximum passenger capacity.";
            return std::nullopt;
        }
    }

    // Driver found
    Driver dCopy;
    {
        std::lock_guard<std::mutex> lock(mtx_);
        for (const auto& d : fleetPartners_) {
            if (d.seats > 0) {
                dCopy = d;
                break;
            }
        }
    }

    return dispatchSharedTrip(passenger, dCopy.id, matchScore);
}

std::vector<Trip> NexusEngine::getActiveTrips() const {
    std::lock_guard<std::mutex> lock(mtx_);
    return activeTrips_;
}

std::optional<Trip> NexusEngine::getTripByRef(const std::string& ref) const {
    std::lock_guard<std::mutex> lock(mtx_);
    for (const auto& t : activeTrips_) {
        if (t.tripRef == ref) return t;
    }
    return std::nullopt;
}

bool NexusEngine::completeOrCancelTrip(const std::string& tripRef) {
    std::lock_guard<std::mutex> lock(mtx_);
    auto it = std::find_if(activeTrips_.begin(), activeTrips_.end(), [&](const Trip& t) {
        return t.tripRef == tripRef;
    });
    if (it != activeTrips_.end()) {
        activeTrips_.erase(it);
        return true;
    }
    return false;
}

json NexusEngine::verifyRecord(const std::string& query) const {
    std::lock_guard<std::mutex> lock(mtx_);
    std::string cleanQuery = query;
    // Strip leading '#' if present
    if (!cleanQuery.empty() && cleanQuery[0] == '#') cleanQuery = cleanQuery.substr(1);

    // Try finding Driver Partner
    bool isNumeric = !cleanQuery.empty() && std::all_of(cleanQuery.begin(), cleanQuery.end(), ::isdigit);
    if (isNumeric) {
        int id = std::stoi(cleanQuery);
        for (const auto& d : fleetPartners_) {
            if (d.id == id) {
                return json{
                    {"found", true},
                    {"type", "driver"},
                    {"driver", d}
                };
            }
        }
    }

    // Try finding Trip or Booking Reference
    std::string upperQuery = cleanQuery;
    std::transform(upperQuery.begin(), upperQuery.end(), upperQuery.begin(), ::toupper);
    for (const auto& t : activeTrips_) {
        std::string tRef = t.tripRef;
        std::string pId = t.passenger.id;
        std::transform(tRef.begin(), tRef.end(), tRef.begin(), ::toupper);
        std::transform(pId.begin(), pId.end(), pId.begin(), ::toupper);
        if (tRef == upperQuery || pId == upperQuery) {
            return json{
                {"found", true},
                {"type", "booking"},
                {"trip", t}
            };
        }
    }

    return json{{"found", false}, {"message", "Reference not found in fleet or active registry."}};
}

NexusEngine::ReversalResult NexusEngine::revertLatestConfirmation() {
    std::lock_guard<std::mutex> lock(mtx_);
    ReversalResult res;

    if (reversalAuditLog_.empty()) {
        res.success = false;
        res.message = "No recent dispatch confirmations available to revert.";
        return res;
    }

    AuditAction action = reversalAuditLog_.back();
    reversalAuditLog_.pop_back();

    // 1. Remove trip from activeTrips
    auto it = std::find_if(activeTrips_.begin(), activeTrips_.end(), [&](const Trip& t) {
        return t.tripRef == action.tripRef;
    });
    if (it != activeTrips_.end()) {
        activeTrips_.erase(it);
    }

    // 2. Restore driver seats
    Driver* driverPtr = nullptr;
    for (auto& d : fleetPartners_) {
        if (d.id == action.driverId) {
            d.seats = std::min(d.originalSeats, d.seats + 1);
            driverPtr = &d;
            break;
        }
    }

    // 3. Put passenger back to head of queue
    action.passenger.status = "Restored to Dispatch";
    dispatchQueue_.push_front(action.passenger);

    res.success = true;
    res.message = "Reverted Trip " + action.tripRef + " successfully.";
    res.action = action;
    if (driverPtr) res.driver = *driverPtr;

    return res;
}

std::vector<AuditAction> NexusEngine::getAuditHistory() const {
    std::lock_guard<std::mutex> lock(mtx_);
    return reversalAuditLog_;
}

json NexusEngine::getSustainabilityMetrics() const {
    std::lock_guard<std::mutex> lock(mtx_);
    double totalSavedCO2 = 148.5;
    double totalDistance = 1420.0;
    int totalCapacity = 0;
    int occupiedSeats = 0;

    for (const auto& t : activeTrips_) {
        totalSavedCO2 += t.co2Saved;
        totalDistance += t.distance;
    }

    for (const auto& d : fleetPartners_) {
        totalCapacity += d.originalSeats;
        occupiedSeats += (d.originalSeats - d.seats);
    }

    double seatUtilization = (totalCapacity > 0) ? (static_cast<double>(occupiedSeats) / totalCapacity) * 100.0 : 94.2;

    return json{
        {"totalCo2SavedKg", std::round(totalSavedCO2 * 10.0) / 10.0},
        {"totalDistanceKm", std::round(totalDistance * 10.0) / 10.0},
        {"seatUtilizationPercent", std::round(seatUtilization * 10.0) / 10.0},
        {"vehiclesEliminated", static_cast<int>(std::round(totalDistance / 24.5))},
        {"leaderboard", leaderboard_}
    };
}

std::vector<EcoLeader> NexusEngine::getLeaderboard() const {
    std::lock_guard<std::mutex> lock(mtx_);
    return leaderboard_;
}

json NexusEngine::loadRushHourDemo() {
    {
        std::lock_guard<std::mutex> lock(mtx_);
        fleetPartners_.clear();
        dispatchQueue_.clear();
        standbyLounge_.fill(std::nullopt);
        standbyFront_ = 0;
        standbyRear_ = 0;
        standbyCount_ = 0;
        activeTrips_.clear();
        reversalAuditLog_.clear();
    }

    onboardDriver("Marcus Vance", "ALPHA", 3);
    onboardDriver("Elena Rostova", "METRO", 3);
    onboardDriver("Kaelen Chen", "SKYPORT", 2);
    onboardDriver("Siddharth Rao", "QUANTUM", 3);

    submitRideRequest("Dr. Aris Thorne", "ALPHA", "HORIZON");
    submitRideRequest("Maya Lin", "METRO", "SKYPORT");
    submitRideRequest("Amara Okafor", "HARBOR", "QUANTUM");

    std::string err;
    Passenger standbyP;
    standbyP.id = "BK-STDBY-01";
    standbyP.name = "Taro Watanabe";
    standbyP.pickup = "HARBOR";
    standbyP.drop = "HORIZON";
    standbyP.requestedAt = getCurrentTimestamp();
    standbyP.status = "Priority Standby";
    pushToStandby(standbyP, err);

    auto trip = autoMatchTrip(96);

    return json{
        {"success", true},
        {"message", "Simulated Metropolitan Rush-Hour scenario loaded with live fleet, commuters, and active trips!"},
        {"sampleTrip", trip.has_value() ? json(*trip) : json(nullptr)}
    };
}

void NexusEngine::reset() {
    std::lock_guard<std::mutex> lock(mtx_);
    dispatchQueue_.clear();
    standbyLounge_.fill(std::nullopt);
    standbyFront_ = 0;
    standbyRear_ = 0;
    standbyCount_ = 0;
    fleetPartners_.clear();
    activeTrips_.clear();
    reversalAuditLog_.clear();
    nextDriverId_ = 101;
    nextBookingRef_ = 501;
    nextPassengerId_ = 201;
    initDefaultNetwork();
}

} // namespace Nexus
