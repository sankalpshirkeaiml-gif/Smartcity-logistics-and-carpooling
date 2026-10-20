@echo off
setlocal
echo Starting NexusMobility C++ REST API Server on port 8080...

if exist build\Release\nexus_server.exe (
    build\Release\nexus_server.exe 8080
) else if exist build\nexus_server.exe (
    build\nexus_server.exe 8080
) else if exist build\Debug\nexus_server.exe (
    build\Debug\nexus_server.exe 8080
) else (
    echo [ERROR] nexus_server.exe not found! Please run build.bat first.
    pause
    exit /b 1
)
