# Keyboard and accessibility scope

Cardsy supports a complete keyboard path through its existing Klondike moves.
See [board controls](board-interaction.md#keyboard-navigation) for the navigation
map. Pointer click and drag remain available; the engine is unchanged.

## Logical focus

Focus is a pile type/index plus a stable card identity for tableau items, not a
rectangle or pointer into a vector. It is separate from move selection and drag
state. Current geometry is resolved through BoardLayout. New Game returns focus
to Stock; mutations/Undo reconcile it against the engine's current state.

One board widget is a Qt tab stop. Arrows navigate its logical items, Enter or
Space activates, and Escape cancels selection/drag without changing focus or
game state. Tab/Shift+Tab retain Qt's normal behavior; this is not a custom tab
trap. All five movement intents, stock/recycling and the winning move are
available without pointer input.

The black/white double focus outline is distinct from the dark-backed gold
dashed move-selection outline and pale dashed drag-destination outline. Suit
names/symbols and ranks do not depend on red/black color alone. System font
families and Qt logical coordinates remain in use; minimum-size and 2x rendering
are tested. There is no bundled font or new high-contrast theme.

## Victory motion

The victory sequence preserves the status-bar win message and never takes
keyboard focus. Gameplay activation is temporarily disabled while cards
celebrate; New Game, Undo, Quit and the normal Qt menu/Tab paths remain available.
If the platform style disables Qt's `SH_Widget_Animate` hint, the final picture
is revealed immediately without the cascade or flips. Cardsy has no separate
motion preference. Desktop reduced-motion propagation through the installed
Qt platform style remains platform-dependent and is not certified here.

## What Qt accessibility exposes

A plain custom-painted QWidget does not automatically expose painted cards as
accessible children. Cardsy adds a small QAccessibleWidget adapter:

- Role: one focusable Grouping, named "Klondike Solitaire board".
- Value: the current logical item's description.
- Description: navigation instructions, focused location, selected source and
  current game feedback.
- Native Press action: activates the focused item through the same shared
  selection/move path as Enter/Space.
- Native QWidget focus state and ordinary focus action support.

Navigating exposes Stock/Waste, named suit foundations and numbered tableau
columns. Visible cards include rank, suit, face-up state and sequence context.
Hidden-card counts/visibility can be described, but hidden ranks/suits are never
revealed. Top-row piles always describe their accessible top, not buried cards.

Logical focus changes request Qt focus/value notifications. Accessible metadata
is updated only when context changes, not on every paint or pointer hover.
Qt-owned accessible interfaces follow QWidget lifetime; destruction is tested.
Menus use native Qt accessibility. Status-bar description mirrors persistent
status text, including illegal moves and image-selection errors without source
paths. No speech library or OS-specific accessibility API is used.

## Tested versus deferred

**Tested:** direct QAccessible queries for role, name, descriptions, value,
focusability/focus state, activation, menu labels, status errors and object
lifetime. Keyboard behavioral tests cover every required input/move path,
scrolling, state mutations, shortcuts and pointer interoperability.

**Not claimed:** Orca or other end-to-end screen-reader validation. No runnable
Orca executable was found; no external screen reader was tested or installed.
Qt event delivery/announcement ordering through a real assistive-technology
bridge remains unverified.

**Deferred:** a virtual per-card/per-pile child tree, independently queryable
focused/selected states for those children, and richer screen-reader
announcements. That tree would need stable virtual-interface lifetime and
child/focus mapping across moves, Undo and new deals. This phase deliberately
keeps one Qt-owned board interface with useful navigable context rather than
introducing that additional object graph.

This is a meaningful keyboard/accessibility baseline, not complete
screen-reader accessibility or a compliance certification. Specialized
high-contrast and touch-navigation modes are not implemented.
