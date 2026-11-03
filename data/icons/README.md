# Cardsy icon

`cardsy.svg` is original vector artwork created for Cardsy in this project:
two overlapping playing cards on a navy tile, with a heart on the front card.
It contains no photographs, fonts, external references or imported artwork.

The SVG is the master. PNGs at 16, 48 and 256 pixels are derived renditions for
menu, launcher and application/window use. These are embedded by Qt resources
so the runtime does not need an SVG plugin or an installed icon-theme path.
The master and renditions are installed in the standard hicolor hierarchy.

The PNGs were rendered offline using the system librsvg/Cairo stack. Regeneration
is an artwork-maintenance step, not a build or runtime dependency.

This original artwork is CC0-1.0 under [ASSET-LICENSE](../ASSET-LICENSE).
That asset license does not resolve or imply a software license.
