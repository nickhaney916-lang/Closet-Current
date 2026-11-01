# Closet Current 3D-72 — genuine 360-degree human visual review

**Mode:** Main development, isolated draft research. No deployments.

**Verified baseline:** 3D71 PR #482, HEAD ca578b12b4cc2714f484d0582651ca56bd89ce0a, dedicated 3D71 no-deploy CI run #41267482319 SUCCESS.

## What this completes

The existing 3D71 pipeline produces 72 genuine 163-bone male/female WebGL screenshots (2 figures x 2 mobile widths x 2 geometry modes x 9 angles). Visual pixel changes are not evidence that the garments look natural to a person. This priority packages a rigorous **offline manual acceptance workbench** with explicit review outcomes.

## Deliverables

- research/three-d-72/review-gate.mjs validates 72 source PNGs, 36 unique camera pairs, SHA-256 digests, the real original rig evidence and continued release HOLD. Manual scoring never authorizes launch.
- scripts/build-three-d-72-human-gallery.mjs verifies true PNG bytes and builds benchmark/three-d-72/index.html, an offline before/after side-by-side review gallery with 36 per-view scoring controls and a local JSON export.
- tests/three-d-72-human-review.test.mjs tests missing/tampered views, duplicate decisions and false approvals.
- Dedicated strict GitHub Action re-runs original 3D71 source tests, actual 72-image WebGL captures, gallery assembly, review manifest, and uploads both benchmark folders as a single artifact.

## Manual acceptance

Download artifact THREE-D-72-REAL-CC0-360-HUMAN-VISUAL-REVIEW-HOLD from the dedicated CI. Extract and preserve sibling benchmark/three-d-71 and benchmark/three-d-72 folders. Open benchmark/three-d-72/index.html on a computer without a web server. Review before/after all 36 male/female, width, and camera-angle combinations. Mark whether new fabric geometry looks more natural, unchanged, less natural or unclear. Export the JSON and return to the main Closet Current conversation.

## Hard limitations

This specifically evaluates real skinned **neutral trousers**, NOT original photographed denim. Separately vetted photographed shirt and jeans with 360 swap are in PR #480, and category-to-wardrobe bridge in PR #479. No changes to photo recognition, original photos, source mesh, camera, geometry, garment fitting, production, staging, accounts, auth, billing, Drive Duel or Delta Ebb.

Simulated mobile browser widths are not physical Android/iPhone QA, and no generated review can certify aesthetics without a real human. Human appearance remains REVIEW, original private photo-to-3D conversion remains unproven, and Family Alpha issue #255 remains HOLD. No merge or deployment permitted.
