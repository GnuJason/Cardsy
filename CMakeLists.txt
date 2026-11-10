cmake_minimum_required(VERSION 3.21)

project(Cardsy VERSION 1.0.0 LANGUAGES CXX)

set(CARDSY_APPLICATION_ID "io.github.gnujason.cardsy")
set(CARDSY_DISPLAY_NAME "Cardsy")
set(CARDSY_VERSION "${PROJECT_VERSION}-dev")
set(CARDSY_SOFTWARE_LICENSE "GPL-3.0-or-later")
set(CARDSY_ORGANIZATION_DOMAIN "gnujason.github.io")
set(CARDSY_HOMEPAGE "https://github.com/GnuJason/Cardsy")

configure_file(src/app/ApplicationConfig.h.in
    generated/cardsy/ApplicationConfig.h @ONLY)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)

if(CMAKE_CXX_COMPILER_ID MATCHES "GNU|Clang")
    add_compile_options(-Wall -Wextra -Wpedantic)
    add_compile_options("-ffile-prefix-map=${CMAKE_SOURCE_DIR}=."
                        "-ffile-prefix-map=${CMAKE_BINARY_DIR}=build")
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
    src/app/ApplicationIdentity.cpp
    src/app/ApplicationIdentity.h
    resources/cardsy_icons.qrc
    src/ui/BoardFocus.cpp
    src/ui/BoardFocus.h
    src/ui/BoardAccessibility.cpp
    src/ui/BoardAccessibility.h
    src/ui/CardBackSettings.cpp
    src/ui/CardBackSettings.h
    src/ui/CardBackIdentity.h
    src/ui/CardBackPainting.cpp
    src/ui/CardBackPainting.h
    src/ui/IndividualCardBacks.cpp
    src/ui/IndividualCardBacks.h
    src/ui/CardBackDialog.cpp
    src/ui/CardBackDialog.h
    src/ui/BoardLayout.cpp
    src/ui/BoardLayout.h
    src/ui/GameBoard.cpp
    src/ui/GameBoard.h
    src/ui/MainWindow.cpp
    src/ui/MainWindow.h
)
target_link_libraries(cardsy-ui PUBLIC Qt6::Widgets cardsy-engine)
target_include_directories(cardsy-ui PUBLIC "${CMAKE_CURRENT_BINARY_DIR}/generated")

add_executable(cardsy src/main.cpp)
target_link_libraries(cardsy PRIVATE cardsy-ui)

include(GNUInstallDirs)
install(TARGETS cardsy RUNTIME DESTINATION "${CMAKE_INSTALL_BINDIR}")
install(FILES COPYING
        DESTINATION "${CMAKE_INSTALL_DATADIR}/licenses/${CARDSY_APPLICATION_ID}")
if(CMAKE_SYSTEM_NAME STREQUAL "Linux")
    configure_file(data/cardsy.desktop.in "${CARDSY_APPLICATION_ID}.desktop" @ONLY)
    configure_file(data/cardsy.metainfo.xml.in "${CARDSY_APPLICATION_ID}.metainfo.xml" @ONLY)
    install(FILES "${CMAKE_CURRENT_BINARY_DIR}/${CARDSY_APPLICATION_ID}.desktop"
            DESTINATION "${CMAKE_INSTALL_DATADIR}/applications")
    install(FILES "${CMAKE_CURRENT_BINARY_DIR}/${CARDSY_APPLICATION_ID}.metainfo.xml"
            DESTINATION "${CMAKE_INSTALL_DATADIR}/metainfo")
    install(FILES data/icons/cardsy.svg
            DESTINATION "${CMAKE_INSTALL_DATADIR}/icons/hicolor/scalable/apps"
            RENAME "${CARDSY_APPLICATION_ID}.svg")
    foreach(size IN ITEMS 16 48 256)
        install(FILES "data/icons/${size}/cardsy.png"
                DESTINATION "${CMAKE_INSTALL_DATADIR}/icons/hicolor/${size}x${size}/apps"
                RENAME "${CARDSY_APPLICATION_ID}.png")
    endforeach()
    install(FILES data/ASSET-LICENSE
            DESTINATION "${CMAKE_INSTALL_DATADIR}/licenses/${CARDSY_APPLICATION_ID}")
endif()

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

    foreach(test_name IN ITEMS BoardLayoutTest GameBoardTest CardBackSettingsTest PersonalizationTest
            IndividualCardBacksTest IndividualBackRenderingTest CardBackDialogTest
            DragInteractionTest KeyboardNavigationTest KeyboardGameplayTest BoardAccessibilityTest)
        add_executable(${test_name} tests/${test_name}.cpp)
        target_link_libraries(${test_name} PRIVATE cardsy-ui Qt6::Test)
        add_test(NAME ${test_name} COMMAND ${test_name})
        set_tests_properties(${test_name} PROPERTIES
            ENVIRONMENT "QT_QPA_PLATFORM=offscreen"
            TIMEOUT 30
        )
    endforeach()

    foreach(test_name IN ITEMS ApplicationIdentityTest DataMigrationTest)
        add_executable(${test_name} tests/${test_name}.cpp)
        target_link_libraries(${test_name} PRIVATE cardsy-ui Qt6::Test)
        add_test(NAME ${test_name} COMMAND ${test_name})
        set_tests_properties(${test_name} PROPERTIES
            ENVIRONMENT "QT_QPA_PLATFORM=offscreen"
            TIMEOUT 30)
    endforeach()
    target_compile_definitions(ApplicationIdentityTest PRIVATE
        CARDSY_TEST_EXECUTABLE="$<TARGET_FILE:cardsy>")
    add_dependencies(ApplicationIdentityTest cardsy)
    if(CMAKE_SYSTEM_NAME STREQUAL "Linux")
        add_executable(DesktopMetadataTest tests/DesktopMetadataTest.cpp)
        target_link_libraries(DesktopMetadataTest PRIVATE cardsy-ui Qt6::Test)
        add_test(NAME DesktopMetadataTest COMMAND DesktopMetadataTest)
        set_tests_properties(DesktopMetadataTest PROPERTIES TIMEOUT 30)
        target_compile_definitions(DesktopMetadataTest PRIVATE
            CARDSY_TEST_DESKTOP="${CMAKE_CURRENT_BINARY_DIR}/${CARDSY_APPLICATION_ID}.desktop"
            CARDSY_TEST_METAINFO="${CMAKE_CURRENT_BINARY_DIR}/${CARDSY_APPLICATION_ID}.metainfo.xml")
        find_program(CARDSY_READELF readelf)
        configure_file(tests/InstallLayoutTest.cmake.in
                       generated/InstallLayoutTest.cmake @ONLY)
        add_test(NAME cardsy-install-layout
                 COMMAND "${CMAKE_COMMAND}" "-DCARDSY_TEST_CONFIG=$<CONFIG>"
                         -P "${CMAKE_CURRENT_BINARY_DIR}/generated/InstallLayoutTest.cmake")
        set_tests_properties(cardsy-install-layout PROPERTIES TIMEOUT 30)
        find_program(CARDSY_DESKTOP_VALIDATOR desktop-file-validate)
        if(CARDSY_DESKTOP_VALIDATOR)
            add_test(NAME cardsy-desktop-validate
                     COMMAND "${CARDSY_DESKTOP_VALIDATOR}"
                             "${CMAKE_CURRENT_BINARY_DIR}/${CARDSY_APPLICATION_ID}.desktop")
        endif()
        find_program(CARDSY_APPSTREAM_VALIDATOR appstreamcli)
        if(CARDSY_APPSTREAM_VALIDATOR)
            add_test(NAME cardsy-metainfo-validate
                     COMMAND "${CARDSY_APPSTREAM_VALIDATOR}" validate --no-net --pedantic
                             "${CMAKE_CURRENT_BINARY_DIR}/${CARDSY_APPLICATION_ID}.metainfo.xml")
        endif()
    endif()

    foreach(test_name IN ITEMS
            CardDeckTest DealTest TableauRulesTest FoundationRulesTest
            StockWasteTest UndoTest GameStateInvariantTest WinTest)
        add_executable(${test_name} tests/engine/${test_name}.cpp)
        target_link_libraries(${test_name} PRIVATE cardsy-engine Qt6::Test)
        add_test(NAME ${test_name} COMMAND ${test_name})
        set_tests_properties(${test_name} PROPERTIES TIMEOUT 30)
    endforeach()
endif()
