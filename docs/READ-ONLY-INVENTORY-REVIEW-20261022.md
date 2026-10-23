# Closet Current — Read-only recovery inventory drift safeguard

**As of October 22, 2026.** This is an **undeployed, disabled account-deletion incident review module**, not an erasure workflow, API, public feature or recovery authorization.

## Independent finding corrected

Work [issue #196](https://github.com/nickhaney916-lang/Closet-Current/issues/196) demonstrated that two back-to-back recovery assessments can both say `privatePhotoObjectsPresent=true` while an uploaded original photo is inserted between assessments. The former `recovery-handoff.mjs` compared only boolean presence/backup/Auth/locks, so it could emit a **non-authorizing** handoff packet despite changed private photo content-address names.

The earlier staging [PR #205](https://github.com/nickhaney916-lang/Closet-Current/pull/205) subsequently validated 4-page owner-specific Storage listing and orphan discovery with an actual, disposable localhost Supabase stack. That confirmed owner-scoped photo-name pagination works in the tested local API but did not provide a write-fenced complete account-erasure solution.

## Exact changes

- New **server-only** `createDeletionReviewPhotoInventory` accepts a privileged, injected **read-only** `listPage({uid,limit:100,offset})`. It walks at most 10,000 filename entries, rejects malformed/out-of-order/duplicate/nested data and refuses ambiguous, over-limit listings. It calculates an owner-namespaced SHA-256 over the exact ordered set of content-addressed JPEG filenames, returning **no UID, path or object names**.
- `createDeletionRecoveryHandoff` now requires the injected `readPhotoInventory` dependency; after independent worker fence verification it obtains a strongly shape-checked owner-scoped inventory. After dual human approvals, it repeats the inventory and rejects **any SHA or object-count change**, even if `privatePhotoObjectsPresent` stayed true. If an inventory cannot be produced or conflicts with presence, it **fails closed**. It also passes the fingerprint to privileged human-approval verifiers so the proofs can bind to a specific snapshot.
- Previously non-authorizing Work #196 negative control now **rejects changed original-photo inventory**. Additional tests cover 237 objects across three pages, same-count swaps, bad/malformed/duplicate pagination and bounded failure.
- Previous source files `public/`, cloud deletion coordinator/adapters, SQL/migrations, Auth/Storage paths and disabled HTTP endpoint remain **byte-for-byte unchanged** from the earlier [draft PR #205](https://github.com/nickhaney916-lang/Closet-Current/pull/205).

## Cautions and explicit non-claims

This is **snapshot drift detection of reported photo names** under an independently attested fence, not proof of image bytes, complete provider inventory, server-side Storage write locks, transactional cloud state, stable paginated snapshot under races, JWT revocation, backup/log erasure, nor an operational delete/recovery service. A lying or incompletely scoped privileged list adapter can still return a false snapshot. The code remains imported nowhere in the deployed web bundle or HTTP deletion entrypoint. No erasure receipt, unlock/tombstone release or destructive capability is issued.

**No Cloudflare/Supabase settings, SQL migration, production app or paid inference changed; no hosted, personal-data or destructive test.** Work issue #204 independently handles outfit-image provenance. Actual account deletion remains intentionally `503`, `deletionCompleted:false`.

## Acceptance evidence

See the branch-specific GitHub Actions `read-only-inventory-review-qa.yml`: full Node suite, independent issue #196 network-denied recovery cases, source scope check, and stage-specific documentation. Record **exact-head SUCCESS and actual test totals**, if achieved, rather than assuming the previous 1,701-pass integration remains green.
