# Closet Current Family Alpha v0.1 — Isolated staging artifact, release HOLD

**October 23, 2026 | Issue #255 | Main integration conversation | NO MERGE / NO DEPLOY**

Stacked on PR #268 (`f9d2422f5a4ab562f5ce6e321558fcd4b186bbeb`) and its reviewed-photo, original-source and account-check stack (#267 → #266 → #264/#263/#262/#260/#258/#256). Parallel Assignment #17 owns PR #269 four-account cloud-restore safety; do not merge it blindly or represent its synthetic tests as proof of deployed RLS.

## Problem this resolves

Normal `node scripts/build.mjs` copies `public/` into `dist/`. The reviewed-photo real JPEG provider, independent pixel-audit and conservative mask algorithm are under `research/`. `public/family-alpha-preview-controller.mjs` references `../research/family-alpha-reviewed-photo/*`, so a deployment of the normal public build would **not have all its imported modules**, even though the feature is default-off.

Never solve this by turning on the feature in production or copying the entire research/test fixture tree.

## Separate compiled review artifact

Run `node scripts/build-family-alpha-staging.mjs`.

The script first builds the unchanged ordinary `dist/`, then writes an **isolated** `dist-family-alpha-candidate/`. The candidate:
- Keeps every ordinary `dist/` asset *byte-identical*, except for the staging copy of `family-alpha-preview-controller.mjs`, whose two research imports point to isolated, bundled local paths.
- Includes **only four reviewed runtime** source files under `__alpha_research/`: the PR #257 simple-background extractor, PR #265 independent source RGB/provenance auditor, the PR #267 real-JPEG reviewed preview provider and its human confirmation UI.
- Rewrites the two reviewed modules' source import to resolve to the candidate root's original production `family-alpha-2d-saved-board.mjs` instead of a non-existent `public/` folder.
- Asserts the original PR #257 extractor matches pinned Git blob `12ad1234b44d1257a1f1e697e61468f91595148c`; rejects changed/unreviewed source, unexpected extra imports, invalid build directory or symlinks.
- Generates `alpha-candidate-manifest.json` with content digests, pinned source, counts and the explicit **releaseGate: HOLD**.
- Preserves **hard-off preview**: `public/family-alpha-preview-boot.js` returns on *every* non-localhost hostname and also requires a pre-initialized explicit developer flag. No query parameter or cookie can activate the feature. Do not use the bundle for family sign-in yet.
- Makes **NO** Supabase/Cloudflare modifications, deployments, paid service requests, customer photo reads, or new backend credentials. Does not alter or replace the public `dist/` output or the normal app release process.

GitHub Actions `family-alpha-staging-artifact-no-deploy.yml` builds the isolated folder and runs full Node tests and **five independent Chromium/WebKit suites** at 320/390/430px: packaged artifact import + real browser-decoded JPEG → independently audited PNG → source-bound 2D layer; actual Builder mock Auth and 3-piece review; explicit review/retake; independent mask fidelity; 3 distinct outfits/one-piece swaps. The hosted CI artifact is an **offline inspectable development candidate only** and expires after seven days. No deployment job, host credentials or write permissions.

## Critical distinction: buildable != safe to distribute

This candidate proves module resolution and private-data-free synthetic integration, NOT:
- actual protected Cloudflare staging access or independent restriction from the internet;
- four real signed-in Supabase accounts and deployed Postgres RLS / object-storage isolation;
- Auth-callback correctness, redirect/email flow or current deployed row/storage owner rules;
- real-family photographs' background removal success or actual device latency;
- mobile camera/browser physical tests on Android and iPhone, including background/offline/reopen;
- a safe **staging-only** activation policy (this candidate remains hard-off on every staged hostname).

PR #269 identifies a separate async cloud restore / logout privacy risk and contains candidate hardening; its findings must be reviewed, integrated and independently retested BEFORE granting actual family access.

## Release sequence after this isolated packaging step

1. Verify PR #269 security changes and reconcile any non-overlapping fixes with PR #268+candidate. Re-run all Auth/backup regressions.
2. Obtain explicit approval for any staging deployment, web access policy changes and synthetic test accounts. The owner must be able to access protected staging; public host protection and redirects must be verified independently. This is **not** a blanket authorization to change Supabase or Cloudflare.
3. Design the staging-only activation mechanism and fail-closed user allowlist. For now, no staging hostname can activate the feature. Keep standard production artifact separate.
4. In authorized protected staging, use ONLY separate synthetic accounts to check deployed Auth, RLS and private photo bucket read/write/cross-account rejection.
5. Then request consent for real family photos and run phone-native 15–20 garment test per person, retake/preview/outfit swap and private feedback channels.

**No Family Alpha release approval.** Do not link this candidate to the family as a test URL.
