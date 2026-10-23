# Closet Current — Restricted staging cutover and rollback plan (owner approval required)

**Prepared:** 2026-10-22 (Pacific) · **Status:** NOT AUTHORIZED TO DEPLOY · **Not production.**

## Scope and provenance

This is an offline review guide for the **separate protected Cloudflare staging project** only. The new candidate is based on [draft PR #195](https://github.com/nickhaney916-lang/Closet-Current/pull/195), source commit `425efe54cbcebffe54e8d32c209d6fb80a739dca`. [Draft PR #197](https://github.com/nickhaney916-lang/Closet-Current/pull/197) generated its first safe-clear staging ZIP (build fingerprint `f514386e47f6`; 93 files, 92 sealed assets). A separate provenance workflow reproduces it twice and rejects intentional tampering; consult its exact CI results, digest and expiration instead of trusting a ZIP filename.

**This is a QA checklist, not authorization.** No available evidence proves Cloudflare Access covers every root, alternate preview alias, static asset or support URL; Supabase hosted email redirect allowlist and two distinct hosted users' private photo separation have not been verified. All known remaining gates in [issue #190](https://github.com/nickhaney916-lang/Closet-Current/issues/190) and [issue #192](https://github.com/nickhaney916-lang/Closet-Current/issues/192) still apply. Account deletion is disabled and real customer photos are not permitted.

## Mandatory pre-cutover hold points

1. **Verify policy coverage first:** owner confirms by Cloudflare dashboard and signed-out/private browsing that the exact pilot preview host **and any Pages root, alias, support HTML, service worker and static assets intended to be private** are protected. A sample Access OTP on one hostname is insufficient. Unprotected path/alias means **STOP**; never try to deploy to fix policy.
2. **Record existing rollback target:** in Cloudflare Pages deployment history, owner records the **exact currently serving deployment ID, URL, deployment time and previous verified static artifact/asset manifest**. This has *not* been gathered or verified by ChatGPT. If any rollback target cannot be identified or remains insecure, **STOP**.
3. **Verify Auth on separate staging project:** owner inspects Site URL, Redirect URLs, email/signup confirmation, anonymous provider, leaked-password warning and published key. Preserve live Closet Current and Drive Duel project settings; never put credentials in GitHub issues.
4. **Verify candidate source before upload:** record GitHub artifact ID, runner SHA, source SHA, complete SHA-256 ZIP digest, manifest fingerprint, expiration, 93-file root, both support pages, and `auth.js` staging origin + backend. The ZIP's top-level paths should be the actual web root. A staging hash manifest is not a cryptographic publisher signature.
5. **Explicit separate approval:** owner authorizes only a named staging project/host and this exact digest with a rollback target. No generic permission to deploy future changes; no production authorization.

## After an explicitly authorized staging-only deployment (not performed in this assignment)

- Verify unauthenticated requests to root, `/index.html`, `/pilot-data-notice.html`, `/saved-closet-audit.html`, `/phone-photo-check.html`, `/sw.js`, direct asset paths and all preview/root aliases. Private assets must not bypass the intended Access policy.
- Verify service-worker and browser cache turnover from **previous release** to the new staging fingerprint. Avoid wiping the owner's real wardrobe while testing.
- On **owner-approved synthetic hosted accounts A and B only**, verify signup/confirmation, password recovery, private photo upload and owner-bound restore; B must not read/overwrite/delete A's records. Verify blocked/expired Auth sessions and local drafts on Samsung and iPhone. Do not invite minors or upload body/face-containing photos.
- Inspect live console/network endpoints for staging-only Supabase; treat any production, Drive Duel or paid-AI request as a **STOP** condition. Capture redacted evidence without tokens, full-screen bodies, emails or private photos.

## Rollback and incident controls

On Access bypass, mixed production/staging endpoints, hosted cross-account leakage, broken login, failed device restore, missing pages or data-loss symptoms: **stop new tester use, preserve evidence and request owner approval for rollback**. Restore ONLY the recorded known-safe staging deployment ID using Cloudflare's approved deployment rollback interface; do not guess a prior build from an unrelated ZIP. Retest Access protection, Auth redirects, assets and affected browser sessions after rollback; report differences. A rollback changes site assets, **not** cloud-stored photographs or records, and does not undo any data changes already made by testers. Handle suspected cross-user leakage separately as a privacy incident.

## Release interpretation

- **Offline QA PASS** = deterministic static ZIP bytes, staging-only references, expected support files and negative tamper checks; never equals hosted safety.
- **Staging owner pilot GO** = all independently approved hosted Access, Auth, A/B and physical-phone checks passing, plus an actually verified deletion/support/retention procedure. No-go today.
- **Production/public/teen release** = separate, unapproved, significantly broader work.

The owner should not deploy or delete anything simply because this file exists.
