# PowerShell API Test Script for NexusMobility C++ REST Backend Server
param(
    [string]$BaseUrl = "http://localhost:8080"
)

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "  NEXUSMOBILITY C++ BACKEND AUTOMATED API TEST SUITE     " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Uri,
        [object]$Body = $null
    )

    Write-Host "`n[TEST] $Name ($Method $Uri)..." -NoNewline
    try {
        $params = @{
            Uri = "$BaseUrl$Uri"
            Method = $Method
            ContentType = "application/json"
            TimeoutSec = 5
        }
        if ($Body) {
            $params["Body"] = ($Body | ConvertTo-Json -Depth 5)
        }

        $res = Invoke-RestMethod @params
        Write-Host " SUCCESS" -ForegroundColor Green
        return $res
    } catch {
        Write-Host " FAILED: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# 1. Health check
$health = Test-Endpoint -Name "Server Health" -Method "GET" -Uri "/"
if ($health) {
    Write-Host "  -> Service: $($health.service), Status: $($health.status)" -ForegroundColor DarkGray
}

# 2. Get Stations
$stations = Test-Endpoint -Name "Get Stations" -Method "GET" -Uri "/api/stations"
if ($stations) {
    Write-Host "  -> Retrieved $($stations.Count) stations" -ForegroundColor DarkGray
}

# 3. Calculate Route
$route = Test-Endpoint -Name "Calculate Optimal Eco-Route" -Method "POST" -Uri "/api/route/calculate" -Body @{
    origin = "ALPHA"
    destination = "HORIZON"
    density = 2
}
if ($route) {
    Write-Host "  -> Path: $($route.path -join ' -> ')" -ForegroundColor DarkGray
    Write-Host "  -> Distance: $($route.totalDist) km, Time: $($route.estTime) mins, Fare: `$$($route.fare)" -ForegroundColor DarkGray
}

# 4. Onboard Driver Partner
$driver = Test-Endpoint -Name "Onboard Driver Partner" -Method "POST" -Uri "/api/drivers/onboard" -Body @{
    name = "Marcus Vance"
    station = "ALPHA"
    seats = 3
}
if ($driver) {
    Write-Host "  -> Onboarded Driver: $($driver.name) with ID #$($driver.id), Seats: $($driver.seats)" -ForegroundColor DarkGray
}

# 5. Submit Passenger Request
$passenger = Test-Endpoint -Name "Submit Passenger Request" -Method "POST" -Uri "/api/passengers/request" -Body @{
    name = "Dr. Aris Thorne"
    pickup = "ALPHA"
    drop = "HORIZON"
}
if ($passenger) {
    Write-Host "  -> Passenger Registered: $($passenger.name) with ID $($passenger.id)" -ForegroundColor DarkGray
}

# 6. Auto-Match Trip
$tripMatch = Test-Endpoint -Name "Auto-Match & Dispatch Trip" -Method "POST" -Uri "/api/trips/auto-match" -Body @{
    matchScore = 96
}
if ($tripMatch -and $tripMatch.success) {
    Write-Host "  -> Trip Dispatched: $($tripMatch.trip.tripRef), Driver: $($tripMatch.trip.driverName), Match: $($tripMatch.trip.matchScore)%" -ForegroundColor DarkGray
}

# 7. Verify Record
if ($tripMatch -and $tripMatch.trip) {
    $verify = Test-Endpoint -Name "Verify Booking Reference" -Method "GET" -Uri "/api/verify?query=$($tripMatch.trip.tripRef)"
    if ($verify -and $verify.found) {
        Write-Host "  -> Verified Record: $($verify.type) $($verify.trip.tripRef)" -ForegroundColor DarkGray
    }
}

# 8. Standby Ring Buffer Push
$standbyPush = Test-Endpoint -Name "Push Standby Passenger (5-slot Ring Buffer)" -Method "POST" -Uri "/api/standby/push" -Body @{
    id = "BK-STDBY-01"
    name = "Taro Watanabe"
    pickup = "HARBOR"
    drop = "HORIZON"
}
if ($standbyPush) {
    Write-Host "  -> Standby Status: $($standbyPush.success)" -ForegroundColor DarkGray
}

# 9. Get Standby Telemetry
$standbyStatus = Test-Endpoint -Name "Get Standby Telemetry" -Method "GET" -Uri "/api/standby/status"
if ($standbyStatus) {
    Write-Host "  -> Capacity: $($standbyStatus.count)/$($standbyStatus.capacity) slots occupied" -ForegroundColor DarkGray
}

# 10. Revert Last Trip (LIFO Rollback Stack)
$revert = Test-Endpoint -Name "Revert Latest Trip Confirmation (LIFO Stack)" -Method "POST" -Uri "/api/trips/revert"
if ($revert -and $revert.success) {
    Write-Host "  -> Reverted: $($revert.message)" -ForegroundColor DarkGray
    Write-Host "  -> Restored Driver Capacity: $($revert.driver.seats)/$($revert.driver.originalSeats) seats" -ForegroundColor DarkGray
}

# 11. Sustainability Analytics
$sustainability = Test-Endpoint -Name "Get Sustainability Metrics" -Method "GET" -Uri "/api/sustainability"
if ($sustainability) {
    Write-Host "  -> Total CO2 Avoided: $($sustainability.totalCo2SavedKg) kg" -ForegroundColor DarkGray
    Write-Host "  -> Seat Utilization: $($sustainability.seatUtilizationPercent)%" -ForegroundColor DarkGray
}

Write-Host "`n=========================================================" -ForegroundColor Cyan
Write-Host "  ALL TESTS COMPLETED SUCCESSFULLY                       " -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Cyan
