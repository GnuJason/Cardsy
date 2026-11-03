# Native Klondike behavior and traceability

## Engine contract

The `cardsy-engine` C++17 static library has no Qt, GUI, filesystem or networking
dependency. The GUI target links it but does not yet invoke it. Qt Test is only a
test harness. There are no game assets or third-party engine dependencies.

- `Card` has typed suit, rank and visibility. `CardId` is derived from suit and
  rank: Clubs A-K = 0-12, Diamonds = 13-25, Hearts = 26-38, Spades = 39-51.
  Visibility never changes identity. Do not use an ID from an invalid card.
- `Deck` is an array of 52 cards; creation, shuffling and dealing are separate.
  `dealKlondike` rejects invalid/duplicate cards and invalid configurations.
  It deals contiguous groups of 1-7 cards in input order, as the old engine did,
  and normalizes visibility. Remaining cards retain their input order in stock.
- Piles are ordered bottom-to-top: `back()` is the accessible top. A draw pops
  stock cards one by one and appends them face up to waste. In draw-three mode,
  the third card drawn is the new waste top; only the waste top can be played.
  A final draw may contain fewer than three cards. An empty draw fails.
- Recycling is a separate intent, permitted only with empty stock and nonempty
  waste. It reverses waste into face-down stock, so the oldest remaining waste
  card is drawn first next pass. Configuration defaults to draw-one and unlimited
  recycling. `allowRecycle = false` disables recycling; there are no pass limits
  or score penalties in this phase.
- Foundation slots are fixed in native Suit order: Clubs, Diamonds, Hearts,
  Spades. Callers must target the correct slot, including for an Ace.
- Every nonempty tableau has a hidden prefix followed by a face-up descending
  alternating-color run. Hidden-prefix ranks/colors are unconstrained. Only
  kings or king-led runs enter empty columns. Moving a tableau suffix/top card
  exposes the newly uncovered top automatically.
- Foundations contain face-up Ace-through-current-rank cards of their fixed
  suit. Only a tableau top or waste top can enter a foundation. A foundation top
  may return to a legal tableau target, even after a win.
- `Game::state()` is read-only. Typed `Move` alternatives encode game intent,
  not clicks, positions or automatic destination selection. Pile/card indices
  are zero-based and bounds-checked before access. `apply` returns a typed
  `MoveResult` error without changing state or history on failure.
- `Game::loadState` is a validated replacement API for controlled games and
  future adapters. It rejects corruption without repair, preserving both current
  state and history. Successful replacement clears history.
- `Game::newGame` accepts configuration and optionally an explicit seed.
  Successful new games clear history. Rejected configuration changes neither
  state nor history. The seed remains in state across moves and undo.
- `undo` restores the complete pre-move value, including all cards, ordering,
  visibility, configuration, status and optional seed. History has no arbitrary
  100-move truncation in this phase. Its memory use grows with successful moves.
- Victory is derived from all 52 correctly placed foundation cards and a valid
  board, not a stored counter/status flag. `isWon` ignores stored status;
  `validate` additionally checks that stored status agrees with the board.
- Ordinary rule failures use error values, not exceptions. Standard-library
  allocation failures and system entropy failures are not suppressed.
  Unseeded new games use a local `std::random_device`, not global RNG state.

## Deterministic shuffle

The native shuffle is Fisher-Yates using a locally seeded `std::mt19937`.
Bounded indices use explicitly defined 32-bit rejection sampling followed by
modulo, rather than `std::shuffle`/`std::uniform_int_distribution`, whose mapping
may vary between standard-library implementations.

For each remaining length `n`, reject samples below `(-n mod 2^32) mod n`;
swap index `n-1` with `sample mod n`. The initial deck is native suit order,
Ace through King. A full fixed-seed permutation regression test pins this
contract. It was independently calculated during implementation.

This intentionally does **not** reproduce historical TypeScript PRNG sequences
or historical suit-order IDs. No cross-language deal compatibility is claimed.

## Invariants

`validate` returns typed issues and human-readable diagnostics; it never mutates
or repairs state. It checks:

- Valid draw configuration, card suits and ranks.
- Exactly 52 cards, every logical card present once; no duplicates or omissions.
- Face-down stock and face-up waste.
- Structurally valid hidden-prefix/face-up-run tableau piles.
- Correct suit slot, face-up state and gap-free ascending foundations.
- Valid game status and agreement between status and physical victory.

Array types fix the number of tableau and foundation slots. Normal moves operate
only on engine-owned valid states; successful transitions are validated before
being committed. Derived IDs cannot drift independently of suit/rank.

## Historical behavioral traceability

Reference: local `archive/grandmagames-web` at
`f6023745bac9f4354ed3c44e88ef50bbbd255739`, inspected with `git show`.
No historical source or assets were restored.

The five old suites were `deck.test.ts`, `draw3.test.ts`, `moves.test.ts`,
`rules.test.ts` and `scoring.test.ts` under `packages/card-engine/tests/`.
The React reducer in `apps/web/src/hooks/useGameState.ts` supplied undo/new-game
context. Classification covers behavioral groups rather than matching test counts.

| Old behavioral area | Native status | Native evidence / decision |
|---|---|---|
| 52-card deck, suits, uniqueness, initial visibility | PORTED | `CardDeckTest`: every ID, suit count, visibility and stable identity |
| Shuffle preserves input/cards and repeats a seed | PORTED | `CardDeckTest`: conservation, input immutability and repeatability |
| Historical PRNG and string card IDs | SUPERSEDED | Explicit native shuffle vector and typed, derived IDs |
| Deal shape, visibility, 24-card stock and conservation | PORTED | `DealTest`: exact input order, all piles and invariants |
| New-game layout and seed | PORTED | `DealTest`: seeded/unseeded games, configuration and history reset |
| Draw-one, draw-three, partial draws and order | PORTED | `StockWasteTest`: sizes, top order, exposure and empty-source rejection |
| Recycling order/visibility and repeated recycling | PORTED | `StockWasteTest`: full repeated passes and a removed waste card |
| Recycling score unchanged | NOT APPLICABLE | No score exists in the Phase 2 model; recycling has no penalty |
| Pure-function original-state nonmutation | SUPERSEDED | Read-only owned state, candidate transitions and atomic error tests |
| Waste-to-tableau/foundation | PORTED | `StockWasteTest`, `FoundationRulesTest`, `UndoTest` |
| Tableau single/run movement and automatic reveal | PORTED | `TableauRulesTest`, `UndoTest`: suffix ordering and exact reveal restoration |
| Alternating descent, kings on empty, invalid runs | PORTED | `TableauRulesTest`: required positive/negative cases and safe indices |
| Foundation Ace/start, same-suit ascent, invalid rank/suit | PORTED | `FoundationRulesTest`, controlled full game in `WinTest` |
| Foundation-to-tableau (previously unexposed in UI) | PORTED | `FoundationRulesTest`, `WinTest`, `UndoTest` |
| Victory based only on foundation lengths | BUGGY OLD BEHAVIOR | `WinTest`: malformed full foundations and duplicate cards cannot win |
| Clone losing optional shuffle seed | BUGGY OLD BEHAVIOR | Full value snapshots and complete-state equality assertions |
| Undo penalizing score/retaining time instead of exact state | SUPERSEDED | Exact logical-state restoration; score/time are outside this phase |
| Arbitrary 100-entry undo truncation | SUPERSEDED | `UndoTest` restores more than 100 successful actions |
| Unchecked indices / malformed target acceptance | BUGGY OLD BEHAVIOR | Bounds checks, full foundation validation and validated state replacement |
| Foundation-first `findBestMove` click policy | NOT APPLICABLE | Explicit typed target intent; no automatic click destination |
| `hasAnyMoves` and no-moves status | DEFERRED | No hint/stalemate API required; recycling availability is not proof of progress |
| `canAutoComplete` / `autoCompleteStep` | DEFERRED | No auto-completion in Phase 2; foundation transitions are tested directly |
| Move scoring and undo penalty | DEFERRED | Not required by this contract |
| Timer bonus and its zero/negative boundaries | DEFERRED | No timer or score policy introduced |

## Native test organization

- `CardDeckTest`: card model, deck and native shuffle regression.
- `DealTest`: deal, configuration, seeded/unseeded new games and invalid decks.
- `TableauRulesTest`: placement, sequences, reveal and invalid requests.
- `FoundationRulesTest`: ascent, rejection, malformed targets and returns.
- `StockWasteTest`: draw/recycle ordering, exhaustion and configuration.
- `UndoTest`: every move kind, rejected operations and history lifetime.
- `GameStateInvariantTest`: corrupt-state diagnostics and seeded transition/undo
  sequences (12 seeds, up to 100 successful moves per seed).
- `WinTest`: controlled full victory, invalid arrangements and win/undo transitions.

Tests use full 52-card states, not partial boards mistaken for valid games.
The existing GUI smoke test remains separate and unchanged. Licensing remains
unresolved; this work does not authorize distribution or release.
