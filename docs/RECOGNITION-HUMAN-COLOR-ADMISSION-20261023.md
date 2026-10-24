# Closet Current — Original-backed human color confirmation

**Family Alpha release HOLD.** Stacked on PR #279 (recognition review flag safety). Does not modify original pictures, model weights, segmentation, Cloudflare/Supabase, Resend configuration or any personal/production data. No deploy or merge.

## User-visible regression discovered in the parent recognition review gate

PR #279 correctly keeps `recognitionReviewRequired=true` until source/mask/color/category/owner checks pass and avoids clearing review for an item that needs a human color choice. However, the pre-existing `canConfirmReviewedColor` control required `!recognitionReviewRequired`; as a result **all correctly flagged, otherwise verified colorless garments lost the quick “Choose color · save” affordance**. The UI showed “Needs review” or instructed the user to choose a color but hid the control, forcing manual Adjust instead.

## Fix

On the *real current scan*, only AFTER a supported model garment category/type and its original RGB input have passed category/segmentation gates, and with no missing crop, duplicate, ownership hold, user adjustment or corrupted picture, record an ephemeral `WeakMap` evidence token for an otherwise valid **category+missing-color** result.

The proof binds the in-memory garment object, current Supabase Auth owner identity, IndexedDB handle, actual recognition input JPEG string, displayed JPEG, original full-scene JPEG (if multi-item), segment hint serialization, and confirmed category/type.

The UI offers human color selection only when:

- `recognitionReviewRequired===true` **and** the current in-memory proof matches all pinned fields;
- no worker is pending, the current draft is neither saved nor a duplicate nor a failed scan;
- the original source is present; item has a recognized category, no valid color, and any outfit segment is not clipped / original-crop fallback / inconsistent with the proposed category;
- the person explicitly chooses a valid named color to save it.

On explicit confirmation, the actual atomic quick-color transaction writes the selected `color`, `colorSource:'user'`, `userAdjusted:true`, and **clears review ONLY in the confirmed, saved clone**, leaving a canceled/failed attempt in review. The proof is **never stored** in IndexedDB or cloud and is deleted on a new scan attempt; source, owner, crop/mask hint, category, type or IndexedDB connection changes invalidate eligibility without a new scan.

It is deliberately conservative when reopening the app: a restored draft's historical category and review flag do not recreate the proof, and the user can use Adjust or run recognition again.

This change **does not improve actual classifier correctness**, identify unseen fabric, or measure licensed source-photo accuracy; those belong to independent Work Assignment #20. It does not edit worker timeouts/retry logic; those belong to parallel chat #21. Actual confirmation save still uses preexisting IndexedDB transactions; full cloud account isolation must still be separately tested.

## Tests

`tests/recognition-human-color-admission.test.mjs` executes the actual helper, quick-save and async recognition handler from `public/app.js` with synthetic originals and classifier replies in isolated VM. Coverage: strongly recognized shoes, category-only Bottoms subtype Unknown, successful atomic human color commit, removed control for forged/restored proof, mask/crop/duplicate/ownership disputes, manual corrections, source/scene/hint/category/type/owner/DB changes, pending scan, blank source, bad color, cross-session token reuse.

Existing parent recognition direct-handler tests are retained and updated to inject the actual new helper rather than duplicated test logic. Full Node regression and build via a no-deploy CI workflow.

## Integration requirements

- Branch is stacked on **draft PR #279**, itself stacked on original-recognition safety PR #234. Don't copy `public/app.js` wholesale over the newer Family Alpha staging/avatar branch; cherry-pick/reconcile the small proof helpers and eligibility changes only after parent review.
- No merged or deployed code, paid AI, SMTP or Supabase/Cloudflare changes, customer photos, staging account access, or Drive Duel work.
- Four-account RLS/private storage and actual physical-phone camera tests remain release blockers. Do not interpret synthetic tests as category or color accuracy metrics.

**Expected review verdict: HOLD until branch tests pass and main conversation approves integration.**
