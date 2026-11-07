# Closet Current — MAIN Priority #133 / REMOTE-CLOUD-REVIEWED-PREVIEW-133

**RESEARCH ONLY · Family Alpha GitHub Issue #255 HOLD · DRAFT/UNMERGED · NO MODIFICATION OR DEPLOYMENT OF PRODUCTION OR EXISTING STAGING.**

## Parent, ownership and problem

- Pinned independently green P132 [PR #687](https://github.com/nickhaney916-lang/Closet-Current/pull/687), **exact source HEAD `cd6a3b1775032c8694e8fdaccf4108732c1ec4b9`**, dedicated [NO-DEPLOY CI #42383635346](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42383635346): 1,168/1,168 Node, 8/8 disposable real PostgreSQL owner RLS/CAS, 6/6 inherited native app mobile browser scenarios, 93 actual screenshots.
- Separate P130 [PR #684](https://github.com/nickhaney916-lang/Closet-Current/pull/684) demonstrated a semantic source/review merge defect: valid photo hashes do not prove the color reviewed for photo A also belongs to a replaced photo B. **No automatic per-field cloud merge is authorized.**
- P132 now rejects silent overwrites and requires literal consent and an expected remote revision. However, the P132 adapter trusts the *caller* to supply that revision; the existing remote document is not necessarily observed before an owner is asked to replace it. This is a gap in grounding the destructive decision.
- Parallel #51 P129 remote signed account + normal app cloud integration, and parallel #52 Family Alpha mobile UX, remain distinct. P131 dual-humanoid research remains unchanged.

## Implementation

New `research/remote-cloud-reviewed-preview-133/remote-preview-owner.mjs` exports `createOwnerRemotePreview133`. This is an **opt-in research-only composition** of unchanged P132/P129/P128 behavior, NOT a shipping UI or public cloud writer.

1. Capture owner ID, existing auth token and operation revocation epoch. Perform a no-store, owner-scoped GET of `closet_backups`, with only this owner's `owner_id,revision,document`, and recheck active token/owner around each async step. No Storage request is initiated by the preview.
2. Strictly validate remote owner, positive safe-integer revision, manifest version, item array/owner membership/unique IDs, saved-outfit metadata, and EVERY nested private JPEG owner path with P128's existing complete-graph preflight. Malformed or foreign manifests fail closed **without any Storage object fetch or cloud write**.
3. Derive an owner-facing **count-only summary**: existing revision, number of reviewed garment entries, number of saved looks and explicit warning that replacing existing cloud data may discard remote-only edits. Never reveal item names, clothing labels, raw JSON, photo/cutout bytes or storage paths in the confirmation prompt or preview receipt.
4. Internally SHA-256 fingerprint the observed private manifest JSON, with no fingerprint published in UI.
5. Require caller-provided `confirmReplace` to return **literal true**, and after the awaited decision recheck the owner token and re-read the remote document under the same owner. Refuse any changed **revision OR same-revision document fingerprint**, remote deletion, foreign owner or logout before calling P132.
6. P132 again checks owner identity and consent contract and delegates to existing P129 original/cutout JPEG uploads, local fingerprint recheck and **server-side revision-CAS**. A racing writer after the final preview still receives a CAS conflict; P133 never tries a retry with a guessed revision.
7. If no remote row exists, call P132 with explicitly observed create-only revision `0`. If another writer creates the remote row before the delegate, the P129 CAS path refuses overwrite.
8. Serialize owner preview/backup operations; `revoke()` invalidates pending consent and delegates revocation to P132/P129. No auto-merge, no live account activation, no production settings/schema modifications.

**Important limitation:** a token revocation after the server RPC has committed is not a distributed rollback. Live JWT cryptographic validity, HTTP API authentication and actual signed A/B account isolation are NOT independently proven by mock transport and injected local PostgreSQL claims.

## Evidence and independent quality

New `tests/remote-cloud-reviewed-preview-133.test.mjs` covers read-only preview and private data non-disclosure; explicit owner replacement with observed revision, literal true-only consent, owner/token/revocation during async confirmation, nonconcurrent busy safety, remote version change, same-revision different document, remote deletion, foreign owner/item/path and duplicate item failure. Simulates a second writer **after** the final GET and requires P129's delegated CAS to reject; no cloud write is permitted by the preview itself.

The integration case invokes the **actual unchanged P132/P129** researched adapter using ephemeral private IndexedDB, a publicly licensed original JPEG and separately encoded crop JPEG with independently computed SHA-256, fake authenticated transport/private storage, rev 0 create, real metadata-only preview, rev 1 literal owner replacement, rev 2 successful CAS, saved outfit ID preservation and no inline JPEG in backup manifest. These are deterministic **unsigned fake tokens**, not real signed Supabase JWTs or live hosted data.

A strict P133 no-deploy workflow should confirm exactly 4 **new research-only files** against the P132 exact parent SHA, focused tests, full Node regressions, real ephemeral PostgreSQL 17 owner RLS, and six inherited actual app Chromium/WebKit 320/390/430 CSS px browser regressions with 93 archived real screenshots. The inherited app browser acceptance is NOT an actual browser-driven P133 backup UI acceptance. Physical Android/iPhone and human-reviewed 3D visual fidelity remain unresolved. No personal photo or account was touched.

## Status and release gate

**Exact-head green CI must be established separately; this report does not pre-announce results.** The signed two-account remote cloud E2E, native app mounting and owner-visible conflict UI need separate authorization/verification. Family Alpha **HOLD**, draft PR only, no merges/deployments, and production/existing staging untouched.
