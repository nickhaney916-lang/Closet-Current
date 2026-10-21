# Closet Current — original photo to owned-wardrobe outfit save safety

October 20, 2026 Pacific. Isolated development continuation stacked on PR #110 exact SHA `ba4e2155fed86174a4043b0f8bf08334bda42ecf`. Parallel Work owns the new independent real garment recognition benchmark. No overlapping manifest, model, garment mask or vector changes.

## Reproduced cross-feature failure

The existing `Style this` customer journey uses the new garment's saved photo plus the existing owner's wardrobe to recommend three outfits. Previously, the **Preview on model** link pinned image/category/type during asynchronous board loading but did not guard all source changes or confirm the database was still linked to the signed-in user. The **Save outfit** link checked owner ID and selection object before queuing storage but did not revalidate garment identity **when the queued IndexedDB write actually started**.

If a saved piece was re-photographed, had its color/category/season corrected or the account changed while an outfit was waiting, an old option containing the same garment IDs could still be persisted or previewed. The matcher would not knowingly include another account's item, but stale source metadata at final write could produce a saved outfit inconsistent with the options the user actually saw.

## Bounded fix

- `public/closet-stylist.js`: `stylistSelectedSources` captures immutable primitive details for each chosen slot: slot, saved garment ID, full displayed image identity, category, subtype, color, pattern and seasons. `stylistSourcesCurrent` rechecks each property and confirms the authenticated user still owns the actual active IndexedDB. The same check protects model preview and **Save outfit**; changing preferences, switching the selected item or replacing a garment invalidates the earlier option.
- `public/outfit-board.js`: the existing transaction API gains an optional `sourceStillCurrent` callback, evaluated **inside the queued write immediately before the transaction**. An invalid callback prevents any save and returns clear `This outfit or closet changed. Create outfits again before saving.` feedback. Other ordinary board-saving routes need not pass the optional callback; previous behavior and tenant checks are unchanged.
- A successful save still includes the anchored newly owned article and uses only local saved wardrobe entries; outfits are not generated using shopping placeholders or unsaved suggestions. Existing preference-based options, dress/bottom exclusivity, one-piece swaps, and original high-resolution recognition remain unchanged.
- The guard uses live in-memory owner/garment data. A separate cloud synchronization service can still produce external changes after a transaction has begun; this is not a remote atomic distributed lock or proof that production cloud permissions are correct.

## QA evidence and launch boundary

- New `tests/stylist-owned-source-commit.test.cjs` covers correct owner, re-photographed garment with same ID, category/dress and color/pattern/season changes, removed wardrobe pieces, cross-account DB swaps, and a valid delayed write. Older `tests/outfit-save-recovery.test.cjs` now uses an actual mocked signed-in database association and tests color/category changes during preview readiness.
- Dedicated `.github/workflows/owned-style-source-commit-qa.yml` runs full app build and Node tests; original-RGB camera, review asset and release-veto gates; plus actual `scripts/test-style-my-new-item-mobile.mjs` in both Chromium and WebKit **mobile emulation**, including the real customer-facing `Style this` flow.
- `scripts/verify-camera-cloud-integration.mjs` pins both customer-modified files to **exact reviewed Git blob commits**, guarding against broad unrelated customer source edits; only named tests/docs/workflow are allowed. This is a draft-only safety improvement. The CI run at the final exact PR head must be checked before reporting completed verification.
- No hosted Supabase Auth/RPC settings changed, no paid AI activated, no customer photos accessed from the server, no deployment, no merge, no Drive Duel modifications. Actual physical Android/iPhone checks and account-isolated production cloud restore remain separate pilot requirements.
