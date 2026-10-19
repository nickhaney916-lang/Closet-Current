# Closet Current — Work session continuation (October 19, 2026)
This is the **main-chat coordination checkpoint** after the user ran out of
ChatGPT Work workspace. It does not represent a released or deployed app.

## Recovered Work chain

| Draft | Branch | Role |
|---|---|---|
| [#12](https://github.com/nickhaney916-lang/Closet-Current/pull/12) | `research/true-multigarment-ai-tryon-20261018` | Source-hard-disabled provider top → bottoms research chain |
| [#13](https://github.com/nickhaney916-lang/Closet-Current/pull/13) | `work/multigarment-integrity-phone-qa-20261019` | Durable prepaid two-pass quota/idempotency; real disposable DB/local Auth/RPC tests |
| [#14](https://github.com/nickhaney916-lang/Closet-Current/pull/14) | `fix/multigarment-reliability-phone-gates-20261019` | Status polling, pending-fetch cancellation, corrupt/stale-image protection |
| [#17](https://github.com/nickhaney916-lang/Closet-Current/pull/17) | `fix/tryon-ledger-recovery-compatibility-20261019` | Compatible #13 quota model + #14 browser recovery, actual Deno loopback test, physical-phone and live AI evidence audit |
| This follow-up draft | `fix/tryon-account-bound-availability-20261019` | Bind availability checks to the signed-in account; never unlock B with A's late reply |

#17 is based on #13 (which is based on #12). PR #10 and the recognition
research PR #15/#16/#18/#19 remain separate from this AI-try-on track. No
production integration/merge or deployment has occurred.

## Highest-priority continuity fix

`public/ai-tryon.js` previously treated a successful availability response
as a global yes/no, not a verification bound to the *current* account. If a
request for owner A resolved after a sign-in change, it could leave the
generate button available for owner B. The backend still checks ownership,
but the client should fail closed **before any generation POST**.

This branch:
1. Tracks the owner whose AI availability was checked.
2. Ignores superseded availability responses through an increasing epoch.
3. Invalidates old previews and cancels pending generation if the owner
   changes during an outfit/board update.
4. Blocks Generate unless the current account equals the verified availability
   owner; account switching can initiate a fresh availability check.
5. Adds synthetic test cases for an old availability response arriving after
   account switch and an attempted generation before owner re-verification.
6. Adds isolated Chromium/WebKit emulation workflow using intercepted provider
   responses; these tests cannot prove phone hardware or AI visual fidelity.

## Recovered verified tests and remaining evidence

- [#17 last full green workflow on `ac423d8e`](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39275497224):
  **854 passed / 0 failed / 3 skipped** Node tests, Deno checks,
  Pixel Chromium/iPhone WebKit browser emulation, PostgreSQL concurrency and
  actual local Supabase Auth/RPC and HTTP. All model outputs synthetic.
- [#17 newer final checkpoint `20a241b6`](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39278149616):
  includes final digest timeout, Deno HTTP/entrypoint coverage, and strictly
  blocked evidence audit. **Do not infer run success until the live workflow
  completes.**
- [Account-continuity regression workflow](https://github.com/nickhaney916-lang/Closet-Current/actions/workflows/research-tryon-account-availability.yml):
  check GitHub run conclusion before claiming new code verified.
- Physical Android/iOS phones **not tested**; genuine provider inference **0**,
  provider garment-detail fidelity **unknown**; footwear/outerwear unsupported
  by v1 two-pass try-on. Passing browser emulations do not change this.

## Release/cost restrictions (unchanged)

Do not modify Drive Duel, merge to `main`, deploy, provision hosted SQL,
enable paid AI service or spend money without explicit approval. Both
`RESERVED_PAID_INFERENCE_APPROVED` and
`CHAINED_PAID_INFERENCE_APPROVED` remain **false** in the staged backend.
Do not upload real customer photos/faces or overwrite original high-resolution
photos. Original-photo-first clothing categorization remains the rule.

## Next priorities after this branch verifies

1. Confirm the newest #17 Deno/SQL/local Auth research workflow and this
   branch's account-switch and browser evidence.
2. Independently review hosted migration/privacy/consent/quota controls,
   provider spend cap, reconciliation, and deliberate new-generation/recovery
   UX in draft; do not apply hosted migrations or activate the provider.
3. Audit integration conflicts between divergent PR #10 original-photo
   recognition and PR #17 AI try-on, on an **isolated integration branch**
   without merging to production.
4. With explicit later financial approval, licensed assets and consent, perform
   live two-pass top/bottom fidelity evaluation with independent reviewers;
   obtain physical iPhone and Android QA evidence separately. Those gates are
   presently **blocked**, not completed.
