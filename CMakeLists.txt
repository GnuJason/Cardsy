cmake_minimum_required(VERSION 3.21)

project(Cardsy VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)
set(CMAKE_AUTOMOC ON)

if(CMAKE_CXX_COMPILER_ID MATCHES "GNU|Clang")
    add_compile_options(-Wall -Wextra -Wpedantic)
elseif(MSVC)
    add_compile_options(/W4)
endif()

find_package(Qt6 6.2 REQUIRED COMPONENTS Widgets)

add_library(cardsy-engine STATIC
    src/engine/Card.h
    src/engine/Deck.cpp
    src/engine/Deck.h
    src/engine/Game.cpp
    src/engine/Game.h
    src/engine/GameState.cpp
    src/engine/GameState.h
    src/engine/Rules.cpp
    src/engine/Rules.h
)
set_target_properties(cardsy-engine PROPERTIES AUTOMOC OFF)
target_include_directories(cardsy-engine PUBLIC src)

add_library(cardsy-ui STATIC
    src/ui/CardBackSettings.cpp
    src/ui/CardBackSettings.h
    src/ui/BoardLayout.cpp
    src/ui/BoardLayout.h
    src/ui/GameBoard.cpp
    src/ui/GameBoard.h
    src/ui/MainWindow.cpp
    src/ui/MainWindow.h
)
target_link_libraries(cardsy-ui PUBLIC Qt6::Widgets cardsy-engine)

add_executable(cardsy src/main.cpp)
target_link_libraries(cardsy PRIVATE cardsy-ui)

include(CTest)
if(BUILD_TESTING)
    find_package(Qt6 6.2 REQUIRED COMPONENTS Test)
    add_executable(cardsy-smoke-test
        tests/MainWindowTest.cpp
    )
    target_link_libraries(cardsy-smoke-test PRIVATE cardsy-ui Qt6::Test)
    add_test(NAME cardsy-window-smoke COMMAND cardsy-smoke-test)
    set_tests_properties(cardsy-window-smoke PROPERTIES
        ENVIRONMENT "QT_QPA_PLATFORM=offscreen"
        TIMEOUT 15
    )

    foreach(test_name IN ITEMS BoardLayoutTest GameBoardTest CardBackSettingsTest PersonalizationTest)
        add_executable(${test_name} tests/${test_name}.cpp)
        target_link_libraries(${test_name} PRIVATE cardsy-ui Qt6::Test)
        add_test(NAME ${test_name} COMMAND ${test_name})
        set_tests_properties(${test_name} PROPERTIES
            ENVIRONMENT "QT_QPA_PLATFORM=offscreen"
            TIMEOUT 30
        )
    endforeach()

    foreach(test_name IN ITEMS
            CardDeckTest DealTest TableauRulesTest FoundationRulesTest
            StockWasteTest UndoTest GameStateInvariantTest WinTest)
        add_executable(${test_name} tests/engine/${test_name}.cpp)
        target_link_libraries(${test_name} PRIVATE cardsy-engine Qt6::Test)
        add_test(NAME ${test_name} COMMAND ${test_name})
        set_tests_properties(${test_name} PROPERTIES TIMEOUT 30)
    endforeach()
endif()
