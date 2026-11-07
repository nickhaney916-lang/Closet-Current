# Closet Current — MAIN Priority #137 / CLOUD-RESTORE-OWNER-SAFETY-137

**RESEARCH ONLY / Family Alpha Issue #255 HOLD / DRAFT & UNMERGED / NO PRODUCTION OR EXISTING STAGING MODIFICATION OR DEPLOYMENT.**

## Exact independent parent and ownership

- Source parent: independently green P134 [PR #690](https://github.com/nickhaney916-lang/Closet-Current/pull/690), exact HEAD `59ec81353d03a6a5443c9370f209d7e367456e26`; [strict no-deploy Actions #42386964139](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42386964139) passed all 3 jobs, 1,195/1,195 Node, 8/8 disposable PostgreSQL 17 owner RLS/CAS, and six actual-app inherited Chromium/WebKit browser flows at 320/390/430 with 93 screenshots.
- Parallel #51 P129 signed-owner cloud integration, Parallel #52 mobile UX, Parallel #53 recognition, Parallel #54 storage performance, and separate P131 humanoid realism remain separately owned and unmodified. P134 research controls *backup replacement*, P137 concentrates on *cloud-to-local destructive restore* without changing existing Cloud, P129/P132/P133/P134, photo provenance or source trees.

## Why P137 exists

P129 `restore` verifies the private original+cutout JPEG assets, requests literal owner confirmation, and then atomically replaces the owner-local IndexedDB wardrobe using P126 `restoreOwner01`. It takes its local CAS snapshot **after** the awaited confirmation, and does not recheck the remote owner manifest after approval. Thus a local edit or new saved outfit during the restore dialog can be overwritten even though that edit was never included in the owner's prior choice; a remote change occurring during approval also goes unobserved.

The new P137 safeguard supplies **both a pre-observed local snapshot and remote manifest identity** to the verified P129 restore callback.

## Implemented P137 research facade

New `research/cloud-restore-owner-safety-137/owner-restore-guard.mjs` exports `createCloudRestoreGuard137` and immutable research-only acceptance/status flags:

1. Capture and consistently recheck owner UUID, access-token string and revocation epoch. Operations are serialized. Logout, account change, token rotation, or explicit revoke invalidate pending restore decisions.
2. Take a complete actual-owner IndexedDB `readOwnerSnapshot01` fingerprint *before* remote JPEG download or human confirmation. A damaged/local incomplete wardrobe may still be recoverable: **do not block rescue restores merely because the local records cannot pass the full export validator**.
3. Independently read exactly one private owner cloud backup via authenticated no-store metadata GET. Validate owner, positive integer revision, backed-up item IDs/counts, saved-outfit shape, and **all nested owner-private JPEG paths before fetching any Storage asset**. Hash the entire remote document in memory with SHA-256. Display only local/remote item and saved-outfit COUNTS and remote revision, never source photos, user color, category, garment IDs/names, sensitive notes or JPEG object paths.
4. Delegate real JPEG recovery to the **unchanged P129 bridge**, which uses P128 to verify both genuine original and independently reencoded reviewed cutout JPEG SHA bytes against owner-folder Storage and then the P126 complete V4 validator. The P137 callback runs **only after** this expensive evidence and receives P129's independently verified receipt.
5. Ensure P129's verified owner, remote revision, garment count, saved-look count, and double-JPEG proof exactly match the previously observed remote. Recheck the local IndexedDB fingerprint and remote version **and full document fingerprint** immediately before presenting an irreversible replacement decision.
6. Ask the caller-supplied visible owner dialog for **literal boolean true**. Any false, absent, string, object, or cancelled decision refuses local replacement. After an affirmative callback, again recheck authenticated owner lease, complete local IndexedDB fingerprint, remote revision and remote SHA fingerprint; no automatic source-review data merge or retry.
7. The unchanged P129/P126 subsequent owner-only IndexedDB restore is atomic and CAS-protected against local edits occurring **after P129's final local snapshot**. Preserve saved outfit IDs and original/cutout JPEG identity. No alternate database writer, no new browser UI, no direct storage write or cloud changes by P137.
8. Count-only `previewRestore` never downloads private photo files or changes the local wardrobe. The service remains opt-in research only; no cloud credential is created or touched.

**Important race and safety limitations:** P137 is an additional preflight and human-consent guard, not a single distributed transaction spanning IndexedDB, remote PostgreSQL and Storage. A local edit in the tiny interval **after P137's last fingerprint check and before P129 takes its transaction snapshot** remains possible; the underlying P126 local CAS only protects changes after that snapshot. Likewise, a remote update after the last remote check is not atomically locked. Do not claim global serializability, no risk of lost writes, authoritative live owner identity, or a rollback of already-committed work. No new physical phone, certified WebKit cloud UI, real hosted Supabase signed-JWT A/B integration, production rollout or Family Alpha release is proven.

## Verification

New `tests/cloud-restore-owner-safety-137.test.mjs` uses the **unchanged actual P129 bridge**, real browser-standard IndexedDB API simulated by fake-indexeddb, a genuinely licensed original JPEG and independently reencoded cutout verified with SHA-256, synthetic owner JWT-like strings and a fully isolated fake owner-scoped HTTP/Storage RPC.

Tests include: count-only read-only preview/no JPEG transfer; actual double-JPEG restore and saved-look recovery; nonliteral/declined choices; local garment and saved-board changes during awaited approval; remote revision changes and same-revision different document; cloud deletion; foreign owner rows and private cutout paths rejected before object fetch; corrupt cutout bytes rejected before prompt; account switch/token revocation; concurrent operation rejection; missing cloud fail closed; explicit limits and version flags.

Dedicated GitHub Actions verifies **exact pinned P134 parent and only four newly added research paths**: focused P137/P134/P133/P132/P129 tests, full inherited Node regressions, disposable PostgreSQL 17 two-owner RLS and CAS checks, and inherited actual-app Chromium/WebKit 320/390/430 viewport browser flows with 93 screenshot evidence. Inherited browser tests do NOT mount P137 or prove live cloud UI/physical phone operation.

**Exact-head verification is pending until CI passes.** Never conflate synthetic HTTP/locally injected Postgres owner claims with cryptographically signed live Supabase accounts.

## Release gate

Family Alpha #255 stays **HOLD**. All changes must be research-only, draft PR, unmerged and undeployed. The next distinct release blocker is genuine signed-account hosted two-owner cloud-to-phone UI acceptance coordinated with Parallel #51, plus physical smartphone checks.