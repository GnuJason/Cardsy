# Desktop identity and upstream installation

## Identity and development status

The application ID is `io.github.gnujason.cardsy`, shared by the desktop filename,
metainfo ID, icon name and Qt desktop-file identity. It uses the confirmed GitHub
upstream owner and all-lowercase segments, following the
[AppStream ID convention](https://www.freedesktop.org/software/appstream/docs/chap-Metadata.html#tag-id-generic).
The scoped identifier search found no matching existing component. This is not
a trademark clearance claim; unrelated projects can share the human-readable name.

The authoritative target version is `project(Cardsy VERSION ...)` in CMake.
Runtime version is generated as that version plus `-dev`: currently
`Cardsy 1.0.0-dev`. There is no public 1.0.0 release and no invented release date
or release history in metainfo.

Qt metadata is initialized centrally:

| Field | Value |
|---|---|
| Application name | `io.github.gnujason.cardsy` |
| Display/window name | `Cardsy` |
| Organization name | Empty intentionally, avoiding a duplicate path segment |
| Organization domain | `gnujason.github.io` |
| Desktop file name | `io.github.gnujason.cardsy` |
| Homepage | `https://github.com/GnuJason/Cardsy` |

`--version` and `--help` use a QCoreApplication-only path and work without a
display or Qt GUI platform plugin. With no arguments, Cardsy still opens its
normal graphical window. No terminal gameplay interface is provided.

## User data and development migration

Qt `AppDataLocation` now naturally uses the application ID. The default Linux
managed image is:

```text
~/.local/share/io.github.gnujason.cardsy/card-back.png
```

`XDG_DATA_HOME` and other platform-native path rules remain honored. QSettings is
not used: the valid managed PNG itself remains the sole personalization setting.

On the first use of an absent canonical data directory, Cardsy checks only the
former Cardsy-managed development file at `Cardsy/Cardsy/card-back.png` beneath
the native data base. It validates that normalized PNG, writes the canonical
copy atomically with owner-only permissions, then removes only the old managed
file. It never follows a final legacy symlink or touches the original photo.

An existing canonical directory takes priority, even when empty. This means
Use Default cannot resurrect an old copy if cleanup previously failed.
Reset creates that directory if necessary and removes only the canonical PNG.

Failed migration leaves the old copy untouched, uses the default and reports a
nonmodal warning. If automatic retry is no longer applicable after a partial
storage failure, Choose Photo can explicitly import the retained managed image
after the storage issue is corrected. No general migration framework is added.
The development migration is tested on Linux; future platform releases need their
own native-path QA.

## Installation contract

Linux installation uses GNUInstallDirs and prefix-relative destinations:

```text
bin/cardsy
share/applications/io.github.gnujason.cardsy.desktop
share/metainfo/io.github.gnujason.cardsy.metainfo.xml
share/icons/hicolor/{16x16,48x48,256x256}/apps/io.github.gnujason.cardsy.png
share/icons/hicolor/scalable/apps/io.github.gnujason.cardsy.svg
share/licenses/io.github.gnujason.cardsy/ASSET-LICENSE
share/licenses/io.github.gnujason.cardsy/COPYING
```

The executable always installs; Linux desktop metadata/icon-theme files are
Linux-specific. No tests, headers, libraries, build metadata or user data install.
Static PNG resources provide the window icon without QtSvg or icon-theme paths.

Safe staging:

```sh
stage="$(mktemp -d)"
DESTDIR="$stage" cmake --install build --prefix /usr
"$stage/usr/bin/cardsy" --version
"$stage/usr/bin/cardsy"
```

A direct custom prefix also works:

```sh
cmake --install build --prefix "$HOME/.local"
```

No sudo or global launcher-cache updates are needed for upstream staging.
`Exec=cardsy` relies on the normal installed PATH; for staging, prepend the
staged `bin` and use a temporary XDG environment.

Uninstallation belongs to the selected installer/package manager. For a test
stage, remove only that reviewed temporary directory. Never blindly apply a
DESTDIR install manifest to the host root. Removing application files must not
remove per-user customization.

GCC/Clang file-prefix maps make Cardsy-owned source/debug paths reproducible
without manually stripping the executable. System startup objects may contain
their distribution build locations; these are not Cardsy RPATHs or private
developer dependencies.
Sanitizer instrumentation can intentionally retain additional source locations
for diagnostics. Those debug binaries are not the distribution payload: normal
staged-install path inspection is separate from the applicable sanitizer
runtime/migration suites.

## Licensing and metadata validation

The software's owner-selected license is GPL-3.0-or-later, with the official
text in [COPYING](../COPYING) and explicit [scope](../LICENSING.md).
Metainfo `project_license` accurately reports that expression. Original icon
artwork, desktop metadata and AppStream metadata independently remain CC0-1.0
under [ASSET-LICENSE](../data/ASSET-LICENSE).

The exact Linux payload is now nine files: the Phase 7 executable, desktop,
metainfo, four icons and asset dedication, plus the official GPL COPYING file.

Use the system validators:

```sh
desktop-file-validate build/io.github.gnujason.cardsy.desktop
appstreamcli validate --no-net --pedantic build/io.github.gnujason.cardsy.metainfo.xml
```

The development metainfo has no release history; report any corresponding
pedantic hint rather than inventing a public release. Validator success does
not establish Factory submission readiness or replace dedicated-machine QA.
No RPM, OBS configuration or release archive is produced by this installation work.
