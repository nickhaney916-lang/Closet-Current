# Closet Current — Priority #117 / OWNER-INDEXEDDB-ATOMIC-COMMIT-117

**RESEARCH ONLY • Family Alpha Issue #255 HOLD • NEVER merge or deploy; never modify production or existing staging.**

## Pinned parent and actual scope

Parent #116 [draft PR #670](https://github.com/nickhaney916-lang/Closet-Current/pull/670), SHA `758fee507505037735126d07c5203ef4ebd64896`, dedicated [green no-deploy run #42311154530](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42311154530): 1,058/1,058 inherited Node tests PASS, 9/9 two-JPEG cutout tests PASS. Parallel #48 separately owns scientific genuine-photograph recognition accuracy; #47 owns saved-outfit-to-3D mobile integration.

### Actual defect/risk

P114 and P116 independently inspect the original JPEG/source SHA-256 and source/recognition metadata **before** returning a research automatic-index decision. But the existing app's eventual IndexedDB item write is separate from that check and could read a newer saved wardrobe/draft or lose the owner's pending edits. Existing default app `saveIndexed` uses a transaction, but **does not repeat P114/P116 source/recognition/duplicate validation inside its transaction**. A source that was unique when verified could become a duplicate during the async proof. A pending draft edited in another flow could be replaced by a stale snapshot.

### Research implementation

A new **opt-in standalone** `commitOriginalPhotoToPrivateCloset117` adapter calls P116's complete asynchronous original-JPEG and reviewed metadata verifier against a live **actual owner-scoped IndexedDB snapshot**. It then uses exactly one IndexedDB **readwrite** transaction on the real `items` and `state` stores to:
- Re-read all live saved garment entries and the current saved draft.
- Reject changes to the old normalized snapshot, original-photo source claim, model/correction fields, signed owner and current capture lease.
- Reject duplicate IDs and identical or ambiguous verified original source hashes by rebuilding the owner index **inside** that transaction.
- Insert the newly admitted, copied garment using **add**, never a silent overwrite via put.
- Preserve all other unsaved draft garments, unknown draft metadata and original JPEG bytes, while removing only the newly inserted garment from the stored pending draft.
- Abort **both** item insert and draft update when the lease is revoked even after an item insert request is staged.

The program does not upload, access cloud, write to other users' DB names, reconstruct user photos, or claim signed JWT/RLS. Its response only reports a frozen `saved` / `review-required` verdict and a research HOLD state; it returns no owner identifiers, source hashes, photo bytes or other clothing records.

### Real Chromium browser storage acceptance (added in P117)

The independent `scripts/test-owner-indexeddb-commit-117-browser.mjs` test hosts only local research modules on loopback HTTP and executes real **Chromium WebCrypto + IndexedDB** using the original repository public-license JPEG at **320, 390 and 430 CSS px** mobile-style viewport widths. It checks successful one-transaction item/draft change, unchanged original JPEG and SHA identity, non-target draft preservation, repeat-save denial, owner-database mismatch rejection, and absence of private JPEG/source hash/owner ID in the returned result. A public-source research fixture is the only photograph used. The browser job emits a machine-readable evidence JSON with explicit flags that this does **not** prove scientific model accuracy, physical phone acceptance, cloud RLS or the shipping app path.

### Independent technical acceptance

A dedicated no-deploy GitHub Actions job runs real `fake-indexeddb` stores, the original genuine public-license JPEG source bytes from the repo, actual WebCrypto SHA verification, full old Node tests, new transaction tests, and a separate genuine Chromium browser storage job. Test cases cover successful one-transaction save and preserving unrelated drafts, missing color review, multi-garment review-only, source and ID duplicates, signed-owner rotation during SHA, review mutation, an intervening saved wardrobe addition, intervening draft edits, explicit lease revocation **after staged item add**, two concurrent saves (at most one committed), foreign-owner entry, foreign DB, stale draft-original mismatch and privacy/no production source change.

**New JPEG input is a genuine public-licensed photograph but category/type/color statements in tests remain synthetic fixture labels, not actual model output or scientific accuracy evidence.** Browser/physical phone acceptance is not part of this priority.

### Explicit limitations

**This is a research adapter, NOT wired into the shipping app**. Therefore a passing test proves its isolated IndexedDB transaction behavior, **not that live users already benefit**. It does not prove authenticated cloud JWT/RLS, actual account sign-out notification revocation after a transaction has completed, a race-free entire remote backup workflow, scientific multi-garment instance segmentation, trained-model subtype or color accuracy, physical iPhone/Android acceptance or 10/10 photorealistic 3D. It cannot stop user edits after a transaction is durably committed; live integration would need explicit lease lifecycle plus independently authorized browser acceptance.

**Legacy INDEX-04 strict workflow on accumulated research branch is independently known to fail its historical narrow path allowlist.** This is a scope-check conflict (the old workflow rejects `.github/workflows/allowlisted-review-snapshot-78-no-deploy.yml`, inherited long before #117), not evidence that tests passed or failed. The dedicated P117 exact-head no-deploy workflow is authoritative for this isolated priority; we will not weaken existing guardrails or claim all legacy workflows green.

**Family Alpha HOLD. No production/staging modification, merge, deploy or unauthorized other-project changes.**
