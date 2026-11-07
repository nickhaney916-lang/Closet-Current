# Closet Current — Main Priority #131 — DUAL-HUMANOID-FACE-DEFINITION-131

**Research only · Family Alpha #255 HOLD · No production/staging modification, merge, or deploy.**

## Scope and baseline

- Main development parent: verified [Priority #130 PR #684](https://github.com/nickhaney916-lang/Closet-Current/pull/684), exact SHA `5ce8f51ebbf65d275197a21bdaa7818801b4b49b`, [3/3 green dedicated CI](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42336025270), 1,161/1,161 Node, 8/8 isolated real Postgres RLS, 6/6 app browser, 93 screenshots.
- Real 3D technical donor: original license-verified CC0 163-bone female/male P541 SHA `df6885d6011cb33fb22dceb81a08f35a0ac4dd61`. **Do not alter the source rig, GLB, 3D garment geometry, original photograph bytes or SHA receipt.**
- Separate P118 [PR #674](https://github.com/nickhaney916-lang/Closet-Current/pull/674) pinned to research overlay commit `672247f7121e92bba32b81cec74efddb2b69c817`: demonstrable warmer skin tone and procedural hair for both figures. P118 is a separate branch and is **not merged or modified** by P131.
- Parallel #49 owns broader male/female photorealism improvements; #51 owns research-gated signed-owner cloud integration. P131 is a separate **main-controller complementary research refinement** focused on missing face definition and independent real mobile WebGL acceptance.

## Visible problem and actual improvement

The original CC0 figures have anatomically rigged mesh bodies but mannequin-like facial presentation. P118 adds warm skin and scalp/hair overlays, but does not create independently controllable eyes, irises, pupils, eyelid rims or brows.

P131 implements a second **query-opt-in** `face131=after` layer on the actual P541 donor with P118 enabled, affecting both female and male figures:

- Sample actual deformed, skinned body vertices in world space to infer top/head bounds and each eye's closest front-facing **skin surface**, rather than using hard-coded free-floating mannequin coordinates. Exclude every source garment mesh and P118 hair mesh from anatomical measurements.
- Add restrained physically based geometric eyes, tiny irises/pupils/highlights, skin-tone upper and lower eyelid rims and eyebrows with differing licensed/procedural pigments for female and male.
- Rigidly attach new detail as a child of the **existing real head bone**, so it follows native head movement without replacing or adding bones. Preserve the original 163-bone skeleton and every source photograph/UV/geometry.
- Reject missing skinned source, missing actual head bone, unsafe or unmeasurable source vertices, unsupported figures, accidental duplicate overlay or non-163-bone source.
- Keep eye/body source textures and facial identities private: no user face photo, biometric identity modeling, remote libraries, external image requests, new credentials or source garment reclassification.

This is a small procedural facial-definition experiment, **not a claim of photorealistic face reconstruction**. It does not change anatomy topology, natural hair dynamics, eyes expression animation or body realism enough to claim 10/10.

## Genuine tests

New `tests/dual-humanoid-face-definition-131.test.mjs` exercises actual Three.js skinned transforms and an isolated license-safe 163-bone fixture for both figures. Checks two surface-derived eye anchors, exactly 14 new facial-detail meshes for each figure, eye/brow attachment to actual head bone, following the source head pose, unchanged original source vertices/material/skeleton, failed nonhuman/duplicate/unverifiable model, and no cloud/privacy/photo access.

For **real donor visual acceptance**, CI fetches the P541 donor and the exact P118 research overlay through pinned commit IDs into a **disposable detached Git worktree**. The main repository does not import or merge the P118 branch. It builds the donor's original source material, applies the P118 renderer only within the worktree, then applies FACE131 exclusively in that worktree.

New `scripts/prepare-dual-humanoid-face-131-webgl-test.mjs` derives the validated P118 Playwright/WebGL harness from the exact pinned P118 research test without silently omitting existing source checks. It renders the real authenticated donor source-garment demo in both modes (P118-only before vs P118+FACE131 after), 2 figures, six real camera angles (front, left, right, back, and two three-quarter), viewport widths 320/390/430 CSS pixels, **all 72 Chromium before/after screenshots required**. WebKit is **a bounded 24-frame after-only smoke** (two figures × three mobile widths × front/left/right/rear) when its actual WebGL engine supports rendering; the full WebKit 72-frame A/B matrix is expressly NOT claimed, with real PNGs and SHA hashes, 163-bone diagnostics, fixed original shirt/denim hashes, no external requests, no JS errors or browser crashes, real pixel-diff evidence, before/after contact sheets and scorecard with human ratings pending.

**The browser matrix is a detached research demonstration**, not live Closet Current app user-photo fitting or physical Android/iPhone testing.

## Release and evidence boundaries

P131 will be complete at the research-engineering level **only after exact-head CI confirms green full Node tests, genuine mobile-size WebGL screenshot evidence and original-source invariance**. Realistic appearance must then be judged by independent reviewers; no automated score can honestly establish 10/10 photorealism.

No person-specific face reconstruction, live signed accounts, 3D photo garment breakthrough or independent clinical/anatomical accuracy certification is claimed. Procedural eye and lid geometry is not a human eye tissue simulation.

**Exact-head status: PENDING until successful CI.** Draft only, Family Alpha Issue #255 HOLD, production/existing staging untouched, main branch unchanged.
