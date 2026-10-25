# Closet Current Family Alpha — exact staging callback and host acceptance gate

**October 25, 2026 · Issue #255 · DRAFT · NO DEPLOY / NO CONFIG CHANGE**

## Verified owner context

- Owner added `https://closet-current-staging.pages.dev/` to staging Supabase redirect allowlist and refreshed to verify it persists, alongside `https://pilot-access-check.closet-current-staging.pages.dev/`.
- **Supabase staging Site URL still points to the older pilot host**, which remains a blocker for the default invitation email destination until explicitly approved for change or an equivalent supported explicit redirect is verified.
- Public staging signup was turned OFF with Supabase “Successfully updated settings”; email confirmation enabled; custom Resend SMTP with masked secret enabled. Staging `auth.users` was read with a read-only exact COUNT and contains **1 account**.
- Cloudflare Pages STAGING `closet-current-staging` was last owner-observed running **one index.html-only Access placeholder**, not this full application. Existing screenshots prove an owner-approved Cloudflare Access challenge success; they do not prove every alias/static asset or unauthorized user denial.

## Problem addressed

`scripts/build-family-alpha-staging-auth-hold.mjs` previously validated `approvedRedirect` as **almost any HTTPS hostname** if it had the expected path. For example, an unrelated externally hosted `https://alpha-preview.example.com/` was previously accepted as a synthetic QA redirect. The generated runtime checked only that the page origin matched this arbitrary supplied redirect, so the build guard did not enforce our explicitly designated staging hostname.

This was an **offline build-time redirect scope weakness**, NOT evidence that the user-facing production site or current one-file staging placeholder accepted cross-account access. Public client keys are not authorization secrets; Supabase auth, Cloudflare Access and server-side RLS remain separate required controls.

## Changes, stage-only source

- Introduce `APPROVED_STAGE_CALLBACK='https://closet-current-staging.pages.dev/'`; `validRedirect` accepts **only** that exact HTTPS root.
- Reject: live `closet-current.pages.dev`, `pilot-access-check`, Cloudflare hashed or branch preview URLs, arbitrary domains, lookalike subdomains, non-root paths, embedded credentials, unexpected query/fragment or HTTP.
- Generated staging Auth config requires the **exact** callback string, root browser pathname and staging origin to set `ready:true` — including if someone later explicitly supplies a synthetic publishable key.
- Generated staged login UI guard independently requires exact `stage.redirect`, HTTPS, staging origin and `pathname==='/'`. Approval/HOLD state is unchanged.
- Stage candidate manifest's `routingReadyForQa` now demands **exact** approved callback string, not a merely parseable HTTPS URL.
- Runtime VM tests exercise synthetic QA config on the protected root versus pilot, preview, live and non-root variants. Tests must not call real users, providers, stores, SMTP or Cloudflare.

## Strict remaining gates — explicit owner authorization required

1. Review one **source-pinned combined Family Alpha package**, including the staging key and callback activation procedure. Default artifacts still have **blank callback/key** and independent avatar rollout OFF.
2. Verify Cloudflare Access blocks unauthorized users on exact root, preview/hashed aliases and static assets.
3. If appropriate, after approved protected full-app staging deployment, change staging Supabase **Site URL** from pilot to the new root (or use a verified admin invite redirect); confirm Auth allowed redirect still includes main root.
4. Before invitations, test direct server denial of unsigned-up users, disposable invited test-adult password flow, user A vs user B real JWT RLS/Storage and private full-JPEG leakage, plus physical phone QA. No unauthorized request testing or account creation without approval.

**This document and PR do not merge, deploy, alter Supabase settings, send email, create users, activate paid services, access family photos, touch live Closet Current or Drive Duel.** Release remains **HOLD**.
