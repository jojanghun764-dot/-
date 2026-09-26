# Combat effects

The six transparent PNG sheets were drawn for this project with `python scripts/make-combat-vfx.py` using Pillow primitives and original palettes. Each sheet is 384 × 64 pixels: six 64 × 64 frames in order, rendered with nearest-neighbor scaling. `art-ex20.js` draws these frames for normal attacks and the five job skill families. The source script provides a reproducible provenance record; no outside artwork is included. Bundled Android builds copy the sheets with the game files.
