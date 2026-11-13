# P80 — licensed public development photograph worker execution (research HOLD)

**FAMILY ALPHA HOLD #255 OPEN — DRAFT / UNMERGED / UNDEPLOYED.** No main/controller, production/staging, hosted Supabase, signed users, private wardrobes, or sibling branches changed.

## Purpose and boundary

Existing Parallel #80 donor [PR #990](https://github.com/nickhaney916-lang/Closet-Current/pull/990) verified the real FashionCLIP runtime on **one generated geometric JPEG**, not actual clothing. This isolated follow-up adds a reproducible **actual model / actual public clothing photograph** no-deploy smoke, using the locked, publicly exposed licensed 32-photo *development* manifest. This is NOT independent blinded accuracy, cannot lift the Family Alpha hold, and cannot be represented as owner-confirmed garments.

The smoke selects existing test IDs `commons-0033` (shorts), `commons-0041` (skirt) and `commons-0088` (boot), **only by previously exposed development-test identity**. It reads the unchanged `benchmark/locked-photo-sources.json` and `benchmark/manifest-reviewed-32.json`, requires a Commons source and listed license, uses the existing byte-for-byte SHA-256 verifier/downloader to retrieve the frozen source, and verifies exact JPEG SHA-256 again in Node and in the browser evidence module. Nothing new is scraped or re-labeled. Rights to use source photographs under their stated public licenses are distinct from the curator approvals and human source-group/mask/label receipt gates required for independent truth.

The browser runs the **actual unmodified P80 opt-in `local-worker.mjs` and pinned FashionCLIP**, not a mocked scorer, on the actual JPEG bytes at a local-only test server. It verifies both complete 47-label score lists, model/vector/recognition-source SHA identity, original/input JPEG SHA identity, zero `strong`, zero `choices`, zero automatic subtype certificates, and Unknown when photo quality has not been independently reviewed. It reports only aggregate/programmatic summaries and image IDs already public, not image pixels, private inputs, visual annotation, or model embedding arrays.

**Synthetic fixture owner and category declarations are deliberately simulated solely for exercising the protected model API**. There is no actual signed account, person, independent human subtype label, mask, owner consent, source-disjointness proof or sealed blind data. Historical manifest categories are development-exposed hints, not certified truth. The `simulatedCategoryStatus` is an engineering result and MUST NOT be interpreted as an empirical accuracy or subtype improvement rate. No actual owner save, learning, pairing, duplicate merge or production write occurs. All requests in the synthetic harness must be GET/HEAD only, and no image is uploaded.

## Reproduce

```bash
npm install --no-save --no-package-lock playwright@1.56.1
npx playwright install chromium
node scripts/download-reviewed-photos.mjs benchmark/locked-photo-sources.json benchmark/photos commons-0033,commons-0041,commons-0088
node scripts/test-p80-public-dev-worker.mjs
```

**Network/custody:** At execution time Commons originals must be available at precisely the frozen hashes and the pinned FashionCLIP model/runtime CDN must be reachable. Unavailable sources or model mean **FAIL/BLOCKED**, never fabricated scores. Model CDN fetches are permitted by existing research runtime; photographs remain locally byte-hashed and are never sent to the CDN. The CI job is NO DEPLOY and does not upload screenshots, predictions or photo artifacts.

## Acceptance

- Report actual input count, SHA-verified source count, complete-vocabulary view count, model revision/source checksum, simulation-only policy outcomes and no-upload/no-save guards from **exact-head GitHub Actions logs**.
- Native regression, original public integrity and desktop editor/genuine worker baseline remain required.
- **0** approved independent human subtype labels / correct-instance masks, **0** physical-phone cases, **0** sealed blind test cases, **0** genuine signed-owner acceptance; independent recognition accuracy **UNKNOWN** until #75/#79/#71 provide source-disjoint reviewer truth.
- The separate inherited legacy 32-photo benchmark still has five conservative Unknown boot cases vs historical automatic-indexing expectations, resulting in ten legacy checks failing. This new smoke does **not** waive those tests, recalibrate thresholds, or prove a recognition improvement.

Controller Mission 1 P856 retains integration authority; #75/#79 source and independent annotation custody; #71 independent evaluator; #78 actual physical phones. There is no release authorization. Exact-head run evidence is attached to this PR after CI and is not asserted before it completes.
