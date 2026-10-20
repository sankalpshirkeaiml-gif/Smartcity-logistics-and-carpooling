#pragma once

#include "Models.hpp"
#include <string>
#include <vector>
#include <array>
#include <queue>
#include <deque>
#include <optional>
#include <mutex>
#include <memory>
#include <unordered_map>

namespace Nexus {

class NexusEngine {
public:
    static NexusEngine& getInstance() {
        static NexusEngine instance;
        return instance;
    }

    // Network Topology
    std::vector<Station> getStations() const;
    std::vector<Corridor> getCorridors() const;

    // Dijkstra Eco-Pathfinding
    RouteResult findOptimalEcoRoute(const std::string& startId, const std::string& endId, int commuterDensity = 2);

    // Commuter Request FIFO Queue
    Passenger submitRideRequest(const std::string& name, const std::string& pickup, const std::string& drop);
    std::optional<Passenger> dequeueNextRequest();
    std::vector<Passenger> getDispatchQueue() const;

    // Fixed 5-Slot Priority Standby Ring Buffer
    struct StandbyStatus {
        int capacity = 5;
        int count = 0;
        int front = 0;
        int rear = 0;
        std::vector<std::optional<Passenger>> slots;
    };

    bool pushToStandby(const Passenger& p, std::string& errorMsg);
    std::optional<Passenger> popFromStandby(std::string& errorMsg);
    StandbyStatus getStandbyStatus() const;

    // Driver Fleet Management
    Driver onboardDriver(const std::string& name, const std::string& station, int seats);
    std::vector<Driver> getFleet() const;
    std::optional<Driver> getDriverById(int id) const;

    // Active Shared Trips & Route Matching
    Trip dispatchSharedTrip(const Passenger& passenger, int driverId, int matchScore = 94);
    std::optional<Trip> autoMatchTrip(int matchScore = 94, std::string* errorMsg = nullptr);
    std::vector<Trip> getActiveTrips() const;
    std::optional<Trip> getTripByRef(const std::string& ref) const;
    bool completeOrCancelTrip(const std::string& tripRef);

    // Identity Verification (Driver ID or Booking Reference)
    json verifyRecord(const std::string& query) const;

    // Reversal LIFO Audit Stack (Rollback Engine)
    struct ReversalResult {
        bool success = false;
        std::string message;
        std::optional<AuditAction> action;
        std::optional<Driver> driver;
    };
    ReversalResult revertLatestConfirmation();
    std::vector<AuditAction> getAuditHistory() const;

    // Sustainability Analytics
    json getSustainabilityMetrics() const;
    std::vector<EcoLeader> getLeaderboard() const;

    // One-Click Rush-Hour Simulation Scenario
    json loadRushHourDemo();

    // Reset Engine State
    void reset();

private:
    NexusEngine();
    ~NexusEngine() = default;
    NexusEngine(const NexusEngine&) = delete;
    NexusEngine& operator=(const NexusEngine&) = delete;

    mutable std::mutex mtx_;

    // Graph Network
    std::vector<Station> stations_;
    std::vector<Corridor> corridors_;
    std::unordered_map<std::string, std::vector<std::pair<std::string, double>>> adjList_;

    // Commuter FIFO Queue
    std::deque<Passenger> dispatchQueue_;

    // 5-Slot Priority Standby Circular Ring Buffer
    static constexpr size_t STANDBY_CAP = 5;
    std::array<std::optional<Passenger>, STANDBY_CAP> standbyLounge_;
    size_t standbyFront_ = 0;
    size_t standbyRear_ = 0;
    size_t standbyCount_ = 0;

    // Driver Fleet & Active Trips
    std::vector<Driver> fleetPartners_;
    std::vector<Trip> activeTrips_;

    // LIFO Reversal Audit Log
    std::vector<AuditAction> reversalAuditLog_;

    // Leaderboard
    std::vector<EcoLeader> leaderboard_;

    // ID Counters
    int nextDriverId_ = 101;
    int nextBookingRef_ = 501;
    int nextPassengerId_ = 201;

    void initDefaultNetwork();
    std::string getCurrentTimestamp() const;
};

} // namespace Nexus
