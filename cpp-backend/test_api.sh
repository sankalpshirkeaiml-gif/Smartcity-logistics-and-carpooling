#!/usr/bin/env bash
# Shell test script for NexusMobility C++ REST API Server
BASE_URL="http://localhost:8080"

echo "=== 1. Health Check ==="
curl -s "${BASE_URL}/" | jq .

echo -e "\n=== 2. List Stations ==="
curl -s "${BASE_URL}/api/stations" | jq .

echo -e "\n=== 3. Calculate Route (ALPHA -> HORIZON, density: 2) ==="
curl -s -X POST "${BASE_URL}/api/route/calculate" \
  -H "Content-Type: application/json" \
  -d '{"origin": "ALPHA", "destination": "HORIZON", "density": 2}' | jq .

echo -e "\n=== 4. Onboard Driver Partner ==="
curl -s -X POST "${BASE_URL}/api/drivers/onboard" \
  -H "Content-Type: application/json" \
  -d '{"name": "Marcus Vance", "station": "ALPHA", "seats": 3}' | jq .

echo -e "\n=== 5. Submit Passenger Request ==="
curl -s -X POST "${BASE_URL}/api/passengers/request" \
  -H "Content-Type: application/json" \
  -d '{"name": "Dr. Aris Thorne", "pickup": "ALPHA", "drop": "HORIZON"}' | jq .

echo -e "\n=== 6. Auto-Match & Dispatch Trip ==="
curl -s -X POST "${BASE_URL}/api/trips/auto-match" \
  -H "Content-Type: application/json" \
  -d '{"matchScore": 96}' | jq .

echo -e "\n=== 7. Get Active Trips ==="
curl -s "${BASE_URL}/api/trips/active" | jq .

echo -e "\n=== 8. Revert Last Trip (LIFO Rollback Stack) ==="
curl -s -X POST "${BASE_URL}/api/trips/revert" | jq .

echo -e "\n=== 9. Sustainability Metrics ==="
curl -s "${BASE_URL}/api/sustainability" | jq .
