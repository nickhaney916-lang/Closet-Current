# Mission 1 P784 — native reviewed capture subtype validity (research only)

Base (pinned, independently verified P774 integration): `bba0c0ced654230f9555cf264c7c332fc5fdc590`.
Branch: `research/mission1-native-catalog-review-784-HOLD`. Family Alpha **HOLD #255**. No merge, no deploy, no production/staging, no hosted account or Supabase edits.

## Reproduced defect

The native app displayed `Other` under **Dresses / Item type** although the original-photo, owner-bound P119 commit accepts only category/type pairs from `public/local-catalog.mjs`. The genuine CC BY original / real SegFormer research path proved that selecting `Other`, checking both boxes, and clicking Save remained rejected. This is correct fail-closed storage, but misleading UI.

## Scoped correction

For **new** original-photo native-reviewed captures only, the form now removes `Other` across the app's categories, explicitly explains that `Unknown` is a placeholder, and preflights the exact local catalog before invoking private commit. Unsupported categories/subtypes never write to IDB or bypass original JPEG SHA, capture lease, two owner checkboxes, account binding, or atomic save. `Unknown` stays selectable during review but cannot complete private save. Existing saved-piece editors and normal non-research controls retain their original `Other` choices; historical records are not remapped or deleted.

The real-image B0→native form→IDB Chromium/WebKit runner now checks absence of `Other`, explicit refusal of `Unknown` with draft preserved, followed by deliberate *simulated* supported `Dresses / Casual dress / Black` selection and successful private IndexedDB write. This screenshot/browser test does not independently verify the color or garment subtype, the model's published accuracy, a real human, a real hosted signed account, or an actual physical phone.

## Acceptance / exclusion

- Run `node --test tests/mission1-reviewed-catalog-type-784.test.mjs` to verify each category's supported UI subtype subset exactly matches local catalog candidates.
- Run the dedicated `.github/workflows/mission1-native-catalog-review-784-no-deploy.yml`: protected parent and diff allowlist, full native regression, actual Chromium/WebKit original-photo browser flow and report receipt, no deployment.
- Future genuine two-human blind ground truth, new rights-cleared source photos, unseen independent recognition accuracy, source-fit 3D realism and real Android/iOS acceptance remain **unmet**. Do not mark Mission 1 complete or Family Alpha release ready.
