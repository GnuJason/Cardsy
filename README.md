# Cardsy

Cardsy is a native desktop card-game application targeting openSUSE/Linux first,
with Linux, macOS and Windows portability intended long term.

## Currently implemented

- A playable native graphical Klondike board with generated cards and backs.
- Click-to-select source/destination interaction, stock drawing and recycling.
- Native New Game, Undo and Quit actions, plus small win/status feedback.
- One user-selected personal photo card back, processed and stored locally.
  The private copy survives restarts; Use Default Card Back removes that copy
  without deleting the original or changing the current game.
- A UI-independent C++17 Klondike engine: dealing, legal moves, draw 1/draw 3,
  recycling, win detection, complete-state undo and invariant validation.
- A C++ / Qt 6 Widgets / CMake foundation with native engine, geometry and GUI
  integration tests.

See [engine behavior and historical test traceability](docs/engine-behavior.md)
for the model contract and [board interaction](docs/board-interaction.md) for
controls, resizing and current accessibility limits.
See [personal card-back policy](docs/personal-card-backs.md) for accepted images,
resource limits and private storage behavior.

## Planned for Cardsy 1.0

- Native preferences and desktop integration.

Drag-and-drop, broader preferences and distribution packages are not implemented.

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

GUI tests use Qt's offscreen platform; engine tests need no GUI or display
server. The engine library uses only the C++ standard library and does not link
Qt. Tests require Qt Test.
Running `cardsy` normally opens a graphical desktop window and requires a working
Qt platform plugin and display session. `-DBUILD_TESTING=OFF` excludes Qt Test.

## Preservation and release status

The previous GrandmaGames web application is preserved locally on branch
`archive/grandmagames-web` and tag `grandmagames-web-pre-cardsy`.
Its history contains personal/photo-like assets; do not publish that history or
include those assets in Cardsy source releases, builds or test fixtures.

**Public distribution is blocked pending an explicit project license and asset
provenance decisions.** No license has been selected or inferred.
