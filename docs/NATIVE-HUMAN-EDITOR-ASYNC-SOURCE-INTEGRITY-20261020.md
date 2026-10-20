# Native human garment annotation: latest-selection integrity

2026-10-20. Isolated from the production app, Work's styling integration, source/photo classification, 3D figure artwork, and all earlier PR branches.

## What was wrong

The standalone independent human annotation page accepted an asynchronous `Image.decode()`, original-byte SHA-256, and later `File.text()` when resuming a saved mask. Switching photos before decoding completed could allow the older source to publish after the newer source. Restoring an old draft could also overwrite a new photo's work or the reviewer’s subsequent brush edits. A clean CI pass for single-image upload does not test those races.

## New source integrity contract

- Selecting any new original photo immediately invalidates prior source/mask/export and increments a photo generation; pending older file loads cannot redraw, publish hashes, or restore an old mask.
- The exact original source bytes are hashed and validated before canvas/source commit. Decode, file reading, and hash promises each check the same source generation. Photo errors only affect the still-current request.
- Loading a saved first-person human DRAFT snapshots the source identity, source version and edit revision. A newer draft, changed photo or human brush/polygon/undo action wins. Stale draft text cannot rebind to that source.
- Browser object URLs are revoked even if their decode result becomes stale. The original photo continues to determine classification/indexing BEFORE any clipping in the customer app; this change is confined to the offline QA editor.

## Actual tests

`scripts/test-native-human-editor-file-races.mjs` runs in mobile-width Chromium emulation. It deliberately holds an older image decode while loading a newer photo, delays an older draft while switching sources, delays another draft during human brush editing, and selects an archival/noncanonical photo. Every scenario checks source identity, mask state and disabled export. It never uses model-predicted masks, creates human review evidence, or measures clipping quality. Automated CI runs both app tests and this browser test.

## Remaining blockers

12 original JPEGs exist, but 0 genuine independently approved complete human garment masks, 0 reliable real-photo cutout error rates, and no physical-phone hardware verification. Second reviewer and image/annotation redistribution rights evidence remain human tasks. No promotion or deployment.
