#include "NexusEngine.hpp"
#include <httplib.h>
#include <iostream>
#include <string>

using namespace Nexus;
using json = nlohmann::json;

void setupCORS(httplib::Response& res) {
    res.set_header("Access-Control-Allow-Origin", "*");
    res.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
}

int main(int argc, char* argv[]) {
    int port = 8080;
    if (argc > 1) {
        port = std::stoi(argv[1]);
    }

    httplib::Server svr;
    auto& engine = NexusEngine::getInstance();

    std::cout << "=========================================================\n";
    std::cout << "  NEXUSMOBILITY — SMART CITY ECO-LOGISTICS C++ BACKEND   \n";
    std::cout << "  High-Performance Modern C++ REST API Server             \n";
    std::cout << "=========================================================\n";

    // Global Preflight OPTIONS handler
    svr.Options(R"(/.*)", [](const httplib::Request&, httplib::Response& res) {
        setupCORS(res);
        res.status = 204;
    });

    // 1. Health & Root Info
    svr.Get("/", [](const httplib::Request&, httplib::Response& res) {
        setupCORS(res);
        json j = {
            {"status", "online"},
            {"service", "NexusMobility Eco-Logistics C++ Engine"},
            {"version", "2.0.0"},
            {"endpoints", {
                "/api/stations",
                "/api/corridors",
                "/api/route/calculate",
                "/api/passengers/request",
                "/api/passengers/dequeue",
                "/api/passengers/queue",
                "/api/standby/push",
                "/api/standby/pop",
                "/api/standby/status",
                "/api/drivers/onboard",
                "/api/drivers",
                "/api/verify",
                "/api/trips/dispatch",
                "/api/trips/auto-match",
                "/api/trips/active",
                "/api/trips/complete",
                "/api/trips/revert",
                "/api/trips/audit",
                "/api/sustainability",
                "/api/simulation/rushhour"
            }}
        };
        res.set_content(j.dump(2), "application/json");
    });

    // 2. Stations List
    svr.Get("/api/stations", [&](const httplib::Request&, httplib::Response& res) {
        setupCORS(res);
        json j = engine.getStations();
        res.set_content(j.dump(), "application/json");
    });

    // 3. Corridors List
    svr.Get("/api/corridors", [&](const httplib::Request&, httplib::Response& res) {
        setupCORS(res);
        json j = engine.getCorridors();
        res.set_content(j.dump(), "application/json");
    });

    // 4. Calculate Route (Dijkstra)
    svr.Post("/api/route/calculate", [&](const httplib::Request& req, httplib::Response& res) {
        setupCORS(res);
        try {
            auto body = json::parse(req.body);
            std::string origin = body.value("origin", "ALPHA");
            std::string dest = body.value("destination", "HORIZON");
            int density = body.value("density", 2);

            RouteResult r = engine.findOptimalEcoRoute(origin, dest, density);
            json j = r;
            res.set_content(j.dump(), "application/json");
        } catch (const std::exception& e) {
            res.status = 400;
            res.set_content(json{{"error", e.what()}}.dump(), "application/json");
        }
    });

    // 5. Submit Passenger Request
    svr.Post("/api/passengers/request", [&](const httplib::Request& req, httplib::Response& res) {
        setupCORS(res);
        try {
            auto body = json::parse(req.body);
            std::string name = body.value("name", "");
            std::string pickup = body.value("pickup", "ALPHA");
            std::string drop = body.value("drop", "HORIZON");

            Passenger p = engine.submitRideRequest(name, pickup, drop);
            res.status = 201;
            res.set_content(json(p).dump(), "application/json");
        } catch (const std::exception& e) {
            res.status = 400;
            res.set_content(json{{"error", e.what()}}.dump(), "application/json");
        }
    });

    // 6. Dequeue Next Passenger
    svr.Post("/api/passengers/dequeue", [&](const httplib::Request&, httplib::Response& res) {
        setupCORS(res);
        auto p = engine.dequeueNextRequest();
        if (p) {
            res.set_content(json(*p).dump(), "application/json");
        } else {
            res.status = 404;
            res.set_content(json{{"message", "No pending passenger requests in the pipeline."}}.dump(), "application/json");
        }
    });

    // 7. Get Passenger Queue
    svr.Get("/api/passengers/queue", [&](const httplib::Request&, httplib::Response& res) {
        setupCORS(res);
        json j = engine.getDispatchQueue();
        res.set_content(j.dump(), "application/json");
    });

    // 8. Standby Push
    svr.Post("/api/standby/push", [&](const httplib::Request& req, httplib::Response& res) {
        setupCORS(res);
        try {
            Passenger p;
            if (!req.body.empty() && req.body != "{}") {
                auto body = json::parse(req.body);
                if (body.contains("passenger")) {
                    p = body["passenger"].get<Passenger>();
                } else {
                    p.id = body.value("id", "P-WAIT");
                    p.name = body.value("name", "Standby Passenger");
                    p.pickup = body.value("pickup", "METRO");
                    p.drop = body.value("drop", "SKYPORT");
                }
            } else {
                auto nextP = engine.dequeueNextRequest();
                if (nextP) {
                    p = *nextP;
                } else {
                    p.id = "BK-STDBY-AUTO";
                    p.name = "Standby Commuter";
                    p.pickup = "METRO";
                    p.drop = "SKYPORT";
                    p.status = "In Priority Standby";
                }
            }

            std::string err;
            if (engine.pushToStandby(p, err)) {
                res.set_content(json{{"success", true}, {"passenger", p}}.dump(), "application/json");
            } else {
                res.status = 409;
                res.set_content(json{{"success", false}, {"message", err}}.dump(), "application/json");
            }
        } catch (const std::exception& e) {
            res.status = 400;
            res.set_content(json{{"error", e.what()}}.dump(), "application/json");
        }
    });

    // 9. Standby Pop
    svr.Post("/api/standby/pop", [&](const httplib::Request&, httplib::Response& res) {
        setupCORS(res);
        std::string err;
        auto p = engine.popFromStandby(err);
        if (p) {
            res.set_content(json{{"success", true}, {"passenger", *p}}.dump(), "application/json");
        } else {
            res.status = 404;
            res.set_content(json{{"success", false}, {"message", err}}.dump(), "application/json");
        }
    });

    // 10. Standby Status
    svr.Get("/api/standby/status", [&](const httplib::Request&, httplib::Response& res) {
        setupCORS(res);
        auto s = engine.getStandbyStatus();
        json slots = json::array();
        for (const auto& slot : s.slots) {
            if (slot) {
                slots.push_back(*slot);
            } else {
                slots.push_back(nullptr);
            }
        }
        json j = {
            {"capacity", s.capacity},
            {"count", s.count},
            {"front", s.front},
            {"rear", s.rear},
            {"slots", slots}
        };
        res.set_content(j.dump(), "application/json");
    });

    // 11. Onboard Driver Partner
    svr.Post("/api/drivers/onboard", [&](const httplib::Request& req, httplib::Response& res) {
        setupCORS(res);
        try {
            auto body = json::parse(req.body);
            std::string name = body.value("name", "");
            std::string station = body.value("station", "METRO");
            int seats = body.value("seats", 4);

            Driver d = engine.onboardDriver(name, station, seats);
            res.status = 201;
            res.set_content(json(d).dump(), "application/json");
        } catch (const std::exception& e) {
            res.status = 400;
            res.set_content(json{{"error", e.what()}}.dump(), "application/json");
        }
    });

    // 12. Get Fleet Directory
    svr.Get("/api/drivers", [&](const httplib::Request&, httplib::Response& res) {
        setupCORS(res);
        json j = engine.getFleet();
        res.set_content(j.dump(), "application/json");
    });

    // 13. Verify Record (Driver ID or Booking Reference)
    svr.Get("/api/verify", [&](const httplib::Request& req, httplib::Response& res) {
        setupCORS(res);
        std::string query = req.get_param_value("query");
        if (query.empty()) {
            res.status = 400;
            res.set_content(json{{"error", "Query parameter 'query' required."}}.dump(), "application/json");
            return;
        }
        json j = engine.verifyRecord(query);
        res.set_content(j.dump(), "application/json");
    });

    // 14. Auto-Match & Dispatch Shared Trip
    svr.Post("/api/trips/auto-match", [&](const httplib::Request& req, httplib::Response& res) {
        setupCORS(res);
        int matchScore = 94;
        if (!req.body.empty() && req.body != "{}") {
            try {
                auto body = json::parse(req.body);
                matchScore = body.value("matchScore", 94);
            } catch (...) {}
        }
        std::string err;
        auto trip = engine.autoMatchTrip(matchScore, &err);
        if (trip) {
            res.set_content(json{{"success", true}, {"trip", *trip}}.dump(), "application/json");
        } else {
            res.status = 409;
            res.set_content(json{{"success", false}, {"message", err}}.dump(), "application/json");
        }
    });

    // 15. Explicit Dispatch Shared Trip
    svr.Post("/api/trips/dispatch", [&](const httplib::Request& req, httplib::Response& res) {
        setupCORS(res);
        try {
            auto body = json::parse(req.body);
            Passenger p = body.at("passenger").get<Passenger>();
            int driverId = body.at("driverId").get<int>();
            int matchScore = body.value("matchScore", 94);

            Trip trip = engine.dispatchSharedTrip(p, driverId, matchScore);
            res.set_content(json{{"success", true}, {"trip", trip}}.dump(), "application/json");
        } catch (const std::exception& e) {
            res.status = 400;
            res.set_content(json{{"error", e.what()}}.dump(), "application/json");
        }
    });

    // 16. Get Active Trips
    svr.Get("/api/trips/active", [&](const httplib::Request&, httplib::Response& res) {
        setupCORS(res);
        json j = engine.getActiveTrips();
        res.set_content(j.dump(), "application/json");
    });

    // 17. Complete / Cancel Trip
    svr.Post("/api/trips/complete", [&](const httplib::Request& req, httplib::Response& res) {
        setupCORS(res);
        try {
            auto body = json::parse(req.body);
            std::string ref = body.at("tripRef").get<std::string>();
            if (engine.completeOrCancelTrip(ref)) {
                res.set_content(json{{"success", true}, {"message", "Trip " + ref + " completed."}}.dump(), "application/json");
            } else {
                res.status = 404;
                res.set_content(json{{"success", false}, {"message", "Trip not found."}}.dump(), "application/json");
            }
        } catch (const std::exception& e) {
            res.status = 400;
            res.set_content(json{{"error", e.what()}}.dump(), "application/json");
        }
    });

    // 18. Revert Last Dispatch Confirmation (LIFO Stack Pop)
    svr.Post("/api/trips/revert", [&](const httplib::Request&, httplib::Response& res) {
        setupCORS(res);
        auto result = engine.revertLatestConfirmation();
        if (result.success) {
            json j = {
                {"success", true},
                {"message", result.message},
                {"action", result.action.has_value() ? json(*result.action) : json(nullptr)},
                {"driver", result.driver.has_value() ? json(*result.driver) : json(nullptr)}
            };
            res.set_content(j.dump(), "application/json");
        } else {
            res.status = 400;
            res.set_content(json{{"success", false}, {"message", result.message}}.dump(), "application/json");
        }
    });

    // 19. Get Audit History
    svr.Get("/api/trips/audit", [&](const httplib::Request&, httplib::Response& res) {
        setupCORS(res);
        json j = engine.getAuditHistory();
        res.set_content(j.dump(), "application/json");
    });

    // 20. Sustainability Metrics & Leaderboard
    svr.Get("/api/sustainability", [&](const httplib::Request&, httplib::Response& res) {
        setupCORS(res);
        json j = engine.getSustainabilityMetrics();
        res.set_content(j.dump(), "application/json");
    });

    // 21. Load Rush-Hour Simulation Scenario
    svr.Post("/api/simulation/rushhour", [&](const httplib::Request&, httplib::Response& res) {
        setupCORS(res);
        json j = engine.loadRushHourDemo();
        res.set_content(j.dump(), "application/json");
    });

    // 22. Reset Engine State
    svr.Post("/api/reset", [&](const httplib::Request&, httplib::Response& res) {
        setupCORS(res);
        engine.reset();
        res.set_content(json{{"success", true}, {"message", "Engine state reset to default."}}.dump(), "application/json");
    });

    std::cout << "[NexusMobility Engine] HTTP REST API Server listening on http://localhost:" << port << "\n";
    std::cout << "[NexusMobility Engine] Ready to serve transit route and dispatch requests.\n";

    svr.listen("0.0.0.0", port);
    return 0;
}
