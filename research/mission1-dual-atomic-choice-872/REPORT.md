# Closet Current — Mission 1 P872: exact confirmed model suggestion application

**Family Alpha HOLD #255 OPEN. Draft-only, unmerged, undeployed.**
Parent: [Mission 1 P871 #1064](https://github.com/nickhaney916-lang/Closet-Current/pull/1064), exact head `d9ce392233f0ea3a3e6e6f037c3af8239ebca1d0`, [NO DEPLOY CI #43513580028](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43513580028) passed 584/584 native tests and six desktop browser safety profiles.

## Source-verified issue
`public/dual-panel-82.mjs` `choose.onclick` previously called `onChoose(...)`, then unconditionally stated **Your unsaved draft was updated**. But `public/app.js` applies the chosen category conditionally, and only applies subtype if it exists in the current type-select options. When a candidate is unrepresentable or editor state changes, the subtype may remain unset with an incorrect success notice. Genuine P82 model candidate labels currently align with taxonomy, so this is a fail-closed integration defense, **not a measured incident of a wrong garment save or a recognition accuracy improvement**.

## Code fix
- `app.js` validates proposed category and subtype against the actual `clothingSchema.types` before modifying either field, preventing partial updates from invalid taxonomy.
- It dispatches normal form input events as before (preserving owner review invalidation), and returns `true` **only** after both corresponding DOM selects and the actual reviewed draft equal the proposed values.
- `dual-panel-82.mjs` accepts only strict `true` from that application callback. Any unsuccessful application clears suggestions, keeps the owner draft without a misleading success notice, and displays **No suggestion applied**.
- Browser safety fixture now models a callback that rejects the choice; across Chromium and WebKit at 320px, 390px and 430px it must not apply a suggestion, save any clothing, or claim successful update. The normal valid owner-confirmed application path remains tested.

## Reproducible tests
Exact immutable-parent research-only CI changes only `public/dual-panel-82.mjs`, `public/app.js`, `scripts/test-p82-review-browser.mjs`, this report, and its no-deploy workflow. Runs both builds, all native tests, original JPEG/IndexedDB retention/reload/Remove on desktop Chromium and WebKit, 6 browser policy profiles with stale owner/draft/consent failures, footwear grouping and release BLOCKED evidence. **Do not claim final-head green before run finishes**.

## Boundaries and blockers
No changes to model weights, ranking, source originals, private wardrobes, production/staging, hosted Supabase, Family Alpha #255, WebKit model enablement, 2D fallback, recognition learning or owner cloud writes. Existing 48 public development JPEG results are not blind independent accuracy. Parallel #83 retains continuous WebKit real-model crash investigation. Physical phone and independent human-labelled, source-disjoint photo acceptance remain blocked. **No 10/10 recognition or family trial claim.**
