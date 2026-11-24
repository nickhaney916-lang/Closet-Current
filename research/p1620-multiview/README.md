# P1620 independent multiview garment evaluation

Generator baseline [#1618](https://github.com/nickhaney916-lang/Closet-Current/pull/1618), commit `6f20d8d0bff7ed0d7e2fd24622033310271c46c0`, tree `585f2e743ca079647cdbd7eaf17307c52f27fc1e`. The generator and its source register come from that exact tree. The evaluator and its outputs are research-only. Family Alpha #255 remains HOLD.

## Intake and isolation

The [cohort](cohort.json) contains six independently identified catalog objects. It records four Smithsonian JPEGs from one accession and ten Met JPEGs from five accessions. Each media row pins the archive URL, rights, credit, accession component, view basis, dimensions and untouched JPEG SHA-256. The Met API's front and back filename suffixes were matched to the ordered gallery IIIF assets and visually checked. Smithsonian orientations come from visible garment features in the same catalog gallery. The Smithsonian side and three-quarter views are unregistered. The other five sets provide rear views only.

The repository baseline was checked for matching accession strings and its inherited photo register checked for SHA overlap. Controls reject different components, reused bytes and media IDs, invalid rights, altered JPEGs and inherited fixture hashes. This proves custody against the inspected register. An external training corpus was unavailable for deduplication. JPEGs are fetched on demand and checked before use.

## Protocol

1. Verify every JPEG against the content receipt. Split by catalog object before testing. Give the existing generator only a byte copy of the designated front JPEG and a source record. Retain the alternate JPEG hashes and observations as evaluator inputs only.
2. For a silhouette score, independently register the photographed azimuth, pose, camera and pixel frame to the projected geometry. Pin the reference mask, projection and uncertainty mask in that frame, with a review receipt. The comparator reports intersection over union and symmetric mean nearest-boundary Manhattan distance in pixels. It excludes uncertain pixels from IoU and withholds boundary distance when uncertainty is present. It never fits a projection to the held-out reference.
3. Review garment pixels separately from the mount, wearer, hanger and background. Record seam and hem landmark provenance. Hold quantitative color and texture comparisons until illumination, material boundaries and the observed region can be aligned. A front JPEG RGB receipt covers that observed surface. Neutral side and rear material carry no inferred photographic texture.

The frozen cohort has zero independently registered frames and zero human-reviewed masks. Its [per-object result](held-out-results.json) shows all six front inputs refused by the inherited six-fixture source registry. The comparator emits no side/rear IoU for them. Garment fit, physical depth, drape and unseen-view color accuracy remain unmeasured.

## Browser and reconstruction handoff

The [browser receipts](browser-receipts.json) cover six admitted legacy sources rendered in genuine Chromium and WebKit. Native WebGL drew the original photo texture on the observed plane and neutral side/rear projections of the same indexed meshes. The test checked the input JPEG hash in the browser, exact GPU RGBA readback, unaltered front geometry and indices, no non-loopback request and no consumer admission.

- **Side depth.** In Chromium, the category profile changed side silhouette area from 628–664 to 811–3,979 display pixels across the six inherited fixtures in a fixed view. These are projection diagnostics on previously used sources. Prioritize a source admission and camera registration pass on Smithsonian 28810 before choosing either depth hypothesis. The visible rear skirt projection and side train are suitable landmarks to review.
- **Rear shape.** Both depth variants produce identical rear binary silhouettes on all twelve browser runs. The current rear geometry retains the front XY coordinates. A separate rear shape or multiview constraint is needed to change the rear silhouette. The frozen views localize review candidates at skirt hem and train, coat tails and vents, and blouse sleeves and closure.
- **Color and texture.** Keep the source plane for observed RGB. The rear coat details and blouse closures differ from their fronts. Preserve neutral rear surfaces until independently observed texture can be aligned.

Mission 2 #1173/#1124 retains source admission, reconstruction and fitting ownership. A broadened, reviewed research source register and independent image registration are required before evaluating the new cohort on the generator. No generator changes, promotion or release.

## Reproduce

After installing the inherited pinned dependencies and Playwright Chromium/WebKit:

```sh
node scripts/run-p1620-held-out.mjs /tmp/p1620-media /tmp/p1620-held-out.json --download
node scripts/test-p1620-multiview-browser.mjs /tmp/p1620-projections.json
node scripts/build.mjs
node --test --test-concurrency=1 tests/*.cjs tests/*.mjs
```
