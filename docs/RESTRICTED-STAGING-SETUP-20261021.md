# Closet Current — restricted staging preparation

**Authorized 2026-10-21 for PREPARING private staging, but NOT public publishing, merging production, accessing live customer wardrobes, creating billable resources or enabling paid AI.**

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
2. In the Cloudflare dashboard, **create a distinct Pages project**, e.g. `closet-current-staging`, not `closet-current`. In **Workers & Pages → [new staging project] → Settings → General → Enable access policy**, permit only specifically approved pilot testers. Cloudflare explicitly says that preview URLs are PUBLIC by default; `robots.txt` and guessing a random URL do not make them private.
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
