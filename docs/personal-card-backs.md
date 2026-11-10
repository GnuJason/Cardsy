# Personal card backs

Game > Card Back > Choose Photo... (normally Ctrl+O on Linux) opens a local Qt
file picker. Choose one PNG or JPEG image as the universal back for hidden cards
without individual overrides.
Game > Card Back > Use Default Card Back restores the generated native pattern.
Canceling the picker changes nothing. Failed selections report a concise status
message and retain the current back.

## Individual images for all 52 cards

Open **Game > Card Back > Custom Card Backs...**. The nonmodal manager has one
tab per suit and thirteen entries per tab. Select an entry with the mouse or
keyboard, then use **Choose Image...** or **Replace Image...**. The thumbnail
and larger selected-card preview update immediately. Entries show Custom,
Default, or Unavailable; failures are reported inside the manager.

- **Reset This Card** removes only the selected assignment.
- **Reset This Suit** asks before removing that suit's thirteen assignments.
- **Reset All Card Backs** gives an explicit irreversible-reset warning before
  removing all individual assignments.
- Canceling the chooser or either confirmation changes nothing.

The original source images, universal back, current game, undo history and other
user data are untouched by these resets. Resetting the universal photo through
**Use Default Card Back** does not remove individual overrides.

An unassigned or unavailable individual image uses the existing universal back:
the original generated pattern unless a universal photo is configured. To
restore the original pattern everywhere, reset all individual backs and use
**Use Default Card Back**.

PNG and JPEG are supported when their Qt readers are installed. File contents,
not extensions, determine validity. The same bounded validation, orientation,
normalization and rounded clipping described below apply to individual images.
No new libraries, Qt modules, codecs or packages are required. Tiny images may
look soft after normalization; images of at least 600 x 840 are recommended.
There is no background import queue: a single selection is processed
synchronously with the existing input and allocation limits.

Personalization never replaces the board or touches `cardsy-engine`. The current
deal, seed, selection and undo history are unchanged. Undo only affects game
moves; New Game retains personalization.

## Image policy

Only content decoded as PNG or JPEG by the installed Qt reader is accepted.
Filename extensions are not proof of format. The installed Qt PNG/JPEG stack is
tested; other formats, including GIF/BMP, are deliberately outside this policy.
No codecs or image libraries are downloaded or bundled.

Input limits:

- At most 20 MiB encoded data.
- At most 8192 pixels on either side.
- At most 16,777,216 pixels overall.
- Qt's image allocation limit is reduced to at most 64 MiB, never disabled.

The loader checks a readable regular file, bounds the read, inspects declared
dimensions before decoding, and rejects missing PNG/JPEG end markers. Qt performs
the actual decoding. Scaled decoding requests a longest edge of at most 2048
pixels; codecs may require their full source buffer before scaling, which is why
the input dimensions/pixel count and allocation limit are also enforced.
These limits do not constitute a decoder sandbox.

Qt auto-transformation honors supported orientation metadata; a synthetic JPEG
EXIF rotation regression test verifies the installed reader's behavior.

The private representation is an opaque 600 x 840 PNG. Normalization preserves
aspect ratio, center-crops to cover the 5:7 card shape and flattens transparency
onto white. A fresh pixel image is created: source text/EXIF metadata is not
copied. Tests verify source PNG text is absent and JPEG orientation is baked in.
This is not a claim of forensic metadata erasure or secure deletion.

The universal decoded image is cached outside painting. Painting reuses it with smooth
scaling and rounded clipping; no per-card decoding or file access occurs.
Tests exercise minimum/normal/large boards and 2x rendering.

## Private storage and application identity

The centralized application ID/name is `io.github.gnujason.cardsy`, with display
name `Cardsy` and an empty organization-name path segment.

Qt `QStandardPaths::AppDataLocation` determines the per-user location. On the
current Linux setup the default is:

```text
~/.local/share/io.github.gnujason.cardsy/card-back.png
```

Qt honors the platform's data-location rules, including `XDG_DATA_HOME`.
The former development namespace has a small validated, atomic managed-copy
migration; see [desktop identity](desktop-installation.md#user-data-and-development-migration).
The original path and original bytes are not retained as configuration.
The normalized managed PNG is itself the complete persisted preference:
valid file present means custom; absent means default. There is no separate
QSettings flag, database or JSON file that could disagree with the image.

The application-private directory is created with owner-only permissions and
the PNG is saved owner-readable/writable. Managed file/directory symlinks are
rejected. Normal operation needs no privilege escalation or system-wide writes.

Replacement is transactional: validate and normalize first, then use `QSaveFile`
with direct-write fallback disabled, owner-only permissions and atomic commit.
Only after commit is the active cached image replaced. Write failures retain the
previous active image and private file; this is explicitly tested with a
read-only destination. Individual updates are atomic, not multi-instance preference
synchronization.

Reset removes only the managed PNG, then clears the cache. If removal fails,
the current customization remains active and the failure is reported. The
user-selected source is never overwritten or deleted. Selecting the managed
copy itself as a new source is rejected.

### Individual storage and cache

Strategy B (managed copies) extends the existing image-as-preference mechanism;
no separate QSettings, JSON, or database mapping is introduced. Each existing
numeric engine `CardId` maps through one canonical conversion to a readable
rank/suit key: `AC` through `KC`, `AD` through `KD`, `AH` through `KH`, and `AS`
through `KS`. Ten uses `10`; Jack, Queen and King use `J`, `Q`, `K`.
Face-up state, shuffle position and pile location do not affect the key.

Within `QStandardPaths::AppDataLocation`, individual managed copies live at
`card-backs/<key>.png`. This reserved 52-name namespace is the persisted mapping;
only these known paths are read or reset. Unknown files are ignored, never
deleted. Source names and source paths are not persisted. The existing
`card-back.png` and its development migration remain unchanged.

Each import validates first and atomically saves a private normalized PNG with
owner-only file permissions using `QSaveFile`, without direct-write fallback.
The new subdirectory is owner-only. Existing directory permissions are respected.
Failures retain the previous image and assignment. Managed directory/file
symlinks are refused. Only a selected card's known regular private file can be
removed on reset; no recursive removal, source deletion or directory cleanup
occurs. Corrupt copies remain available for explicit replacement/reset.
Suit/global resets are per-file operations, not cross-file transactions:
if one removal fails, successful removals remain applied and an explicit
partial-failure message identifies that some assignments were kept.

At most 52 normalized images are cached (about 100 MiB of decoded pixels for
a fully customized deck). Qt implicit image sharing avoids duplicating the
cache in the board. Painting uses only cached pixels, with center-cover cropping,
the same rounded clipping, border and smooth scaling as the universal back.
Face-up painting, hidden-card state and move validation are unchanged.

`QFileSystemWatcher` (already in Qt Core) notices managed-file removal,
replacement or corruption and refreshes affected entries outside painting.
Directory notifications compare metadata before decoding unchanged entries.
Failures fall back without modal gameplay interruptions; the manager shows the
unavailable state. Filesystem notifications depend on platform support; a
restart revalidates every assignment if notifications are unavailable.
Concurrent multi-instance editing is not synchronized transactionally.

Everything stays in writable per-user data, never the installation directory.
Linux/openSUSE desktop packaging and installed assets need no changes.
Bulk import is not implemented.

## Startup and privacy

A new settings object loads a valid normalized managed PNG. Missing copies
naturally mean default. Invalid/unreadable copies fall back to default with a
nonmodal status warning; removable invalid files are cleared to avoid repeated
warnings. Cleanup failures are reported without a modal loop.

Cardsy does not upload images, fetch URLs, store them in the project/install
tree, or log source paths or image contents. The operating system's file chooser
may maintain its own recent-location history. No encryption, sandboxing or
guaranteed deletion is claimed.

Tests generate synthetic images in temporary directories, including orientation
and oversized-header fixtures. No personal photographs or binary image fixtures
are committed. Project licensing is defined in
[the project license scope](../LICENSING.md), independently of user image rights.

## Validation and manual desktop checklist

The normal CMake build and CTest command include `IndividualCardBacksTest`,
`IndividualBackRenderingTest` and `CardBackDialogTest`. These cover all keys,
all 52 independent assignments, reconstruction, scoped resets, validation and
storage failures, symlinks, live file loss/corruption, cached repainting,
unchanged faces/game state, menu entry, chooser selection/cancel/error feedback,
confirmations and smaller-window layouts. Existing image-policy and gameplay
tests remain in place.

On the target Linux desktop, with a disposable user-data profile:

- Launch, start a new game, draw/recycle, move/flip cards and undo normally.
- Confirm the original default back with no assignments.
- Assign different images to two hidden cards, including a path with spaces and
  non-ASCII characters; confirm only those backs change.
- Close/relaunch, confirm persistence, then replace one image and confirm its
  thumbnail and board back change immediately.
- Reset a card, cancel/accept a suit reset, cancel/accept reset-all; confirm
  scope and universal-back preservation.
- Move an original source image; confirm the managed copy still works. Remove
  or corrupt a managed copy; confirm safe fallback without repeated dialogs.
- Test the manager at smaller sizes and larger desktop fonts/display scaling,
  keyboard navigation and a full 52-image deck; check responsiveness during
  normal gameplay. Native Wayland/X11 visual QA is distinct from offscreen tests.
