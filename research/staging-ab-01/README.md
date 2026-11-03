# STAGING-AB-01 — Real two-account API/Storage authorization verification

**Mode:** isolated MAIN-CONTROLLER research; STAGING READ ONLY; DRAFT/HOLD; never production or staging deployment.

**Parent:** CLOUD-RLS-01 PR #553, exact SHA `32e62ec4d85e460ed7da5b187d6823ce7cac6ce7`, earlier exact-commit no-deploy CI SUCCESS #41736048712. The Supabase project in this research is strictly `https://fbnplztkbsteuzrmbgib.supabase.co` (Closet Current **Staging**, not production `hlkgymugtfbirlpunsra`). PR #550 has native session authentication research, PR #551 saved outfit preservation; Parallel #18 PR #552 owns lossless saved editing. No merges or source collisions.

## Already executed LIVE staging read-only role checks — factual but NOT signed-token proof

On November 3, 2026, the main controller used the connected staging SQL interface to run three **transaction-scoped, rollback-only/read-only** checks; no rows, secret keys, identity records or image bytes were fetched:

- Role `authenticated` with locally supplied synthetic UUID `111...111`: `auth.uid()` resolves to simulated claim, **0 backup records** and **0 closet-private photo metadata** visible.
- Role `authenticated` with distinct synthetic UUID `222...222`: same role resolution, **0 backup records** and **0 private photo metadata** visible.
- Role `anon`: selecting from public closet_backups fails with PostgreSQL **42501 permission denied**.

The two claims are *not real signed user JWTs*, and the synthetic UUIDs have no seeded owned rows. A deny-on-empty database is NOT a proof of correct owner access. No SQL role replay verifies the HTTP JWT signature layer, the actual REST/Storage gateway, authenticated backup-write RPC or real cross-user access.

## Research implementation

- `two-account-proof.mjs` performs only fixed-origin staging HTTPS requests using **two independently server-verified test-account logins** (actual `/auth/v1/token` + `/auth/v1/user`). No identity is trusted solely from browser state or unsigned JWT payload.
- It requires existing account A and B backup fixtures (one matching owner row each) **and** account-owned original JPEG test paths. Missing credentials, independent owner identity, data or photos produce **BLOCKED**, never a false PASS.
- It first proves each account can select its own backup and retrieve its own preseeded private JPEG, then tests A→B and B→A backup owner filter and image retrieval, anonymous backup/photo denial, cross-owner photo metadata list and anonymous list denial.
- It refuses all operations outside the **fixed staging hostname** or read-only `GET` and `POST` limited to password authentication and storage **list**. Storage `POST .../list` is read-only. It cannot upload/delete/modify backups, images, identities, Auth configuration, RLS policies or the RPC.
- No secrets, raw signed tokens, emails, UUIDs, raw photos, backup documents or customer data are printed/persisted. On image reads it cancels HTTP bodies without inspecting or saving bytes. It checks only statuses.
- Legacy anon JWT/publishable key accepted; service_role/secret keys are refused. All redirects rejected.

## Required manual test configuration (approved STAGING fixtures only)

The no-deploy **manual** workflow accepts GitHub repository or environment secrets with these exact names, provided by the authorized project administrator:

- `CC_STAGING_AB01_PUBLIC_KEY` — *staging publishable key or legacy anon key only*
- `CC_STAGING_AB01_A_EMAIL` / `CC_STAGING_AB01_A_PASSWORD`
- `CC_STAGING_AB01_B_EMAIL` / `CC_STAGING_AB01_B_PASSWORD`
- `CC_STAGING_AB01_A_PHOTO_PATH` / `CC_STAGING_AB01_B_PHOTO_PATH` — existing approved sentinel paths, `<verified-owner-uuid>/test-prefix/name.jpg`, each confirmed owned by its distinct account

Only use dedicated staging QA accounts and test JPEGs. **Do not provide normal family accounts or customer originals.** The selected accounts must already have distinct owned backup records. No new users, content or fixtures are provisioned by this research.

Invoke the dedicated `STAGING-AB-01 real two account staging only NO DEPLOY` workflow with `run_live_staging=true` **only when the above are present**. A run without fixtures exits code 2 / `LIVE_BLOCKED`. Read-only HTTP leak detection exits code 1 / `LIVE_FAILED`. Only fully positive + negative verified accounts yield `PASS_LIVE_READ_ONLY`.

Never disclose secret values or real owner UUIDs in PR comments, CI logs or ChatGPT. The sanitized JSON report has *no identity fields*.

## Offline adversarial contract verification

`node --test tests/staging-ab-01.test.mjs` uses a local fake HTTP transport and verifies source code will:

- Reject production URL, service-role secret key, missing/duplicate accounts, invalid or foreign JPEG path.
- Require actual `/auth/v1/user` server identity validation.
- Refuse empty own backup/photo fixtures instead of returning PASS.
- Fail if broad or filtered A→B backup leak, anon backup leak, foreign private image retrieval, foreign private list.
- Avoid accidental writes, external redirects, service_role, and any secret material in acceptance JSON.
- Preserve release HOLD even if every read-only staging check passes, because update/insert/delete and API write-path/RPC tests remain **NOT TESTED**.

The CI runs the exact full base app regression/build, strict research path-only diff check, offline adversarial tests, and deliberately executes the live runner without secrets to demand a BLOCKED exit (never a fake success). Browser screenshots are not requested: this priority directly validates the server with HTTPS requests, not UI appearance.

## Remaining acceptance gates

1. **Real two approved signed-in staging accounts plus positive owner backup/JPEG sentinels:** not provided/accessibly connected to this conversation. True live token/API verification remains BLOCKED until an explicitly authorized manual workflow runs and passes.
2. Staging writer RPC authorization, cross-owner UPDATE/DELETE/INSERT with rollback-safe disposable fixtures, cloud conflict revision, token refresh and revoked session behavior: NOT VERIFIED, and not silently attempted on existing accounts.
3. Native consumer workflow PR #552 is in a separate parallel; no integrated merge or staging web client. PR #550 session evidence and PR #551 data-loss evidence are research-only.
4. Supabase security advisory disabled leaked-password protection: warning remains, requires authorized settings intervention.
5. Real phones, model inference, photorealism, Family Alpha #255 and production deployment: HOLD.

**Completion semantics:** code/contract/CI may pass on a final research HEAD while *live two-account* and *production release* remain BLOCKED. Do not conflate these.
