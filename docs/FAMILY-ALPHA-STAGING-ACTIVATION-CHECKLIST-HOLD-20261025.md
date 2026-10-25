# Closet Current — Family Alpha protected staging activation checklist

**October 25, 2026 · Issue #255 · DRAFT, PREPARATION ONLY · NO GO / NO DEPLOY**

## Read-only facts and evidence limits

| Gate | Status |
| --- | --- |
| Supabase staging | `fbnplztkbsteuzrmbgib`; ACTIVE_HEALTHY at last read-only check |
| Supabase production | `hlkgymugtfbirlpunsra`; **never touch** |
| Stage public API key | Existing enabled publishable key found by connected Supabase read-only lookup. **Value intentionally not copied, stored or displayed** |
| Staging root | `https://closet-current-staging.pages.dev/` (exact approved root for staged Auth only) |
| Stage Supabase Site URL | Last observed **pilot** `https://pilot-access-check.closet-current-staging.pages.dev/`; requires review before Auth invitations |
| Redirect allowlist | Owner refresh-confirmed exact root and pilot entries; no unapproved wildcard needed |
| Cloudflare Access | Owner observed sign-in challenges at root, `/index.html`, pilot and deployment-hash preview, plus approved owner reached **one-file placeholder**, not app. This is not definitive denial proof for unapproved identity or new static resources |
| Stage Auth / 2D | Default source-pinned full app bundle is **inert**: blank callback/key and independent avatar rollout disabled |
| Staging SQL/storage | Read-only metadata: backup table RLS enabled with owner-scoped policy, storage bucket private, three owner-scoped photo READ/INSERT/DELETE policies. UPDATE policy not present, consistent with immutable JPEG uploads |
| Actual Family Alpha account tests | No two disposable real stage JWTs used yet; **only 1 staging Auth account** observed |
| Device test | No physical family Android/iPhone pass yet |
| Production GitHub deploy | Existing workflow targets `closet-current` on `main`; never use it for staging |

The stage public key's existence is **not activation authorization**. The separate app bundle deliberately contains no staging key. Public client keys are not secrets, but service-role/secret credentials are never permitted in browser bundles.

## Technical checkpoint added by this draft

`scripts/audit-family-alpha-staging-activation-checklist-hold.mjs` is an offline, no-deploy/read-only evaluator. It refuses an unverified or incorrectly scoped observed Site URL, wildcard aliases, production routing, unreviewed changes to the production deployment workflow, missing packaged assets, misleading claims of identity denial, or claims that the placeholder is the full app.

It cross-checks the original-JPEG/2D candidate, static resource closure, Cloudflare browser-smoke record and unchanged main-only production workflow. Even if a later screenshot verifies that the Site URL equals the staging root, **releaseGate remains HOLD** until independent testing and owner approval.

## Suggested owner-controlled activation sequence (NOT executed)

1. **Read only:** Open <https://supabase.com/dashboard/project/fbnplztkbsteuzrmbgib/auth/url-configuration> and confirm that the Site URL still points to `pilot-access-check`, with the exact root present in Redirect URLs. Do not click Save or edit yet. Do not open production Auth.
2. Review a **single coherent protected full-app artifact**, on an immutable Git SHA and with separate main-vs-staging Cloudflare Pages project identity. Keep provider settings, private keys and real users out of GitHub PR comments and logs. Avoid publishing a generic `dist/` production build into the staging project: it can contain production Auth endpoints.
3. Obtain **explicit owner approval** before a staging-only full-app upload, and separately before changing staging Supabase Site URL, authorizing staging callback/key embedding into a public client build, or altering Cloudflare Access policy.
4. After approved staging upload, use a fresh unauthenticated browser to recheck static JS/CSS/model/worker routes and hashed-preview URLs; ensure no private data or app assets are accessible before authorized Cloudflare login. Complete unapproved-identity denial with an alternate address that the operator can access.
5. Only after routing and security review, use disposable *adult* staging accounts for a verified private invitation/password recovery test, direct self-signup denial, and signed-in A/B REST/Storage/RPC allow/deny evidence. Current stage Auth public signup was observed OFF; it still needs a direct safe negative test. Cloudflare Access approved-email list may need separately approved temporary test-account additions.
6. Test an actual phone original-JPEG capture, automatic category/color, image mask/cutout, reviewed save, private reload, 2D layered avatar, outfit generator and one-piece swap. **Do not use children's real photos or invites in initial security tests**.
7. Require a separate owner **Family Alpha v0.1 GO** decision before expanding from disposable adult verification to two adults and two children.

Never merge or run the existing production deploy workflow in order to perform staging activation; it targets the live `closet-current` Pages project. Check the exact staging artifact and project destination at every authorized deployment step.

**No account creation, emails, SQL or provider writes, photo downloads/uploads, deployment, merge, spending, production changes or Drive Duel changes in this work.**
