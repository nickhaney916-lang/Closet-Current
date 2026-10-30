# 3D-QA-49 — genuine original-photograph 3D visual realism acceptance (DRAFT / HOLD)

**Independent verified input:** PR #454 original 3D46 photo evidence at exact head `fe351f01fe565179e40daa57ec2d7aead15adc99`, dedicated [successful CI #41091391572](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/41091391572) and real artifact ID `12995572094`. This PR is stacked on independent seam QA [PR #457](https://github.com/nickhaney916-lang/Closet-Current/pull/457) and garment PR #455; concurrent collar [PR #456](https://github.com/nickhaney916-lang/Closet-Current/pull/456) is separate. Do **not** combine the branches automatically.

## Verified source-photo observation (3D46 screenshots, 2026-10-30)

Downloaded and locally opened real Chromium source-photo screenshots from #41091391572; compared front/side/back female/male for both photo denim sources at 430px and analyzed the full underlying 320/390/430 mobile capture matrix.

- **Working:** Both original 3D anatomical bodies are rendered. Actual black AJ photographed shirt front and separately licensed denim fronts render without replacing the front with synthetic artwork. Side and back are present; the screenshot gallery is not fabricated. Before/after geometry has visible pixel differences.
- **Still visually unrealistic:** Rounded yet stiff padded/bulbous upper-arm silhouette, squared shoulders, largely uniform sleeve profiles. Back of shirt and denim are source-neutral/simplified and cannot be described as a photographed back of the same piece. Small contour shifts alone do not produce the look of actual textile resting on a person.
- **Material impact:** A deterministic `sharp` re-analysis of 72 real before/after PNG pairs from the successful 3D46 artifact found only **0.02641%–0.13489%** of the canvas pixels changed (RGB absolute-channel sum threshold 27). This measures visible difference, **not** perceptual improvement or realism. It must not be marketed as an aesthetic PASS.
- **Status:** Human perceptual realism **REVIEW / not approved**. Family Alpha remains **HOLD**. Captures use Chromium mobile-sized viewports, **not** physical handsets. Correct continuous motion, signed garment/body containment and complete photo coverage remain unverified.

## Functioning independent QA

`scripts/report-three-d-qa-49-visual-evidence.mjs` consumes the authentic output of 3D46 and, when available, 3D47 Chrome photo test scripts (not generic stand-ins) and:

1. Fails closed if 3D46 baseline or explicitly required 3D47 source browser results are absent.
2. Verifies **72 before/after PNG pairs per stage**: two original denim source IDs × 320/390/430 mobile widths × original male/female rig × source-neutral half-arm/relaxed poses × front/side/back views. Requires real screenshot sizes (`viewport-24` canvas) and exact matching image dimensions.
3. Requires preserved original photos, `releaseAuthorized: false`, `humanVisualApproval: false`, and a genuine nonzero pixel change for every pair.
4. Outputs a machine-readable `benchmark/three-d-qa-49/visual-metrics.json` and offline HTML before/after `benchmark/three-d-qa-49/gallery.html`. Both are archived by the inherited existing no-deploy workflow after genuine photos are captured.
5. **Never** turns changed pixels into automatic garment realism PASS; labels observations REVIEW, release blocked.

## Locally executed evidence

- PASS: Ran the exact same new source against a downloaded copy of the dedicated-green 3D46 artifact: **72 / 72** screenshot pairs validated; HTML gallery and JSON produced.
- PASS (negative test): Changed the local browser manifest to falsely mark `humanVisualApproval: true`; the script exited nonzero and rejected the test with `Automated pixel-change result cannot authorize human visual PASS`.
- **Pending:** Exact new PR-head CI, including the 3D47 72 additional generated genuine image pairs; no claim that those jobs succeeded until GitHub reports success.

Local command after the dedicated benchmark has generated all PNGs:

```bash
node scripts/report-three-d-qa-49-visual-evidence.mjs benchmark --require-47
```

Strict draft HOLD. Do not merge/deploy or change production, staging, billing, family accounts, private wardrobe photos, or Drive Duel. No paid AI calls. Issue #255 remains the four-account release gate.
