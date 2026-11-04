# AUTO-MULTI-MODEL-EVIDENCE-15 — independent real SegFormer multi-garment proof

**Controller:** dominant Closet Current main chat. **Parent:** verified PR #569, exact HEAD `ca23c25d6621ea41c29fc9bac5f32eefb829b550`. **Parallel #25 owns subtype-recognition accuracy**; this scope is strictly original-photo automatic *visible garment region proposals* and does not touch parallel branches. DRAFT RESEARCH ONLY. Family Alpha issue #255 HOLD. No merge, deployment or changes to production/default app, auth, user photographs or database.

## Starting ground truth and what is being proved

Prior PR #569 ran six genuine mobile Chromium/WebKit browser cases with **automatic model network intentionally blocked**, followed by explicit human-reviewed crop boxes and category/color confirmation. That proved private item saving but NOT automatic segmentation recall. This priority closes that evidence gap with the actual unchanged `public/outfit-worker.mjs`, unchanged `research/multi-garment-capture-01/visible-groups.mjs`, and the pinned original 800×750 JPEG of Rasmus K. Kristiansen's person wearing an upper shirt, jeans and Converse, CC BY-SA 2.0, SHA `e3df4503a89c244b28fa344ec170d6554fc06ad1d7cd331014fcb277df19d5ff` (104,520 bytes).

`locked-worn-original.json` reuses the *previously manually reviewed* approximate top/bottom/shoes rectangular regions from PR #569. These are not true pixel masks and MUST NEVER be called pixel-level mask IoU or comprehensive object recognition ground truth. This is ONE licensed photograph tested independently in Chromium and WebKit (two browser scenarios), NOT two unique photos or a general population benchmark.

## Scope of new implementation

- `runner.html`: research-only real browser photo and candidate overlay. Actual automatic proposals drawn separately from human-reviewed coarse boxes; no save or authorization surface. Visible attribution of licensed photograph.
- `scripts/test-auto-multi-15-browser.mjs`: source SHA verifies original JPEG bytes prior to import, spins up a local test server and one actual SegFormer worker per Chromium/WebKit engine, checks full unchanged original photo, collects **model-produced** box, label and confidence only. It never sends source bytes to a third-party upload endpoint, never touches the private wardrobe or claims automatic subtype correctness. Captures three mobile widths 320/390/430 for each engine.
- `scripts/score-auto-multi-15.mjs`: class-compatible greedy unique matching of **coarse human-reviewed boxes** at visible-overlap IoU ≥0.10, with missed class, unmatched proposal and model-error diagnostics, original SHA validation, synthetic label-map results explicitly identified as NON-MODEL tests. Output labels are visibly separate from review decisions; all proposed garments remain human-review only.
- `tests/auto-multi-model-evidence-15.test.mjs`: synthetic label-map/geometry and fail-closed unit tests ONLY, never represented as real automatic detection accuracy.
- `scripts/audit-auto-multi-15.mjs`: independently hashes actual browser screenshots, checks source lineage and no uploads, requires **two actual model executions** before accepting its own research workflow.
- Dedicated GitHub Actions workflow pins PR #569 source and locks production/cloud/3D/worker code against changes. Runs full inherited Node/build and research-only browser evidence. No deploy.

## Scientific acceptance rules

1. Actual SegFormer model must load and finish without fallback or mocking in real Chromium and WebKit on original licensed photo. If either model fails, CI is red, diagnosis is recorded and the priority is not described as fully verified.
2. Coarse box class-compatible coverage is a rough smoke-check. **Even 100% here does not certify semantic segmentation precision/recall, masks, arbitrary clothes, person privacy, colors or subtype accuracy.** Additional independent flat-lay, overlapping, layered and diverse original-photo datasets must be annotated before real multi-photo accuracy claims.
3. The model can only suggest visible regions. Manual human review of actual photo, category/type/color/crop and explicit confirmation remains mandatory. Original source and owner-private atomic IDB savings remain unchanged.
4. No physical Android/iPhone, signed live Supabase A/B RLS, actual user-photo accuracy, arbitrary 163-bone 3D fitted garments or Family Alpha release proof is asserted. Production untouched, Family Alpha HOLD.

## Reproduce

Run `npm install --no-save --no-package-lock playwright@1.56.1 sharp@0.34.3 fake-indexeddb@6.2.4 three@0.180.0 three-mesh-bvh@0.9.2`, then `node --test tests/auto-multi-model-evidence-15.test.mjs`, then `node scripts/test-auto-multi-15-browser.mjs && node scripts/audit-auto-multi-15.mjs`. CI uses pinned Playwright browser images and uploads redacted measurement JSON plus licensed-photo screenshot proof. Do not store raw downloaded source JPEG in artifacts.