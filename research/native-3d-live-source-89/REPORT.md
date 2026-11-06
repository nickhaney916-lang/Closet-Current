# Priority #89 — Visible 3D source revocation on owner-private saved-outfit changes

**Research only. Family Alpha Issue #255 HOLD. Do not merge or deploy.**

Starting verified source: #88 draft PR #643 HEAD `8399c82d786f47cf13e9e837d6af6e9f582950ae`, [strict dedicated 163-bone research CI #42142234228](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42142234228), 821/821 Node, 12/12 donor, 3 actual native Chromium widths, 15 real browser screenshot audits and source switch during WebGL lazy import.

## Actual uncovered safety gap

#88 detects a saved-outfit change while the source-photographed 3D scene **loads**, but a preview already visible after successful `open()` remains mounted when the user's saved Outfit Builder changes. An asynchronous account-local saved board update, Style operation, reload or selection change can leave the original licensed photographed dress visible against a different current saved outfit. Neither source-photo privacy nor source provenance is strengthened by displaying old clothing after the owner changes the selection.

## Solution, without application/production edits

The research-only native bridge now retains the same source-confirmed #88 owner, selected index, original saved row ID, pinned donor ID, saved outfit display name, and exact garment slot IDs **while the 3D scene is visible**. The controller observes user-native rendered saved-outfit and board slot updates using a `MutationObserver`, and additionally checks every public `state()` request (covers silent programmatic updates without a DOM change). If the selected saved outfit is no longer identical or native owner auth becomes invalid, it immediately destroys the **read-only donor viewer**, revokes the displayed source admission, and clears the visible source photo while **leaving the owner's saved board, original JPEG and existing valid consumer session untouched**. Reopening is an explicit fresh admission; no automatic mesh substitution.

No new clothing geometry, model predictions, WebGL renderer changes, cloud policies, released UI or saved photo alterations.

## Acceptance

- New Node tests for unchanged owner/source, post-open saved index change, same-index dress/shoe slot changes, revised display name and donor ID, dirty edits, observer and state getter behavior, and no saving/writes.
- Actual Chromium at 390 CSS pixels: open existing verified 163-bone source-photographed dress from pinned independent PR541 donor, capture front/side/rear, programmatically change the *same native saved Outfit Builder controller* to a different existing saved outfit while 3D still visible, demand source-photo/canvas removal and still-valid owner, confirm original private database exact unchanged, capture one real source-revoked UI screenshot and SHA-audit it, reselect original saved outfit, and confirm the real 163-bone dress reopens. 320 and 430 CSS widths also independently verify normal true source-photographed 163-bone WebGL source and owner-private fallback.
- Existing independent NATIVE05 audit verifies 15 original Chromium native screenshot PNG SHA/dimensions; NATIVE89 checks the additional revoked view screenshot separately.
- Pinned test-only dependencies and strict exact #88 parent ancestry / changed-path no-deploy CI. Inherited CAMERA/INDEX Node tests retained.

**Limits:** real signed Supabase cross-account server authorization, physically tested Android/iPhone camera, 10/10 human photo-fitting realism and arbitrary photographed fabric are not accepted by this task. It is a source-integrity/security safeguard, not a new fabric-fit accuracy improvement. Historical strict PR-wide research branch checks may still fail at unchanged ancestor allowlists; do not disable. Engineering verdict **PENDING** final exact-HEAD GitHub Actions; scientific garment realism **NEEDS REWORK**. Family Alpha HOLD.
