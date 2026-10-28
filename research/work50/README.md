# Work50 — automatic garment isolation (HOLD)

Separate development candidate based on Work49 #370 `8f8724221868c55ea748fff6f0377379d40b75c7`. No edit-recovery work, production change, deployment, merge or provider setting change.

`isolate.mjs` implements native-resolution border-connected background removal, opposite-edge / border consistency, strict and loose threshold disagreement checks, retention of all components, narrow existing-detail protection, and conservative removal, pale-region and significant-component topology gates. It only copies original RGB; alpha can decrease. It does not infer missing cloth, skin, mannequins or hangers from color, fill holes, erode fabric, generate pixels, or duplicate shoes. Semantics remain unverified. Every candidate is REVIEW; no machine acceptance or human visual approval is asserted.

The protected offline app changes only its extraction import. The original source/account auditor, explicit review UI, independent mask replay, Work48 fitting, shoulder / sleeve geometry, manual proportions, recognition, saving, original-photo outfit board, Auth and backup remain byte-identical. The adapter first tries source-native connectivity, retaining pale straps that a global threshold may omit. It retains the previous extraction when the new proposal is refused; invalid source identities stay rejected. Complex backgrounds retain fallback. Local processing does not send images to a service.

The licensed benchmark deliberately distinguishes the previous automatic border-connected result from frozen provisional masks (some have manual outlines). The gallery separately displays native automatic isolation from the original photograph. New cleanup also runs on frozen source-bound alpha with no per-photo polygons, seeds, thresholds or rules. It preserves 7 masks exactly and proposes small alpha-only cleanup on the dress (3,414 pixels) and black boot (338). Six missing cutouts remain missing. These counts are geometry, not fabric recall or accuracy. No independent full licensed reference masks exist; no licensed IoU or accuracy percentage is reported. Synthetic reference tests have independently constructed masks, including pale fabric, light/dark backgrounds, straps and two shoes. Their results do not establish real-photo accuracy.

## Reproduce

Use the inherited pinned parent and dependency setup in `.github/workflows/work47-fit-no-deploy.yml`, then:

```
node scripts/build-work47-parent.mjs
node scripts/build-work47-benchmark.mjs
node scripts/build-work49-cutout-hold.mjs
node scripts/build-work49-benchmark.mjs
node scripts/build-work50-isolation-hold.mjs
node scripts/build-work50-benchmark.mjs
node --test tests/work47*.test.mjs tests/work48*.test.mjs tests/work49*.test.mjs tests/work50*.test.mjs tests/work43/*.test.mjs tests/work46-session-races.test.mjs
node scripts/test-work50-integration-browser.mjs
node scripts/test-family-alpha-51-mobile-nav-browser.mjs
node scripts/test-work48-visual-review-browser.mjs
node scripts/test-work49-editor-browser.mjs
node scripts/test-work50-browser.mjs
```

Serve the repository on localhost and open `research/work50/index.html`. All 15 entries show originals, previous automatic result or explanation, frozen baseline where available, new automatic cleanup, alpha-change map, and the existing fitted humanoid or truthful photo fallback. Existing manual editor and review controls remain available. Browser screenshots and measurements go to `benchmark/work50/` and the no-deploy CI artifact.

## Limits

Tiny cleanup is not a clean worn garment or general automatic segmentation. Pale fabric/background ambiguity, mannequin neck and collar residue, hangers with distinct colors, sleeve openings, narrow trim wider than the protected runs, source perspective, missing masks and single-shoe references still require manual correction / better capture. Threshold stability and topology are risk indicators, not proof of intact fabric. No grades are promoted automatically. Physical phones, live accounts/RLS and cloud restore are untested. Family Alpha remains HOLD.

Local tests include fourteen synthetic/source cases and full licensed pixel audits. CI also prepares inherited fixtures for the general camera suite; missing Sharp and fit/mask fixtures were an existing workflow setup gap. PNG derivatives are encoded and decoded back to exact RGBA before acceptance by the benchmark builder.

Verification and per-photo visual findings will be recorded in `RESULTS.md` after the final browser matrix is inspected.
