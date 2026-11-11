# Mission 1 P825 — reject stale private source crop after account switch or original replacement

**FAMILY ALPHA HOLD #255. DRAFT, UNMERGED, UNDEPLOYED. MISSION 1 NOT COMPLETE.**

## Proven starting point and exact source limitation

P825 is based **only** on independently verified P824 [draft PR #860](https://github.com/nickhaney916-lang/Closet-Current/pull/860), exact source HEAD `44631d716648b9824d60b69c0d5b0b72ea903a6d`, [2/2 no-deploy GitHub Actions #43047418619](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43047418619) (native bundle + 1,703 Node passes / one preexisting optional skip). P824 blocks replacement of a **saved** ambiguous garment using unreviewed Crop photo. The **unsaved** ambiguous owner source crop correctly remains a manual review operation. This new milestone does not change the trained recognition model, source dataset, private cloud/auth implementation, release, staging, production or user photo assets.

## Native race confirmed by code audit

When an unsaved original-owner draft is flagged `segmentHint.sourceDisconnectedReviewRequired`, the existing native `cropClothingPhoto` starts `openPhotoCrop`. The crop editor **asynchronously decodes** the original JPEG. Later, its `save` callback awaits asynchronous photo quality measurement before invoking the normal private `queued` writer, whose work uses mutable global `db` and `batch`. If the original signed-in account changes, a different capture starts, or the draft/source identity is replaced during either wait, the old photo can remain mounted in the new account UI or be offered to a new account's draft store. P823's two PHOTO119 source-cutout hash checks only happen at final owner-reviewed save, not at this interim crop draft persistence. Merely checking auth before a queue is insufficient; there are multiple await boundaries.

## P825 isolated fix

The native app snapshots the signed owner, auth reference, exact owner DB instance, draft item object/ID, capture session, full original JPEG and SHA, visible crop JPEG, and complete segmentation hint on opening an **ambiguous source** crop. Its fail-closed lease checks all that state plus `sourceHashVerified`, the persisted owner's original SHA, `captureProofOwner()` and active `batch.includes(item)`. It runs before editor opening, inside `analyze`, before `save`, **after awaited photo quality**, before creating the IndexedDB write transaction (including after `queued` prewrite), and before updating the in-memory draft. The write uses the **captured owner DB instance**, never a newly switched global DB. An injected crop `id` cannot change original draft ID. Stale work rejects and leaves the previously saved original/draft unchanged.

The shared crop editor now takes an **optional** `isActive` lease callback (defaults to `()=>true` to preserve ordinary crop behavior). It refuses to construct an editor on an invalid lease, independently checks **after actual asynchronous original JPEG decode and before dialog mounting**, and checks before/after recognition and before/after crop save. The owner-session lock already closes visible dialogs; the new check prevents a delayed editor *from mounting after that lock event*.

Normal unflagged single-garment crops follow their existing behavior; previously saved ambiguous garments remain blocked by P824 until a separately authenticated reviewed-item CAS exists. Owner crop inspection is NOT model segmentation validation or approval of multiple items.

## Tests and independent acceptance

`tests/mission1-ambiguous-photo-crop-822.test.mjs` continues extracting and running the actual native `public/app.js` callback, extending its adversarial VM tests with wrong signed owner at open, change of account while `checkPhoto` is blocked, new capture session, original JPEG/segment hint/draft replacement, delayed queued write after account switch, forged crop ID and real shared photo-crop-editor delayed `Image.decode()` rejection before mounting a dialog. Tests verify **zero wrong-owner writes, no photo mutation, and no late private DOM mount**. These use simulated owner events with real native handler code, NOT actual hosted Supabase RLS or human wardrobe accuracy.

Dedicated no-deploy CI requires the **exact verified P824 base**, exactly **five** allowlisted source/test/report/CI paths, independent focused verification, native app build and all Node app suites. Do **not** claim P825 completed until its exact FINAL head has success for both CI jobs.

## Outstanding mission gates

Actual held-out image/source mask accuracy remains poor: the frozen native SegFormer B0 path matched 10/23 exposed publisher garment instances in Chromium and 9/23 in WebKit (not a new independent holdout). P821 experimental thresholds remain a separate unverified diagnostic, not a deployed improvement. Unseen rights-cleared human photos, two distinct genuinely blind annotators for mask/category/subtype/color, independent heldout model accuracy, physical Android/iPhone memory/inference, actual signed hosted two-account cloud privacy, correctly rehashed new reviewed cutout regeneration, and release permission are still missing. No synthetic test may be portrayed as such.

**FAMILY ALPHA HOLD #255 remains OPEN. DRAFT, UNMERGED, UNDEPLOYED. MISSION 1 NOT COMPLETE.**
