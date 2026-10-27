# Closet Current — retain manual photo fit adjustments across re-preview, in memory only

**2026-10-27 · Family Alpha issue #255 · No-deploy developer HOLD**

## User-visible problem

The current verified [PR #333](https://github.com/nickhaney916-lang/Closet-Current/pull/333) gives the user large Up / Down / Left / Right / Larger / Smaller / Reset buttons to position an independently reviewed transparent garment on the existing 2D human. However, when the same look is reopened, the whole 2D preview rerenders and the human's adjustments disappear. That makes iteratively comparing 3 looks frustrating, while saving those adjustments to wardrobe / favorite / cloud is not yet secure or visually accepted.

This isolated extension solves **only this ephemeral preview continuity problem**. It does not bend sleeves, introduce better garment extraction, fabricate texture, or claim photorealistic fit. Work #37/#38 remain independent, no overlapping source changes.

## Implementation

- A **single in-memory session store**, created in the same offline-only Style My New Clothes boot as the existing preview, bounded to **24 small geometry records**. Store never contains photos, PNG data URLs, JWTs, raw image bytes, passwords or user metadata.
- Every record is bound to a verified tuple: **signed-in owner UUID, session generation, exact garment item ID, 2D slot, and SHA-256 fingerprint of the current approved transparent PNG data URI**. A changed mask/cutout, item, slot, account, or session cannot pick up a former garment's displacement.
- An adjustment uses the unchanged rigid fit constraints (horizontal and vertical offsets within 9% / 10%, identical X/Y scaling 0.78–1.22, reject clipping). Up/Down and scale are restored only if they still satisfy the *new* safe base fit bounds; otherwise original positioning is kept.
- Switching outfit looks or reopening the same look in that signed-in session replays only matching adjustments. User can Reset to original placement; the reset is reflected in memory. Repeating review of the original JPEG/cutout remains mandatory and no "approved" flag is created or inferred.
- **On account change, sign-out, session generation change, pagehide or unload**, cached records are cleared; old async renders cannot install controls into a new owner's preview. No localStorage, sessionStorage, IndexedDB, browser persistence, cloud, Auth settings or network calls.
- **Single shoe photo references remain outside the adjustable slots**. No change to existing footwear, human eraser, original-JPEG indexing, RGB, confirmed mask identity, source/owner audit, clothes inventory, atomic save or style recommendations.
- The UI continues to explicitly state: preview only; **not saved to outfit or account**.

## No-deploy source pin and test plan

The output `dist-family-alpha-40-session-fit-HOLD` is copied from the [PR #337](https://github.com/nickhaney916-lang/Closet-Current/pull/337) source-checked staging-safe #333 candidate; exactly its private Style New Clothes boot file, the existing manual-fit control module and one new session-fit module may change. A recursive byte-for-byte audit enforces this and checks all inherited disabled stage Auth/Cloud assets.

Isolated Node tests cover same-source rerender cache, wrong image, wrong item, wrong slot, account/user changes, session epoch changes, malformed source SHA, bounds, cache eviction, release flag tampering, and unchanged parent. Full offline Chromium/WebKit test replays actual synthetic original-JPEG Adjust→manual alpha cleanup→3 outfit preview→change top position→reopen same look→repeat exact reviewed cutout→verify matching position and unchanged transparent PNG→Reset→shoe reference→swap/favorite save/reload→atomic quota rollback.

The test uses synthetic fixtures and mocked Auth/Cloud and is **not** a certified real JWT isolation, physical Android/iOS, real garment visual quality or 3D drape test.

## Remaining HOLD

No real licensed photo has been finally accepted as naturally worn on the 2D humanoid. The licensed 15-photo benchmark remains 0 approved; 8 have no usable cutout. Work #37 [draft PR #334](https://github.com/nickhaney916-lang/Closet-Current/pull/334) and Work #38 [draft PR #336](https://github.com/nickhaney916-lang/Closet-Current/pull/336) are incomplete; Work #39 not verified. Four-account Family Alpha cannot proceed until user approves real garment appearance, four unique staging users and live JWT cross-account / physical phone results are verified.

No merges, staging or production deployments, provider changes, paid services, real family photos, spending, Drive Duel or automatic Work assignments.
