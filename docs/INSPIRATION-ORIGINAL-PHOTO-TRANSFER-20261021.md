# Inspiration → Add to Closet: original photo recognition and account safety

**October 21, 2026. Verified software in an isolated draft only, not live production.**

## User-impacting bug

The Inspiration screen accepted a user-selected image and created a **900px, quality 0.8 JPEG thumbnail** for display and saved inspiration looks. The “Add this single-item photo to Review” action also queued **that 900px thumbnail**. On shoes, prints, seams and similar details, it unnecessarily discarded full-source pixels before the existing recognizer could identify the item, contradicting the original-before-masking product requirement.

## Fix without cloud/model changes

- Keep the existing **small, storage-efficient inspiration preview**. Only while its originating browser File remains in memory and belongs to the current signed-in account, enable “Add this single-item photo to Review.”
- On an explicit click, run **the already verified `photoToJPEG(originalFile)`** bounded source-image encoder (up to 3072px longest edge, .94/.88/.82 JPEG quality, 2,850,000-character backup cap, no upscaling), and pass the resulting full-frame image to the **unchanged `candidate(image)`** recognition pipeline before any segmentation/masking.
- Saved inspiration looks continue storing only lightweight previews; the original source File is **never added to a saved inspiration record or upload**. When opening a saved look or resetting to a new/example look, clear original File and hide the Add-to-Closet button. The user can select the original again.
- Cancel slow decoding/encoding results if another photo was selected, if the user switched accounts, or if the unrelated camera/import queue is busy. Duplicate click and duplicate detection cannot pretend an item was saved. Mobile decode exceptions and timeouts report a recoverable error, never queue the thumbnail as a silent fallback.
- The original File is **not** the literal untouched camera sensor original in the closet: the normal app encoder creates a high-quality JPEG derivative before recognition. Its source dimensions/context are preserved within app storage limits; recognition accuracy must still be validated with genuine human labels.

## Test boundaries

Tests simulate file selection, original-vs-preview queue, a saved look without original File, superseded decode, account switching before/during encode, duplicate-click and error recovery. Chromium and WebKit mobile emulation decode **genuine synthetic 3600×2700 JPEGs**: the inspiration thumbnail remains 900×675, while the recognition source retains 3072×2304 within the original size cap.

Strict source guard pins **only `public/trends.js`** with SHA, freezes source import/recognizer/core customer app/Auth and private-cloud changes, original human-photo evidence, outfit engine and research catalogs. Historical PR #129 source QA is rerun at its immutable tested checkpoint. No new providers, paid AI calls, merge, deployment, or Drive Duel changes.

**No physical device testing or real-wardrobe recognition accuracy is claimed.** Independent real-human reviews, live cloud-account testing and release approval are still blocked, and owned-clothing confirmation remains the user's responsibility.
