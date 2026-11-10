# Cardsy

Cardsy is a native desktop card-game application targeting openSUSE/Linux first,
with Linux, macOS and Windows portability intended long term.

**Development toward Cardsy 1.0.0; not a public 1.0.0 release.**

## Currently implemented

- A playable native graphical Klondike board with generated cards and backs.
- Click-to-select and drag-and-drop source/destination interaction, stock drawing
  and recycling.
- Keyboard board navigation with arrows, Enter/Space selection and activation,
  visible logical focus and basic Qt accessibility context.
- Native New Game, Undo and Quit actions, plus small win/status feedback.
- One user-selected personal photo card back, processed and stored locally.
  The private copy survives restarts; Use Default Card Back removes that copy
  without deleting the original or changing the current game.
- Independent custom images for all 52 cards, managed by suit through
  Game > Card Back > Custom Card Backs, with previews and scoped resets.
- A UI-independent C++17 Klondike engine: dealing, legal moves, draw 1/draw 3,
  recycling, win detection, complete-state undo and invariant validation.
- A C++ / Qt 6 Widgets / CMake foundation with native engine, geometry and GUI
  integration tests.
- Original application icon, Linux launcher/metainfo and prefix-relative CMake
  installation.

See [engine behavior and historical test traceability](docs/engine-behavior.md)
for the model contract and [board interaction](docs/board-interaction.md) for
controls, resizing and current accessibility limits.
See [personal card-back policy](docs/personal-card-backs.md) for accepted images,
resource limits and private storage behavior.

Richer per-card screen-reader semantics, broader preferences and distribution
packages are not implemented.

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
./build/cardsy --version
./build/cardsy --help
```

GUI tests use Qt's offscreen platform; engine tests need no GUI or display
server. The engine library uses only the C++ standard library and does not link
Qt. Tests require Qt Test.
Running `cardsy` normally opens a graphical desktop window and requires a working
Qt platform plugin and display session. `-DBUILD_TESTING=OFF` excludes Qt Test.

## Staged installation and release status

```sh
stage="$(mktemp -d)"
DESTDIR="$stage" cmake --install build --prefix /usr
"$stage/usr/bin/cardsy"
```

No sudo or system-wide installation is needed for staging. See
[desktop identity/install contract](docs/desktop-installation.md) and the
[dedicated Tumbleweed QA checklist](docs/tumbleweed-qa.md).

Personalization now uses Qt's per-user application data location under
`io.github.gnujason.cardsy`. A valid former Cardsy development copy is migrated
safely when the new namespace is first initialized; installed files never
contain user images or preferences.

Authoritative upstream: <https://github.com/GnuJason/Cardsy>.

## Licensing and release readiness

Cardsy software, build/test files and project documentation use
**GPL-3.0-or-later**; see [COPYING](COPYING) and [license scope](LICENSING.md).
The original icon artwork and desktop/AppStream metadata independently use
CC0-1.0. User photos are not project assets or distribution content.

Dedicated Tumbleweed QA remains pending. No RPM, public release or Factory
availability is claimed.
