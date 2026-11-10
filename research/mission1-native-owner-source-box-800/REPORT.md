# Closet Current Mission 1 P800 — actual owner-original JPEG two-corner rectangle in native Adjust

**FAMILY ALPHA HOLD #255; DRAFT, UNMERGED, UNDEPLOYED.** Exact P799 parent `3b16be6f58f6def8f821ae603ef3054d6b1a1299`. Only six allowed native/research/test/CI files change. No signed cloud/owner save, external AI service, model weights, P799 source truth, production or staging changes.

## Why this is the next substantive step

P799 executed the genuine pinned SAM2.1 ONNX model on ten original publisher photographs/23 publisher human garment masks and found **22/23 quality-selected original mask IoU≥0.50 from publisher-mask-derived tight ORACLE boxes vs 15/23 from ORACLE points**, with all three coats passing tight boxes vs zero using points. This is encouraging but NOT reliable real-owner accuracy: each box was derived from the publisher's *exact already-known garment polygon*, which real customers do not possess. P798 independently supplied a SHA-bound but point-only native original-photo Adjust control.

P800 implements the first safe **owner-interactive TWO-CORNER BOX** input on the **actual original JPEG source** in genuine native Adjust. It captures input, not yet an ML mask.

## Native implementation and strict privacy boundaries

- User must explicitly opt in to `mission1OwnerPoint798=research&mission1OwnerBox800=research` on this isolated research build. P167 original JPEG and P120 owner-draft review gates continue to apply. No default app behavior changes.
- Reuse the same immutable, already displayed `originalPhoto.image` and owner-bound source SHA in the P798 Adjust panel; no second original decoded copy, cropped approximation, transformed image or image cloud upload. User selects "Draw a rectangle around the garment", then two opposite corners on the genuine source. Supports actual pointer/touch event taps, a keyboard-operated crosshair with arrow keys plus Enter, and a clear/reselect action.
- Each corner independently invokes the original P798 SHA-256 byte-verification and owner/draft/session check before and after digest. The new `sourceRectFromVerifiedPoints800` verifies matching true owner/source-ID/SHA/natural dimensions and actual verified original-pixel corners. It sorts reverse corner order, rejects degenerate/tiny or out-of-source coordinates, then returns an immutable original-pixel `[x0,y0,x1,y1]` rectangle and normalized display geometry.
- The rectangle is drawn only as a CSS outline over the original, with clear *"box only, not separated garment mask"* status. No DOM selection is silently written into `item`, the draft, IndexedDB, backup, other owner's account, model queue, original JPEG, saved item, garment category, subtype/color, or review confirmation controls. No SAM2 inference run and no publisher human truth inserted into the interaction. Disposed on dialog close/session revocation.
- P800's actual browser tests are **automated Playwright gestures**; neither the prompts nor any screenshots constitute independent actual human review or physical Android/iPhone touch acceptance. "User-drawn" describes the UI's intended interaction, not a claim that an independent tester actually drew it.

## Verification

Dedicated `.github/workflows/mission1-native-owner-original-box-800-no-deploy.yml` enforces exact P799 parent, only six scoped paths and no auth/cloud/storage/model changes; complete original photo/native/cloud/3D Node suite plus pure source-box negative tests against a SHA-verified genuine public CC BY image; true immutable SegFormer B0 original-photo execution and native Adjust real Chromium/WebKit simulated pointer and keyboard events. Test checks that a fake or stale signed owner/draft cannot produce a source rectangle, no source mismatch can combine corners, and manual confirmed clothing save never includes an owner box receipt. Original photo, user field confirmations and owner-private saved clothing behavior remain unchanged. Screenshots of real original source overlay are browser test artifacts, **not human acceptance proof**.

## What this does not complete

**No actual SAM2 binary mask is generated from the P800 rectangle yet.** The published polygon-derived oracle boxes used in P799 are not evidence that realistic, loose actual drawn boxes will yield the same IoU. There is no approved/commercially rights-cleared new independently double-blind source dataset, no genuine independently collected owner mask approvals, no learned subtype/primary-color accuracy proof, no signed hosted two-owner RLS production/cloud acceptance or physical Android/iOS testing. A ~130MB SAM2 ONNX model measured at ~1.2 GiB process peak in GitHub Actions is NOT yet verified mobile safe. The next milestone is real source-safe P800 prompt → local bounded model mask preview, manually corrected/approved and privately saved only after separate explicit review. None of those safety/acceptance conditions are simulated as completed.

Family Alpha HOLD #255 remains active; no staging, prod, merge, automatic cutout save or release signoff permitted.

## Exact-head GitHub evidence

To be recorded only after real Chromium and WebKit, entire Node suite and exact final-head Actions run pass.
