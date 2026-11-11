# Mission 1 P826 — actual owner-confirmed JPEG crop to newly hashed source-bound reviewed private garment

**FAMILY ALPHA HOLD #255. DRAFT, UNMERGED, UNDEPLOYED. MISSION 1 NOT COMPLETE.**

## Strict verified baseline and isolated scope

Based on exact independently CI-verified P825 [draft PR #862](https://github.com/nickhaney916-lang/Closet-Current/pull/862), final `a90d14667e4adc18e2bc21e049e4aaafc7d016cf`, [Actions #43061679105](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43061679105), 2/2 no-deploy jobs, full Node 1,710 PASS / 1 optional SKIP, native app build. Six allowlisted native crop/UI, two research tests, report and no-deploy workflow paths; no main, staging, production, hosted auth/cloud, actual user photos, model weights, released app or release gate changes.

## Previously impossible safe owner crop-to-private-save continuity

P822 kept original owner photo and prevented AI autocolor on ambiguous upper-clothing unions. P823 blocks PHOTO119 save if a newly visible cropped JPEG has an old, different `segmentHint.cutoutImage` SHA. P824 blocks modifying already saved ambiguous clothing via unchecked `writeAll`. P825 blocks wrong-owner/stale async source crops. Together they expose a real workflow gap: when the owner manually crops an **unsaved** ambiguous source, the app saved the new crop while carrying the OLD source-model cutout hash, so the correctly protective P823 PHOTO119 save **must reject** it. Without computing and binding the exact new crop JPEG SHA, the manual original-to-private-closet path cannot finish.

## P826 actual app + original-photo UI

- For flagged unsaved ambiguous original photos, Crop photo exposes an unchecked **original-photo one-garment confirmation checkbox**. User must compare the original and assert the current crop shows exactly one specific garment. Changing the selection/mask resets the checkbox; a stale earlier selection never counts.
- Actual `public/app.js` crop callback enforces this explicit checkbox at the handler (a scripted UI bypass does not create a review receipt) and the P825 signed owner/immutable source/session/draft lease. It calls the **existing native P167 capture-proof implementation**, verifies the full-original JPEG's SHA **cryptographically**, validates the exact newly cropped JPEG envelope and size, computes its actual new SHA-256 and rejects a crop identical to full original.
- The new `segmentHint.cutoutImage` and `cutoutSHA256` refer to the **exact visible crop**, keep the original source SHA, record the provenance `explicit-original-photo-single-garment-checkbox-not-independent-human-ground-truth` and flag `sourceDisconnectedReviewRequired`; `ownerReviewedInstance=true` only after the new manual one-garment declaration. No model type, primary color, category, segmentation accuracy, independent labeler or final save is fabricated. The temporary crop checkbox is removed from the persisted object.
- The cropped garment persists only in owner-private **draft**. The distinct Adjust form must still require its original-photo confirmation and separate category/type/color and individual garment checkboxes, then call the **existing P119** owner/session/draft CAS, independently SHA-verifying original and cutout before one atomic private closet insert. The newly cropped record is not saved to wardrobe automatically. A previously saved ambiguous item remains blocked by P824. Old unambiguous crop behavior is unchanged.
- Keep `segmentHint.clipped` as given: this change does not override any existing clipped/rejected source geometry. This is intentionally safe and may require retake rather than false approval.

## Validation design

`tests/mission1-ambiguous-photo-crop-822.test.mjs` runs the exact native crop handler, controls synthetic signed-owner/draft events, and checks no unchecked one-piece claim, no guessed color or type, original integrity and SHA mismatch, owner logout during asynchronous hash, and prior P822–P825 regression.

`tests/mission1-human-crop-reseal-826.test.mjs` executes actual native app crop callbacks on a **genuine JPEG fixture** by cropping its own original image using `sharp`, then obtains a genuine SHA-256 from the native browser P167 source-proof implementation (Node WebCrypto). Verifies unreviewed owner-private draft and original/full crop byte identities; then calls the **REAL `public/native-reviewed-private-save-167.mjs` PHOTO119** against fake IndexedDB with a *second simulated owner-reviewed* category/type/color confirmation. The separate PHOTO119 verifies full-original SHA, actual crop SHA, owner/draft provenance, and atomically writes just the tested wardrobe row while removing its matching draft. Also tests incomplete original single-garment claim and forged original SHA failure. It demonstrates a real deterministic JPEG/hash/storage logic path—not a physical owner interacting in a mobile browser, genuine independent human labels or model accuracy.

Dedicated exact-parent, six-path-only no-deploy workflow runs both independent and whole app Node/native build checks. **P826 is not verified until final exact-head 2/2 successful jobs.**

## Mission 1 remains blocked on external acceptance

Actual frozen B0 real publisher instance grouping still matched **10/23 masks in Chromium, 9/23 in WebKit** and has high false counts. P821 original-source threshold sweep had timed out rather than reporting real scores; may still need bounded model execution. Legal unseen photograph rights, genuine two independent blind original-polygon/category/subtype/color annotators, predeclared heldout metrics, actual Android/iPhone original-model on-device resource acceptance, hosted signed two-owner RLS/Storage privacy and owner release consent are not yet established. These requirements cannot be replaced by simulated owner checkboxes, publisher labels or Node tests.

**FAMILY ALPHA HOLD #255 remains OPEN. DRAFT, UNMERGED, UNDEPLOYED. MISSION 1 NOT COMPLETE.**
