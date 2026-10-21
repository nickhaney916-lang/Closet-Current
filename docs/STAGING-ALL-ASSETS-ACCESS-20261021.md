# Closet Current — complete staging static-asset anonymous-access probe

**Scope:** no-deployment security preflight on isolated draft branch. It extends the fixed ten-route anonymous Cloudflare Access check to **the complete generated staging bundle**, including nested icons, binary reference assets, manifest and cache-busted app scripts. This work is independent of Work #165's integration and does not alter the customer app.

## Reason
Previously, `scripts/check-staging-anonymous-access.mjs` tested only ten fixed URLs. A public image, newly added diagnostic HTML file, or static JavaScript on one preview could bypass protections without being checked. Protected home page alone is not enough.

## Operator use — only after staging has separately been approved
1. Build `staging-dist` in a clean checkout using the reviewed builder, an **independent hosted staging Supabase project** and verified staging preview origin. Never use the existing Closet Current or Drive Duel backend.
2. Verify `staging-dist` with `node scripts/verify-restricted-staging-bundle.mjs`. A passing static check still does not authorize deployment.
3. Obtain the **complete** project and branch-preview hostname inventory independently from the Cloudflare Pages dashboard. The checker cannot discover all unknown preview hostnames.
4. Only for an already owner-authorized and actually deployed **Access-protected separate test project**, run:

```sh
node scripts/check-staging-anonymous-access.mjs --bundle=staging-dist \
  https://closet-current-staging.pages.dev \
  https://ACTUAL-PREVIEW.closet-current-staging.pages.dev
```

This loads the SHA-256 reviewed local manifest, verifies every byte first, derives all file paths plus cache-busted entry points, then sends anonymous GETs with no cookies, no credentials, no redirect following and 10-second deadlines. It checks up to ten separately supplied origins and 250 distinct candidate paths per origin, with bounded concurrency (12 requests). The terminal exits nonzero on any public 2xx, inconclusive result, missing/linked file, lock, orphan or invalid bundle. Operators must not run it against production domains.

**Important:** `ACCESS_LOGIN_REQUIRED` means only an observed redirect, **not cryptographically verified Access enforcement**. A publicly exposed worker could fabricate the same 302. The report always keeps `privateCloudflareAccessPolicyVerified=false`, `previewInventoryComplete=false`, `authorizedTesterAccessVerified=false`, and `productionPromotion='BLOCKED'`. Cloudflare Access policies, origin inventory and eligible tester login must be independently inspected before staging can be considered protected.

## Rehearsal
All GitHub Actions checks run offline using an invented staging bundle and **synthetic HTTP response functions**. Test cases include: a binary image public on one preview, a protected index with public icon, a changed or missing SHA-256 covered asset, stale lock/orphan, path-traversal route injections, and route count caps. No actual network checks against Cloudflare, Supabase, customer photos or real endpoints are made.

No paid services, live database changes, customer accounts, production merge/deployment or Drive Duel edits. Physical Android/iPhone and independent human review remain unverified.
