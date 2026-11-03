# Native board interaction

## Controls

- Click stock to draw. With empty stock, clicking requests waste recycling;
  the engine decides whether that request is legal.
- Click a face-up tableau card to select its suffix, the accessible waste top
  to select waste, or a foundation top to select a foundation source.
- Click a tableau or foundation destination to submit a typed engine move.
  Only a single selected tableau top has a representable foundation intent;
  selecting a longer suffix never silently moves a different top card.
- Alternatively, press a face-up tableau card/sequence, waste top or foundation
  top and drag it onto a tableau or foundation destination. Stock remains
  click-only.
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

## Drag behavior

The platform's Qt drag-distance threshold separates a click from a drag. A
stationary press or movement below that threshold completes the existing click
interaction on release. Moving stock or an empty/hidden source does not drag or
accidentally execute a stock click.

Dragging changes no cards until release. The source remains ghosted in its
original location while the card/sequence follows the pointer, preserving its
order and fan. A dashed destination outline means "attempt this pile", not
"the UI has declared this move legal". The engine accepts or rejects the same
typed intent used by click interaction.

Successful drops clear both drag and selection; Undo restores the exact prior
game state without restoring a drag. Rejected drops snap back by repainting the
unchanged state. Releasing over blank table, a gap, stock/waste, the original
pile, an unsupported destination or outside the board cancels without adding
undo history.

Pressing or dragging a different source does not alter an existing click
selection. Canceled/rejected gestures restore that previous selection (or none,
if none existed). Escape cancels both selection and dragging. Resizing, losing
focus, hiding/deactivating the board, replacing state, Undo, New Game and opening
the photo picker cancel transient pointer interaction so a later release cannot
submit a stale move.

Open/closed native hand cursors distinguish a draggable source from an active
drag. No cursor assets or animation framework are used.

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
Click and drag share one source/target-to-move translation. Drag state contains
only logical identity/indices, pointer coordinates and transient geometry; it
does not own cards or a second GameState.

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
Manual scrolling remains available. Dragging after scrolling and scrolling the
content during a drag use widget-local coordinates and fresh destination hit
testing. Edge-triggered auto-scroll is intentionally deferred. Resizing cancels
an active drag; a fresh gesture uses the new layout.

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

Full keyboard card navigation, per-card screen-reader semantics, broader
preferences and packaging remain deferred. The custom-painted
board is not yet a complete screen-reader-accessible card interface.

## Validation scope

Native tests cover state-to-layout mapping, exposed-card hit testing, empty
targets, deep fan limits, representative sizes, source selection, every move
dispatch kind, engine rejection, undo, new games, win feedback and scrolling.
Drag tests cover the native threshold, preview/cancellation, all five movement
intents, exact undo restoration, scrolling/resizing, keyboard interruptions and
unchanged personal/default backs. The 52-photo mode remains deferred.
The engine and its Phase 2 test sources remain unchanged.
