# Closet Current — MAIN Priority #148 / ISOLATED-HOSTED-SUPABASE-ACCEPTANCE-148

**RESEARCH ONLY · Family Alpha Issue #255 HOLD · DRAFT UNMERGED · NO PRODUCTION, EXISTING STAGING OR DRIVE DUEL MODIFICATION / MERGE / DEPLOY.**

## Initial connected-project discovery — why actual hosted testing is BLOCKED

On 2026-11-07, connected Supabase accounts exposed three existing projects:

| Connected project | Project ref | Allowed for P148? |
| --- | --- | --- |
| Closet Current (existing production) | `hlkgymugtfbirlpunsra` | **NO** |
| Closet Current Staging (existing staging) | `fbnplztkbsteuzrmbgib` | **NO** |
| Drive Duel (unrelated active app) | `qlwotqbqxpgkheitsboe` | **NO** |

There is **NO independently provisioned disposable Closet Current hosted Supabase test project** in the connected listings. P148 has not authenticated to, uploaded into, altered, migrated, or deployed any of the three available projects. No owner credentials were requested or generated. **Do not claim hosted issuer-backed JWT/RLS/Storage certification until an isolated project has been provisioned and the opt-in hosted tests have actually passed.**

## What is implemented

1. `hosted-project-guard.mjs`: unconditional denylist for all three known protected project refs, HTTPS exact canonical `<20-alphanumeric-ref>.supabase.co` only, matching independently supplied approved project ref, explicit isolated project label, two separate email addresses carrying `p148` in their local parts and strong distinct password env values. Publishable/legacy anon key only; service-role/secret keys refused. Hosted write mode requires independent exact phrase `I_AUTHORIZE_DISPOSABLE_P148_CLOUD_TEST_WRITES`. All values are environment-only; never checked into a file or printed.
2. `test-isolated-hosted-supabase-148.mjs`: safe-by-default no-network CLI that returns `HOSTED_NOT_RUN_NO_APPROVED_DISPOSABLE_PROJECT` with exit 0 and `hostedSupabaseCertified:false` unless **every** project, account and approval gate passes. The real cloud probe is dynamically imported *only after* the complete project guard.
3. `hosted-acceptance-probe.mjs`: actual host-only ready-to-run integration, using /auth/v1/token password sign-in and /auth/v1/user to get **server-verified Supabase-issued** owner UUID; checks JWT issuer, audience, role and lifetime, distinct A/B accounts, strictly same-origin request handling and no redirect. Read-only mode checks bidirectional `closet_backups` cross-owner RLS. Preapproved FULL mode requires both accounts have no existing backups before it writes. FULL mode uses the unchanged P129/P128/P126 cloud bridge, actual SHA-pinned Commons original JPEG plus independently cropped JPEG cutout, create-only per-owner Storage uploads and revision CAS RPC, two-account JPEG Storage owner deny checks, stale-revision refusal, original+cutout SHA re-verification, and owner-only atomic IndexedDB outfit recovery. No hosted project is auto-provisioned; no existing data overwritten.
4. `isolated-hosted-supabase-148.test.mjs`: targeted negative acceptance for every connected project, unsafe URL/scheme/port/hostname, missing project confirmation, duplicate or non-test user, short passwords, service-role key, missing independent write permission and the no-network default entry point.
5. Dedicated `isolated-hosted-supabase-148-no-deploy.yml`: exact verified P147-parent ancestry and six research-only paths, full Node suite and app build. It does **not** contain hosted test credentials, Supabase write actions, hosted migrations or deployment permissions. It explicitly asserts hosted certification did **NOT** run.

## Execution prerequisites for a future isolated-hosted test

Provision a **new separate disposable project** named exactly `Closet Current P148 Disposable`, with a previously unconnected project ref. This may require owner's approval and may incur billing, so P148 does not create one unilaterally. On that disposable project only, prepare the existing unchanged `supabase/cloud-backup.sql` schema and two new dedicated password-authenticated `p148` test accounts, not actual family testers. Confirm account passwords are set securely, accounts are verified for sign-in, and use only public publishable key. Then run from a secured ephemeral CI environment, using secrets set as environment variables; never put secrets in GitHub logs, PR text, repository or chat.

Required environment variables:

```
P148_ISOLATED_PROJECT_REF=<new dedicated project ref>
P148_APPROVED_PROJECT_REF=<same new ref entered independently>
P148_CONFIRMED_PROJECT_LABEL=Closet Current P148 Disposable
P148_SUPABASE_URL=https://<new dedicated project ref>.supabase.co
P148_PUBLISHABLE_KEY=<publishable key only>
P148_TEST_A_EMAIL=<dedicated alpha+p148 email>
P148_TEST_B_EMAIL=<dedicated bravo+p148 email>
P148_TEST_A_PASSWORD=<dedicated secret>
P148_TEST_B_PASSWORD=<different dedicated secret>
P148_RUN_HOSTED=readonly
```

Read-only mode performs no writes. If and **only if** the owner separately approves writing synthetic test data to that new disposable project, explicitly change `P148_RUN_HOSTED=full` and set `P148_WRITE_APPROVAL=I_AUTHORIZE_DISPOSABLE_P148_CLOUD_TEST_WRITES`.

Do **not** use these environment variables with production or existing staging: the guard will refuse them regardless of any approval string. Do not pass service-role JWT or `sb_secret_` keys. Do not publish credentials.

## Trust boundaries

Supabase's official guides establish that /auth/v1 uses Supabase-issued signed JWTs verified server-side, and that Storage RLS must apply owner-specific predicates; the probe checks the issuer/aud/role and verifies the owner with /auth/v1/user, but does **not** independently verify a possible legacy HS256 signature locally. It relies on the hosted Auth service's validated response and actual hosted RLS/Storage. This is a future test gate, not a substitute for genuine hosted results or physically testing phones.

Supabase public changelog also notes November 10, 2026 TLS 1.2 CBC-cipher retirement. Future hosted tests use Node 22+ modern TLS; no deprecated Supabase CLI project change commands are part of P148.

## Verification status

Only research code, gate unit tests, default no-network behavior, exact-head Node regression and unchanged app build may be marked verified from this PR after dedicated CI passes.

**The actual hosted Supabase signed-JWT/Storage test is intentionally NOT RUN. Its status remains BLOCKED, not PASS.**

Unverified for launch: hosted signer-backed tests, physical iPhone/Android camera and PWA, >1,000-clothes memory on real phones, recognition accuracy on genuine new photos, arbitrary 3D photographed-clothing realism, and cloud/local distributed-transaction atomicity.

**Family Alpha HOLD. Unmerged draft. No production or staging changes.**
