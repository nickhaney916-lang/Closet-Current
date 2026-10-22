# Closet Current — restricted staging preparation

**Authorized 2026-10-21 for PREPARING private staging, but NOT public publishing, merging production, accessing live customer wardrobes, creating billable resources or enabling paid AI.**

## October 21 security correction — Cloudflare Pages root host is NOT protected by preview-only Access

**STOP: do not upload any Closet Current staging bundle until both the Pages project root and preview deployment aliases are independently protected.** Official Cloudflare Pages documentation makes an important distinction: `Settings → General → Enable access policy` initially protects **preview deployments** only (`*.<project>.pages.dev`), not the project's root `<project>.pages.dev` nor any custom domain. A successful preview login challenge is insufficient. See:
- https://developers.cloudflare.com/pages/configuration/preview-deployments/
- https://developers.cloudflare.com/pages/platform/known-issues/#enable-access-on-your-pagesdev-domain

For a **new** isolated `closet-current-staging` Pages project, a separately authorized Cloudflare administrator must follow Cloudflare's documented root-host sequence **before serving any app or credentials**:

1. Create the separate Pages project with **no staging app deployed**; do not deploy `staging-dist` as its first/default production release.
2. Under that project's Settings enable the preview Access policy. Open **Manage** for the generated Access application. In Zero Trust / Access / Applications configure its **Public hostname** by removing the leading wildcard (`*`) from the Subdomain. Save to protect the root `closet-current-staging.pages.dev`. Follow Cloudflare's current known-issues instructions rather than assuming an ordinary wildcard covers both host classes.
3. Return to the same Pages project Settings → General and **enable an Access policy again** for `*.closet-current-staging.pages.dev`. Confirm there are **two** distinct, appropriately restrictive Access applications: one for the project root and one for preview aliases. Cloudflare requires this separate application for previews after the root hostname configuration change.
4. If any custom staging domain is attached, create an independently protective **self-hosted Cloudflare Access application** for that exact host. Cloudflare's preview policy does not cover custom hostnames. Avoid custom domains entirely until every hostname and bypass route has a verified policy.
5. Enumerate ALL preview aliases (including old hash-based deployment URLs), project root, and custom hostnames using the Cloudflare dashboard. Verify Access application inventory from the authorized account, test signed-out access for all static assets **and** test a specifically allowed and disallowed account. The existing no-credentials `check-staging-anonymous-access.mjs --bundle=staging-dist` can check the Pages root and supplied preview origins only; **it does not enumerate previews or validate custom domains**. A synthetic HTTP 302 is not proof of a real configured Access application.
6. If ANY root/preview/custom host is publicly accessible, do not upload or connect test Auth/photos. Keep staged assets offline, correct configuration, and repeat the independent review. There is no authorized production/main deployment in this process.

**Cost/provisioning warning:** Read-only connected Supabase inspection found one active Closet Current project and one active Drive Duel project across the user's organizations, not an isolated staging project. On Oct 21, 2026 the existing Closet Current organization returned a **$0/month new-project price quote**; this is *not permission or assurance of capacity*. Supabase's current Free plan normally allows **two active free projects across organizations where the user is an Owner or Admin**: https://supabase.com/docs/guides/platform/billing-on-supabase . A third active Free project may be refused even if its price quote shows $0. **Do not pause or alter Drive Duel or spend on Pro without explicit owner authorization.**

**Never represent local fixtures, workflow tests, read-only cost quotes, screenshots, Access-login redirects or operator-reported checkboxes as verified hosted Access, provisioned free staging, real physical-phone evidence or pilot release approval.**

## Verified hard blockers identified

1. The latest integrated development source still hardcodes the existing live Closet Current Supabase URL and publishable key in `public/auth.js`, `public/cloud-backup.js` and `public/ai-tryon.js`. Auth callback is the legacy GitHub Pages location.
2. Read-only Supabase account inspection found only two currently active projects: **Closet Current** and **Drive Duel**, not a separate isolated staging project. Neither existing project may be reused for staging. There are no customer accounts or images to import into staging.
3. The existing Cloudflare Pages `closet-current` project is the production site and default Pages branch previews are PUBLIC unless **Cloudflare Access** is configured and tested. A separate new project `closet-current-staging` is recommended, with Cloudflare Access enabled BEFORE any upload. This must be separately configured/verified by the authorized account owner or connected Cloudflare management.
4. Real staging signup, callback redirects, SMTP delivery and two-account cloud restore cannot be verified until the separate project, protected URL and restricted test accounts exist.

## Completed preparation on isolated draft branch

`scripts/build-restricted-staging.mjs` builds the current app without touching `public/` or the production deployment workflows, then creates an isolated `staging-dist/` distribution with:
- All known existing production Auth/backup/try-on URLs and existing publishable keys replaced by a NEW **staging-only** Supabase project URL/key;
- email callback pinned to the requested **staging-only** HTTPS origin instead of GitHub Pages;
- user-visible **PRIVATE STAGING — DISPOSABLE TEST ACCOUNTS ONLY** warning;
- paid AI try-on hard-blocked before any provider request;
- staging-specific immutable app-cache release fingerprint and separately pinned phone-photo / saved-closet audit versions;
- noindex headers/robots (only indexing discouragement, **not** actual access protection);
- hard rejections for production/Drive Duel project refs, live/unsafe hostnames, malformed URL, and nonpublishable/private keys;
- a `staging-preflight.json` that always reports `restrictedStagingDeployed:false`, `privateCloudflareAccessPolicyVerified:false` and production release BLOCKED.

The CI job uses **invented synthetic staging values** solely to test the bundler in isolation, and intentionally does **not** upload or deploy the synthetic app. No service credentials are required for that test. Neither the existing Cloudflare production workflow nor Supabase project is modified.

## Steps required to unlock restricted real-phone staging

1. Confirm which Supabase organization should hold a separate `Closet Current Staging` project, verify the price is **$0 before agreeing**; if a new project would incur any charge, pause for explicit separate cost approval. Once created, configure only empty/disposable schemas, RLS, Storage and Auth, using the existing version-controlled schema after a separate security review. Never import production users, photos, tokens, storage, or data.
2. In Cloudflare create a distinct Pages project, e.g. `closet-current-staging`, not production `closet-current`; **before any deployment, establish separate Access coverage for both the project-root hostname and every preview alias** following the October 21 correction above. The ordinary Pages Enable access policy initially protects previews only. `robots.txt` and guessed URLs do not confer privacy.
3. Verify the Access policy from a signed-out browser: unapproved users must be denied on the exact staging URL **AND all deployment previews**. Do not connect any public custom hostname without independent Access protection.
4. Configure the new staging Supabase Auth URL Configuration with an **exact HTTPS staging callback** and allowed redirects; don't change production callbacks or the existing Cloudflare/GitHub Pages site. Use only disposable accounts and test emails. See https://supabase.com/docs/guides/auth/redirect-urls.
5. Build the separate candidate on a trusted machine with **PUBLIC** staging values only (never a service role key or SMTP password):
   ```bash
   CLOSET_STAGING_APP_ORIGIN=https://preview.closet-current-staging.pages.dev/ \
   CLOSET_STAGING_SUPABASE_URL=https://<NEW-STAGING-REF>.supabase.co \
   CLOSET_STAGING_SUPABASE_PUBLISHABLE_KEY=sb_publishable_<NEW-PUBLIC-KEY> \
   node scripts/build-restricted-staging.mjs
   node scripts/verify-restricted-staging-bundle.mjs
   ```
   Replace placeholders only after actual staging URL/project setup; this command never deploys. It produces `staging-dist/` separate from `dist/` and never edits live source.
6. Only after actual Cloudflare Access checks, safe disposable Supabase RLS tests and approval, upload **staging-dist only** to the **separate staging** Pages project via an authorized operator's Cloudflare session. Verify that a signed-out/unapproved visitor is blocked both before and after deployment. Do NOT run `.github/workflows/cloudflare-pages.yml`, which targets production `main`.
7. First owner-only Android smoke test: garment photo, full-frame recognition, real type+color in My Closet, clear saved photo, restore after reopen, correct backup status. Repeat on real iPhone, then offline evidence comparison and independent human reviews. Observe no cross-account mixing or paid calls.
8. Live email sending/verified sender, account deletion, privacy/terms, commercial figure licenses, final production deployment and public invitations remain independently blocked.

**No real hosted staging URL is live just because this script or its GitHub Actions test passes.** Always distinguish a passing bundle QA from real authentication/cloud/hardware tests.

References: Cloudflare Pages Preview Deployments: https://developers.cloudflare.com/pages/configuration/preview-deployments/ ; Supabase Managing Environments: https://supabase.com/docs/guides/deployment/managing-environments ; Supabase Auth Redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls .
