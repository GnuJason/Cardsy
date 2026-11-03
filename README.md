# Cardsy

Cardsy is a native desktop card-game application targeting openSUSE/Linux first,
with Linux, macOS and Windows portability intended long term.

## Currently implemented

- A resizable native Cardsy placeholder window.
- A C++ / Qt 6 Widgets / CMake foundation and a Qt Test smoke test.

## Planned for Cardsy 1.0

- Classic Klondike Solitaire.
- User-selected personal photo card backs, kept locally, with a default-back reset.
- Native preferences and desktop integration.

No gameplay, photo handling or distribution packages are implemented yet.

## Build and run

Use system CMake (3.21 or newer), a C++17 compiler and Qt 6 (6.2 or newer).
On openSUSE, the development modules are `qt6-widgets-devel` and
`qt6-test-devel`; `qt6-wayland` supplies the Wayland platform plugin.
A standard build tool such as Make or Ninja is also required.
No dependencies are downloaded by CMake. Node, npm and pnpm are not used.

```sh
cmake -S . -B build
cmake --build build
ctest --test-dir build --output-on-failure
./build/cardsy
```

Tests use Qt's offscreen platform so they can run without a display server.
Running `cardsy` normally opens a graphical desktop window and requires a working
Qt platform plugin and display session. `-DBUILD_TESTING=OFF` excludes Qt Test.

## Preservation and release status

The previous GrandmaGames web application is preserved locally on branch
`archive/grandmagames-web` and tag `grandmagames-web-pre-cardsy`.
Its history contains personal/photo-like assets; do not publish that history or
include those assets in Cardsy source releases, builds or test fixtures.

**Public distribution is blocked pending an explicit project license and asset
provenance decisions.** No license has been selected or inferred.
