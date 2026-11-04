# INDEPENDENT-RECOGNITION-ACCEPTANCE-40 (Parallel #32) — RESEARCH HOLD

Parent is Work #31 draft PR #597 SHA f4464188c6fddaca35f8e06f54506fa856df455d, itself based on PR #595 a299f9f956fff7cd2045ae5faf0afa86bdc7b669. No model, production, staging, customer, Supabase, segmentation or release changes. Family Alpha #255 remains HOLD.

## Frozen photographic evidence and limitations

dataset-manifest.json joins 35 Work #31 archived JPEG photos with the 16 inherited classification photo IDs. Seven IDs overlap, yielding exactly 44 distinct SHA-locked JPEGs (not 51 independent samples). Sources include Wikimedia author, license, source page and physical-byte SHA when available. Some attribution records are incomplete and MUST be adjudicated before licensing certification; source-audit.json identifies gaps and near-duplicate dHash candidates. Archived JPEG renditions must not be represented as highest-resolution originals. Their individual dimensions are verified where metadata exists.

Only 13 garment labels plus three nonclothing controls are in the locked classification sample. The 35 primary-color targets are single-reviewer provisional rather than blind, independently certified annotations. ZERO second human reviewers or adjudicated garments. Full palette, subtype pairs, instance masks, physical Android/iOS, and an untouched independent holdout of 100–200 photos remain UNVERIFIED. The 35 and 16 image counts must never be summed as disjoint. Browser repetitions are not new image samples.

## Measurement

score.mjs is a new scorer independent of Work #31 comparison logic. It consumes the unchanged inherited manifests and exact actual worker outputs, refuses changed labels/duplicate photos, separates broad category, exact subtype, automatic precision versus coverage, abstention, category review, negatives, per-class/color confusion, Wilson uncertainty intervals and wrong automatic accepts. Category confidence flags are not a calibrated probability. Full region matching is unmeasured. score.mjs distinguishes recorded-historical results from actual-unmocked-browser results and always returns scientific NEEDS REWORK if certified human labels and adequate source population are absent.

Work #31 compares production baseline whole-image 16x16 color to a visual-rectangle 48x48 pixel proposal. It is not a trained recognition model; candidate automatically saves no colors. Its color evidence is exploratory because visual rectangles were chosen with color targets visible. The independent scorer measures exactly the same locked rows and does not tune the candidate.

## Reproduction

From the root with Node, pinned Playwright 1.56.1 and Sharp 0.34.3:

    node scripts/build.mjs
    node --test tests/*.test.cjs tests/*.test.mjs
    node research/independent-recognition-40/verify-images.mjs
    node research/recognition-category-color-39/compare-color.mjs > benchmark/recognition-acceptance-40/paired-color.json
    node research/independent-recognition-40/score.mjs benchmark/recognition-acceptance-40/paired-color.json benchmark/regression-holdout-16.json recorded-historical benchmark/recognition-acceptance-40/historical.json

The dedicated workflow downloads 16 licensed SHA-pinned photographs, runs the existing actual Chromium FashionCLIP worker on the unchanged holdout, reruns the independent scorer with actual-unmocked-browser provenance, tests Chromium and WebKit original-JPEG pixel/color review at 320/390/430, audits six screenshot PNGs, and checks the real app IndexedDB browser flow with explicitly MOCKED classifier results. Neither the browser screenshot exercise nor synthetic classifier save is a fresh FashionCLIP-to-IndexedDB integrated accuracy test. No physical phones or signed production RLS verification.

## Prior and present defects

PR #570 real browser outcome was broad 8/13 (61.54%), accepted subtype 4/7 (57.14%), with three unsafe automatic subtypes: commons-0003 T-shirt→Sweatshirt; commons-0014 Blouse→Tunic; commons-0078 Sneakers→Ankle boots. The inherited older recorded benchmark was 7/13 and 3/6 correct auto-accepted subtypes. Do not confuse the two runs. Work #31 color candidate improved pre-existing provisional labels but still misread commons-0041 Green as Gray and validation-0001 Multicolor as Red, and accepted ZERO colors automatically.

Independent release verdict: NEEDS REWORK. Green workflow means measurement ran, not 95% recognition accuracy. Provide a genuinely independently annotated, rights-verified holdout and matching detected garment regions before any scientific PASS or Family Alpha promotion.
