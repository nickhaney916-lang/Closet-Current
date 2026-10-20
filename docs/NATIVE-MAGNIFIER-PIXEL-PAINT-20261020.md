# Original-photo human reference mask — editable 4×/8× magnifier

October 20, 2026. This isolated main-thread development branch builds on PR #72. It is separate from Work's customer experience improvements in PR #69 and the next parallel Work session.

## Human usability bottleneck

Original licensed photos can be as large as 12 megapixels, but the primary annotation canvas is displayed at no more than 720 CSS pixels wide. Even a perfect source-native RLE export cannot capture trim and delicate cuffs accurately if the reviewer can only gesture at the reduced full-image display. The existing 4× and 8× detail views were read-only.

## New functionality

The model-blind **first human reviewer** can now toggle **Paint or erase directly in the enlarged outline (brush only)**. The detail image is source-aligned, and every gesture converts the displayed coordinate back to exactly the corresponding original pixel grid. The magnified window stays fixed during the whole pointer gesture so it cannot chase the finger and accidentally displace the brush.

The edit reuses existing native-resolution brush radius, mark/erase, dirty-region canvas repaint, sparse 128×128 undo/redo tiles, and original-photo SHA-256 / first-human metadata; no new segmentation model, automatic seed or resampled truth mask is introduced. Magnifier editing is off by default and disables when switching to polygon mode. Switching source photos still invalidates all prior annotation work and export gating.

## Verification and limitations

A new synthetic Chromium mobile-browser test checks opt-in, correct 4× and 8× source-native pixel targeting, pointer stroke stability, undo/redo full-array SHA-256 equality, eraser restoration, polygon-mode read-only fallback, and new-source reset. The complete Node tests and previous native reviewer browser races still run in the isolated workflow.

This is *human annotation tooling*, not a model improvement or quality measurement. Genuine independent first and second annotators still must review the 12 licensed originals. Source rights / second-person evidence must be independently audited. No production, real phones, customer uploads or billable inference are exercised.
