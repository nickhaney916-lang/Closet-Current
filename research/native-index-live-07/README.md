# NATIVE-INDEX-LIVE-07 — newly photographed garment immediately available in private outfits (HOLD)

**Parent:** PR #559 exact verified `e060d033b1a05f1d8a990c0ae1b6864cb5d7fd72`. Research branch only; no merge, deployment, production or staging change.

## Source defect and fix

The existing actual `public/app.js` saves user-confirmed clothing after the owner opened Outfit Builder, but PR #556 `research/native-consumer-board-04/consumer-board-controller.mjs` loaded the saved-item roster **once**. `setSlot` therefore evaluated the owner-compatible ID against stale `wardrobe` and rejected a genuinely captured newly saved garment until a full reload, which risks discarding unsaved clothing arrangements.

- Add a **read-only, epoch-attested, owner-isolated `refreshWardrobe()`** to the real native consumer Outfit Builder. It uses the existing owner-scoped IndexedDB read with exact active token generation and refuses foreign-owner records, duplicate item IDs, changed outfit-board fingerprint and changed login during read.
- It updates only the in-memory saved garment list and re-renders, **never** mutating selected saved outfit, private original JPEG, 3D source identity, unsaved edit draft, expected board CAS, or cloud record.
- The native app invokes it **only after committed item mutations** (manually imported or captured photo save, existing clothing correction/removal and safe recognition auto-save), under a fourth explicit opt-in `nativeIndex07=research`. Pending photo drafts do not trigger it. The index source INDEX-01/02 and INDEX-04 quality gate are inherited unmodified.
- Use all research gates in the integrated browser `?nativeLossless04=research&native3D05=research&restoreAtomic01=research&nativeIndex07=research&index02=after&index04=after&captureProof01=after`. Original/default production remains unchanged.

## Genuine acceptance harness

`scripts/test-native-index-live-07-browser.mjs` runs 320/390/430px Chromium mobile on the *original actual native app + native authentication code*, with synthetic **Supabase auth HTTP responses only** and real owner IndexedDB. It proves:

1. Existing signed-in owner A saved outfits are recovered by genuine V4 atomic restore from simulated data loss.
2. User selects and edits an existing saved outfit, leaving a deliberately **unsaved** draft.
3. A distinct independently licensed and SHA-pinned genuine red T-shirt JPEG (`commons-0002`) arrives through the **actual native photo-file control**, retains full original JPEG bytes and SHA-256. Any neural recognition result is **not trusted**; the user chooses Tops / T-shirt / Red in the real Adjust form and saves to actual owner IndexedDB.
4. Existing INDEX-01/02 index shows the new original photographed Tops / Red item, no additional page reload.
5. The existing native Outfit Builder can select the just-saved new clothing ID and preserve other missing reference IDs and the **in-flight unsaved** draft. Existing BOARD02 owner CAS explicitly saves; other saved dress outfit unaffected.
6. V4 backup includes the new original JPEG, hand-reviewed category and updated saved-outfit references; a second simulated data loss and atomic restore return them exactly.
7. Actual 163-bone pinned PR #541 licensed dress 3D WebGL renders front/side/rear, with unsupported jacket/coat/shoes honest original-photo-only fallback. Active-view restore is rejected. Logout removes old preview and owner B cannot import owner A's file.
8. 18 actual nonblank viewport PNG SHA audited + three contact galleries; inherited #559 60 browser screenshot regressions and all Node tests run in the dedicated no-deploy workflow.

This is *not* proof of fresh trained classifier accuracy, real camera hardware, arbitrary-source garment mesh fitting, server-signed Supabase RLS, real cross-device cloud restore, physical Android/iPhone acceptance or 10/10 photorealism. **Family Alpha #255 HOLD, releaseAuthorized=false.** Verify final GitHub Actions and contact sheets before claiming acceptance. Narrow legacy research workflows may intentionally fail on combined source scope, and must not be weakened.
