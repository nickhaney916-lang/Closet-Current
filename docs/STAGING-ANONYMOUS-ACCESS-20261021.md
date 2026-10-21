# Anonymous staging access preflight

The existing Closet Current Supabase project is accessible again. It remains the existing live project, not the separate empty staging database required by PR #145. No live database settings or customer records were changed.

Before uploading a candidate, configure Cloudflare Access on a separate `closet-current-staging` Pages project. Enumerate every branch/deployment preview in the authorized Cloudflare dashboard. On a trusted machine run:

```sh
node scripts/check-staging-anonymous-access.mjs https://closet-current-staging.pages.dev https://ACTUAL-DEPLOYMENT.closet-current-staging.pages.dev
```

Replace the deployment placeholder; include all actual preview origins as additional arguments. This read-only tool requests ten critical routes on each supplied origin with no credentials, no cookies, no redirect following, no response-body retention and a ten-second request timeout. It checks HTML, application/auth/backup scripts, service worker, recognition vectors, pilot pages and a cache-busted script. No database calls, upload, paid inference or publishing occur.

A public 2xx response fails, even if the homepage redirects to Access. Only a redirect to an HTTPS Cloudflare Access login endpoint counts as an observed login challenge. Generic 401/403, CAPTCHA, 404, network failure and unrelated redirects are inconclusive and fail the preflight. All origin inputs are validated before any request; production and arbitrary domains are refused.

Passing means only the supplied routes returned the expected login challenge at that moment. It does not authenticate the Access policy, verify a complete hostname inventory, prove all assets protected, exclude bypasses, or verify authorized testers can enter. Owner inspection of deny-by-default Access rules, all routes/hostnames, tester allowlist and real signed-out browsers remains necessary. A spoofed login redirect cannot prove Cloudflare enforcement. Repeat checks after any deployment or policy change. Custom domains are deliberately unsupported until separately reviewed.

No hosted preflight was run: there is no verified staging URL or independent staging database yet. Tests inject synthetic HTTP responses. Production promotion stays BLOCKED. Real Android/iPhone, email callbacks and two-disposable-account isolation remain outstanding.
