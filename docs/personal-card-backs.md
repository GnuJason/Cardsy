# Personal card backs

Game > Card Back > Choose Photo... (normally Ctrl+O on Linux) opens a local Qt
file picker. Choose one PNG or JPEG image; every hidden card uses it.
Game > Card Back > Use Default Card Back restores the generated native pattern.
Canceling the picker changes nothing. Failed selections report a concise status
message and retain the current back.

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

One decoded image is cached outside painting. Painting reuses it with smooth
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
