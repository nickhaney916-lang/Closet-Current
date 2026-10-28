# Family Alpha #59 — manual licensed-garment visual review

**Research-only, local browser, NO DEPLOY.** This is a working review workflow on top of the Work48 real-garment geometry candidate. It **does not** modify the protected app, the wardrobe, any family image, original JPEG, fitting source, Auth, storage, Supabase, Cloudflare or the official visual grading.

## How to use

First build the Work48 licensed-fixture benchmark as documented in `research/work48/README.md`. Serve this repository locally (the same local server the Work48 test uses), then open `/research/work48/index.html`. Below the original/cutout/old fit/new fit/attachment close-ups is the new **Human visual acceptance** panel.

1. Inspect all actual photo views for one licensed garment.
2. Choose a deliberate **PASS**, **REVIEW**, or **FAIL**, never an automatic grade. Select a predefined visual reason. The restricted reasons contain no names, emails, IDs, private photos or free-form text.
3. A manual PASS requires a supported reviewed cutout and explicit checks for original print, cutout completeness, sleeve/body attachment and body proportions. Unsupported sources **cannot** be marked PASS.
4. Save the current local decision and move to the next unreviewed item. All **15 start NOT_REVIEWED** regardless of the prior Work48 assistant-authored grades.
5. Export the local **JSON** at any point or import your previous file to resume. No storage, remote upload or external account connection is performed.

## Status distinction

The exported record always includes `release:HOLD`, `decision:HOLD`, `ownerApproved:false`, `productionModified:false` and `stagingModified:false`. It records **self-reported and unverified** visual choices, NOT a verified identity or owner sign-off. The user may share the local JSON explicitly later, but importing it into this tool **does not** change Family Alpha release gates or official `research/work47/visual-assessment.json`. Even an all-PASS selection is not a release.

The underlying Work48 candidate remains technically validated at [draft PR #367](https://github.com/nickhaney916-lang/Closet-Current/pull/367): 62/62 tests, 90/90 licensed mobile-browser cases, and original human-authored 0 PASS/5 REVIEW/10 FAIL. Those grades remain unchanged.

## Verification

```sh
node --test tests/work48-visual-review.test.mjs
node scripts/test-work48-visual-review-browser.mjs
```

The browser test runs at 320px, 390px and 430px in Chromium and WebKit. It checks: all 15 begin unreviewed, unsupported PASS is rejected even with boxes checked, completed reviews survive JSON export/import, forged owner/release approval is rejected without overwriting the current review, no overflow, and zero external requests. The existing no-deploy Work48 workflow runs its full private-owner, fit/editor and 90 licensed-photo regressions as well.

**Outside scope:** physical Samsung/iPhone, screen reader hardware, actual licensed photographic realism approval, two real signed-in staging account JWTs, cloud restore, or production release. No deployment, merge, paid services or Drive Duel changes. Family Alpha HOLD.
