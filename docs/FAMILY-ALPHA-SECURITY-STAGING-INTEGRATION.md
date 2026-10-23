# Family Alpha v0.1 — Four-account security + original-photo/avatar staging convergence

**October 23, 2026 · Main Closet Current integration thread · Family Alpha #255**

**DRAFT DEVELOPMENT ONLY — NO MERGE, DEPLOY, BACKEND POLICY CHANGE, FAMILY PHOTO ACCESS OR PAID AI.**

This integration is based on the successful isolated staging-artifact PR #270 (`e94559614a44c99b7823bedba509b64bd1d0608b`) and imports the exact tested cloud-restore client and offline QA from parallel security PR #269 (verified head `2366df4ff9d347efbf6155656f770e77b3a70e4d`). PR #269 stays unchanged. It also preserves PR #268's private outfit photo invalidation and all older photo/2D adapters.

## What was reconciled

| Surface | Parallel #17 security | Main avatar/staging protection | Final integrated behavior |
| --- | --- | --- | --- |
| `public/cloud-backup.js` | Complete tested owner+exact IDB+epoch+generation guard, check remote `owner_id`, refuse stale restore callbacks/transactions | Existing private wardrobe and original-photo IDs | **Exact source imported from #269**; no SQL/backend policy change |
| `public/auth.js` | Immediately hide app and show login, invalidate cloud sync before awaiting slow signout HTTP | Dispatch `closet:alpha-session-changed` on confirmed account change/logout so 2D avatar clears | **Both preserved**; signout now hides real photos, clears avatar, stops cloud restore, removes local Auth before remote request |
| `scripts/run-cloud-backup-flow.mjs` | Mock remote response includes actual owner_id as required by hardened client | Build remains synthetic/offline | Exact upstream test harness imported |
| Four-account browser + Node tests | Mock A/B/C/D private wardrobe/photo routes, account switch, delay/race, wrong-owner response, signout | Protected source-bound 2D/avatar, three outfit swaps | Run side by side in **one combined 36-view** browser QA matrix |
| Offline artifact | Independent PR #269 did not include any staging deploy | PR #270 preserved normal `dist`, pinned mask source, release HOLD | **Rebuild** candidate with hardened Auth and cloud restore; packaging code unchanged |

## Scope explicitly not represented as complete

- Cloud access checks and policy owner matching are **development defense-in-depth**. The fixture simulates four accounts and a secure backend; it does not interrogate actual Supabase policies or Cloudflare Access.
- The `supabase/cloud-backup.sql` policy definitions were reviewed, but **the currently deployed state, other permissive SQL policies, owner-level Storage read/write/signed URLs, server roles and mobile session lifecycle remain NOT VERIFIED.**
- The app's reviewed photo cutout is conservative (plain high-contrast backgrounds) and requires visual approval. It does not reconstruct clothing fabric or prove body fit.
- No approved protected staging origin or staging-only per-family-account allowlist is enabled. The packaged Family Alpha preview stays **OFF for all non-localhost hosts**, cannot be activated via URL, and the seven-day Actions artifact is **NOT** a family test link.
- Physical-phone capture across Android/iPhone and four consented real family accounts, minor privacy/consent and private feedback flows are not verified.

## Independent verification required for this branch

- `node scripts/build-family-alpha-staging.mjs`: ordinary `dist` preserved, isolated artifact of four pinned garment runtime modules, `HOLD` manifest.
- `node --test tests/*.test.cjs tests/*.test.mjs`: all existing and combined security/Avatar tests.
- `scripts/test-family-alpha-17-four-account-browser.mjs`: four fake users on Chromium/WebKit × 320/390/430px.
- `scripts/test-family-alpha-staging-artifact-browser.mjs`: self-contained artifact resolves actual JPEG→transparent image source and Auth-scoped 2D rendering.
- Four other mobile QA suites: real saved Outfit Builder, reviewed-photo/retake, JPEG→mask fidelity, three outfits/swap.
- Inherited #269 workflow's branch-specific only-assignment file fence is removed **only in this integration branch** because the combined branch legitimately contains many avatar/staging files.
- Before reporting success, record **exact combined commit SHA** and no-deploy Actions result; never infer real RLS or four real family-user acceptance.

## Next release decision

**Family Alpha remains HOLD.** Main owner must explicitly approve any staging deployment/access changes, confirm protected staging Access plus Auth redirect/SMTP and private bucket/RLS with separate synthetic identities, then schedule four consented users' physical phone photo tests. No other branch is merged by this PR.
