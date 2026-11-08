# Closet Current MAIN Priority #170 — native video camera owner session lifecycle

**FAMILY ALPHA #255 HOLD — draft isolated research; NO production/staging/deploy, no hosted Supabase, no private user photos or other projects.**

## Source and exact ancestry

Direct child of verified P169 PR #727 SHA `eda23f639c8b37f8a2f858020efbb410adba969e`. No writes to P169, P168, P167, active full-app Work #719, or separate photographed garment-fitting Work #60.

## Concrete fix on normal app route

The normal P167 camera flow could receive a previously granted camera stream after an owner auth-epoch change, or resume from video.play() after permission/camera cleanup and reset the capture session state. It handled document.hidden but not the mobile browser freeze event or a stale visibilityState when hidden was false. P170 adds a bundled immutable owner/session epoch + owner-private IndexedDB + visible document lease and checks it before/after actual camera permission, after video.play(), and after original-camera JPEG SHA verification. Any late acquired foreign stream has every track stopped. A page freeze immediately releases camera tracks; the already saved wardrobe/photo is not deleted. A permission denial still offers normal file import and camera retry. Parent legacy camera tests are preserved.

## Verification plan

- Five Node tests for owner-bound camera lease, epoch swap, hidden/pre-render, immutable no-photo lease, and real native app wiring; full inherited repository regression suite and built app still run.
- Real Chromium and WebKit browser-context tests at 320/390/430. Actual browser MediaStream tracks generated from a synthetic video canvas feed the actual HTMLVideoElement and actual canvas JPEG capture path. This uses real video frames with real SHA-256 proof, **not fake video readyState/drawImage nor direct candidate injection**.
- Full human review UI with category/subtype/color and single-garment confirmation, saved private original JPEG rehash, camera permission denied/retry, freeze/track release, and late camera permission grant after navigation off the scanner.
- Inherited P167 ordinary gallery photo to private closet to three saved owned outfits and source-verified 2D original preview reruns separately in all six browser engine/viewport combinations.
- Genuine PNG screenshots and SHA-256 receipts for camera active/review and original 2D/owned outfit views, in total 24 screenshots when successful.

## Crucial limitations

A programmatic browser canvas MediaStream is **not a real Android or iPhone physical camera**. This does not verify hardware sensor selection/orientation, low-memory phone lifecycle, physical screen reader support, live AI clothing recognition or actual owned photo reconstruction to convincing 3D. Any WebKit canvas capture limitations must be recorded, not disguised. It does not prove hosted JWT/RLS and does not authorize a release.

**Acceptance pending final exact-head two-job GitHub Actions PASS.** Report only verified actual test receipts; keep Family Alpha on HOLD.
