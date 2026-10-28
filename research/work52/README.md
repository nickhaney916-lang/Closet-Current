# Work52 pale exterior cleanup — HOLD

Separate development branch based on Work51 PR377 exact `043950847dcdaab98d82bdb07f8fe8c84341cc18`. No files from PR379 are edited or integrated. This extends the existing **Find automatic cleanup** action, using the same source-bound remove polygons and mandatory human review. It does not replace the segmentation provider or its canonical crop/mask.

## Functioning scope

Retains the inherited dark-garment/support planner. When that has no proposal, a pale-exterior planner requires a near-uniform bright source border on all four sides, independently contrasting central source pixels, exterior connectivity within two RGB levels of background, full opacity, and a 20% removal budget. It preserves a two-pixel source-boundary neighborhood, every translucent pixel, and a five-pixel neighborhood around narrow alpha runs (including background-colored straps/cuffs). Exact rectangular runs, at most 32 portable polygons, avoid approximation across fabric. No RGB, JPEG, category, source identity, recipe, private storage or fitting coordinates change.

Existing manual/recovered edit histories are refused. Undo/redo/reset and original-photo fallback remain available. The action clears confirmation and never approves a garment. The build byte-compares every inherited compiled asset except the one cleanup import in the existing editor. Work51 remains an unchanged dependency, not a fork or overwritten integration file.

## Evidence and limits

Five controlled variants of one authored garment shape (white-on-beige, cream-on-wall, 24/40-level gray contrast plus translucent detail) improve IoU from 0.7893 to 0.8988 and boundary F1 at two pixels from 0.1521 to 0.9158. Each removes 957/1,655 known background pixels with every reference garment pixel retained. Source RGB and translucent alpha remain exact. Identical/near-identical fabric and a busy border refuse cleanup. An additional adversarial background-colored strap/cuff test passes. These fixtures exercise bounded cleanup of an existing imperfect mask; they are not diverse real photographs or a new semantic segmenter. REVIEW, not automatic approval. Residual two-pixel margins and uncertain details still need manual correction.

**No additional licensed photograph improves relative to Work51.** The same nine available cutouts remain pixel-identical to Work51, and six missing masks retain fallback. The inherited dress support improvement remains available from the canonical Work50 base. No licensed accuracy percentages are claimed. Complex bedding/walls, pale mannequins, broad fabric exactly matching background, clipped sources, lace with no visible boundary, hanging supports and shoe-pair completion remain unresolved. Color/connectivity is not semantic proof: broad matching-color fabric can still be ambiguous; inspect every proposed region and undo it if fabric is affected. Do not invent occluded fabric or approve by successful generation.

See [RESULTS.md](RESULTS.md) for the fifteen-photo assessment. All are still 0 PASS / 5 REVIEW / 10 FAIL. Synthetic screenshots show original, previous mask, improved mask and existing humanoid; the licensed gallery shows both provisional/manual-assisted and source-native variants separately.

## Reproduction

Run the inherited Work51 workflow build steps, then:

```
node scripts/build-work52-isolation-hold.mjs
node scripts/build-work52-benchmark.mjs
node scripts/build-work52-synthetic.mjs
node --test tests/work52*.test.mjs
node scripts/test-work52-editor-browser.mjs
node scripts/test-work52-synthetic-browser.mjs
node scripts/test-work52-browser.mjs
node scripts/test-work52-integration-browser.mjs
```

Serve localhost: `research/work52/index.html` (licensed) and `research/work52/synthetic.html` (known reference masks). `.github/workflows/work52-isolation-no-deploy.yml` reproduces all inherited source/privacy/fit/manual recovery/outfit/mobile checks and Chromium/WebKit 320/390/430 comparisons, without deployment. Offline Auth/cloud/classifier mocks do not establish live JWT/RLS isolation, physical-phone behavior or cloud restore. Family Alpha HOLD.
