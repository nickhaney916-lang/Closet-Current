# Closet Current — MAIN Priority #134 / LOCAL-REMOTE-CONSENT-FENCE-134

**RESEARCH ONLY · Family Alpha Issue #255 HOLD · DRAFT UNMERGED · NO MODIFICATION OR DEPLOYMENT OF PRODUCTION OR EXISTING STAGING.**

## Baseline and division of ownership

- Verified main Priority #133 [draft PR #689](https://github.com/nickhaney916-lang/Closet-Current/pull/689), pinned exact green HEAD `d1b8211462e419c7d2552694c2518a695e218cf9`, dedicated [no-deploy CI #42384867100](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42384867100) verified 1,181/1,181 Node, 8/8 ephemeral actual PostgreSQL 17 owner-RLS/CAS checks, six Chromium/WebKit mobile viewport cases (320/390/430), 93 inherited app screenshots.
- P133 verified **REMOTE** source manifest before/after destructive cloud owner approval, P132 required explicit replacement consent and exact expected remote CAS, P129 handled authentic original+reviewed-cutout SHA-verified JPEG object packaging, owner private storage and local wardrobe read/recheck. Separately, P130 proved source/review-atomic constraints are necessary; no automatic generic per-field merge is authorized.
- New P134 addresses the missing **LOCAL** owner-decision binding: the owner could inspect a remote version, decide to replace it, yet meanwhile edit a local clothing photo review, category/color, draft, outfit board, or other wardrobe data. The actual P129 writer builds its local snapshot after the approval and could copy the new state even though it was not the state considered when the user consented.
- Parallel #51 signed-owner live cloud acceptance, parallel #52 Family Alpha mobile UX and earlier dual-humanoid research remain separate; no prior PR source is modified or merged.

## Implemented research code

New `research/local-remote-consent-fence-134/owner-local-remote-fence.mjs` exports `createLocalRemoteFence134`, using the **unchanged P133 -> P132 -> P129** native research composition and P126's existing atomic owner backup validator.

1. Before the owner views either cloud version, snapshot the authenticated owner's actual IndexedDB items + states with `readOwnerSnapshot01`. Export a detached V4 owner backup and run full P126 `validateRestore01`, independently verifying original JPEG SHA, reviewed cutout JPEG SHA and owner review provenance. Fail before remote GET/upload if private data invalid.
2. Bind a private fingerprint of **all local items and state rows**, including saved outfits and draft data, to the active owner ID/token and explicit revocation epoch. No raw item, user note, garment image, private object path or source SHA enters the UI summary.
3. Show a consumer-supplied callback a COUNT-ONLY **local vs remote** comparison: local reviewed garment and saved-outfit counts, verified original/cutout JPEG counts, remote garment/look counts/revision and an explicit whole-cloud-overwrite warning. Accept literal boolean `true` only.
4. Re-read the identical local snapshot before showing the prompt and again after the asynchronous consent. Any local category, color, outfit board, photo, cutout, metadata, state or other edit invalidates consent; do not silently proceed with a changed local closet.
5. P133 independently re-reads the remote version+SHA after the same consent, P132 requires literal owner approval and current token, and P129 enforces last-known remote revision CAS and a local snapshot fingerprint recheck after private JPEG upload.
6. An opt-in `fetcher` wrapper validates the approved owner-local snapshot **immediately before forwarding the actual P129 `save_closet_backup` POST**, catching pre-dispatch local modifications not present at approval time. A local edit while P129 uploads photo objects is also rejected by P129's own fingerprint check.
7. First backup remains explicit create-only remote revision 0. Inherited owner restore is unchanged; no automatic source/review merge, alternate database writer, remote user image download in preview, or shipping app UI.
8. Entire operation is serialized, and logout/account/token change/revoke fail closed before issuing subsequent operations; receipt cannot claim production or Family Alpha approval.

**Race honesty:** local IndexedDB and remote PostgreSQL/Storage do NOT participate in one distributed transaction. A modification racing *after* a final local read but concurrent with an already dispatched remote HTTP write may be committed despite subsequent failure; an error is not a guaranteed remote rollback. This research facade is a safer pre-approval and pre-dispatch contract, **not** an absolute distributed serializability guarantee.

## Tests, evidence and limitations

New `tests/local-remote-consent-fence-134.test.mjs` runs the **actual** P133/P132/P129 research adapters on private ephemeral IndexedDB with genuinely licensed original JPEG and a separate independently SHA-verified reencoded cutout. Test cases cover read-only local/remote privacy-safe preview, initial create-only remote revision, explicit second-version consent, immutable owner-private double-JPEG storage, saved-look ID preservation, nonliteral rejection, local color correction/saved-look change during consent, local change during remote read, original/cutout corruption, foreign-owner spoof, account/token/revoke during approval, blocked overlapping operations, remote stale version, and local change during actual JPEG upload before CAS. Confirm there are no premature remote POSTs on invalid input.

The dedicated strictly research-only CI checks the exact P133 parent and exactly 4 new files; targeted P134/P133/P132/P129 suites, full Node regressions, isolated original-SQL PostgreSQL 17 RLS/CAS, and inherited real app Chromium/WebKit browser regressions at 320/390/430 with 93 actual screenshots. The inherited browser cases **DO NOT** mount P134 or authenticate live Supabase cloud. Mock HTTP tokens are unsigned synthetic strings; ephemeral Postgres locally injects owner identity. Physical iPhone/Android, real signed remote A/B cloud Storage, owner-visible dialog, and full 3D realism remain release blockers.

**Exact-head CI: pending until successful.** Keep all PRs draft/unmerged and preserve Family Alpha #255 HOLD; production/existing staging and other projects unchanged.
