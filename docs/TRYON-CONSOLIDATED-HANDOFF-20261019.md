# Prepaid ledger and client recovery compatibility — October 19, 2026 Pacific

Review [draft PR #17](https://github.com/nickhaney916-lang/Closet-Current/pull/17),
branch `fix/tryon-ledger-recovery-compatibility-20261019`. It is based on PR #13
and adapts the client safeguards from PR #14. **No branch merge was performed.**
The regular Closet Current conversation remains the main coordination thread.

## Corrected project state

PR #13 already implemented a staged durable ledger and verified its local
database integration. Do not build a second competing ledger or describe it
as absent everywhere. It remains absent from PR #12/#14 alone and has never
been provisioned into a hosted deployment.

| Checkpoint | Purpose | Relationship |
| --- | --- | --- |
| PR #12 `5e9cb665` | Original signed two-pass research pipeline | Unmodified research parent |
| PR #13 `fe1f5c98` | Prepaid pair quotas, durable request/parent replay protection, authenticated HTTP integration | Base of PR #17 |
| PR #14 `e758f209` | Bounded client work, stale-fetch cancellation, status-only recovery and actual built-app emulation | Client safeguards adapted in PR #17 |
| PR #17 `ac423d8e` | Compatible prepaid client plus recovery safeguards | Isolated follow-up; not production |

PR #7 `510ee14d` and PR #11 `5d214c9b` are included ancestors. PR #10's
recognition work remains a separate divergent track; this work does not resolve
its previously observed app/source-recognition conflicts. No PR #7/#10/#11/
#12/#13/#14 source branch was changed by this continuation.

## Combined behavior

- Preserve PR #13's complete two-pass quota reservation before the first
  submission, selected second-photo digest, stable request UUIDs and
  same-owner signed predecessor. Session storage contains only digest/IDs.
- Preflight **both** selected crops before any generation submission. Reject
  invalid sources before starting the first pass or reserving its budget.
- Outfit/account changes abort pending client HTTP, image decode waits and
  polling delays. The original exact source/account comparison still rejects
  stale results. Aborting the browser does not cancel an accepted provider job.
- Status checks recover at most twice consecutively from transient network,
  request-timeout and selected HTTP failures using the original signed token.
  Auth errors, invalid jobs and actual failed renders stop. Generation POSTs
  never automatically retry. An explicit identical recovery retains PR #13's
  original request UUIDs; the server ledger decides accepted/held outcomes.
- Keep PR #13's 85-second submission-request bound to accommodate its Auth,
  reserve/provider/record sequence. Read-only requests are bounded to 25 seconds,
  decode waits to 10 seconds and the complete client attempt to 180 seconds.
  No server timeout, quota, privacy or approval setting was changed.
- Output data uses the server's 10,000,000-character limit, separately from
  the smaller catalog-upload limit; decoded images above 16 million pixels
  are refused. Source photos are not resampled, overwritten or reclassified.
- A failed/stale attempt cannot leave an old or partial image labelled as a
  completed pair. The output remains transient. Unsupported shoes/layers are
  still disclosed as unrendered.

## Verification

Code checkpoint: `ac423d8e98f35e6845fff7e0d55da46d3bc70f87`.
Full local build and suite: **857 total, 854 passed, 0 failed, 3 skipped**.
Existing HTTP, account identity, source preflight, request replay and budget
unit tests remain intact. No server or SQL implementation files changed.

[Workflow 39275497224](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39275497224)
retains all three independent jobs:

1. Actual disposable PostgreSQL concurrency **passed**: per-owner/global cap
   races, same-request races, changed-ID continuation replay, cross-owner
   isolation, held unknown outcomes, lost acceptance acknowledgment, disabled
   quota defaults, browser-role denial, prepaid pair and second-photo binding.
2. Full Node suite, Deno checking, actual built-app Pixel Chromium/iPhone WebKit
   synthetic emulation and full Style this in both browser engines **passed**.
   CI confirmed **854 passed, 0 failed, 3 skipped**. Both emulated profiles
   reported both-source preflight, stable ledger request IDs, prepaid pair
   fields, same-job status recovery, enforced retry limits, corrupt/stale image
   rejection, pending fetch cancellation, unchanged sources and zero page errors.
   Each ran eight synthetic starts/five continuations across all scenarios.
3. Actual local Supabase CLI/SDK/Auth/RPC and loopback HTTP **passed**:
   prepaid budget/selected second-photo binding, global cap, reused start and
   changed-ID continuation, rejected cross-account tokens, held unknown
   outcomes, and default-disabled deployment all verified. Temporary synthetic
   identities and services were cleaned up. This did not use a hosted Supabase
   project or real provider inference. The HTTP host is Node loopback over the
   shared handler, not a deployed Deno gateway.

**Workflow conclusion: success for all three jobs.** Synthetic browser evidence
is in artifact `ledger-recovery-emulated-qa` (`12196524200`) in the linked run.

The browser fixture now combines both-source preflight, full-pair fields,
session identity restoration, explicit retry identity after a lost POST,
transient status failures during both passes, retry exhaustion, corrupt output
rejection, failure recovery and a held response cancelled after outfit change.
It runs the actual built board/scripts/CSS. This is still synthetic provider
behavior, separate from the real local Auth/database/HTTP test job.

## Remaining release gates

Both source approval constants remain **false**:
`RESERVED_PAID_INFERENCE_APPROVED` and `CHAINED_PAID_INFERENCE_APPROVED`.
Quotas default disabled/zero. No environment/body flag can enable billing.

Actual provider calls **0**; actual Android/iPhone hardware runs **0**; actual
two-pass clothing-fidelity score **null**. Passing software/emulation cannot
establish fabric, pattern, collar, seams, fit, drape or first-garment retention.
Shoes and outer layers remain unsupported by this chain.

Still required: owner-approved hosted migration/configuration/privilege review,
pilot limits and deliberate new-generation/recovery UX, operator reconciliation
and metadata retention preserving idempotency, external provider currency cap,
licensed model assets, consent/privacy terms, financial authorization,
protected staging, actual provider fidelity evidence and physical phone tests.
See `docs/TRYON-SUBMISSION-LEDGER-DRAFT.md` and the existing phone evidence packet.

No merge/deploy, paid activation, hosted SQL, real customer/face upload,
original-photo/classification/clipping/indexing change or Drive Duel change.
