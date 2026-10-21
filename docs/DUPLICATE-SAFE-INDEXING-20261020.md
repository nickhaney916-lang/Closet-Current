# Duplicate-safe automatic closet indexing — October 20, 2026

**Development-only draft stacked on verified PR #104. No production merge, deployment, paid service or hosted Auth/closet access.**

## Found and fixed

1. **Incomplete original-backed outfit candidates could be dropped.** `exactlyRepeatedCapturedItem` treated a repeated-looking display preview as an exact duplicate when the proposed outfit piece had no original full-scene JPEG or original unmasked recognition crop. Two distinct real garments—such as a jacket over a shirt, shoes and shorts, or adjacent skirt/dress candidates—can share a display cutout. The function now automatically suppresses **standalone exact repeats**, and complete same-scene outfit candidates only when supporting original/role/geometry evidence proves identity. **Incomplete outfit-source candidates are not discarded**; they remain in review and cannot be automatically indexed without an original recognition input.

2. **Saved-closet changes during the final write queue were not rechecked.** The classifier checked lookalikes before recognition, then asynchronous storage could wait while a new photo was captured, restored or manually saved. The final save transaction now rechecks the up-to-date in-memory closet **and review queue** for identical display images or conservative visual lookalikes, respecting independently separated original outfit regions. On a conflict it marks the proposed garment for human comparison and **does not write** an extra item. A unique image/signature is still saved normally.

The change deliberately **does not** treat every similar blouse, pair of shoes or layered garment as the same physical article. It does not replace original-photo classification with a masked preview, alter the taxonomy, guess uncertain category/type/color, or silently delete a photo when original evidence is missing.

## Exact regression coverage

Expanded `tests/automatic-indexing.test.cjs` with tests for missing source scene or RGB crop, two incomplete same-preview outfit regions, another saved item appearing before final IndexedDB write, a late visually similar garment, and a distinct photo that must still auto-save. Existing tests cover separate same-scene shirt and pants, skirt versus dress masking conflicts, source/role/geometry identity, source changes during model inference, and manual category changes while saving.

`scripts/verify-camera-cloud-integration.mjs` compares the entire `public/app.js` against the exact prior PR #104 app and permits **only** the two reviewed duplicate-check edits, then checks unchanged original camera/segmentation/recognition and reviewed human model sources. The independent `check-dual-parent-review-integration.mjs` also reconstructs the exact PR #104 application code plus only the two approved changes, then compares unchanged camera/recognition source to the historically reviewed customer parent. The outer provenance verifier validates this single review-script extension against the prior reviewed script byte-for-byte, rather than disabling or bypassing independent source review. This is stricter than a generic file allowlist.

Dedicated workflow `.github/workflows/duplicate-indexing-commit-qa.yml` runs focused tests, full Node suite and build, exact provenance, human review integration and production-release veto. Exact final-head CI status must be confirmed before reporting this discrete development fix completed.

## Known limits / unresolved pilot gates

Mocked and browser-integrated tests cannot guarantee exact article identity, 100% real-photo classification, or physical-device behavior. Independent photographer-reviewed garment captures and pilot duplicates from real closets are still needed, especially shoes, dresses, shorts and skirts. Production private-cloud storage grants, SMTP/redirect configuration, actual external email inboxes, phone device tests and human figure rights/review remain independent blockers.

Nothing has been deployed or merged; no customer data, Drive Duel, paid AI or remote Supabase settings were touched.
