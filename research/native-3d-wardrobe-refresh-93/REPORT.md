# Closet Current — Priority #93 — Post-open private wardrobe refresh invalidates photographic 3D

**Research-only / Family Alpha Issue #255 HOLD / NO PRODUCTION OR EXISTING STAGING DEPLOYMENT.**

**Verified parent:** [Priority #92 draft PR #647](https://github.com/nickhaney916-lang/Closet-Current/pull/647), exact commit `201a63957799bac066983ccc3818aa5d1320d738`, green [strict dedicated CI #42150514138](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42150514138): 847/847 full Node tests; 12/12 original independently pinned 163-bone donor tests; three actual Chromium 320/390/430 WebGL mobile-width cases and 18/18 screenshot audits. Historical narrow ancestor scope-gates continue to block merge.

## Specific gap

#92 independently hashes the original photographed JPEG bytes with browser WebCrypto at two 3D admission boundaries: before donor dynamic import and after slow WebGL loading. The already-visible scene then uses #91 metadata-bound source checks. An owner-private garment photo changed **after** successful 3D loading under the same garment ID and with both saved SHA metadata fields unchanged cannot be detected by the synchronous metadata watcher. If the actual native wardrobe is refreshed from private IndexedDB, the old 3D scene must be invalidated **even when all visible item IDs and SHA metadata match**.

## Scoped solution

The authenticated research-only native consumer Outfit Builder increments a monotonic **owner-private wardrobe snapshot revision** whenever it successfully adopts a new wardrobe snapshot via initial load or `refreshWardrobe()`. A strictly gated `readOnlyWardrobeRevision93()` returns only owner ID, original authenticated session generation and the revision integer; never JPEG bytes, tokens or a new write interface.

The native 3D viewer captures this revision alongside its saved-outfit, original garment IDs, original JPEG SHA metadata receipt and byte-level WebCrypto attestation. It fails closed if that revision changes at any existing async WebGL admission boundary. An already-open 163-bone scene uses its current native Outfit Builder DOM mutation observer and public preview state check to **destroy the old private photograph and rendered rig** after a wardrobe refresh, even if the underlying source SHA metadata and garment IDs have not changed. Reopening requires explicit user selection and both independent #92 cryptographic JPEG checks; corrupted original bytes with unchanged SHA remain rejected.

This design conservatively closes the 3D preview on *every* adopted wardrobe refresh, including an unrelated clothing addition or a refresh with identical photos. That can inconvenience users but eliminates the hazardous assumption that unchanged SHA metadata implies unchanged bytes. No continuous SHA hashing on each animation frame and no background photo database watcher. It cannot detect an out-of-band photo alteration that the original Outfit Builder has **not** refreshed. These remain explicitly documented limitations.

No alteration of original JPEGs in actual app code, approved 3D rig, source donor, private outfit CAS/writes, production, existing staging, model classifiers, or parallel Work #90 photographed fabric realism.

## Independent acceptance

- Eight pure Node regressions verify unchanged epoch acceptance; new adopted snapshot revocation, token generation/owner changes, malformed or missing epoch guard, gated source-free read-only epoch, actual bridge in-flight and post-render source revocation, and real browser source replacement evidence.
- Actual 390px Chromium with real pre-rendered original Commons-licensed JPEG dress on pinned PR541 163-bone WebGL: secretly replace its original bytes in the owner A private IndexedDB with *different* licensed JPEG while keeping garment ID and BOTH SHA metadata fields unchanged; call the **real** `nativeLossless04Bridge.refreshWardrobe()`. The viewer must revoke the old 3D/photo **automatically through the native DOM watcher before any viewer state getter forces cleanup**, keep the valid native session and exact saved outfit unchanged, and reject attempts to reopen corrupt photo through #92 WebCrypto. Restore original JPEG, refresh the owner wardrobe and successfully reopen original 163-bone source-verified outfit.
- Inherit all #88 in-import saved outfit race, #89 live saved selection switch, #91 same-ID changed-SHA source correction, #92 original-byte mismatch before donor, pinned independent 12 3D donor tests, 320/390/430 genuine Chromium WebGL views, 15 source photos with nine real 3D views, 3 independent original stale/changed/forged screenshot audits, and add 1 independent new revocation screenshot audit = **19 browser screenshot evidence files** (assuming CI passes).
- Dedicated strict exact #92 verified parent and research-only changed-file no-deployment GitHub CI.

**Engineering verification: PENDING exact-head CI.** No claim of real physical Android/iPhone testing, signed Supabase RLS with real customer accounts, continuous background database monitoring, real scientific ML classification accuracy or photorealistic fabric quality. The separate Work #90 research is independent. Family Alpha HOLD, research PR draft/unmerged; no staging/production changes.
