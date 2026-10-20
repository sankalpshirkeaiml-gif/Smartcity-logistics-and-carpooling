cmake_minimum_required(VERSION 3.16)
project(NexusMobilityServer VERSION 2.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Include directories
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

# Fetch or locate nlohmann/json and cpp-httplib if not found locally
find_package(nlohmann_json 3.9.0 QUIET)
if (NOT nlohmann_json_FOUND)
    include(FetchContent)
    FetchContent_Declare(
        json
        URL https://github.com/nlohmann/json/releases/download/v3.11.3/json.tar.xz
    )
    FetchContent_MakeAvailable(json)
endif()

find_package(httplib QUIET)
if (NOT httplib_FOUND)
    include(FetchContent)
    FetchContent_Declare(
        httplib
        GIT_REPOSITORY https://github.com/yhirose/cpp-httplib.git
        GIT_TAG v0.15.3
    )
    FetchContent_MakeAvailable(httplib)
endif()

# Source files
set(SOURCES
    src/NexusEngine.cpp
    src/main.cpp
)

# Executable target
add_executable(nexus_server ${SOURCES})

# Target include directories
target_include_directories(nexus_server PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

# Link dependencies
if (TARGET nlohmann_json::nlohmann_json)
    target_link_libraries(nexus_server PRIVATE nlohmann_json::nlohmann_json)
endif()

if (TARGET httplib::httplib)
    target_link_libraries(nexus_server PRIVATE httplib::httplib)
endif()

# Threading library
find_package(Threads REQUIRED)
target_link_libraries(nexus_server PRIVATE Threads::Threads)

# Windows socket library (Winsock2)
if (WIN32)
    target_link_libraries(nexus_server PRIVATE ws2_32 wsock32 crypt32)
endif()

# Compiler warnings and optimizations
if (MSVC)
    target_compile_options(nexus_server PRIVATE /W4 /O2 /permissive-)
else()
    target_compile_options(nexus_server PRIVATE -Wall -Wextra -O3 -pthread)
endif()
