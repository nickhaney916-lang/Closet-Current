# Mission 1 P824 — prevent ambiguous crop from silently overwriting a previously saved private garment

**FAMILY ALPHA HOLD #255. DRAFT, UNMERGED, UNDEPLOYED. MISSION 1 NOT COMPLETE.**

## Source and exact parent

P824 is an isolated follow-on to exact green P823 [PR #859](https://github.com/nickhaney916-lang/Closet-Current/pull/859) HEAD `526d61cc500018da7aedb45673da341a88eca0fe`, [Actions #43046414966](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43046414966): 2/2 jobs success, 1,701 Node PASS, one optional SKIP, app build. Only actual native `public/app.js`, updated existing actual-handler tests, this report, and new no-deploy workflow are changed. No private data/model/cloud/auth/production/staging changes.

## Real previously saved wardrobe mutation path

P822 correctly made editing an *unsaved* ambiguous source crop review-only and P823 binds the exact displayed cutout JPEG to the verified cutout bytes in reviewed private save. Yet the existing native `cropClothingPhoto` also exposes Crop photo on already-saved clothing in `items`. For such an item, `save(photo,...)` sends a new ambiguous crop straight to `writeAll([value])`, which overwrites the existing saved wardrobe row rather than going through a source SHA/owner-reviewed saved-item correction. This can replace the previously saved picture, category/color, and leave a stale verified `segmentHint.cutoutImage`, without the new crop's human single-garment confirmation or immutable saved-item CAS.

## Native P824 safety fence

At the actual beginning of `cropClothingPhoto`, before launching Crop, a candidate with `segmentHint.sourceDisconnectedReviewRequired===true` AND an existing matching saved wardrobe ID is blocked, with a clear message that the existing garment remains unchanged and the original must be imported as a new reviewed capture. This keeps the trusted prior item and original image intact until a separately developed SHA-verifiable, owner-reviewed saved-item correction exists. Unconfirmed *unsaved* source crops still open for manual Adjust review (P822). Ordinary unambiguous saved and unsaved crops follow prior behavior. This is an intentionally conservative user-path restriction, NOT a new crop or private correction implementation.

Updated `tests/mission1-ambiguous-photo-crop-822.test.mjs` exercises the actual native handler using unsaved candidate fake IndexedDB draft writes, previous P822 metadata attack/color safeguards, and two new cases: blocked saved ambiguous candidate cannot mount crop or write wardrobe, while ordinary saved nonambiguous crop retains its existing path. No owner human benchmark, mobile performance or image-model quality claim is made.

## Verification and remaining release gates

Dedicated strict four-path NO DEPLOY workflow must pass both exact-parent/full-node-build and independent native handler checks on FINAL HEAD before P824 is considered verified. No merges, test owners/accounts, staging or production. **The missing safe source SHA/cutout SHA regeneration and owner-reviewed atomic CAS for modifying an existing saved ambiguous garment is a known future task.** It must be built without reverting this guard prematurely.

Other Mission 1 release acceptance still not achieved: normal frozen SegFormer B0 real publisher instances detected 10/23 in Chromium, 9/23 in WebKit; novel unexposed rights-cleared photo corpus, two independent genuine human polygon/category/subtype/color annotators, external held-out accuracy, physical iPhone/Android CPU/RAM/inference, real multi-owner cloud privacy and owner release approval. Family Alpha HOLD #255 remains OPEN.

**MISSION 1 NOT COMPLETE — FAMILY ALPHA HOLD #255, DRAFT, UNMERGED, UNDEPLOYED.**
