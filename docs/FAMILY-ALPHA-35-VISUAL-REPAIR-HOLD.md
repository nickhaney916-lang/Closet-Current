# Closet Current — source-backed garment mask repair and honest footwear (HOLD)

**Issue #255 · 2026-10-27 · main coordinating conversation · first product repair after licensed-photo visual FAIL.**

## The two actual observed failures

The licensed screenshot gallery [Work #33, PR #329](https://github.com/nickhaney916-lang/Closet-Current/pull/329) contains a black dress whose transparent cutout includes the original **mannequin neck/chest**, and four single side-view sneaker/boot photos displayed across the 2D humanoid's **two feet**. Main-thread visual release audit [PR #330](https://github.com/nickhaney916-lang/Closet-Current/pull/330) records five FAIL and two REVIEW; eight additional photos could not be cut out. Green browser/PNG source tests are not proof of natural fit. This new work addresses those **behavioral failure modes**, not proprietary image-model accuracy.

## Actual changes in the compiled styling experience

Stacked on independent Work #34 [PR #331](https://github.com/nickhaney916-lang/Closet-Current/pull/331) with its atomic IndexedDB save/rollback. Existing files are copied into a new, strictly local `dist-family-alpha-35-visual-repair-HOLD` output; all parent files are SHA compared against the original and **only six pinned source targets** are overlaid. Both additional modules are kept under `research/family-alpha-35`; production, staging and source main are unchanged.

**1. Mannequin/background touch-up is a real human tool, not wishful segmentation.**

- An explicit original-JPEG vs decoded transparent garment canvas side-by-side; tap to **erase** visible neck, mannequin or hanger residues; Undo and Reset offered. Mobile pointer touch works.
- The eraser operates on garment RGBA with bounded normalized circular strokes; **only alpha may decrease**, preserving RGB of surviving original pixels and the source JPEG bytes. Reject edits that remove too much of the original garment; never generate missing collars or sleeves.
- After user explicitly checks that original vs edited cutout is clothing-only, the provider reconstructs the exact alpha edit from raw candidate pixels and **reruns the independent original-JPEG RGB/source audit** before returning the reviewed image. The prior account, source version, saved crop and request-session guards still run after every await. Altered, stale or rejected images are never persisted into the wardrobe or offered as approved avatar content.
- A skin-colored jacket can legitimately exist. We **do not** automatically erase pale, tan, or flesh-toned pixels. If the result remains ambiguous, choose retake. A human can manually erase unwanted mannequin areas when a clean garment boundary is visible.

**2. Footwear is never silently fabricated into a pair.**

- `Shoes` classification does **not** mean a single photograph contains both shoes.
- An explicit reviewed checkbox can request a paired on-feet preview **only when native transparent alpha has two substantial, separately positioned left/right components**. Otherwise the option is disabled.
- All unverified/single shoe and boot photographs show in a **small framed reference image aside from the feet**, marked with an accessible `footwear-photo-reference` mode. They are **never** stretched across both avatar feet. The shoe source PNG bytes remain unchanged.
- This is not AI synthesis of a second shoe, toe projection, or left/right mirroring. If two photo shoes overlap, or the source is uncertain, it stays reference-only.

## Regression scope

The no-deploy GitHub workflow rebuilds the actual parent #34 offline integration, asserts identical retained JPEG/photo and atomic-save assets, adds 6+ independent Node alpha-only/pair checks and tamper checks, then runs the full compiled synthetic import → Adjust/save with injected quota rollback → Style My New Clothes three avatars → human mask eraser/Undo/confirm → footwear reference instead of false worn pair → outfit swap → save/reload/restore at 320/390/430px in Chromium and WebKit. Synthetic screenshots remain synthetic, not user photos. No external network, Auth/cloud/classifier calls.

**Critical honesty:** This creates a practical removal tool and prevents misleading footwear overlays; it does not establish automatically perfect clothing isolation, guarantee fabric draping, fix all eight unrenderable originals, certify real photographed outfits, or authorize four real family users. **Release HOLD** remains until a real photographed garment is corrected, visually accepted by the owner, and the same four-person session begins with harmless adult-account JWT/RLS privacy confirmation before child photos.

No production/staging/Supabase/Cloudflare/Resend writes, deployment, merge, family images, payment, paid AI or Drive Duel.
