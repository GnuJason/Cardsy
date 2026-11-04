# Cardsy licensing

SPDX expression for Cardsy software: **GPL-3.0-or-later**.

The project owner explicitly selected GNU GPL version 3 or any later version
published by the Free Software Foundation. Cardsy-authored C++ sources, headers,
CMake/build definitions, Qt resource definitions, tests, README, documentation
and other project prose are licensed under that expression, except for the
explicit artwork/metadata dedication below.

The authoritative, unmodified GPL version 3 text is [COPYING](COPYING), obtained
from <https://www.gnu.org/licenses/gpl-3.0.txt>. The project's "or later" grant
is stated here; the official license document itself must not be rewritten.
The GPL document retains the Free Software Foundation's copyright and its own
verbatim-copy permission.

## Independent artwork and metadata scope

The original icon SVG and its derived PNG renditions, the desktop-entry template
and the AppStream template are **CC0-1.0**, under
[ASSET-LICENSE](data/ASSET-LICENSE). The icon-provenance README is project prose
under GPL-3.0-or-later, not artwork covered by that dedication.

Generated desktop/metainfo files retain their templates' CC0-1.0 licensing.
AppStream's `metadata_license` describes the metadata (CC0-1.0);
`project_license` describes the application (GPL-3.0-or-later).

## Source and installed distribution

The upstream source includes these license declarations, source/build files,
tests, documentation and required resources. Installation includes COPYING and
ASSET-LICENSE alongside the executable, metadata and icon assets.

There is no bundled third-party library or font source. Qt, the compiler and
ordinary system libraries remain separately licensed system dependencies;
their licenses are not reassigned by this project policy. Build-generated Qt
moc/resource support is not tracked upstream source.

User-selected images are private user data, not project artwork. This policy
does not grant rights to those images or include them in any distribution.
