cmake_minimum_required(VERSION 3.21)

project(Cardsy VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)
set(CMAKE_AUTOMOC ON)

find_package(Qt6 6.2 REQUIRED COMPONENTS Widgets)

add_executable(cardsy
    src/main.cpp
    src/ui/MainWindow.cpp
    src/ui/MainWindow.h
)
target_link_libraries(cardsy PRIVATE Qt6::Widgets)

include(CTest)
if(BUILD_TESTING)
    find_package(Qt6 6.2 REQUIRED COMPONENTS Test)
    add_executable(cardsy-smoke-test
        tests/MainWindowTest.cpp
        src/ui/MainWindow.cpp
        src/ui/MainWindow.h
    )
    target_include_directories(cardsy-smoke-test PRIVATE src)
    target_link_libraries(cardsy-smoke-test PRIVATE Qt6::Widgets Qt6::Test)
    add_test(NAME cardsy-window-smoke COMMAND cardsy-smoke-test)
    set_tests_properties(cardsy-window-smoke PROPERTIES
        ENVIRONMENT "QT_QPA_PLATFORM=offscreen"
        TIMEOUT 15
    )
endif()
