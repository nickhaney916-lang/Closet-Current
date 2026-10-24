# Closet Current — Family Alpha protected staging preflight (OFFLINE HOLD)

**October 23, 2026** · Issue #255 · main engineering thread · no deploy, no merges, no spending.

Built on #273 staging Auth candidate. This assignment prepares a **reproducible release gate**, not access to a real family website. Cloudflare staging hostname has **NOT** been approved or supplied. The client remains disabled outside localhost; the preflight does not turn it on.

## Run the default, safe preflight

```sh
node scripts/build-family-alpha-staging-auth-hold.mjs
node scripts/check-family-alpha-protected-staging-preflight.mjs
node --test tests/family-alpha-protected-staging-preflight.test.mjs
```

The script inspects only `dist-family-alpha-staging-auth-hold/`, an isolated offline build. It explicitly refuses command-line hostname or token arguments; **it performs zero network requests**. No Supabase project, Cloudflare Access or production account is contacted.

The preflight verifies:
- Production `dist/`, source-pinned garment preparation and previous `dist-family-alpha-candidate/` are preserved by the existing builder gates.
- Stage Auth, cloud-backup client and 2D avatar server preflight all route to the separate **Closet Current Staging** project `fbnplztkbsteuzrmbgib`, not production.
- The configuration is **release HOLD** with empty staging public key and email redirect, meaning neither stage login nor cloud backup can start.
- `alpha-stage-config.js` loads before `auth.js`, the staging token storage key differs from production, and stage PWA does not register a service worker.
- The regular photo-avatar entry is hard-disabled on all non-localhost hosts. A Cloudflare URL does not grant permission to enter the app.
- Even a healthy build cannot claim current Cloudflare protection, a staging Auth redirect allowlist, legitimate user login or row/object-level RLS from offline checks.

## What the future Access verification will and will not do

An exported, **not automatically invoked** `probeUnauthenticatedAccess` method requires:
- the exact explicitly approved HTTPS staging URL;
- `ownerApproved:true` for that check;
- a caller-supplied `fetchFn` (none exists in the default CLI).

The probe can issue only an anonymous **HEAD** with `credentials:'omit'`, `redirect:'manual'`, no referrer and no Authorization header.

| Result | Meaning | Launch verdict |
| --- | --- | --- |
| `FAIL_PUBLIC` (200/204) | Unauthenticated URL responded successfully; do not serve sensitive staging there | HOLD |
| `ACCESS_CHALLENGE_OBSERVED` | Observed a redirect to a recognized `*.cloudflareaccess.com/cdn-cgi/access/` login path | HOLD, not yet verified |
| `DENIED_SOURCE_UNVERIFIED` | 401/403 but the denying component may be the app, not Cloudflare Access | HOLD |
| `INCONCLUSIVE` | Network error, generic redirect, invalid status, unexpected response | HOLD |

This is **not** a Cloudflare management policy audit. It cannot establish that a different hostname, URL, cache, service-worker scope, or static asset path is protected. It cannot certify the approved tester list or login. Never treat this isolated HTTP evidence as Family Alpha access approval. Tests use mock responses only, never any actual staging host.

## Readiness gates before requesting deployment approval

1. Identify the exact intended protected staging hostname (not guessing a `pages.dev` link), its owner and default redirect paths. Require no public alias exposing the same build.
2. Confirm Cloudflare Access is configured for the **whole** staged app, static assets, photo routes and alternate domains; unapproved visitors and unauthenticated GET/HEAD cannot receive private content. Any recorded evidence must contain no private tokens.
3. Confirm stage project `fbnplztkbsteuzrmbgib` has the **exact** approved callback registered for signup, password recovery and login; verify current email delivery/SMTP without contacting real family members.
4. With explicit approval, issue an **isolated, no-deploy** stage artifact with only the stage's publishable key (never the service role key), matching callback and verified access policy. This PR supplies neither.
5. Authorize separate **disposable** staged Auth identities A and B, then live read/write positive controls and cross-owner negative controls for backup rows and private JPEG Storage, including signed-URL expiration. The dated Supabase metadata-only audit #272 is not live authorization evidence.
6. Review production `authenticated` excess table TRUNCATE/TRIGGER/REFERENCES/DELETE privileges from #272 separately; no GRANT/REVOKE without approval.
7. Finally, arrange consented family-user physical Android/iPhone original-photo capture, review/retake, three outfits and swaps, private issue feedback with no minors' photos in GitHub.

The release remains **HOLD** until the main owner explicitly approves staging configuration and test-account authorization. No generated HTML/manifest or CI artifact is a family invitation URL.

## CI scope and evidence standard

`tests/family-alpha-protected-staging-preflight.test.mjs` simulates bad/good Access responses and refuses to claim a verified host even after a Cloudflare challenge. Combined CI runs the **full Node regression suite** and existing browser tests for the actual mocked stage Auth routing and four-account cloud isolation. All login/payment or real user operations are excluded.

Always report the final exact-head GitHub Actions status; do not assume a passing static preflight proves backend or physical-phone readiness.
