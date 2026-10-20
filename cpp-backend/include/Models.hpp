#pragma once

#include <string>
#include <vector>
#include <optional>
#include <nlohmann/json.hpp>

namespace Nexus {

using json = nlohmann::json;

// 1. Transit Station Hub
struct Station {
    std::string id;
    std::string name;
    double x = 0.0;
    double y = 0.0;
    double z = 0.0;
    std::string zone;
    std::string icon;
};

inline void to_json(json& j, const Station& s) {
    j = json{
        {"id", s.id},
        {"name", s.name},
        {"x", s.x},
        {"y", s.y},
        {"z", s.z},
        {"zone", s.zone},
        {"icon", s.icon}
    };
}

inline void from_json(const json& j, Station& s) {
    j.at("id").get_to(s.id);
    j.at("name").get_to(s.name);
    j.at("x").get_to(s.x);
    j.at("y").get_to(s.y);
    j.at("z").get_to(s.z);
    j.at("zone").get_to(s.zone);
    if (j.contains("icon")) j.at("icon").get_to(s.icon);
}

// 2. Transit Corridor Segment
struct Corridor {
    std::string u;
    std::string v;
    double distance = 0.0;
};

inline void to_json(json& j, const Corridor& c) {
    j = json{
        {"u", c.u},
        {"v", c.v},
        {"distance", c.distance}
    };
}

inline void from_json(const json& j, Corridor& c) {
    j.at("u").get_to(c.u);
    j.at("v").get_to(c.v);
    j.at("distance").get_to(c.distance);
}

// 3. Commuter Passenger Request
struct Passenger {
    std::string id;
    std::string name;
    std::string pickup;
    std::string drop;
    std::string requestedAt;
    std::string status = "Pending Dispatch";
};

inline void to_json(json& j, const Passenger& p) {
    j = json{
        {"id", p.id},
        {"name", p.name},
        {"pickup", p.pickup},
        {"drop", p.drop},
        {"requestedAt", p.requestedAt},
        {"status", p.status}
    };
}

inline void from_json(const json& j, Passenger& p) {
    j.at("id").get_to(p.id);
    j.at("name").get_to(p.name);
    j.at("pickup").get_to(p.pickup);
    j.at("drop").get_to(p.drop);
    if (j.contains("requestedAt")) j.at("requestedAt").get_to(p.requestedAt);
    if (j.contains("status")) j.at("status").get_to(p.status);
}

// 4. Driver Partner
struct Driver {
    int id = 0;
    std::string name;
    std::string station;
    int seats = 0;
    int originalSeats = 0;
    int tripsCompleted = 0;
};

inline void to_json(json& j, const Driver& d) {
    j = json{
        {"id", d.id},
        {"name", d.name},
        {"station", d.station},
        {"seats", d.seats},
        {"originalSeats", d.originalSeats},
        {"tripsCompleted", d.tripsCompleted}
    };
}

inline void from_json(const json& j, Driver& d) {
    j.at("id").get_to(d.id);
    j.at("name").get_to(d.name);
    j.at("station").get_to(d.station);
    j.at("seats").get_to(d.seats);
    j.at("originalSeats").get_to(d.originalSeats);
    if (j.contains("tripsCompleted")) j.at("tripsCompleted").get_to(d.tripsCompleted);
}

// 5. Active Dispatched Shared Trip
struct Trip {
    std::string tripRef;
    Passenger passenger;
    int driverId = 0;
    std::string driverName;
    std::vector<std::string> corridorPath;
    double distance = 0.0;
    int time = 0;
    double fare = 0.0;
    double co2Saved = 0.0;
    int matchScore = 94;
    std::string dispatchedAt;
};

inline void to_json(json& j, const Trip& t) {
    j = json{
        {"tripRef", t.tripRef},
        {"passenger", t.passenger},
        {"driverId", t.driverId},
        {"driverName", t.driverName},
        {"corridorPath", t.corridorPath},
        {"distance", t.distance},
        {"time", t.time},
        {"fare", t.fare},
        {"co2Saved", t.co2Saved},
        {"matchScore", t.matchScore},
        {"dispatchedAt", t.dispatchedAt}
    };
}

inline void from_json(const json& j, Trip& t) {
    j.at("tripRef").get_to(t.tripRef);
    j.at("passenger").get_to(t.passenger);
    j.at("driverId").get_to(t.driverId);
    j.at("driverName").get_to(t.driverName);
    j.at("corridorPath").get_to(t.corridorPath);
    j.at("distance").get_to(t.distance);
    j.at("time").get_to(t.time);
    j.at("fare").get_to(t.fare);
    j.at("co2Saved").get_to(t.co2Saved);
    if (j.contains("matchScore")) j.at("matchScore").get_to(t.matchScore);
    if (j.contains("dispatchedAt")) j.at("dispatchedAt").get_to(t.dispatchedAt);
}

// 6. Audit Action Frame (LIFO Rollback Stack)
struct AuditAction {
    std::string type;
    std::string tripRef;
    int driverId = 0;
    Passenger passenger;
    Trip trip;
};

inline void to_json(json& j, const AuditAction& a) {
    j = json{
        {"type", a.type},
        {"tripRef", a.tripRef},
        {"driverId", a.driverId},
        {"passenger", a.passenger},
        {"trip", a.trip}
    };
}

// 7. Route Calculation Result
struct RouteResult {
    std::vector<std::string> path;
    double totalDist = 0.0;
    int estTime = 0;
    double co2Offset = 0.0;
    double fare = 0.0;
    int soloCarsSaved = 0;
};

inline void to_json(json& j, const RouteResult& r) {
    j = json{
        {"path", r.path},
        {"totalDist", r.totalDist},
        {"estTime", r.estTime},
        {"co2Offset", r.co2Offset},
        {"fare", r.fare},
        {"soloCarsSaved", r.soloCarsSaved}
    };
}

// 8. Eco Leaderboard Partner
struct EcoLeader {
    std::string name;
    int trips = 0;
    std::string co2;
    double rating = 5.0;
    std::string badge;
};

inline void to_json(json& j, const EcoLeader& e) {
    j = json{
        {"name", e.name},
        {"trips", e.trips},
        {"co2", e.co2},
        {"rating", e.rating},
        {"badge", e.badge}
    };
}

} // namespace Nexus
