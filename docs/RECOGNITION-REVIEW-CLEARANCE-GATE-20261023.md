# Closet Current — Recognition review flag admission order

**October 23, 2026 PT** · Safety regression on PR #234 exact head `a247124e40e17b22baa7462dd6bd0555a63062db` · independent main-conversation change · no deployment.

## Reproduced source-level problem

`public/app.js` function `recognizeItem(item)` originally set `item.recognitionReviewRequired=false` immediately after confirming a model category/type combination, **before** returning early for other safety checks:

1. Model proposes strong but garment segmentation, clipping or mask evidence disagrees with the source/category.
2. User has already manually adjusted the item, so recognition must not silently override their corrections.
3. An unverified multi-garment `original-crop` fallback may include multiple pieces/background.
4. Photo color is unknown, a duplicate requires comparison or owner confirmation is pending.

Those cases previously returned with a stale *review-cleared* flag even though the UI indicated “Needs review,” “Use Adjust” or “Choose a color.” The usual atomic `saveIndexed` path still checked segmentation and input provenance, so this is **not proof that a privacy leak or bad photo auto-save occurred**. It is nonetheless an unsafe admission-state mismatch and a future integration regression risk.

## Minimal scoped fix

Move the single review-clearance assignment to immediately before the final verified automatic save, after classification support, mask/category consistency, manual edits, unverified original-source-crop fallbacks, required color, duplicate detection and ownership confirmation.

- At the start of a recognition request the flag is set to **true**, and all uncertain/abstaining/pending branches retain it.
- A valid recognized category+color may clear it only after the complete gate; specific type remains optional and `Unknown` is permitted when an approved category-only prediction is the most defensible result.
- The original source and scan epoch are checked as before; no masks, photo pixels, recognition vectors, cutout preparation or cloud policies are modified.
- A previously adjusted item retains user authority and is never auto-saved by a late classifier response.
- No confidence numbers, category predictions, appearance transformations or learned weights were changed.

## Direct dynamic tests

`tests/recognition-review-clearance-gate.test.mjs` loads the real `async function recognizeItem(item)` from `public/app.js` into an isolated Node VM and supplies only synthetic photos, categories and simulated classifier replies. The test checks actual handler behavior, **not a reimplementation of the gate**.

It includes:
- Strong proposed shoes/sneakers on a valid synthetic source and matching mask → final save allowed.
- Category-only bottoms, subtype `Unknown`, valid color → final save allowed without fabricating skirt/shorts.
- Strong or category-only mismatched mask, original-outfit region fallback, user adjustment, category conflict, missing color, possible duplicate, ownership confirmation, abstaining classifier and replaced original during delayed result → **no automatic save, review flag remains true**.
- Blank original photo skipped without auto-save.

Running these tests does **not** measure real garment recognition model accuracy. The inherited PR #234 benchmark measured 47/56 correct broad categories, including shoes 19/20, dresses 7/9 and bottoms 12/13 on previously reviewed public photos. That result is unchanged by this state-management fix. Real shoelace/skirt/dress recognition errors, segmentation masks, shadow-color accuracy, user-photographed original JPEG quality and on-device camera testing remain open.

## Integration / release constraints

Branch is stacked on #234 and does **not** change its parent PR, the current staging/email work, Supabase/Cloudflare, source photos, model weights, billing, family accounts or Drive Duel. This app.js snapshot is part of the **recognition-specific PR #234 stack**, while the separate Family Alpha staging stack has additional Auth/UI changes. Main conversation must reconcile changes rather than merge recognition code wholesale over newer Family Alpha code.

**Family Alpha HOLD.** Do not merge, deploy, incur expenses, claim actual real-photo recognition quality or use customer photos. User asked to pause verified Resend/Supabase SMTP work until tomorrow morning; that work is unchanged by this PR.
