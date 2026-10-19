# Higher-resolution source-guided mask boundary proposals

Isolated follow-up to PR #39 `8d009ec0`; existing PR branches are untouched. The same 12 licensed original photos are tested. This adds local diagnostic processing; it does not approve new default displays, change source recognition or replace high-resolution photographs.

## Processing

`public/source-guided-mask-refinement.js` accepts a bounded original-pixel preview copy up to **600,000 pixels**. It derives an area-averaged guide up to 150,000 pixels internally from that exact buffer, then invokes PR #39's conservative dark-studio proposal. No externally supplied mask can be substituted from another photo or old outfit.

The guide's one-cell inner/outer boundary becomes an explicit uncertainty band. Inside that band only, original higher-resolution RGB can restore non-neutral pixels that the projected guide omitted. **Every projected foreground pixel is preserved**, including dark material that resembles the backdrop. Outside the band, projected alpha is preserved exactly. No RGB paint, interior smoothing, erosion, invented material or recovery of unseen fabric occurs. Existing source alpha is refused for this path and stays on its unchanged native-alpha route.

An earlier experiment cleared 798 source-neutral boundary pixels. Its Pillow witnesses passed, but WebKit reported **2 of 696 collar-patch pixels missing**. Clearing was disabled while investigating; follow-up logs showed those two pixels were already absent in the internally projected guide, not newly erased by refinement. Their source RGB was `[29,15,15]` and `[25,10,10]`: small absolute channel differences, but strong relative chroma. The final boundary check also preserves relative chroma at low light levels. Every projected foreground pixel remains protected. The earlier experiment JSON is retained at `benchmark/source-guided-clearing-experiment-20261019.json`.

The final alpha is applied to a fresh copy of the same source RGB and the candidate is trimmed/passed into the existing local inverse mesh. Resampling by the mesh is separate from zero RGB edits during extraction. Every proposal remains `eligible:false`, `displayEligible:false` and `requiresIndependentMaskReview:true`. The customer page merely makes the module available for local diagnostics; normal outfit display/cache behavior remains held for these scenes.

## Actual evidence

Pillow 11.3.0, Python 3.12 / Node 22 runner:

- 12 real original photos: **1 refined proposal (`commons-0002`), 11 without proposals; 0 automatic display approvals**.
- Red-shirt source copy **633×946 (598,818 pixels)**; internally derived guide **316×473 (149,468 pixels)**. These are bounded preview copies, not a claim of full native-resolution extraction from the 1920×2868 original.
- **11,680 uncertain boundary pixels** remain unverified. Compared with the internally projected guide on the SAME larger source grid, **0 projected foreground pixels are cleared** and **2,171 source-chroma-supported pixels become opaque**, including 1,807 dark relative-chroma pixels.
- Region diagnostics: collar 0 clear / 286 restored; left cuff 0 / 211; right cuff 0 / 46; hem 0 / 298. These are observed alpha changes, not true-positive/false-positive classifications.
- **23,808/23,808 pixels in 8 assistant-inspected garment-core patches stay opaque**; **32,483/32,483 pixels in 4 sampled background/neck/stand patches remain clear**. Three boundary-straddling patches remain explicitly ambiguous, not counted as pure fabric.
- **0 RGB-byte edits before warp**, **0 alpha changes outside the band**, unchanged original JPEG hashes and deterministic repeat reports.

This compares a guide derived from the larger source buffer against refinement of that same guide. It is not a pixel-identical A/B against PR #39's independently Pillow-resized 150k mask; decode/resampling methods differ. Partial source witnesses are assistant inspection, not independent full garment masks. No full-mask precision/recall, realistic fit, perfect collars/cuffs or competitor-quality claim is justified.

Relative chroma can also retain colored background bleed, so restored pixels are still unverified. The current restoration-only proposal retains dark outlining and hard-alpha edges. The module cannot distinguish true black garment trim from an identical black backdrop. An explicit synthetic counterexample documents omitted black trim while requiring the result to remain held. Enclosed dark-logo preservation, thin colored boundary preservation, alpha/source immutability, band invariance and invalid/oversized refusal are software tests; those passes do not mean the counterexample has been solved.

## Reproduce

```sh
python -m pip install Pillow==11.3.0
python scripts/benchmark-source-guided-boundaries.py
node scripts/assert-source-guided-boundaries.cjs
node --test tests/source-guided-mask-refinement.test.cjs
```

Open `artifacts/source-guided-boundaries/index.html` for original, projected alpha, refined alpha, orange uncertainty overlay, inverse mesh and collar/cuff/hem comparisons. Exact source/pipeline/candidate digests and license/derivative notices are retained in the report. `benchmark/source-guided-boundary-results-20261019.json` preserves the actual local measurement.

CI regenerates and byte-compares the report, runs all automated tests, and uses built-app Android Chromium/iPhone WebKit emulation to execute both extraction stages on the licensed red-shirt source, check protected witness patches/unchanged RGB/band invariance and preserve existing cache/race/selfie/source HOLD regressions. Actual phone hardware, approved full garment boundaries, soft-alpha edge quality and realistic drape remain untested.

No merge, deploy, paid generation, external inference, assets purchase, customer-photo/selfie upload or Drive Duel changes.
