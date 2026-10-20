@echo off
setlocal
echo ========================================================
echo   Building NexusMobility C++ REST API Server
echo ========================================================

where cmake >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] CMake is not found in PATH. Please install CMake or run from Visual Studio Developer Command Prompt.
    pause
    exit /b 1
)

if not exist build (
    mkdir build
)

cd build
cmake ..
if %errorlevel% neq 0 (
    echo [ERROR] CMake configuration failed.
    pause
    exit /b 1
)

cmake --build . --config Release
if %errorlevel% neq 0 (
    echo [ERROR] Build failed.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo   Build Successful! Executable ready in build\Release\
echo ========================================================
cd ..
pause
