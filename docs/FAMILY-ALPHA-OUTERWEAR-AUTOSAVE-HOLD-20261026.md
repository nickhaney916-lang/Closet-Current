# Family Alpha — Outerwear automatic-save safety HOLD

**October 26, 2026 · Issue #255 · Draft-only staging-integration change.**
No merge, deploy, account creation, customer/family photo use, Supabase/Cloudflare/Resend configuration, paid model inference, production or Drive Duel access.

## Why this change

The archived independently reviewed licensed-photo cohort has **only 1/4 jackets recognized to the correct broad category**. Four examples are too small to estimate population accuracy, but too weak to allow unreviewed outerwear saves with confidence.

The existing source-pinned Family Alpha integration requires a human acknowledgement when an **Outerwear garment is edited through Adjust**. Before this patch, a strongly inferred Outerwear item with a valid color could bypass Adjust and automatically save; an Outerwear item without color could offer the one-tap color-approval path. This allowed an inconsistency between the explicit review intent and automatic admission.

## Narrow isolated fix

`scripts/build-family-alpha-recognition-integrated-hold.mjs` applies `applyOuterwearAutoReviewHold()` only **after** importing coherent original-source worker/recognition modules and the pinned mobile Adjust overlay. It does NOT modify the production `public/app.js` or independently locked source commits.

1. A pending item categorized **Outerwear** may not use the one-tap Choose Color route. That button is not displayed as available.
2. A recognized Outerwear item stays in the review queue even when classification and color checks pass. It tells the tester to use **Adjust**, where the original image, category, item type and color are acknowledged before saving.
3. Existing scan/crop/source freshness, duplicate, ownership, manual-category correction, account-change and queued IndexedDB write protections remain intact.
4. Tops, Bottoms, Dresses and Shoes keep their existing automatic-save policy. A wrongly categorized jacket that appears as **Tops** is not corrected by this gate; improving recognition requires new independently labeled source photos and a true holdout.
5. The patch fails closed if the precise guarded scan and quick-color blocks move, duplicate or change, instead of applying a blind replacement.
6. The held integration manifest records `outerwearAutoSaveHold:true` and the artifact verifier checks for the guard. Neither manifest nor source flag is release authorization.

## Verification scope

`tests/family-alpha-recognition-integrated-hold.test.mjs` checks exact compiled source identity including this safety transform, the order of Outerwear review versus automatic admission, actual compiled quick-color predicate behavior with synthetic Tops/Outerwear entries, failed overlay reapplication and changed-source refusal.

The existing `family-alpha-recognition-combined-hold.yml` workflow is triggered by changes to the integration builder/tests and runs source-locked full Node regressions and synthetic Chromium/WebKit suites. **Report PASS only after an exact-branch Actions run succeeds**. Real clothing-category accuracy is unchanged; no false 100% or physical-phone claim.

## Next steps

Before inviting four family members, test true independent adult account storage and original-photo review in protected staging, then perform consented physical phone capture and fresh holdout recognition evaluation. Do not introduce minor data first. Continue Family Alpha **HOLD**.
