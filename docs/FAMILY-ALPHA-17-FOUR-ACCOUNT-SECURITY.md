# Family Alpha #17 — Four-Account Privacy, Backup/RLS & Staging Security

**October 23, 2026 — independent no-deploy code/security review; release decision: HOLD.**

## Version scope and duplication avoidance

Isolated PR stacked on latest Family Alpha **#267** commit `fe30c48d611eccec05121a4dd4812aa570ae2b64`. Branch also inherits **#266** (integration), **#264** (stale avatar cancellation), **#263** (actual scoped IndexedDB read and Auth session epoch), and **#262** (mock Auth server identity check). These branches and #267's image provider, #265's fidelity research, #261's swaps and #257's original preparation are **not changed**.

Only client Auth/cloud-backup lifecycle hardening plus independent account/privacy verification is included. No production rollout, backend connection, credentials, live family account, customer image, Auth/RLS policy modification or paid service.

## Reviewed security definitions: file evidence vs live evidence

| Area | Repository finding | Status and unknowns |
| --- | --- | --- |
| DB RLS | `supabase/cloud-backup.sql` enables RLS on `public.closet_backups`; `closet_backup_owner` uses `auth.uid() = owner_id` in USING and WITH CHECK; anon/public table permissions revoked | PASS in *checked-in SQL definition*; deployed `pg_policies`, role grants, other OR policies, real API remain **NOT VERIFIED** |
| Database RPC | `public.save_closet_backup` uses `security invoker`, `auth.uid()` as owner, optimistic revision and bounded JSON; anon/public function EXECUTE revoked | PASS static; deployed grants/privileges/RPC behavior not rechecked |
| Storage | `closet-private` defined private, JPEG-only, 8 MiB; SELECT/INSERT/UPDATE/DELETE storage policy owner folder `(storage.foldername(name))[1]=auth.uid()::text` | PASS checked-in policy; existing deployed policy inventory/bucket `public` setting and signed URL lifetime **NOT VERIFIED** |
| Stored paths | `<owner-UUID>/<SHA256-JPEG>.jpg` validated in client before download; downloaded bytes rehashed | PASS client contract; cryptographic name is integrity/addressing not authorization; per-garment derivative provenance not covered |
| API keys | Browser contains publishable `sb_publishable_` key, not `service_role` or a secret project key in reviewed files | PASS inspected files; full deployed bundle and server secrets **NOT VERIFIED** |
| Cloud restoration | JSON document includes items and `outfit-board`; photos downloaded before atomic local replace; old code depended on server RLS and did not recheck Auth epoch and owner at every final write | Development fix in this isolated PR; real backend and all application integrations **NOT VERIFIED** |
| Staging | Repo Cloudflare deployment workflow deploys `main` to `closet-current`; Auth email redirects are hardcoded to GitHub Pages, not a verified staged callback | Auth callback and protected staging origin require owner-approved deployment/allowlist/Cloudflare Access validation |
| Email + age/privacy | Signup/resend/reset clients exist; current SMTP, minors' privacy/parental consent and private feedback destination are not established by source | **NOT VERIFIED**; keep release blocked |

Historic source: `docs/CLOUD-BACKUP.md` records prior *two disposable synthetic backend accounts* with real Supabase API deny/allow tests and local SQL policy checks on October 14, 2026. This is useful earlier evidence **but not current deployed four-account RLS or staging verification**. Treat future access-token expirations, unknown additive policies, Storage object signed URLs, current SMTP and staging ACL as unresolved.

## Concrete development-level fixes

1. `public/cloud-backup.js` captures an owner + exact DB handle + Auth session epoch + cloud generation for each sync. Immediately before a restoring IndexedDB transaction, and again inside its asynchronous `cloud-sync` read handler, it checks this scope; on mismatch aborts without clearing or writing items, photos, outfits or other private state. Prevents pending restored data being installed after signout/account change/pagehide.
2. Auth scope rechecked after token refresh, HTTP response, image decode and RPC save. A changed owner cannot accept a stale callback or schedule retry/status for a new user's UI. New account `start` bumps cloud generation; per-generation sync ownership prevents old operations clearing a new account's lock.
3. Server backup SELECT now requests `owner_id` and rejects a missing or foreign owner in JSON even where a hypothetical broken server returned wrong data. This is **defense in depth**, never a replacement for DB RLS. Mock cloud-flow protocol updated to reflect real table contract.
4. `public/auth.js` hides `appShell` and exposes login gate *before* awaiting network logout. Increments its session epoch, clears local Auth, calls cloud `invalidateSession()`, then attempts revoke and reload. Old photos are hidden immediately; browser memory is cleared by eventual reload. **It does not promise instantaneous revocation of already-issued server JWTs**.

### Privacy matrix

Use four fictional UUID owners: A (Adult 1), B (Adult 2), C (Minor 1), D (Minor 2), with synthetic generated patterned JPEGs, fake saved outfit boards, mocked bearer tokens and mock HTTP API. This is a privacy/consistency test against the actual client and a **simulated** strict owner backend:

| Operation | Expected and asserted |
| --- | --- |
| Same-owner clothes/original/derivative storage | Allowed per synthetic account; exact owner folder and SHA integrity |
| Same-owner save/download/restore | Own records and `outfit-board` recovered |
| Each other owner's DB, cloud row and photo | Deny (4×3 account pairs); no other IDs in restored view |
| Sign out while HTTP request is pending | Cancel and hide private UI; never apply completed old response |
| Rapid Account A → B → A | Correct per-user IndexedDB handle and private garment/board on refresh |
| Refresh/reopen | Recovered correct own saved item/board |
| Stale mask/source / older rendered request | Existing independently tested #260/#264 guards (not duplicated) |
| No real users or photo uploads | Only synthetic canvas-derived JPEG and mocked HTTP endpoints |

**Security confidence:** no percentage assigned. Passing a mocked backend says nothing about whether deployed Supabase grants deny access as intended.

### Outstanding gates (all NOT VERIFIED unless specifically stated)

1. **Actual backend authorization — NOT VERIFIED:** Approved disposable A/B/C/D accounts and provider-created tokens in an isolated Supabase project; inspect `pg_policies`, grants, `storage.buckets`, `storage.objects` plus any additional permissive policies. For each of 4 actors: attempt other 3 owners' backup SELECT, INSERT, UPDATE (including owner transfer), DELETE, RPC writes; separately verify intended same-owner row deletion via account-erasure cascade or privileged operator path because this SQL does not grant authenticated DELETE; storage SELECT/INSERT/UPDATE/DELETE and signed/public URL access. Verify anonymous/expired/revoked login tokens and token/session lifetime. Roll back/remove synthetic test data. Do not do in this assignment without explicit approval.
2. **Private staging — NOT VERIFIED:** Check actual Cloudflare Access policy and permitted emails, URL, production isolation, deployment pin and four-way login. Confirm callback redirect allowlist matches the chosen protected staging hostname; code currently points to GitHub Pages. Do not change origins or email templates here.
3. **Account switch and logout on real devices — NOT VERIFIED:** Fast A/B switching, browser pagehide/bfcache, token expiry during upload/restore, interrupted indexedDB transaction, reopen, back navigation and multiple active tabs. Images should disappear immediately on logout; zero leakage across accounts in DOM, IDB and cache.
4. **Source and derivatives — NOT VERIFIED:** Real consented images, trusted original/crop SHA and mask provenance (#265/#267 research only), per-owner private storage of original JPEG/transparent PNG and revocation. Existing bucket configuration allows JPEG; actual private PNG derivative design/storage policy is still undecided.
5. **Privacy — NOT VERIFIED:** Review privacy/terms, children's data treatment, retention and deletion of unreferenced uploaded images, signed-photo-url TTL and leakage in browser/network log or feedback. `docs/CLOUD-BACKUP.md` says unused immutable originals are not garbage-collected.
6. **Release authorization — NOT VERIFIED:** Main conversation reviews CI, environment ACLs, real Auth/RLS, authorized testers, physically observed capture→save→avatar→outfit swap, and explicitly decides Go/No-Go. **Current recommendation: NO-GO.**

### How to reproduce in isolated CI

```bash
node scripts/build.mjs
node --test tests/*.test.cjs tests/*.test.mjs
npm install --no-save --no-package-lock playwright@1.56.1
node scripts/test-family-alpha-17-four-account-browser.mjs
```

The browser test runs Chromium/WebKit at 320, 390 and 430 px and outputs synthetic-only `benchmark/family-alpha-17/four-owner-browser.json`. HTTP requests are intercepted locally; no backend credentials, real account traffic or customer photos are involved. The general existing cloud-backup regression uses `scripts/run-cloud-backup-flow.mjs` with a controlled mock; run that separately before integration. Do not claim headless mobile viewport simulation is a physical Android or iPhone test.
