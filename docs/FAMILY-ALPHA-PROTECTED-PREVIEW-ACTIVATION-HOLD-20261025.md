# Closet Current — isolated protected-root 2D preview activation contract

**October 25, 2026 · Family Alpha issue #255 · DRAFT / NOT DEPLOYED · no provider changes**

## Where the app actually stands

The real Cloudflare Pages **closet-current-staging** deployment still has the single-file `index.html` Access test placeholder (owner screenshot dated October 25). Successful Cloudflare code verification from the owner's Gmail establishes an **allowed-owner challenge and access**, not denial for unapproved addresses and not complete static asset/preview alias protection.

The GitHub integrated source from #292 and audit #293 builds a **110-file** offline application with current modern clothing recognition, original unmasked JPEG and derivative review, owner-bound wardrobe saving, reviewed transparent 2D photo layers, and staged cloud-backup routing. It is deliberately unusable: blank staging Auth publishable key and callback, `HOLD` release manifest, and 2D boot localhost-only. The existing output is kept byte-for-byte unchanged.

## What this draft adds (and what it does NOT do)

New script `scripts/build-family-alpha-protected-preview-hold.mjs` makes a **fourth, isolated output** `dist-family-alpha-protected-preview-hold/`, copied from the exact already audited combined candidate. It modifies only `index.html` and `family-alpha-preview-boot.js` and adds a default-blocked `alpha-stage-preview-rollout.js` and a **HOLD** manifest. All other app and authentication assets are identical to the source combined artifact.

The staged-only boot cannot even attempt to load 2D controllers unless *all* are true:

1. Exact HTTPS **main staging root** `https://closet-current-staging.pages.dev/`, not `closet-current.pages.dev`, a branch/hash preview, `pilot-access-check`, another path or localhost.
2. Staging-only Supabase project `fbnplztkbsteuzrmbgib`, exact root callback, public staging key, `stage.ready===true` and a deliberately explicit isolated QA configuration.
3. A **second independent rollout object** with `ownerApproved===true` **AND** `enablePhotoAvatar===true`. The generated object is frozen and sets **both false**.
4. After boot, the existing avatar controller still requires a real logged-in user, IndexedDB scope, cloud owner, server-checked `/auth/v1/user` and individual original-photo human approval. The JavaScript gate alone is NOT authorization; only verified Supabase RLS/Storage and Cloudflare Access can enforce real security.

The generated staging Auth has **no publishable key or callback**; the rollout is **disabled**, so this output remains non-deployable and does not open sign-in, cloud sync or an avatar on any public host. It includes no passwords/tokens, only public staging project metadata. It cannot activate itself from GitHub Actions or a dashboard navigation.

## Safe developer verification (no provider calls)

```sh
git fetch --no-tags origin 879f1b92fb15f9bc9a7f0429c7ee178f7bbf1373 795ad6637f8d4f782bc99751211b25e8e72a3a7d 08ed6ac4a3fc921eae5d5d3df3bd3966429559d2 1ecac1079e75f1f25dc70a4c712b2448eb87dca8
node scripts/build-family-alpha-staging-auth-hold.mjs
node scripts/build-family-alpha-recognition-integrated-hold.mjs
node scripts/build-family-alpha-protected-preview-hold.mjs
node --test tests/family-alpha-protected-preview-hold.test.mjs
```

CI tests exact URL matching, production/preview host denial, mismatched Auth config, missing owner's separate rollout approval, tampering, unchanged existing source, and no preview initialization when either flag remains disabled. Full Node regressions run; all work is offline/synthetic. Green tests only mean code paths are ready for **later** approved verification.

## Required future approvals — do not perform now

Obtain current security findings from independent Work Assignment #26 without duplicating its RLS/audit responsibilities. Main conversation should verify unauthorized visitor denial on root and alternate hosts/static assets, and owner consent for any new staging Auth callback or key, app deployment or test-account creation. Ensure staging direct Auth signup restrictions, disposable real JWT A/B backup and private JPEG row/object tests, and actual Android/iPhone camera/2D layer tests before inviting family members.

**No merge, no Cloudflare Pages deployment, no Resend changes, no Supabase configuration, no paid AI, no access to customer/minor photos, no production or Drive Duel changes.** Family Alpha release remains HOLD.
