# Issue #182 — independent staging Auth and privacy audit

Audit date: October 22, 2026. Baseline PR #180 exact head
`083f9c234a0a0829476df25287ccf8ff638af937`.
Branch: `audit/issue-182-staging-auth-qa`. Target: PR #180 branch,
`staging/pin-verified-supabase-project-20261022`. No hosting work is included.

## Read-only hosted observations

Only project `fbnplztkbsteuzrmbgib` was queried. Connector reports Closet Current
Staging, ACTIVE_HEALTHY, PostgreSQL 17.11.0.003. Catalog inspection (not customer
row reads) observed:

- `public.closet_backups` has RLS enabled. Authenticated owner policy compares
  `auth.uid()` with `owner_id` in both USING and WITH CHECK. Writer role also has
  owner predicates in both clauses. FORCE RLS is false; this alone is not a
  vulnerability for ordinary authenticated callers.
- Authenticated has SELECT only on backup table; no anon/PUBLIC table grants
  were returned. Public save RPC is SECURITY INVOKER with empty search_path;
  anon cannot execute; authenticated can execute.
- Its private `closet_rpc_private.save_checked` implementation is SECURITY
  DEFINER with empty search_path, rejects missing subject, derives owner from
  verified JWT subject rather than editable metadata, validates document shape
  and size, and atomically checks expected revision. This privileged internal
  function is intentional; exposed schema configuration was not inspected.
- `closet-private` is private, JPEG only, maximum 8,388,608 bytes. SELECT, INSERT
  and DELETE policies require matching bucket and first folder = `auth.uid()`.
  No public Everyone policy or storage UPDATE policy was observed.
- No UPDATE is needed by this client: cloud-backup.js uploads immutable
  owner/SHA256.jpg objects with POST, and handles existing-object 400/409 by
  fetching and checking the digest. Do not broaden storage access for upsert.

Catalog observations do not establish actual HTTP isolation or email behavior.
Unauthenticated anon role is denied. Supabase anonymous *signed-in* users use
`authenticated`; policies do not exclude `is_anonymous` users. Verify anonymous
sign-ins are OFF before pilot; if enabled, request separate approval for disabling
that provider or designing explicit exclusion. No setting was changed.

## Auth URL configuration: not observable through this connector

Available tools have no Auth configuration read endpoint. No management token
was requested, and no browser session was assumed. Observed Site URL, redirect
allowlist, email confirmation setting, anonymous provider setting and email
message templates are **UNVERIFIED**, not presumed correct from prior reports.
The following checklist fulfills the issue's read-blocked fallback. Do not press
Save or change anything during this audit.

1. On mobile open https://supabase.com/dashboard/project/fbnplztkbsteuzrmbgib/auth/url-configuration
   and verify project title says Closet Current Staging and ref is the exact one
   above. Expand the browser menu and use desktop site if controls are hidden.
2. Record Site URL and each redirect entry privately. Desired staging default
   and exact allowed callback are both
   `https://pilot-access-check.closet-current-staging.pages.dev/` (including slash).
   Flag localhost, production Closet Current, Drive Duel, broad wildcards, or
   unprotected preview hosts. Do not silently delete entries: owner approval is
   required for any settings change.
3. In Authentication > Sign In / Providers, inspect Email: enabled, signup
   allowed for the approved pilot and Confirm email ON. Inspect Anonymous
   Sign-Ins: OFF. Record observed versus desired and stop if different.
4. Inspect confirmation and password-reset templates. Prefer Supabase-hosted
   `{{ .ConfirmationURL }}` for this implicit client. Custom token-hash links
   must land at the exact preview root with token_hash and supported type
   (signup/email/recovery). `/auth/confirm` is not an implemented app route.
   A PKCE `code`-only callback is intentionally rejected (no code verifier).
   Never share email tokens or full delivered link URLs in issue comments.
5. Inspect SMTP readiness and delivery restrictions without sending email or
   copying secrets. Record whether the approved disposable inboxes are allowed.
6. After owner approval AND an independently deployed protected app, test actual
   delivered confirmation/recovery links. Verify destination origin and pathname
   without recording query/fragment secrets. A dashboard value alone cannot
   prove delivered email links or Cloudflare callback preservation.

## Source and offline runtime findings

Source public/auth.js deliberately retains production configuration; running its
ordinary production build is NOT a staging procedure. The connected staging
builder rewrites Auth and cloud endpoints, public key and APP_URL in a temporary
sealed bundle. New tests execute that generated auth.js with a synthetic public
key at the exact required preview, and intercept every fetch locally.

Signup/resend/recover all send exact redirect_to; signup without a usable token
keeps wardrobe locked. Implicit callback verifies token against /auth/v1/user
and clears URL credentials before network. Custom token-hash confirmation also
verifies identity. Recovery remains gated until password update. Refresh and
logout have generation/account guards against late results. Cloud backup checks
owner-specific IndexedDB and generation around async work; decode rejects other
owner photo paths and checks content SHA256. Existing regression suites exercise
cross-account races. No source defect justified a runtime change in this audit.

Cloudflare email OTP grants website access only. It does not create a Supabase
app session. Returning from Access without app tokens must show the app login;
a code-only callback must not unlock it. Expired links offer resend/reset help.
If Access expires while opening a Supabase link, complete Access and confirm the
app received its callback; if lost, request a fresh app email. Real Access
round-trip preservation is still unverified.

## Two-account hosted QA plan — NOT EXECUTED

Requires separate owner approval for disposable account signup and any hosted
writes. Use only two owner-controlled disposable inboxes, distinct browser
profiles, generated JPEG color swatches and fictitious garment names. Never
import a wardrobe or photograph a person. Keep credentials out of reports.

| Step | Procedure | Required result |
| --- | --- | --- |
| Prerequisite | Confirm root and every preview protected; exact built stage endpoints and paid-AI block; record app commit | Stop if production endpoint or public app asset appears |
| Double Auth | Open preview signed out, complete Cloudflare code | App still asks for its own login |
| Signup A/B | Create each approved account; confirm latest delivered email | Exact preview callback; separate verified user IDs; no account data before confirmation |
| Own round trip | A saves blue swatch, B saves red; sign out and back in on second clean profile | Each restores only own fictitious record and byte-identical photo |
| Backup isolation | With A's token request B owner filter and unfiltered backup list; repeat B to A | Filtered list empty; unfiltered contains only caller; direct writes denied |
| Photo isolation | Both directions: other owner GET/list/sign/POST/PUT/upsert/DELETE using known synthetic paths | No bytes, signed URL, overwrite or deletion; owner content unchanged after every attempt |
| Anonymous | Without session request backup, RPC and private/public photo paths; malformed JWT too | No data or mutation; private bucket public URL fails |
| Metadata | Disposable A tries B owner_id/admin in editable metadata | No additional access; verify B unchanged |
| Session race | Start sync/refresh as A, sign out, then B logs in; exercise back-forward cache | No A UI/photos/backups in B; late A work cannot commit as B |
| Recovery | B resets password, opens latest link; retry expired/used link | Preview preserved; wardrobe gated during reset; expired link stays locked |
| Cleanup | Owner-approved deletion of test records/objects/accounts and sessions | Only synthetic evidence removed; report cleanup status |

Do not post tokens, signed URLs, actual emails, UUIDs, photos or document payloads.
Report only commit, platform, step/pass/fail, sanitized status and timestamps.
A single privacy failure blocks pilot; never repair by adding public policies.

## Evidence and limitations

New exact-preview tests: 5 passed, 0 failed, 0 skipped. These are VM/offline
network-interception tests, not real hosted signup or browser/hardware tests.
The existing 207-check disposable Auth/PostgREST/Storage script was reviewed but
cannot run here: neither Docker nor psql is installed. No replacement mock is
claimed as those 207 HTTP checks. Full Node regression result is recorded in the
checkpoint and PR after completion. No hosted accounts created, no email sent,
no real photo read, no settings/schema write, deployment, money spent or merge.

References consulted: Supabase MCP documentation search, Redirect URLs
https://supabase.com/docs/guides/auth/redirect-urls and Password-based Auth
https://supabase.com/docs/guides/auth/passwords (October 22, 2026). Changelog
markdown fetch was attempted but reader rejected its content type; no Supabase
feature or schema implementation was changed.
