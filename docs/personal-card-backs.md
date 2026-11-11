# Personal card backs

Open **Game > Card Back > Custom Card Backs...** to choose a mode:

- **Default Cardsy Back:** the original generated pattern. Selecting Default
  keeps both the single image and collection in private storage.
- **Single Image:** choose or replace one PNG/JPEG for every face-down card.
  Remove Image deletes only that private single-image copy.
- **Random Image Collection:** add images to a collection, without selecting
  ranks, suits or destination cards. Images are randomly assigned at the start
  of a game and stay fixed throughout that game.

The selected mode, single image and collection survive application restarts.
**Choose Photo...** (normally Ctrl+O on Linux) remains a shortcut for choosing
the single image and selecting Single Image mode. **Use Default Card Back**
selects Default without deleting stored images.

## Import and collection management

Choose **Add Images...**, select several files in the same file chooser using
the platform's multiple-selection controls, then confirm. Cardsy validates each
file and shows one summary of imported files, skipped duplicates and failures,
with details for up to five failures. Valid imports survive failures elsewhere
in the batch. A progress dialog allows canceling remaining work between files;
already completed imports remain. Canceling the file chooser changes nothing,
including the mode.

The scrollable thumbnail collection supports keyboard navigation and multiple
selection. **Remove Selected** removes only those managed collection items.
**Clear Collection...** requires confirmation and leaves the single image,
source files, current game and unrelated user files untouched.

Add Folder is deferred. Multi-file selection is supported; directories are not
scanned recursively or automatically.

## Randomization and active games

Cardsy establishes one complete temporary mapping for all 52 card identities at
startup and after each successful **New Game**. This uses a separate Qt random
generator, not the engine's deck shuffle or shuffle seed.

- No usable images: use the original built-in back.
- One usable image: use it on all 52 cards.
- 2-51 usable images: repeat images as evenly as possible. Frequencies differ by
  at most one; both the pool and final assignments are shuffled.
- Exactly 52 usable images: use every image once.
- More than 52 usable images: randomly select 52 distinct images and use each
  once. A later game may choose a different subset.

Missing or corrupt collection items are marked Unavailable in the manager and
excluded from new-game pools. Distribution uses the number of usable images.
Random selection is not guaranteed to look different on every deal.

The same card retains its assigned image through movement, stock recycling,
undo, repaint, resizing, theme/display changes, and opening/closing settings.
Neither painting nor the first display of a card chooses an image.

**Active-game policy: retained decoded images (Option B).** Adding, removing or
clearing collection items updates storage for the next new game. The active
game retains shared decoded pixels, even after its managed file is removed or
externally corrupted. Adding images during a game that began with an empty
collection does not fill that game's assignments: start New Game to use them.
Switching modes changes the displayed style immediately; switching back to
Random Image Collection reuses the same current-game mapping.

No active game is saved across application restarts. Launching Cardsy starts a
new deal and creates a new mapping. There is no separate restart/redeal command.
Recycling the waste is an ordinary move and does not regenerate assignments.
New Game clears undo history; undo cannot cross a deal boundary.

Fallback order is strictly mode-specific:

- Default: built-in pattern.
- Single Image: valid single image, otherwise built-in pattern.
- Random Image Collection: current game's assigned decoded image, otherwise
  built-in pattern (not the single image).

Custom backs never change faces, hidden-card state, rules, card order, scoring,
selection or undo history.

## Victory picture

After an engine-confirmed win, the cards cascade and then assemble into one
enlarged picture, with a different image region on each card. Single Image uses
that configured photo; Random Image Collection chooses exactly one currently
valid configured picture for the whole celebration. Default mode, an empty
collection or all-unavailable files produces a cascade only. Selection happens
once per celebration, independently of the current game's card-back mapping.
The final arrangement stays until New Game; Undo remains available as before.
See [victory lifecycle and rendering](board-interaction.md#victory-cascade-and-picture-mosaic).

The stored, orientation-normalized 600-by-840 card-back picture is the source,
not the original external file. Any crop already applied during import remains;
the original image is never modified. The complete mosaic uses a further
aspect-preserving centered aspect-fill crop when necessary to fit its grid.
Enlargement of small or normalized pictures can look soft.

## Image policy and duplicate detection

Only content decoded as PNG or JPEG by the installed Qt reader is accepted.
File filters reflect that installed PNG/JPEG support. Extensions alone are not
trusted; GIF/BMP and other formats remain outside the existing policy.
No new libraries, Qt modules, codecs or packaging requirements are added.

Existing safety limits are unchanged:

- At most 20 MiB encoded data.
- At most 8192 pixels on either side and 16,777,216 pixels overall.
- Qt image allocation limit at most 64 MiB.
- Bounded reads, dimension inspection before decoding, and end-marker checks.
- Scaled decoding requests a longest edge of at most 2048 pixels.

These are resource bounds, not a decoder sandbox or a wall-clock timeout.
Each file is processed synchronously; progress and cancellation happen between
files. Decoding may briefly pause the UI on a slower machine.

Qt honors supported orientation metadata. Normalization preserves aspect ratio,
center-crops to cover the 5:7 card shape and flattens transparency onto white.
The private image is an opaque 600 x 840 PNG. Source text/EXIF metadata is not
copied. This is not a forensic metadata-erasure or secure-deletion guarantee.
Images smaller than 600 x 840 may look soft.

**Duplicate policy:** skip identical normalized pixel content. A SHA-256 digest
of canonical RGBA pixels is the stable item ID. Different source filenames with
identical normalized pixels are duplicates, including images that become
identical after cropping/flattening. Reimporting a source does not add selection
weight. The same filename with different normalized content creates a distinct
item and cannot overwrite its predecessor.

## Private storage and migration

`QStandardPaths::AppDataLocation` determines writable per-user storage. The
application ID is `io.github.gnujason.cardsy`; Qt honors `XDG_DATA_HOME`. Default
Linux layout:

```text
~/.local/share/io.github.gnujason.cardsy/
  card-back.png
  card-back-collection.json
  back-collection/<sha256>.png
```

The versioned JSON manifest stores an explicit mode, ordered image IDs, and a
legacy-migration completion flag. It contains no card identities, source names,
source paths, per-game image mapping or shuffle seed. Image order is retained
for display, not used as a permanent association with deck order.

The existing single-image loader and development-namespace migration remain in
place; see [desktop identity](desktop-installation.md#user-data-and-development-migration).
The JSON mode, not the presence of the single PNG, now determines the displayed
style.

On first collection initialization, Cardsy reads only the known 52 legacy
`card-backs/<rank-and-suit>.png` paths, validates and copies valid images into the
collection, and deduplicates normalized content. Available legacy images select
Random Image Collection; a universal image alone preserves Single Image mode;
otherwise Default is retained. The universal image is preserved separately.

Successful migration is recorded atomically and is not repeated on subsequent
launches. Legacy files are retained as recovery copies, not used as active
rank/suit preferences. Incomplete migration imports what it safely can, reports
a warning, preserves all old files, and retries on a later launch without
duplicating existing content. Do not remove recovery copies while migration is
incomplete.

Managed PNGs and the manifest use `QSaveFile` with direct-write fallback disabled
and owner-readable/writable permissions. Newly created private directories are
owner-only. Existing directory permissions are respected. Images are committed
before their records; failed manifest saves remove only the newly created image.
Removal commits the updated manifest before deleting only its selected known
regular managed files. Cleanup failures are reported explicitly.

Managed directory/file symlinks are refused. IDs are validated before forming
paths. Unknown files, legacy recovery files and original source images are never
deleted by collection removal. Invalid/unreadable manifests block writes rather
than being silently overwritten. A crash or failed cleanup may leave an
unreferenced image; it is not automatically deleted or overwritten. Concurrent
editing by multiple application instances is not synchronized.

## Cache and privacy

The collection retains small 60 x 84 thumbnails (about 20 KiB per item), not a
full decoded cache for arbitrarily large collections. At a game boundary only
the selected pool (at most 52 images) is retained at full size. Each 600 x 840
RGB32 image uses about 1.92 MiB, so 52 use about 100 MiB. Qt implicit sharing
means repeated assignments share decoded data rather than allocating 52 copies.
The single image adds about 1.92 MiB when configured. Dialog icons have a small
additional, collection-sized cost.

Old game images are released before generating the next pool. Removing
collection items releases thumbnails and watch entries; active images live
until the next game. `QFileSystemWatcher` refreshes changed thumbnails outside
painting. Restart revalidates the collection if filesystem notifications are
unavailable. The shared painting helper still provides smooth scaling, rounded
clipping and the original pattern. Ordinary painting never reads files.

Cardsy does not upload images, fetch URLs or store photos in the repository or
installation. Import summaries show basenames, not full source paths. The
operating system chooser may maintain its own history. No encryption,
sandboxing or guaranteed deletion is claimed.

Tests generate synthetic images in temporary directories, not personal photos
or tracked binary fixtures. Project licensing is described in
[license scope](../LICENSING.md), independently of user image rights.

## Validation and native-desktop checklist

The normal CMake/CTest workflow includes the adapted historical test targets
`IndividualCardBacksTest`, `IndividualBackRenderingTest` and `CardBackDialogTest`.
They now test collection persistence, normalized duplicates, migration,
distribution, active-game stability, cached repainting, unchanged faces and
game state, multi-file chooser/cancel/summary behavior, confirmed clear,
mode controls, image-count messages and smaller-window layouts. Existing image
validation and gameplay tests remain.

With a disposable user-data profile on each target desktop:

- Launch, draw/recycle, move/flip cards and undo normally.
- Test Default and Single Image; select Default without deleting the single.
- Select several synthetic images at once; inspect summary, count and thumbnails.
- Test 1, fewer than 52, exactly 52 and more than 52 collection images.
- Start New Game; observe fixed backs through movement, undo, repaint and resize.
- Add/remove/clear while playing; verify current backs stay and the next game
  reflects changes. Cancel clear and verify no changes.
- Relaunch; verify collection/mode persistence and a new deal.
- Test missing/corrupt copies and migration using disposable legacy fixtures.
- Check keyboard selection, scrolling, larger fonts, 2x scaling and performance.

Native Wayland/X11 and openSUSE Leap visual QA are distinct from offscreen
automated tests; do not claim those passed solely from automated coverage.
