# Closet Current 3D-73 — source-true photographed denim rear fabric drape

**Main-thread priority:** Improve real photographed fabric geometry, rather than doing another neutral-placeholder pass or duplicating parallel Capture QA and photographed-garment QA. Research only. Family Alpha Issue #255 HOLD.

**Baseline:** [3D69 PR #480](https://github.com/nickhaney916-lang/Closet-Current/pull/480) exact SHA `d37a68faec58614f46896b50933bc6769a5977d7`, dedicated no-deploy run #41265150993 SUCCESS. This changes no 3D72 neutral pant branch, no #484 capture QA branch, and no parallel independent 3D photographed-garment QA.

## Implemented

The existing index/real-garment source-verification chain continues to require byte-verified original public licensed garment sources and 163-joint CC0 skinned human rigs.

A new isolated `research/three-d-73/photographed-denim-rear-drape.mjs` uses genuine lower-body source hip/knee/ankle landmarks plus measured rear cross-sections of the existing **photographed independent sewn skinned garment mesh**. It creates bounded small posterior ease along the seat/thigh, with an oriented nearest-body triangle clearance guard. It only modifies actual garment position vertices. Original raw shirt and denim images, original source IDs and SHA-256 hashes, transferred source-UV/front/rest data, skin weights, anatomical body, and independently sewn photographed front are unchanged.

An opt-in `photoDenimRearDrape73` in the research outfit controller and showroom activates only after real independently sewn photographic pants are ready. The local research preview `research/three-d-69/index.html?denimDrape73=after` enables the new geometry; `?denimDrape73=before` is exactly the existing 3D69 behavior and the default remains OFF.

Dedicated source-only `tests/three-d-73-real-denim-drape.test.mjs` checks fail-closed source gating, immutable mapping, default OFF, and honest release flags. `scripts/test-three-d-73-source-denim-browser.mjs` verifies both original independent denim photo assets swapped with shirt identity unchanged on each genuine CC0 male/female skinned rig, in 320/390 mobile Chromium, with 0/90/180 camera angles and before/after 48 real WebGL images. The dedicated strict no-deploy workflow regenerates and uploads real screenshot/geometry evidence. This is actual source-photographed jeans, unlike 3D71/72 neutral trouser work.

## Verification and release honesty

These tests verify genuine 3D geometry and original garment source preservation; they do **not** verify that clothing looks natural to an independent human, real physical Android/iPhone behavior, scanned personal closet clothes, made-up photographed back pockets, true cloth physics or swept collision. Results are conditional on the dedicated workflow's final success and any human inspection of genuine images.

No merge, deployment, production/staging, authentication, storage, private family/customer photos, paid per-outfit AI, or Drive Duel / Delta Ebb changes. **Family Alpha HOLD**.
