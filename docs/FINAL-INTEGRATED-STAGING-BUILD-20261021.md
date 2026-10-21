# Work Assignment #159 — final integrated staging-build recovery candidate

Base: PR #157 `232a735f99af0da73df2e7095508c2a99e8df6da`.
Incoming verified branch: PR #158 `e67edcaa34e6c4ed9f93cc8edd6c204a7b15db80`.
Both exact-head source workflow runs were confirmed SUCCESS before work. New isolated branch: `integration/security-staging-build-recovery-20261021`; original branches remain untouched. Only checkpoint prose conflicted, and both complete histories are preserved.

PR #158's atomic output helper, lock/crash and actual-builder tests, manual recovery instructions and workflow are retained byte-for-byte. Exclusive creation of the lock precedes any prior-output deletion; competing builders cannot delete another build's artifact. Normal exceptions clean up, while a SIGKILL leaves evidence that blocks automatic retry. The implementation deliberately does not guess stale-lock ownership from a PID, elapsed time or TTL. Operator cleanup requires confirming no active builder and inspecting incomplete output. The dedicated tests use only disposable directories and processes; no other Work session output or locks are removed here.

The inherited source guard now recognizes the verified #158 parent and pins all its inherited build-lock files to that commit. Every other inherited security/mobile/staging file retains #157's exact-parent checks. The full public tree, original-before-mask full-resolution recognition, camera/wardrobe/styling, Supabase security sources and production migrations/functions/hosting remain unchanged. Integration-specific edits are limited to guard adaptation, this guide, checkpoint prose and a dedicated QA workflow.

## Required combined verification

- Complete app build and Node regression, including nine atomic helper tests and five actual-builder tests: competing builds, stale lock refusal, interrupted artifacts, actual SIGKILL, no deployable partial output, explicit disposable cleanup and safe rebuilding.
- Existing source/release checks, synthetic staging build and forbidden-live-backend scan, generated staging worker VM lifecycle and cache isolation.
- Actual disposable runner-local Supabase Auth/REST/private Storage with two generated accounts and a synthetic JPEG: symmetric owner isolation, backup revisions, failed-save retry, migration drift rejection, controlled fallback and re-hardening. No hosted link or credentials; teardown destroys the stack.
- Android Chromium and iPhone WebKit generated-app login/photo/offline recovery using intercepted fixture backends; actual Chromium installed worker/offline cache checks with zero external worker traffic. These frontend and local-backend tests are separate checks on identical candidate source.

New combined CI evidence and exact final SHA must be checked before claiming completion. The dedicated workflow targets only this development branch and never deploys. Installed iPhone PWA instrumentation is unsupported; these browser tests are not physical-phone verification.

## Readiness limits

Even a technically green candidate is not hosted-pilot or production approval. Separate protected staging, Cloudflare Access, approved live migration/recovery, actual external email, real Android/iPhone acceptance and independent original-garment validation remain outstanding. Existing live permission findings are unchanged. No customer accounts/data/photos, paid resources or AI calls, Drive Duel changes, production merge or deployment. Production promotion remains BLOCKED.
