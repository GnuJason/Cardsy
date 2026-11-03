# Native board interaction

## Controls

- Click stock to draw. With empty stock, clicking requests waste recycling;
  the engine decides whether that request is legal.
- Click a face-up tableau card to select its suffix, the accessible waste top
  to select waste, or a foundation top to select a foundation source.
- Click a tableau or foundation destination to submit a typed engine move.
  Only a single selected tableau top has a representable foundation intent;
  selecting a longer suffix never silently moves a different top card.
- Clicking the selected source again, pressing Escape, or clicking board
  background clears selection. Clicking another face-up card in the same column
  or clicking waste replaces selection.
- Illegal destination requests preserve both state and selection and report a
  short status message. Clear selection before choosing a different source
  from another tableau column.
- Game > New Game starts a fresh deal and clears undo/selection.
- Game > Undo restores the previous engine state and clears selection.
- Game > Card Back offers Choose Photo... and Use Default Card Back without
  changing the current game. See [personal card backs](personal-card-backs.md).
- Game > Quit closes the application normally.

New Game, Undo and Quit use the platform's standard Qt shortcuts (normally
Ctrl+N, Ctrl+Z and Ctrl+Q on Linux). Undo is disabled when unavailable. The GUI
uses the engine's default draw configuration; no draw-mode settings are provided.
Engine `Won` status produces a small status-bar message rather than a dialog.

## Ownership and boundaries

Each `GameBoard` owns exactly one `cardsy::Game`. `MainWindow` owns that widget
and its native actions. Painting always reads the current engine state; there
is no UI copy of the piles.

`BoardLayout` calculates rectangles with logical pile/card indices in painting
order. Hit testing scans them in reverse, so an overlapping top card wins.
Only the stock top, waste top and foundation tops are rendered in the upper
row; every tableau card is represented. Empty piles retain target rectangles.

Transient selection records a logical source and derived card ID, never old
coordinates. Resizing cannot change the selected logical cards. Accepted engine
moves clear selection; rejected moves do not modify it.

The board dispatches `DrawStock`, `RecycleWaste`, `TableauToTableau`,
`TableauToFoundation`, `WasteToTableau`, `WasteToFoundation` and
`FoundationToTableau`. It does not duplicate placement, sequence, recycling or
victory rules. `loadState` forwards to validated `Game::loadState`; corrupt
controlled states are rejected without changing the existing board.

## Layout and rendering

The window minimum is 760 x 600 logical pixels. The board minimum width is 720;
card widths range from about 87 to 140 logical pixels, with a 1:1.4 aspect ratio.
The upper row contains stock, waste, a spacer and four fixed-suit foundations.
The seven tableau columns share the same horizontal slots.

Tableau fans compress to fit vertically. Lower bounds preserve exposed label
space for face-up cards and a visible strip for face-down cards. If a column
cannot fit at those bounds, the board grows within a native scroll area.
Vertical scrolling keeps the deepest cards reachable rather than clipping them
or shrinking labels indefinitely.

QPainter draws generated card faces, suit/rank text, rounded outlines, geometric
backs and empty slots. An optional cached personal image replaces hidden-card
backs. There are no bundled image resources, fonts or graphics frameworks.
Unicode suits use the system font; C/D/H/S are fallback labels when
that font lacks a suit glyph. Qt handles logical coordinates and HiDPI scaling.

## Accessibility and deferred work

The board has an accessible name/description, click focus and a visible focus
border. Selection uses a dashed enclosing border, not color alone. Suit/rank
text distinguishes cards independently of red/black color. Native actions have
meaningful labels and keyboard shortcuts; Escape cancels selection.

Full keyboard card navigation, per-card screen-reader semantics, drag-and-drop,
broader preferences and packaging remain deferred. The custom-painted
board is not yet a complete screen-reader-accessible card interface.

## Validation scope

Native tests cover state-to-layout mapping, exposed-card hit testing, empty
targets, deep fan limits, representative sizes, source selection, every move
dispatch kind, engine rejection, undo, new games, win feedback and scrolling.
The engine and its Phase 2 test sources remain unchanged.
