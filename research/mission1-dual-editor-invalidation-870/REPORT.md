# Mission 1 P870 — Immediate invalidation of AI garment advice on silent editor updates

**FAMILY ALPHA HOLD #255 OPEN. DRAFT / UNMERGED / UNDEPLOYED.**
**Immutable base:** Mission 1 [P869 PR #1053](https://github.com/nickhaney916-lang/Closet-Current/pull/1053) exact HEAD `94cf9ec5ee30760d8b710fa3bedd5fd1cfa7a7f6`, [NO DEPLOY CI #43509236572](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43509236572) succeeded, 580/580 native tests.

## Source-verified behavior and problem
P869 detects category/type/color/etc drift at model request boundaries and a subsequent choice click, rejecting stale suggestions before application. However `public/app.js` `clothingFields()` also changes photo-editor fields directly after asynchronous `Fill missing details from photo`, background color detection, or owner-confirmed local learning. These code paths invoke the editor's `onChange` callback without necessarily dispatching a bubbled `input` event, leaving old two-model consent/results *visible* after the owner has modified the actual reviewed draft. A stale proposal was refused on click by P869, but an immediate clear makes that failure obvious and eliminates latent photo-review ambiguity.

## Conservative source fix
- `public/dual-panel-82.mjs`: expose an `invalidate()` capability that clears model results and both explicit consent checkboxes, cancels any pending worker, and updates the panel status. This is inert on closed panels.
- `public/app.js`: invoke `dual82Panel?.invalidate()` inside the existing actual `clothingFields(form,draft,onChange)` callback before resetting normal owner review. This covers automatic and direct editor changes without weakening approval controls.
- Retain P869 per-comparison draft revision checks at all async boundaries. P868 worker cleanup, exact original JPEG and owner/crop/mask/garment binding, no silent saves, 2D fallback, unchanged.

## Evidence and reproducible browser tests
The inherited desktop-browser test script now executes the **actual extracted `app.js` clothingFields+Adjust editor** on Chromium at 390px. It supplies a clearly **synthetic** strong model result from a stubbed localRequest, clicks the real `Fill missing details from photo` button, confirms the subtype is updated programmatically without any external form `input` event, and asserts both model-consent boxes are immediately unchecked, panel shows comparison cleared, and **zero** saved wardrobe writes. This is a true source UI regression for the automatic editor callback and a synthetic model suggestion, **not** a real FashionCLIP inference, external image, physical device or accuracy score.

Inherited policy browser controls in desktop Chromium+WebKit 320/390/430, no-deploy builds and serial native tests must pass. Workflow locks changed paths to exactly 5 and denies code/model/private cloud/production changes. Results must be verified on exact new HEAD.

## Remaining blockers
Current dual model workflow remains opt-in and never auto-admits a garment. Independent human-blind real-photo recognition accuracy, repeated genuine WebKit inference stability (#83), physical Android/iPhone validation (#78), and signed-owner cloud end-to-end testing remain **BLOCKED**. Maintain Family Alpha #255 HOLD; no claim of 10/10 recognition, physical device success, production release, or owner pilot.
