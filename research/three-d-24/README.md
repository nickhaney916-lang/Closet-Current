# Closet Current — 3D-24: combine independently verified photographed-shirt and dress neckline changes (HOLD)

**Date:** October 29, 2026. This is an *integration-only* main-thread development branch, **not a new Work assignment**, clothing reconstruction method, alternate base mesh, staging change or release decision.

## Context

- [Work #63 / PR #423](https://github.com/nickhaney916-lang/Closet-Current/pull/423), exact `926c85ebf9d2d29c919771f3dcd6c1527208b63c`: existing real separate skinned AJ shirt, neutral pants and photographed dress on two licensed anatomical bodies, source/review/privacy controls.
- [Work #64 / PR #426](https://github.com/nickhaney916-lang/Closet-Current/pull/426), exact `a010cafcbcaf8152d939dff459cefa9e0baa50cf`: original photo shirt collar/edge fit, independently tested 192 real GPU snapshots, still aesthetically REVIEW.
- [Main-thread PR #427](https://github.com/nickhaney916-lang/Closet-Current/pull/427), exact `417cdb648c743771d93b4c6b51ff30dc2bba0d9c`: separate skinned dress physical V-neck adjustment, independently tested 96 real GPU captures, still aesthetically FAIL.

Both changes were individually authored and tested on the **same PR #423 base**. Neither includes the other's import, toggle or garment call. Blind merge would overwrite the other's `research/three-d-15/{demo,showroom,outfit-controller}.mjs` edits.

## New integration behavior

Start from the **exact Work64 PR426 HEAD**, preserving the entire verified shirt fitting and image-edge/neckline code unmodified. Import the exact 3D23 `shapePhysicalDressNeckline` physical mesh algorithm from PR427, original 3D23 browser regression and adjusted integration expectations in its existing Node test. Modify only the three shared 3D15 experimental UI/controller files to wire **both separate default-on independent toggles**:

- `?necklineSeams=before`: turns off Work64 shirt neckline/photographic edge treatment **without touching dress neckline**.
- `?dressNeckline=before`: turns off PR427 dress front-neck physical treatment **without touching shirt fit**.
- Both default on for new side-by-side technical research preview; the user still must explicitly review original source JPEG vs proposed source-RGB cutout before applying either garment.
- Shirt fitting order: existing Work63 continuous surface fit → Work64 neckline seam treatment only for shirt.
- Dress fitting order: existing verified source dress → PR427 source-front-only V-shape → original Work61 edge finishing. Dress still exclusive: shirt and pants removed.
- Unverified back remains neutral, exact Work47 original JPEG/PNG source SHA and underlying 163-bone CC0 GLB SHA preserved. Do not change or repin the two anatomical bodies, source photos, recognition engine, original garment geometry UV, privacy controls or production code.

The dress change is a **modest actual skinned garment neckline displacement**, not a sewn V-neck, realistic shoulder/armhole, natural drape or positive human appearance review. The shirt remains aesthetically REVIEW and the dress aesthetically FAIL as the independently assessed candidates—combining code does not change those quality grades.

## Verification

A strict no-deploy GitHub Actions integration workflow compares against exact PR426 head, permitting ONLY the three 3D15 experimental modules, the exact imported PR427 dress algorithm, its own existing dress test/browser script, one dedicated integration contract test, this README, and the integration workflow. CI rebuilds 15 original licensed sources and 9 proposed alpha assets, restores hash-locked original male/female model GLBs from the trusted immutable Work63 Git archive, and performs both previous independent proof paths on the combined code:

1. Node geometry/privacy: exact Work64 3D22 shirt tests, 3D20 continuous fit tests, PR427 real skinned dress V-neck tests, new 3D24 combined source/interaction contracts.
2. Work64 real Chromium WebGL2 **430px both models** before/after shirt neckline, both source poses, front/three-quarter/side/back, and unchanged dress controls. Existing script's original source SHA, trusted-click, account-free storage, GPU resource stability, pointer turn and figure switching gates retained.
3. PR427 actual Chromium WebGL2 **320/390/430px both models** before/after dress neckline, both poses and four angles, with unchanged source dress print/rear, GPU resources and privacy. This test runs against the shirt-enhanced same app.
4. Label real generated screenshots and evidence as HOLD; preserve original source photo RGB and do not turn technical visual difference into human aesthetic PASS.

Older stage-specific workflows may fail their frozen strict diff guards on a **new stacked combination**, and the full camera/indexing suite was already RED independently. Report all rather than asserting all checks green. Human 15-licensed-photo visual grading and four-person live Family Alpha remain separate, on HOLD. No production/staging deployment, cloud changes, account writes, family photos, paid model usage or Drive Duel changes.

**Next work after this integration:** actual dress source-faithful shoulder/armhole shape and neck seam contact, not another unreviewed tiny V-depth increment, plus visual human grading. Privately gated four-family pilot still requires JWT/RLS, cloud save/restore and phone evidence.
