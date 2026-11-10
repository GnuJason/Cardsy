# Dedicated openSUSE Tumbleweed QA handoff

Run on the dedicated machine, not through assumed remote access. Record failures
before changing packages or source. This is local development QA, not an RPM or
Factory installation.
Use this checklist once the reviewed Phase 8 revision is available in the
checkout; the public main branch does not acquire uncommitted local work.

## 1. Environment and source

- [ ] Record Tumbleweed snapshot, architecture, desktop, Wayland/X11 and scaling.
- [ ] Required system build packages: `gcc-c++`, `cmake`, `make`,
      `qt6-widgets-devel`, `qt6-test-devel`; `qt6-wayland` for Wayland.
- [ ] Optional system validation tools: `desktop-file-utils`, `AppStream`,
      `file`, `binutils` (`readelf`). Record availability; approve installations.
- [ ] Acquire a fresh reviewed source checkout:

  ```sh
  git clone --single-branch --branch main https://github.com/GnuJason/Cardsy.git cardsy
  cd cardsy
  git rev-parse HEAD
  git status --short
  ```

- [ ] Record compiler, CMake and Qt versions. Do not add vendored libraries or
      download dependencies during the build.

## 2. Configure, build and test

```sh
cmake -S . -B build
cmake --build build
ctest --test-dir build --output-on-failure
./build/cardsy --version
./build/cardsy --help
```

- [ ] Save configure/build/test output and authoritative test totals.
- [ ] Confirm `1.0.0-dev` development status, not a released 1.0.0 claim.
- [ ] After acquiring source/packages, repeat build/tests without networking
      (disconnect network or use an already available isolation tool). Record how.
- [ ] No Node, web server, external code fetch or bundled Qt is needed.

## 3. Stage and inspect

```sh
stage="$(mktemp -d)"
DESTDIR="$stage" cmake --install build --prefix /usr
find "$stage" -type f -print | sort
file "$stage/usr/bin/cardsy"
ldd "$stage/usr/bin/cardsy"
readelf -d "$stage/usr/bin/cardsy"
"$stage/usr/bin/cardsy" --version
desktop-file-validate "$stage/usr/share/applications/io.github.gnujason.cardsy.desktop"
appstreamcli validate --no-net --pedantic \
  "$stage/usr/share/metainfo/io.github.gnujason.cardsy.metainfo.xml"
```

- [ ] Compare all nine files with [installation contract](desktop-installation.md),
      including the GPL COPYING file and separate CC0 asset dedication.
- [ ] Confirm system libraries, no build-tree RPATH and no private developer paths.
- [ ] No tests, private card back, user settings or temporary fixtures are staged.
- [ ] Record validator hints; missing development release history is not fixed by
      fabricating a release. Verify `project_license=GPL-3.0-or-later` and
      independent `metadata_license=CC0-1.0`.

## 4. Isolated desktop launch

Keep test preferences separate from real user data:
Use a disposable terminal/subshell through the gameplay checks, then close it
after cleanup to restore the normal environment.

```sh
qa="$(mktemp -d)"
mkdir -p "$qa/data" "$qa/config" "$qa/cache"
export XDG_DATA_HOME="$qa/data"
export XDG_CONFIG_HOME="$qa/config"
export XDG_CACHE_HOME="$qa/cache"
export XDG_DATA_DIRS="$stage/usr/share:/usr/local/share:/usr/share"
export PATH="$stage/usr/bin:$PATH"
"$stage/usr/bin/cardsy"
```

- [ ] Native board appears with the Cardsy title and original window icon.
- [ ] Inspect icon at small menu, normal launcher and large application sizes.
- [ ] Close normally, then test temporary desktop launch:

  ```sh
  gtk-launch io.github.gnujason.cardsy
  ```

  Use the desktop's equivalent if GTK tooling is unavailable. Do not copy launchers
  into the real profile or alter global caches.

## 5. Gameplay and personalization

- [ ] Default generated backs; stock draw/recycle and visible waste behave normally.
- [ ] Click source/target, legal/illegal moves, reveal, foundations and Undo.
- [ ] Drag a card and sequence; rejected/blank drops snap back without extra Undo.
- [ ] Keyboard-only arrows, Enter/Space, Escape, Undo and New Game.
- [ ] Deep keyboard focus scrolls into view; pointer scrolling/drag remain usable.
- [ ] Resize minimum/normal/large; test actual desktop scaling.
- [ ] Use **only a non-sensitive test image**. A copy of the original project icon
      is suitable:

  ```sh
  cp data/icons/256/cardsy.png "$qa/non-sensitive-test.png"
  ```

- [ ] Choose that file; all hidden cards change without altering the current deal.
- [ ] New Game retains the back; Undo remains game-only.
- [ ] Close, rename the source test file, restart; customization persists.
- [ ] Use Default keeps the single managed image and collection, leaves source
      files intact and does not reset the game.
- [ ] Custom Card Backs supports multi-image import, confirmed collection clear
      and all three modes. Collection changes apply on the next New Game;
      active-game images remain fixed. Follow the
      [collection checklist](personal-card-backs.md#validation-and-native-desktop-checklist).
- [ ] Repeat startup/gameplay/personalization offline.
- [ ] If a screen reader is already available, record actual behavior separately
      from [the tested Qt baseline](accessibility.md); do not claim untested support.

## 6. Cleanup and findings

- [ ] Close every Cardsy instance.
- [ ] Verify `stage` and `qa` still identify only the temporary roots created above.
- [ ] Remove only those explicitly resolved temporary directories. Do not use
      install-manifest paths to delete actual host `/usr` files.
- [ ] Application removal does not imply deletion of real user preferences.
- [ ] Capture source commit, package/tool versions, full test logs, staged manifest,
      validator output and observed GUI failures.
- [ ] Screenshots must show only default or synthetic test content; no personal
      photos, credentials or unrelated desktop content.
- [ ] Do not create/publish a release archive, RPM or OBS submission during this QA.
