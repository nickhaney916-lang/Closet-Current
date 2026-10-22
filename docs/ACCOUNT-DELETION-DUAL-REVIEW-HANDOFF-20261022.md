# Closet Current — Dual-review interrupted-deletion handoff

**October 22, 2026 — server-only UNDEPLOYED security design.** Created from independently verified account recovery assessor (PR #178). Do **not** enable, deploy, merge to production `main`, activate the customer account-delete HTTP function, alter customer data, or migrate any draft SQL automatically.

## Problem and goal

A long-lived write tombstone protects backup and Storage writes after an owner starts account deletion. A separate, one-time exclusive cleanup claim prevents two concurrent deletion workers. If the worker crashes, the account deliberately stays write-locked and its claim is not reissued. PR #178 adds a read-only assessor, but the assessor cannot prove a previous worker has stopped. A human incident workflow must not infer quiescence or account deletion from existence flags.

## Implemented: non-executable, dual-review handoff check

`supabase/functions/account-delete/recovery-handoff.mjs` is a **disabled-by-default, server-only** function that prepares a sanitized REVIEW packet after all these checks:

1. Validate account UUID and fixed-format incident reference. Injected privileged `authorizeIncident({uid, incidentTicket, operatorContext})` must approve the exact account. Failure occurs **before any account-specific read**. Ticket knowledge is **not** authorization.
2. Obtain server-provided time; inspect trusted PR #178 read-only recovery snapshot. Reject missing tombstone, missing exclusive worker claim, malformed or affirmative deletion statuses.
3. Obtain **independent proof** of an actual externally enforced worker fence, plus short-lived attestation (at most two minutes old). A tombstone or old claim does not prove a worker stopped.
4. Require two separately verified, account/incident/**snapshot** and fence-bound authorizations for roles `incident_owner` and `security_reviewer`. Reviewer identities must be different. User-supplied approval objects are **not trusted**; real backend verifiers must independently validate authentication, review and binding.
5. Re-read the owner recovery snapshot **after** both approvals. Any change in Storage presence, backup presence, Auth presence, lock, claim or classified incident state invalidates the packet.
6. Recheck independently enforced worker fencing **after** the second snapshot; a changing fencing epoch voids approval.

**Output is deliberately not a capability.** It includes only enumerated status and Boolean safeguards; never user UUID, email, private photo filename, passwords, tokens, incident ticket, approver identities or approval artifacts. All outputs explicitly deny unlocking, claim removal, starting or retrying cleanup, deleting Storage, and deleting Auth. Even `READY_FOR_SEPARATE_MANUAL_INCIDENT_REVIEW` is not an authorization to delete. No audit artifact can be used by a destructive endpoint.

## Required external work for actual hosted recovery

This draft does **not** provide an approved operator identity system, verified two-person signatures, distributed worker orchestration/fencing, immutable incident log, credential rotation, hosted recovery executor, retention decision or complete Storage byte-level inventory. Supabase Auth user deletion does not immediately invalidate still-live access JWTs, so session existence and all sensitive writes need independent protections. In a real system, fence enforcement must be guaranteed server-side across ALL worker instances and checked in the SAME trustworthy transaction context as future privileged cleanup, rather than simply trusting a stale Boolean.

**No recovery executor or automated unlock exists.** Future work must separately implement and review owner consent, dual control and audited background-worker fencing; only after owner-authorized isolated staging tests may an approved manual, fenced transaction be considered. A robust plan for a claimant that died after deleting Auth is necessary before enabling any deletion endpoint; otherwise recovery remains blocked.

## Verification plan

- Synthetic isolated Node tests for default-disabled posture, unauthorized account and incident, first-read-before-auth rejection, same operator twice, forged or expired approval, duplicate or changed state, late or missing worker-fence evidence, wrong fence epoch, no sensitive data in result, and zero destructive calls.
- Strict source guard that checks original PR #178 assessor, HTTP 503 endpoint, service-only draft SQL, all production Auth/Storage and original-before-crop garment recognition still byte-identical.
- Full inherited Node suite, disposable 207 HTTP Supabase security checks, Android Chromium/iPhone WebKit browser emulation and camera/indexing CI. **No physical phone evidence counted.**
- No new Data API grants, tables, migrations, executable functions, customer data or paid resources. The existing `account-delete/index.ts` remains disabled HTTP 503.

**Still blocked:** actual recovery operation, passwordless reauthentication, protected hosted staging, real Android and iPhone 0/2, independent source-photo review 0/24, genuine AI accuracy unmeasured, public legal/retention review. No pilot or production promotion.
