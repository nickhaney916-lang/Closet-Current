# Closet Current Main Priority #182 — honest post-commit original-photo recovery and safe 3D reopening

**Family Alpha Issue #255 HOLD — isolated local HTTP research only. No merge, existing staging, production, cloud SQL, hosted credentials, private user photos or unrelated apps may be touched.**

## Exact baseline

Direct immutable parent: Main Priority #181 draft PR #743, verified SHA `7a52c010811b348bb146c7ee4fef4ccbe1594032`, independent exact-HEAD green Actions #42556501702 (1,417/1,417 Node tests, 6/6 genuine browser cases, 42 SHA-audited mobile screenshots). Parallel #62's PR #742 is separate, draft, and not integrated.

## Actual defect

P129 calls its `onRestored` callback **after** P126 has already atomically replaced owner-private IndexedDB. P181 then reloads the real P550 native saved board and independently checks original JPEG NATIVE91/NATIVE92 receipts. If the asynchronous follow-up read, source SHA, session, or other post-commit verification throws, P129 rejects and the P146 account-menu UI showed generic “Operation stopped safely” as though the already-committed restore never happened. The P180 lease was released without permanently blocking a future source-bound 3D opening. Such a post-commit failure is **not** an IndexedDB rollback.

## P182 implementation

- Add a strict post-P126-write `markAtomicCommitted` barrier before the P146 callback awaits any post-commit logic. Mark `postCommitUnverified` and report the actual commit count separately from successful SHA proof.
- If any post-commit SHA, owner/session, wardrobe revision, source receipt or board reread fails, leave a durable-in-session quarantine flag; P541/P550 native 3D already checks `cloudToNative3D180Bridge.pending()`, which now stays true even after the destructive restore lease finishes. A second destructive restore is refused until reconciling.
- Add `retryVerification()` to re-read the user's CURRENT existing private board and recompute NATIVE91/NATIVE92 and NATIVE93 source proofs **without re-importing cloud, asking destructive consent again or writing wardrobe records**. Keep quarantine on retry failure; clear it only after exact receipt/wardrobe/source verification succeeds. Preserve honest original-photo-only fallback for missing legacy JPEGs.
- Integrate one user-visible “Retry restored-photo verification (no cloud replacement)” action into existing local P146 native account menu. The UI says the wardrobe **WAS restored** but original-photo verification failed, and explains that 3D is blocked until a retry. The restore button is disabled during quarantine; retry shows a truthful success or fallback status.
- Maintain 6 exact research flags, one real owner, original/cutout SHA and private cloud policies unchanged. No `public/` edits or production release behavior changes.

## Independent acceptance

1. Exact verified P181 ancestor, precisely 5 allowlisted research/test/CI paths, unchanged `public/`, Supabase, original NATIVE consumer and staging, build and syntax.
2. Targeted adversarial tests: postcommit false-rollback prevention, wrong SHA, local-only successful retry without second cloud write, repeated retry failure, owner/logout/dirty-draft/active-viewer denials, honest fallback, legacy successful restore and native UI/static 3D guard.
3. Full inherited Node suite.
4. Genuine Chromium and WebKit single-session original+reviewed cutout cloud-to-saved-163-bone WebGL browser cases at 320/390/430, including actual 42 independent PNG SHA/width checks from existing end-to-end benchmark.

**No claim of actual hosted Supabase JWT E2E, physical smartphone acceptance, arbitrary private photo fitting, or 10/10 photorealism.** P182 closes one important post-commit recovery gap, not the complete application/release.

## Delivery status

Pending exact-head CI verification. Keep draft and HOLD.
