# Closet Current — Cloudflare Access root + preview-host coverage audit

**Family Alpha #255 | Historical host checkpoint October 21, 2026 | Created October 23, 2026 Pacific**

**Release HOLD.** This is a source-only offline audit plan. It does not make a network request, inspect current Cloudflare Access apps through an API, change policies, deploy Pages, register redirect URLs or access any personal data.

## What is actually known (dated screenshot checkpoint)

The existing Cloudflare staging Pages project is `closet-current-staging`. The root Pages hostname was previously entered into an Access application:

**`https://closet-current-staging.pages.dev/`**

The screenshot-derived checkpoint recorded:
- Root Access destination: hostname `closet-current-staging.pages.dev`, subdomain/path blank. It was **not** an observed successful Access denial or permitted-user sign-in.
- The project displayed “Create your first deployment.” Root endpoint returned **522**. Neither proves that Access actually protects app or photo assets.
- One Access application and an Allow policy beginning `Allow Members - Clo…` were visible. **Include, Require and Exclude rules had not been examined.**
- Pages UI claimed previews are restricted, but `Manage` led back to a root-only application; wildcard `*.closet-current-staging.pages.dev` enforcement **not verified**.
- No real deployed app, approved test-user login, signed-in staging RLS test, callback/SMTP verification, or family invitation in that checkpoint.

These statements are historical, not a fresh Cloudflare configuration audit. Source: Library file `Closet_Current_Staging_Checkpoint.md` (saved October 21, 2026). Machine-readable sanitized checkpoint: `research/family-alpha-access/known-cloudflare-setup-20261021.json`.

## Exact next owner-visible Cloudflare checks

In the existing Cloudflare Zero Trust dashboard:

1. Open **Access → Applications** and locate the application whose public hostname is `closet-current-staging.pages.dev`. Read its destination and whether any wildcard or path restriction excludes app assets. Capture only redacted metadata/evidence.
2. Open its **Allow Members - Clo…** policy. Review **Include**, **Require** and **Exclude**. Ensure access is limited to the owner's explicitly approved testers; check for broad Everyone, email-domain-wide, Bypass and Service Auth policies. Never commit identities, email addresses, authentication codes or token screenshots.
3. Inspect the **separate preview-host coverage** for `*.closet-current-staging.pages.dev`, without removing root coverage. Branch aliases, commit/deployment URLs and any alternate preview/project domains must not bypass Access. A Pages “Restricted” label alone is insufficient.
4. Inspect the full public route scope: homepage, `/index.html`, JavaScript/image assets, `/_alpha_research/` paths if eventually deployed, and any other static route. Verify actual identity policy enforcement and no unauthenticated access before uploading app files.
5. Only after owner authorization, test in private browser sessions that unauthenticated/unapproved viewers are denied for **both root and preview**, that approved tester identities can pass Access, and that no other hostname permits unauthenticated access. The existing exported HEAD check in #274 is only a first anonymous challenge signal; it cannot establish policy/member authorization or all-route coverage.
6. Once protection is verified, separately approve a precise staging Supabase Auth callback and use the staging project `fbnplztkbsteuzrmbgib` (never production) with disposable accounts for real JWT backup and private JPEG positive/negative tests.

**Do not deploy, change Access rules, send family invites or authorize additional paid capacity from this report.**

## Offline technical acceptance

`node scripts/build-family-alpha-staging-auth-hold.mjs`

`node scripts/family-alpha-cloudflare-host-coverage-offline.mjs`

`node --test tests/family-alpha-cloudflare-host-coverage.test.mjs`

The checker reads the dated sanitized checkpoint and the already-verified local staging-auth artifact. It returns **HOLD** with explicit coverage gaps for root, wildcard, policy identities, aliases, callback and real Supabase account tests.

`evaluateProposedAccessCoverage()` accepts **only fabricated/proposed policy objects** for unit tests; it can note root and wildcard declared and flag risky Anyone/Bypass policies, but even a theoretically complete proposal returns `PROPOSED_COVERAGE_ONLY_NOT_VERIFIED` with `allowedToDeploy:false`.

The actual Access app's latest rule state, wildcard coverage, hostname activation and staging login callback are **NOT verified** by GitHub. The next real-world action requires someone with approved Cloudflare dashboard access to inspect the above controls and record redacted evidence.

Do not conflate old 522 failures, mock CORS tests, local checks, Supabase metadata audit or a redirect with verified protected deployment.

## Non-negotiable remaining family release gates

- Exact root AND wildcard preview hostname enforcement with approved tester allowlisting.
- Explicit owner-approved staging-only build and subsequent deployment.
- Correct registered stage Auth callback, publishable key and reliable email recovery flow.
- Disposable signed-in stage Accounts A/B proving cross-owner database and private JPEG storage/signed-URL denials.
- Physical Android/iPhone camera/garment processing with consented family accounts, and clear private feedback channels.
- Independent review of production authenticated excessive backup-table privileges before production release.

No production data accessed, no sensitive media stored, no billing/auth settings touched, no paid AI, no Drive Duel changes.
