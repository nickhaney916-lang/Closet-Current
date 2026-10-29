# Closet Current 3D-20 — actual triangle surface at anatomical wrists (HOLD)

**Objective:** Progress from [PR #421's vertex-sampling audit](https://github.com/nickhaney916-lang/Closet-Current/pull/421) to a genuine *body-surface* contact diagnostic before altering any more material or geometry. User wants a lifelike human wearing the original photographed garment. Previous 3D18 wrist hem attempts left pale visible wrist wedges despite green source/functional CI. A third neutral strip without determining whether skin actually meets the hem is not justified.

## Implementation

This strictly read-only code measures the **true posed anatomical surface triangles** from the source-hash-pinned CC0 male and female models, rather than only distances to selected body vertices. `research/three-d-20/triangle-contact.mjs`:

1. Requires the exact source-bound Work56 separate photographed shirt, original 3D17 facing and 3D18 neutral wrist hem, all sharing the same real GLB skeleton and Work47 image review/identity handoff.
2. Applies each real skeleton's bone transforms to every anatomical skin vertex once per pose, processes the actual `BufferGeometry.index` triangles, and isolates genuine forearm/wrist neighborhoods on both anatomical arms.
3. Measures each source-hem tip's **closest point on each candidate deformed body triangle**, collecting true point-to-body-*triangle* distances, count and percentile distributions.
4. Casts both **inward and outward radial rays** from that hem point along the actual wrist-to-elbow axis to test where skin surfaces lie relative to the hem. Captures inward/outward surface-hit fractions and distances, without silently converting missing hits to zero gap or pretending signed distance.
5. Does not move any original geometry, texture pixels, joint weights, shirt/cuff seam, model rig or app code.

**Crucial geometry semantics:** This is a point-to-*skin*-triangle and ray probe, not exact *garment-triangle to body-triangle* intersection certification, not watertight mesh inside/outside sign, not a complete union of skin/cloth pixel coverage, not a guarantee of natural appearance. Results explicitly report `fullTriangleCollisionValidated=false`, `signedClearance=null`, `visualGapClosureProven=false`, `humanVisualApproval=false`. We should use the real numeric outcome to decide whether to make an actual contact repair or investigate face winding/transparency and depth instead of building new black strips.

## Source identity / no-op guarantees

Exact parent [3D19 PR #421](https://github.com/nickhaney916-lang/Closet-Current/pull/421) commit `5deb26e55cac8e40fa4d286ac5925a58cdfb97f9`. Only four new research/test/CI files. Historical Work47 original 15 licensed source JPEGs and existing provisional masks rebuilt from immutable source, both 163-bone anatomical CC0 binary GLBs SHA256-locked and never changed. Node tests use original Work61 `createOutfitController`, source-verified original AJ shirt, both real body rigs and each **source and relaxed pose**; source pose repeated for reproducibility on the female rig. Results emitted as `benchmark/three-d-20/actual-skin-triangle-contact-HOLD.json`.

The dedicated no-deploy CI re-runs both original 3D18 and 3D19 tests and the new actual wrist triangle contact test, plus existing 3D18 browser WebGL screenshot comparison and the 3D19 eight-panel genuine screenshot sheet. These are read-only legacy tests; any failures are not renamed or suppressed. CI artifact includes the real 3D20 contact report alongside old pre/post screenshot evidence. No new external browser requests, personal photos, Supabase/Cloudflare/Resend, paid AI, staging/production, family accounts, original JPEG or alpha modifications, Drive Duel, or merges/deployments.

**Independent human visual result:** still HOLD; the real 15-photo aesthetic baseline is 0 PASS, 5 REVIEW, 10 FAIL, not rerun by this diagnostic. Four real family testers remain on HOLD pending protected staging JWT/RLS, cloud backup/reopen/restore, physical phones and owner aesthetic approval. Model triangle samples alone cannot release the alpha.

## Follow-up decision

Use measured inward/outward skin-hit fractions and true point-to-surface distances to select a *single* physically informed fix: either adjust the actual worn garment wrist rim to follow the original anatomical skin/skeleton after a verified signed collision study, or correct rasterized side/underside face coverage if the wrist already meets skin. Recheck both sexes, all available poses, mobile front/side/rear with the original licensed garment. Do not implement a generic fabric patch or extend cuffs blindly.
