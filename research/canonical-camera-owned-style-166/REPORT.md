# Closet Current — MAIN P166: Canonical camera JPEG → private human-reviewed Style photo

**FAMILY ALPHA HOLD — GitHub Issue #255. Research-only, draft, unmerged. Absolutely no production or existing staging changes, no deployment, no live owner photos, no Delta Ebb or Drive Duel writes.**

## Why this priority matters

The independently verified P165 [draft PR #723](https://github.com/nickhaney916-lang/Closet-Current/pull/723), exact SHA \`2b6d891367fd67cc8f7d054b1250600e0e13c323\`, proved that a newly captured blouse could be saved, combined with three owned looks, and shown as a truthful 2D saved photo rather than fake 3D clothing. However, actual full-app Work [PR #719](https://github.com/nickhaney916-lang/Closet-Current/pull/719) saves that particular new blouse without canonical independent original JPEG source proof: P165 correctly labels it "saved photo · 2D (original source unverified)."

P166 tests the stronger existing research-only path on the **same full-app Work** styling UI. Actual original camera JPEG bytes are SHA-256 hashed by \`captureProofFromJPEG\`, passed through native \`candidate\`, human reviewed for garment/category/subtype/color, and atomically saved by existing PHOTO119 owner-scoped IndexedDB writer. The original bytes' independent digest must still match persisted original image and every visible P165 2D preview after three outfit generation, one shoe swap, two saved boards and reload.

## How integration is isolated

- P166 adds a **scratch browser runner transformer only**, its no-deploy CI, tests and this report. It never edits \`public/app.js\`, \`public/index.html\`, \`public/closet-stylist.js\`, \`public/style-photo-preview-gate-165.mjs\`, existing Work PR #719 branch, private wardrobe records or original 3D source code.
- It pins the exact full-app Work SHA \`0eaa99fe1e1a07b253a4ef2b1b5a0dc7192a2a00\` and composes it via \`git merge --no-commit --no-ff\` in ephemeral GitHub Actions only, never merging GitHub branches.
- It requires explicit research camera flags, exact owner authentication and two explicitly checked human review confirmations. Synthetic 240×320 clothing JPEG is used; no real device camera or private photo is read.
- It reruns inherited original source-dress 360° WebGL tests, cross-stream styling acceptance, full Node tests and the P165 source-honest 2D screenshot audit.
- Genuine Chromium and WebKit browser rendering at 320, 390 and 430 CSS pixels must prove six independent images with verified-original mode, source digest identity and no fake 3D blouse.

## Acceptance and limits

**Acceptance is pending an exact-current-head successful GitHub Actions run. Do not mark P166 complete before it passes both jobs, screenshot source checks and all full-app tests.**

This is still **not a 3D fit** for the newly captured blouse, full photoreal cloth reconstruction, live AI inference, physical phone acceptance, live hosted cloud two-account RLS, or public application completion. Camera tests use a **synthetic camera** source; category/type/color are **human reviewed** but not independently ground-truth verified by a model. No production or existing staging change is authorized. **FAMILY ALPHA HOLD** remains enforced.

Next integration should bring canonical original capture provenance into the normal carefully controlled application flow in coordination with full-app Work, verify real physical Android/iPhone cameras, and preserve a strict 2D fallback until source-specific 3D reconstruction is genuinely verified.
