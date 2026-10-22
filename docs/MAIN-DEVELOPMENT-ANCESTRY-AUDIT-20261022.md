# Closet Current — Main branch ancestry reconciliation and release blockers

**Status: ISOLATED DRAFT INTEGRATION CANDIDATE — NOT RELEASE READY.** Audited October 22, 2026. Do not deploy, merge, change live authentication or start paid services.

## The discovered issue

The latest verified app development was PR #174 at `b15bc9cbe5d6b46b8790db0b888587ca397fc707`. Meanwhile production `main` had one extra independent October 19 trend-refresh commit `54c9e29ede069a05d1268e003f80cbda043c7d6a`. A GitHub compare reported **diverged: development ahead 1,794 commits, main ahead 1 commit**. The review inspected both copies of `public/trend-data.json`: their actual Git blob SHA was **identical** `0fd0911a32ff7c80fc027657465c96f34dfe532d`. Copying/cherry-picking the file would introduce unnecessary risk.

The isolated branch `integration/reconcile-main-trend-ancestry-no-deploy-20261022` has a **two-parent commit** referencing the exact verified PR #174 and production `main` commit. Its Git tree is byte-for-byte identical to the verified app candidate, with **zero customer/application/security/hosted-code modifications** at this merge commit. It thus reconciles ancestry without silently replacing the verified October 19 trend dataset or changing `main`. A following commit adds only this documentation, a fail-closed read-only audit, its unit tests and a separate branch-only QA workflow. All parent development PRs stay open/draft.

**Important limitation:** Having reconciled ancestor commit history does not establish that this 1,794-commit development candidate is suitable for production. A human must still review the full substantive diff against `main`, security changes and dependencies. GitHub's compact compare may cap file lists at 300. Neither green tests nor a mergeable PR authorizes a production merge or Cloudflare deployment. This branch is intentionally not targeted at `main`.

## Why release is still blocked

1. **Live email redirects:** The current `public/auth.js` still declares an APP_URL pointing to the old GitHub Pages origin, not the Cloudflare production origin. Do not auto-switch it: Supabase Auth Site URL, allowlisted redirect URIs, actual external inbox delivery (sign-up, link expiration, reset) and password/session behavior require owner-approved end-to-end verification. A source link fix alone would risk signing users into a different per-origin closet.
2. **Full account deletion:** `supabase/functions/account-delete/index.ts` deliberately serves an HTTP **503** response with `deletionCompleted:false`. This is a correct fail-closed *current state*, not a completed paid/public release feature. Releasing it requires server-enforced writes lock across backups and Storage, real reauthentication, an audited admin cleanup adapter, customer consent and independent hosted tests. Never enable it automatically.
3. **Protected staging:** Cloudflare project root, preview aliases and any custom host require separately verified Cloudflare Access. A preview Access redirect or synthetic staging test does not prove real hostname security. Existing live Supabase and Drive Duel projects cannot be used as staging. No project creation/paid tier approved.
4. **Human validation:** No physical Android or iPhone test (**0/2**); no independently labeled untouched original-photo scenes (**0/24**, 30 garment entries); no real verified garment recognition accuracy. Operator-entered or simulated scores must not be marketed as proven accuracy.
5. **Privacy/commercial:** terms/privacy/age-consent, real customer support, image/figure rights and subscription/payment readiness require separate human/legal/business decisions.

## QA expected from this branch

The branch-specific audit proves (a) exactly one two-parent merge with pinned ancestry, (b) identical merge-tree vs. last tested app, (c) identical trend-data blobs in both parents and final branch, (d) no changes to `public/`, `supabase/`, benchmark or either production deploy workflow, (e) only four new audit/doc/QA files, (f) production `main` still at checked SHA during this review, and (g) hosted email, account deletion and launch remain unverified.

The workflow also runs full Node suite, browser-emulated Android Chromium and iPhone WebKit original-first and outfit flows, synthetic staging preflight, installed PWA tests, and disposable local Supabase 207 HTTP security checks. If main moves again, the strict audit intentionally fails until a fresh review.

**Next authorized action:** none needed to retain this draft. Owner-approved staging, actual phone/human review and future independent integration approval are still needed. Production promotion remains **BLOCKED**.
