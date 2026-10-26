# Closet Current — owner-only login activation rehearsal

**October 25, 2026 | Family Alpha v0.1 #255 | OFFLINE MOCK ONLY | NO DEPLOY**

## Where the project actually stands

The owner has verified the staging Site URL remained changed to `https://closet-current-staging.pages.dev/` after Save and refresh. The approved staging-only upload of the complete 112-file app succeeded; the owner saw its mobile login screen. **Login and 2D photo avatar remain intentionally inactive in the live deployed app.** GitHub Actions verified the homepage and three entrypoint routes challenge anonymous Cloudflare Access visitors.

The Supabase staging project is `fbnplztkbsteuzrmbgib`. A fresh read-only check confirms **exactly one registered Auth account**, backup table RLS enabled and private wardrobe-photo bucket. None of that proves that the owner can sign in, password recovery emails work, or that a second JWT cannot see another user's data.

## Separate rehearsal artifact created

`scripts/build-family-alpha-owner-login-rehearsal-hold.mjs` derives an independent artifact:

`dist-family-alpha-owner-login-rehearsal-NEVER-DEPLOY/`

Only `alpha-stage-config.js` is modified to embed an **invalid fictional publishable key** and the approved root callback, simulating what an explicit owner-only QA Auth activation *would* look like. Everything else, including actual staged Auth and backup code, automatic high-res original-JPEG recognition, 2D photo preview modules, the blocked avatar rollout, and backup persistence, stays byte-identical to the already-reviewed stage package. A separate never-deploy manifest marks the result **HOLD**, plus cryptographic source and output hashes. No actual real publishable key value is accessed or copied.

The default live staging build `dist-family-alpha-protected-preview-hold/` is independently reverified unchanged with its blank key and callback. The rehearsal is not a deployment candidate and **must never be uploaded to Cloudflare**, since a fictional key cannot authenticate any user.

GitHub Actions exercises the synthetic source at the exact staging root, `/index.html`, existing deployment preview, older pilot preview, the production host and HTTP. Only the root passes the mocked client Auth readiness predicate. Corrupting the file or attempting avatar rollout fails closed. **No real network call or account was created in these tests.**

## Separately approved next actions

An actual owner-only staging login **requires a fresh, explicit approval** for a staging-only upload that includes a real *publishable* stage key, not a service-role/secret key, and retains Cloudflare Access's owner-only policy. Before any actual login: review direct self-signup disabled, confirm exact redirect allowlist/Site URL, confirm owner has a working stage password or owner-approved recovery method, and ensure return links do not expose tokens to wrong origins. The owner can test a login to the staging app without any family invitation only after these gates.

Later testing must verify signed-in A/B database RLS, file owner-folder isolation and backup writer RPC, stale-session rejection, private photo rendering, original-JPEG mobile classification, human review/auto-mask, 2D avatar layering and outfit swapping. A successful owner login alone is never approval to invite the four-person Family Alpha or enable avatar. No paid AI activation or costs.

**Production Supabase project `hlkgymugtfbirlpunsra`, production Pages `closet-current`, Drive Duel and all real customer photos remain untouched.**
