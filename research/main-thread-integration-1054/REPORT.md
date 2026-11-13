# Closet Current MAIN1054 — Cross-mission source-to-outfit contract milestone (HOLD)

**Research-only status:** NO MERGE / NO DEPLOY / Family Alpha #255 OPEN/HOLD.
**Tracking:** https://github.com/nickhaney916-lang/Closet-Current/issues/1054
**Primary safety objective:** detect broken ownership/source/outfit handoffs rather than silently normalizing invalid selections or calling a generic 3D asset a user-photograph reconstruction.

## Exact inspected references — 2026-11-13

| Line | Checkpoint reviewed | Research status |
| --- | --- | --- |
| Protected main | `8c3355350303399e9edc2e98beaf9de15d601282` | Unchanged |
| Mission 1 | Draft #1048 `d2b7fcb5b22511742cac8c4586d544ab6f049219` | AI hints + owner review; real WebKit continuous crash still unproven |
| Mission 2 | Draft #1051 `5566e49d4ebc516259daa238b0e78b837e88ff9e` | Licensed 163-bone dress contact topology, **not** full arbitrary photo-to-3D |
| Layered donor | Draft #1050 `9d474f434d639b082657a2c04323b0b34bc6dc87` | Source-constrained contact *diagnostic*, not photo-derived outfit rendering |
| Mission 3 | Draft #1049 `12472bab696ca3ec006dc05a54f230982798b695` | **Exact base parent** for this separate #1054 branch |

No cross-mission cherry-picks. No Mission 1/2/3 working branches, `public/`, original JPEG, private data, production, staging, hosted Supabase, deployment or preview hosts modified by #1054.

## Actual interface contracts grounded in source

1. **Native wardrobe:** `public/outfit-board.js` uses `currentBoard.slots` mapping slot ID → saved item ID, not a synthetic `{items:[{accountId,originalPhotoId,...}]}` contract. The real `public/outfit-board-engine.js` uses `cleanOutfitBoard(board, items)` which can silently drop invalid slots; it removes `bottom`, `layer`, `layer2` and `layer3` when top is a dress. A previously authored dress + outer-layer outfit therefore requires separate migration/owner approval, not unannounced data loss.
2. **Owner storage:** M3 `public/native-owner-wardrobe-index-167.mjs` verifies owner fields `ownerId/userId/accountId`, native ID, category, review reasons, original `sourceSHA256`, `sourceHashVerified`, `singleGarmentVerified` or cutout identity. This is metadata review, not proof of JPEG bytes, inferred model accuracy, or 3D geometry.
3. **Original source:** M3 `public/native-canonical-photo-source-167.mjs` produces `originalPhoto.image/sha256` and `sourceSHA256` from actual encoded JPEG bytes. The new preflight recomputes the hash from the original saved data URL before allowing even a 2D identity receipt.
4. **Owner correction:** The M3 manual reviewed-save pathway requires explicit user confirmation and signed owner storage. MAIN1054 conservatively requires `ownerReviewed`, `userAdjusted`, `sourcePhotoOriginal`, `sourceHashVerified` and an unambiguous source instance on selected records. Two source-linked garments may be distinct only with verified cutout identity and owner review.
5. **Browser-model suggestion:** M1 `public/dual-panel-82.mjs` applies suggestions only after explicit consent and still leaves final photo confirmation to the owner. This branch does **not** integrate or enable WebKit inference; a prediction is not an approved closet item.
6. **3D:** Real source-dependent mesh/UV/rig/collision/render receipts for arbitrary saved items are not a unified verified interface across branches. This milestone therefore deliberately returns **original-photo 2D only**, `renderAuthorized3D:false`. It does not call a 3D mesh loader or make fit/visual quality claims.
7. **Backup:** M3 #1049 includes default v3 *saved-only* private backup and opt-in v4 lossless pending-original recovery. MAIN1054 leaves those APIs and their independent test suites untouched. A comprehensive combined live backup/restore + 3D acceptance is still missing.

## New isolated implementation and evidence

`research/main-thread-integration-1054/source-to-outfit.mjs` is a **read-only, not app-mounted** contract preflight. It imports M3's real owner index and source SHA functions, injects the legacy board normalizer, attests the signed owner/epoch/private DB before and after awaits, verifies fresh selected records, refuses unverifiable/ambiguous garment instances, blocks silent loss of outfit slots, and returns only item ID / original SHA / explicitly 2D-only metadata (never JPEG pixels, signed tokens or inferred 3D mesh data). Unknown subtype/color or photo-estimated color blocks this strict path until owner correction.

`source-to-outfit.test.mjs` uses the actual `public/outfit-board-engine.js` under Node VM and imports the real M3 research modules. Its photos and two-account/session examples are **synthetic original-envelope fixtures, not decodable real clothing photographs**. It checks happy-path source receipts, no hidden images in results, unreviewed AI input, Unknown/estimated labels, owner mismatch and epoch change, concurrent edits, forged source SHA, missing source, dress+layer loss, dress-only 2D fallback, stale/duplicate item IDs, duplicate/cutout identity and missing attestation.

`.github/workflows/main-thread-integration-1054-no-deploy.yml` is a branch-specific, strict pinned-ancestor and four-path allowlist. It runs the new test, inherited full Node native suite and offline build. Its only permission is `contents:read`. It never uses secrets, hosted data or deployment steps.

## Acceptance matrix — actual status must be set by exact HEAD CI

| Gate | Status before CI evidence | Evidence required |
| --- | --- | --- |
| Source structure from current M3 parent | INSPECTED | Pin exact parent + root native modules |
| Read-only owner/SHA/board adapter | IMPLEMENTED, NOT YET CI-VERIFIED | Source-driven `node --test` |
| Original-photo 2D render policy | IMPLEMENTED, NOT YET CI-VERIFIED | No unauthorized 3D receipt |
| Actual integration in normal app | **BLOCKED / NOT IMPLEMENTED** | Compatible M1+M2+M3 source ancestry and explicit owner-reviewed adoption |
| End-to-end public real-photo camera→3D outfit | **BLOCKED / NOT TESTED** | Independent original-photo / mesh / both rig validation |
| Full original+pending v4 restore in normal user flow | **NOT RETESTED BY #1054** | M3 delegated test plus combined signed journey |
| WebKit dual-model continuous stability | **BLOCKED** | Independent #83 genuine real-model crash reproduction/fix |
| Physically tested iPhone Safari / Android Chrome | **BLOCKED** | Authorized actual devices |
| Hosted signed two-account Supabase RLS | **BLOCKED** | Approved disposable hosted owners |
| Human-approved photographic 3D fit / 10 of 10 recognition | **BLOCKED** | Independent human-real-photo ground truth |
| Family Alpha release | **NO GO** | #255 + owner's explicit decision |

## Next integration work

1. Verify final-head branch-specific no-deploy run, distinguishing inherited unrelated workflow failures from this exact CI.
2. Establish a source-locked three-way merge plan from verified incompatible/compatible edit scopes. Never silently combine research branches or widen release toggles.
3. Introduce an opt-in native owner-reviewed board adapter only after confirmed fit with M1/M2/M3; preserve the saved 2D path and the original slot set on incompatible dresses/layers.
4. Add legally authorized photo-based, signed browser integration and mobile acceptance with immutable original JPEG receipts.
5. Obtain independent physically tested / human acceptance and owner authorization before moving Family Alpha #255.
