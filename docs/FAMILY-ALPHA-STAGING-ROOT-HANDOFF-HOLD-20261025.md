# Closet Current — protected staging root / complete-app handoff

**October 25, 2026 · Family Alpha issue #255 · release HOLD · no provider changes or deployment**

## What the owner verified today

The owner navigated **Cloudflare One → Access controls → Applications** and saw two distinct Access applications for `closet-current-staging.pages.dev`:

- A wildcard `*` subdomain + staging domain, path blank, intended for preview subdomains. This does **not** automatically prove every preview hostname works.
- A blank subdomain + staging domain, path blank, intended for the exact **root** `https://closet-current-staging.pages.dev/`.

An attached policy inspected under the staging application had **Action: Allow** and included the owner-approved email. In a fresh incognito browser, the owner saw a Cloudflare challenge, received a Gmail code, authenticated and reached the familiar access-test page. **This is authorized-owner success, not a negative test of an unapproved address, or proof of coverage for every static asset/alias.** Do not record private email addresses, codes, user data or tokens in GitHub.

Cloudflare Pages **closet-current-staging** production-channel deployment `a15254d6` succeeded on October 22, 2026 at approximately 12:59 PM (dashboard time). The owner expanded *Assets uploaded*: **1 file, `index.html`**. This is the Access demonstration page, **not** the actual Family Alpha application. The live `closet-current.pages.dev` project shown in another screenshot is a different production project and is off limits.

The owner/Work previously confirmed staging Resend SMTP delivery. This confirms email transport only; application magic-link callback, password reset, new signup and real app session remain untested. **Do not rotate/recreate keys or reconfigure the working SMTP without specific evidence.**

## Development status and safe handoff

PR #292 exact head `ea1288bbb26ced04c71944c4ecc753c24bdaa664` combines original-garment-region 2D avatar provenance and mandatory original-photo Outerwear category/type/color review. [CI #40207811515](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/40207811515) passed 463/463 Node tests and synthetic Chromium/WebKit flows. The output directory `dist-family-alpha-recognition-integration-hold/` includes the full mobile app, recognition assets and photo-based 2D components, but is deliberately **not deployable**: stage publishable key and root callback blank, cloud and sign-in fail closed, local-only preview disabled on deployed host, and release manifest says HOLD.

The new **read-only, offline** `scripts/audit-family-alpha-staging-root-handoff.mjs` validates:
1. Only the exact `https://closet-current-staging.pages.dev/` matches the observed root; hashed URLs, branch preview aliases, `pilot-access-check` and `closet-current.pages.dev` are different sites.
2. The deployed owner-screenshot `index.html` inventory is a placeholder; a complete candidate must include the real app, local model worker, original-image avatar, staged Auth and private backup assets.
3. Stage code contains no production Supabase endpoint in the inspected primary files and still has blank callback/public key, HOLD manifest and localhost-only preview guard.
4. **It returns HOLD even when a code bundle passes all checks.** No live Cloudflare, Supabase, Resend or account requests; no secrets, real photos, billable AI, merges or deploy operations.

### Reproduce offline (source-pinned branches only)

```sh
git fetch origin 879f1b92fb15f9bc9a7f0429c7ee178f7bbf1373 795ad6637f8d4f782bc99751211b25e8e72a3a7d 08ed6ac4a3fc921eae5d5d3df3bd3966429559d2 1ecac1079e75f1f25dc70a4c712b2448eb87dca8
node scripts/build-family-alpha-staging-auth-hold.mjs
node scripts/build-family-alpha-recognition-integrated-hold.mjs
node --test tests/family-alpha-staging-root-handoff.test.mjs
node scripts/audit-family-alpha-staging-root-handoff.mjs
```

The no-deploy CI repeats these and the full Node regression suite.

## Separate release authorizations still required

**Before** any full app staging deployment or callback/key change, verify current Access host plus unauthorized-user denial, asset paths, alternate public URLs, and an owner-approved staging-only package. Then obtain explicit approval for:
- A correct **staging** publishable key and authorized exact root callback (register with staging Supabase only; never store a service-role key in GitHub).
- Current staging Auth public-signup/invite policy and disposable isolated test accounts, including signup/confirmation/recovery.
- Actual JWT-based A/B backup row and private JPEG Storage positive + cross-owner denial tests and signed URL behavior.
- Protected app deployment to **closet-current-staging**, not `closet-current`, followed by real Android/iPhone image capture→review→cloud closet→avatar→three looks→one-piece swap and consented four-user acceptance.

There is **no deployable Family Alpha staging app yet**, and no claim that old UI screenshots prove complete Cloudflare/DB security. The primary main conversation owns all approval, deployment and final release decisions.
