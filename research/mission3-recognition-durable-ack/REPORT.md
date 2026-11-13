# Mission 3 — A recognition review result is not saved until its source-CAS transaction commits

**Family Alpha HOLD #255 OPEN. DRAFT ONLY: no merge, no production or staging deployment, no hosted Supabase and no private family wardrobe access.**

Verified exact parent [Mission 3 PR #1006](https://github.com/nickhaney916-lang/Closet-Current/pull/1006), `aed074ba2f8a0d4713bb5a208d1722350fae5f38`. Change scoped to the live `public/app.js` `recognizeItem` final status update, source-backed tests, native browsers, strict exact-parent CI and report.

## Reproduced risk

After a canonical original was inserted durably into the signed owner's pending-photo list, `recognizeItem` handled the blank/duplicate/manual-confirmation/failure paths and completed with this statement in `finally`:

```js
void persistDraft({mode:'update',expected:expectedDraftForRecognition,record:outcome});
```

The code did **not await** the native, owner-specific compare-and-swap transaction. The scan could return a successful result while its review status was still queued or was later denied by device quota, revoked account, conflicting two-tab owner correction, a failed cloud `beforeWrite` lease, or another IndexedDB error. The source photo was still on disk, but the UI showed a newer recognition status as if it had been saved. A reload could revert it without warning.

## Engineering correction

1. Await `persistDraft({required:true,mode:'update',expected:expectedDraftForRecognition,record:outcome})` inside `recognizeItem` `finally`. Existing per-row source identity checks, original JPEG+SHA, signed-account lease, queue, two-tab CAS and no-auto-discard rule stay unchanged.
2. On rejected/non-committed status write, leave the entire original photo and pending review row unchanged. Mark on-screen analysis as not durably saved, `scanFailed=true`, show actionable owner warning to check storage/other tabs and refresh Photo results. Return `false`, never false-positive recognition success.
3. Ensure late failures after logout/relogin cannot publish a warning or render an older account's photograph; keep the original session epoch and `batch.includes(item)` fences. A successful write returns the earlier recognition result only after transaction commit.
4. Only the live status completion path changes. No schema, cloud transaction, photo compression, remote URL, account list, model threshold, fashion styles, production configuration, or deployment touched.

## Evidence and tests

- Source-executed `tests/mission3-pending-capture-status-cas.test.cjs` with native-like fake IndexedDB: acknowledgement remains pending behind the queued owner-private write, then succeeds after actual commit; synthetic quota returns false with photo proof still durable; same-owner second-tab human color correction wins against stale recognition; revoked session suppresses cross-owner warning; direct source assertion bans prior `void persistDraft`.
- Native Chromium and WebKit, CSS widths 320/390/430, actual signed synthetic owner and owner-private IndexedDB: hold real `beforeWrite` until release and prove not prematurely acknowledged, update human color from a second same-owner tab before CAS and prove stale failure, simulate quota, actual page reload rehydrates original JPEGs, check distinct signed-owner isolation, block off-host traffic. Synthetic SHA-proven photos; no physical device or hosted cloud claims.
- Exact-parent **five-path NO DEPLOY** CI runs inherited full serial Node tests, cloud restore transaction/rehydration and no-auto-discard tests, native browser capture/save/restore, signed disposable PostgreSQL Storage RLS/two-owner browser and owner photo-based outfit integration smoke tests.
- CI **must** be verified against the final HEAD before reporting success. Any earlier failed test/check is superseded only by a final green run.

## Release blockers remain

Authorized hosted Supabase two-account Auth/Storage backup/restore and revocation, real Android Chrome/iPhone Safari physical acceptance, independent legal real-photograph human ground truth, complete recognition model accuracy, realistically fitted photo-derived cloth on 3D humanoids, full Mission 1/2/3 integration and owner signoff. **Family Alpha HOLD #255 remains OPEN.**
