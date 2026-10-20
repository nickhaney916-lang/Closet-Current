# Native-resolution human mask drawing — brush performance and fidelity

October 20, 2026. Stacked on draft PR #70, isolated from main customer-facing styling PR #69, original model artwork in PR #58, and production. No paid services.

## Problem and fix

The original-grid annotation page (first-human **model-blind** reviewer only) previously repainted the **entire** source canvas and read/rewrote up to twelve million RGBA pixels on every `pointermove`, even when a small brush changed tens or hundreds of pixels. This made accurate tracing of fine cuffs, seams, lace loops, hems and dark trim unnecessarily expensive on phones and large images.

- Keep the *identical* original-resolution `mask`, `source.base`, classification-first/clip-later invariant and first/second reviewer separation.
- Every brush segment changes exactly the same source-grid bitmap pixels as before, but copies and composites only the clamped dirty rectangle surrounding the stroke and radius. The renderer resets that region from the unmodified original image before overlaying marked pixels, so eraser strokes never accumulate overlay tint.
- Full repaint remains available for image load, polygon completion, undo/redo and independent baseline comparison; rendering changes do not themselves certify garment correctness.
- Avoid redundant full-canvas detail refreshes during an active brush pointer move.

## Automated browser evidence

`scripts/test-native-brush-dirty-regions.mjs` synthesizes an original-grid **1.4 MP** image in a 390px-wide Chromium mobile browser, physically dispatches brush pointer events, records `canvas.getImageData` dimensions per stroke and compares every displayed canvas byte against the previous full-redraw algorithm. It also checks erase correctness, original RGB unchanged, native pixel dimensions and export requirements. First/second reviewer stale-source browser guards remain tested.

This is performance **architecture** evidence (less per-stroke canvas IO), not an actual mobile FPS benchmark, physical-phone rendering measurement or independent garment accuracy measurement.

## Real-world accuracy and release limits

All 12 licensed-original human-reference tasks still need manual first-person outlines, a genuinely independent second human check and legally audited evidence before any real-photo segmentation metrics can be calculated. This isolated change cannot approve a synthetic mask, update the benchmark reference registry or deploy customer-facing changes.
