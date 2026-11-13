# Parallel #80 — public-photo source revision and adverse capture reliability

**FAMILY ALPHA HOLD #255 OPEN. DRAFT / UNMERGED / UNDEPLOYED.**

## Exact research starting point

[Parallel #80 PR #990](https://github.com/nickhaney916-lang/Closet-Current/pull/990) immutable updated HEAD `a702f420598848c76fc58a6f724d5bafe0cd1c6e`, full-source strict 12-field model input capsule and **before-inference quality veto**, exact-head 4/4 no-deploy success, 487 native tests. The prior independently developed [three-photograph real worker smoke #996](https://github.com/nickhaney916-lang/Closet-Current/pull/996) used an older P80 parent `83f51ea...`; this work **ports its test only onto the newer verified P80 code**, leaves both source branches untouched, and extends it with real-image source revision attacks.

## Actual photographic input and provenance

Originals `commons-0033` (shorts), `commons-0041` (skirt), `commons-0088` (boot) are already **publicly exposed development** Commons JPEGs. The existing immutable `benchmark/locked-photo-sources.json` supplies approved-for-development source attribution, license and exact SHA-256, while `benchmark/manifest-reviewed-32.json` provides only **historical public category hints**, not new independent human ground truth. Existing `scripts/download-reviewed-photos.mjs` confirms original download hashes; browser P80 independently rechecks SHA-256.

The real `ff13/fashion-clip` WASM worker scores two complete 47-label views per unchanged original with a synthetic fixture owner/categorical acknowledgment. Neither a signed human owner nor an independent human annotator is represented. Outputs are **hypotheses or Unknown**, never scores of real-world correctness.

Next, the test deterministically re-encodes one changed 256px JPEG recognition input per original: two severely darkened full frames and one cropped boot frame. The original full-resolution JPEG remains byte-for-byte unchanged in `originalPhoto.image`. The transformed image becomes only `recognitionPhoto.image`. **These are three synthetic transformations of real source photographs, not three independent new real photos.** This is adversarial input/custody testing, not semantic accuracy.

For each changed-input test, source and recognition hashes MUST differ appropriately; an old input/source-revision lease sent with the new JPEG must be rejected by the **real pre-load worker input SHA gate**. Fresh matching source-bound evidence can be used to exercise the raw worker solely for diagnostics; resulting model scores are not shown to owners. Under explicit invalid-quality declarations (`lowLight:true` or `clipped:true`), the actual policy MUST return `Unknown`/abstain with **zero candidates or automatic certificates**, even when the raw worker ran; reapplying the old response against the changed photo also abstains. A foreign owner ID must fail source evidence. The actual UI upstream, already tested in P80, abstains **before** requesting the model on these poor-quality flags. The test intentionally bypasses that UI guard to exercise the raw worker contract; do not mistake it for default user experience.

## Measurements and boundaries

The test produces per-public-ID **aggregate-only** output: unchanged input hashes verified, changed-recognition SHA, number of verified 47-label worker score views, stale lease rejections, uncertain outcome and owner-switch revocation. **No photo bytes, model embedding vectors, score arrays, human labels, sealed answers or private data are uploaded in CI artifacts.** Network test instrumentation requires every request to be GET/HEAD; the model/runtime CDN may be downloaded, but JPEG bytes remain local. Real worker request timing is CI hardware only, not phone latency.

NO changes to the actual recognizer, P80 safe Unknown policy, model/scorer/taxonomy, production/staging, signed auth/cloud/wardrobes, P75/P79 reviewer custody or other mission branches. Scope is this development-only browser test, report and restricted no-deploy workflow.

### Reproduce

```bash
npm install --no-save --no-package-lock playwright@1.56.1
npx playwright install chromium
node scripts/download-reviewed-photos.mjs benchmark/locked-photo-sources.json benchmark/photos commons-0033,commons-0041,commons-0088
node scripts/test-p80-public-dev-worker.mjs
```

### Still BLOCKED

**Real independent recognition accuracy and gains remain UNKNOWN.** This test has zero approved source-disjoint reviewer labels and masks, zero actual human confirmations, zero physical Android/iPhone tests, zero hosted signed two-owner/cloud privacy tests. It cannot certify accurate classes or “10/10” recognition. The historical default-path 32-photo benchmark continues to FAIL five boot-Unknown-versus-auto-indexing expectations and is neither waived nor altered. The P851 release gate remains BLOCKED; Family Alpha HOLD #255 remains OPEN. Independent evaluation remains with #71/#75/#79; witnessed phones with #78; Mission 1 controller P857 handles integration. CI results/precise denominators must be added only after the exact final commit completes.
