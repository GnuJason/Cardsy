# Cardsy upstream release preflight

Cardsy remains development toward 1.0.0 (`1.0.0-dev`), not a released 1.0.
Feature scope is closed. Packaging, publication and release tagging require
separate authorization after the readiness gates below.

## Source provenance and inclusion

| Category | Provenance and license | Installed | Source snapshot |
|---|---|---|---|
| C++/headers, CMake, Qt resource definitions | Cardsy native implementation; GPL-3.0-or-later | Compiled executable; no development headers/libraries | Yes |
| Tests and synthetic-image helpers | Cardsy-authored native regressions; GPL-3.0-or-later | No | Yes |
| README, docs and icon-provenance prose | Cardsy-authored documentation; GPL-3.0-or-later | No | Yes |
| Icon SVG | Original Cardsy geometric artwork; CC0-1.0 | Yes | Yes |
| Three icon PNGs | Intentionally tracked renditions of that SVG; CC0-1.0 | Yes, also embedded | Yes |
| Desktop/metainfo templates | Cardsy-authored; CC0-1.0 | Generated metadata | Yes |
| COPYING | Official FSF GPLv3 document, verbatim-copy terms; project grant is GPL-3.0-or-later | Yes | Yes |
| ASSET-LICENSE and LICENSING.md | Independent CC0 dedication and project scope declaration | Asset dedication only | Yes |
| .gitignore | Development hygiene policy; GPL-3.0-or-later | No | Yes |

No copied/vendored libraries, binary libraries, downloaded source, embedded
fonts or web runtime belong in this source tree. Qt-generated moc/resource
support is produced by the system build tools, not tracked third-party source.
Tests and relevant development documentation are legitimate upstream source,
even though they are not installed.

Export only the reviewed sanitized source tree. Include COPYING, LICENSING.md,
source, headers, CMake, resources, metadata templates, artwork, tests and docs.
Exclude Git internals, ignored files, build outputs, logs, editor/session state,
temporary probes and all user-generated images/preferences.

Use a predictable temporary top-level name such as
`Cardsy-1.0.0-preflight/`. It is a local validation snapshot, not a published
release artifact. Build both a clean source export and a separately extracted
archive with networking unavailable and the original checkout inaccessible.
Configure, build, run CTest and stage installation from each.

## System dependencies and validation

Use a C++17 compiler, CMake >= 3.21 and a normal build tool. Qt >= 6.2 Widgets
provides the Core/Gui/Widgets build/runtime closure; tests additionally need Qt
Test. PNG/JPEG readers and the desktop's platform integration come from system
Qt and system codec libraries, never vendored replacements.

Verify actual RPM ownership/capabilities on Tumbleweed rather than guessing
package names. Verify Factory source records independently, and mark target
build-root capabilities or architectures not checked as VERIFY IN FACTORY.
Do not add repositories or install undeclared dependencies during validation.

Keep the normal install-path/RPATH audit strict. ASan/UBSan runtime tests are
separate from that distribution assertion because instrumentation can retain
diagnostic source locations; see [the install contract](desktop-installation.md).
Do not claim instrumentation is the release payload.

Revalidate the desktop entry, selected GPL project license, independent CC0
metadata license and icon identity. Do not fabricate release history to silence
the development metainfo's missing-release-information notice.

## Installation boundary

The [nine-file payload](desktop-installation.md#installation-contract) consists
only of application files, metadata, artwork and licenses.
Simulated uninstall removes only the explicitly reviewed staged root. Verify
that source and a separate synthetic user profile survive unchanged.

Future package uninstall must not remove
`~/.local/share/io.github.gnujason.cardsy/card-back.png` or other user data.
That data is user-owned, not package-owned. Owner-only storage and atomic
replacement remain required; no encryption or secure deletion is claimed.

## Pending gates

- Dedicated Tumbleweed QA: PENDING until actual findings are supplied.
  Use a fresh sanitized clone and only synthetic/non-sensitive images, following
  [the handoff](tumbleweed-qa.md).
- GitHub server-side cached/unreachable-object privacy follow-up: PENDING unless
  separately confirmed. It is distinct from clean reachable source history.
- Confirm Factory build-root capabilities and final dependency policy.
- Review the actual source revision and release/source-verification process
  before any release or packaging work.

## Future source verification recommendation

For a genuine reviewed release, use an annotated OpenPGP-signed Git tag and a
detached OpenPGP signature over the exact source tarball supplied downstream.
Also provide SHA-256 checksums, authenticated by a signature if distributed
separately. A checksum alone does not authenticate the publisher.

Publish the signing public key/fingerprint through the authoritative upstream,
document key rotation and verify signatures before downstream use. A signed
tag authenticates its Git object; it does not automatically sign every
independently generated archive. Rebuild/test the exact signed archive before
publication. See [Git's signing documentation](https://git-scm.com/book/en/v2/Git-Tools-Signing-Your-Work).

This is a recommendation only: no keys, signatures, tags or releases are created.
Later reproducibility work can pin archive compression options, timestamps and
ordering. Do not claim bit-for-bit reproducibility for these development builds.

## Undated future release-notes outline

- Native Klondike with click, drag, keyboard operation, Undo and New Game.
- One local persistent card back; original image preservation and explicit limits.
- Offline operation and system Qt requirements.
- Stable application ID, icon and desktop integration.
- GPL-3.0-or-later software and independent CC0 artwork/metadata.
- Tested accessibility baseline and known limitations, not complete screen-reader support.
- Actual clean-machine findings and installation guidance once verified.

This outline is not release history and does not announce availability in Factory
or on untested platforms.
