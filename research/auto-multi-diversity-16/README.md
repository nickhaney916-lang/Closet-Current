# AUTO-MULTI-DIVERSITY-16

Draft research on top of PR #571 at `0236182f72b29a7b4d4924f0b3f5754cb9956690`. Family Alpha issue #255 remains HOLD.

The manifest locks 19 distinct, original Wikimedia Commons JPEGs and 35 visually annotated visible garment boxes. Boxes were marked without the model overlay. They are a single-reviewer reference, with three inherited boxes from PR #569. A second reviewer and independent pixel masks are pending. The split is recorded per photo. The runner verifies each SHA-256, file length, JPEG dimensions and complete decoding before inference. The manifest records attribution and license per photograph. No JPEG originals are added to Git or CI artifacts.

A recognizable shoe pair is one target. The benchmark therefore measures how well proposals cover the pair as a closet item. It cannot validate left/right identity. Upperwear is one semantic family, including shirts and jackets as separate targets when both are visible. Accessories and ambiguous scraps are outside the scored families. The benchmark includes a visibly overlapping two-shirt case. Layered upperwear coverage remains limited.

Each proposal can satisfy at most one same-family box at IoU ≥ 0.50. Matching maximizes the number of valid matches. False positives are split into duplicates, wrong-family matches and unmatched regions. The last category requires image inspection to distinguish fragments from background and non-clothing. Failed inference cases have their own count and contribute missed targets to end-to-end recall. Precision is undefined when there are no proposals. Box IoU is reported separately from mask IoU, which is unavailable.

## Run

```sh
npm install --no-save --no-package-lock playwright@1.56.1 sharp@0.34.3 fake-indexeddb@6.2.4 three@0.180.0 three-mesh-bvh@0.9.2
npx playwright install --with-deps chromium webkit
node scripts/build.mjs
node --test tests/*.test.cjs tests/*.test.mjs
node research/auto-multi-diversity-16/run.mjs
MULTI16_INPUT=app-equivalent node research/auto-multi-diversity-16/run.mjs
```

The first model pass gives the worker the unchanged JPEG. The second separately reproduces the existing review UI canvas resize for images above 3072 pixels on either side. It retains and displays the unchanged source. That pass can still benchmark a JPEG larger than the UI's 10 MiB import limit, so those records carry an explicit flag. The resize pass is an input experiment with the same model and proposal algorithm. It is not a change to the application detector. The CLI exits nonzero for incomplete runs, unexpected inference errors, or unexpected external writes even when partial results can be written.

Set `MULTI16_ORIGINALS` to a directory containing the locked JPEGs by manifest ID to avoid downloading the images again. The optional `MULTI16_RELAY_MODEL=1` mode forwards only version-pinned model/library GETs through Node for workspaces where browser requests fail. It uses the actual downloaded model bytes and browser inference. The report marks the transport. Both modes use a research-only overlay and never save closet records. Existing native fallback tests exercise confirmation, manual crops, storage, styling and V4 restore separately.

No physical device, 3D fit, automatic-save safety, arbitrary garment accuracy, or second-engine acceptance follows from the Node tests or a successful model smoke case.

## Research confidence triage

The review-resize development split retained all five matched boxes at a primary-tier confidence of 0.925, with zero of the 28 unmatched proposals in that tier. The cutoff is fixed and is evaluated separately against the unchanged held-out boxes. Lower-confidence proposals remain available as additional review candidates. This experiment changes no application controls, model output or wardrobe records. It measures the cost of presenting a smaller primary review set. The reported confidence is a component score rather than a calibrated probability.

Source downloads are paced and retry rate limits and server errors. `MULTI16_SOURCE_CACHE` can reuse originals verified during the first CI pass. Raw JPEGs are excluded from the artifact glob.
Expected direct-input worker size rejections still count as failures and missed targets in the accuracy results. The verification workflow distinguishes those known limits from asset-load, runtime and browser failures. A passing workflow only verifies execution and the manual fallback. There is no detector quality pass based on CI status.

The matrix retains one model worker per engine and input mode after initial load. This avoids treating repeat network downloads as model accuracy. The native test's default six cases deliberately block the model and verify fallback. `MULTI16_NATIVE_AUTO=1 node scripts/test-multi-garment-capture-01-browser.mjs` adds one Chromium 390 px case with genuine automatic proposals. It verifies that proposals stay unsaved until confirmation, corrects two proposed crops, replaces an inadequate footwear crop manually, saves, checks duplicates and owner isolation, and reopens the restored saved outfit.
Set `MULTI16_NATIVE_AUTO=matrix` to attempt the same acceptance case in both engines at all three viewports.
