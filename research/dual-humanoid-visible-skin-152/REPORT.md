# CLOSET CURRENT — MAIN #152 / DUAL-HUMANOID-VISIBLE-SKIN-152

**Research only · Family Alpha Issue #255 HOLD · NO production/default-branch, existing staging, Supabase, Drive Duel or Delta Ebb writes, merges or deployments.**

## Why this is the next highest priority

Parallel #57 / Priority #150 has delivered verified [draft PR #706](https://github.com/nickhaney916-lang/Closet-Current/pull/706), exact HEAD `6e576da9d7ff6a0a439a7762cf333670d20f0131`, [passing research workflow #42417467795](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42417467795), **but its actual 18 screenshot native app gallery failed the independent appearance inspection**. Both female and male models show photographed dress and a narrow dark hair cap with tiny detached facial geometry, but little to no visible head/hands/foot skin. The original pinned P149 figure ([PR #704](https://github.com/nickhaney916-lang/Closet-Current/pull/704)) visibly has a complete skin-covered head/arms/feet. This is a specific source/skin regression, not a reason to start another unrelated research topic.

The parent main controller's verified P151 [draft PR #705](https://github.com/nickhaney916-lang/Closet-Current/pull/705) is at `d8f66ee67489e3a6d136f41f2c6f310054a266a5`, successful Actions #42414500134: 1,244 passing Node tests; 30 genuine source photo mobile screenshots; owner privacy and source lifecycle gates. We base main P152 there and **never edit P150's separate branch or override its priority ownership**.

## Root cause and precisely scoped fix

P150's pinned P118 `realism.mjs` wraps the native app's original `MeshStandardMaterial.onBeforeCompile` modifier. It inserts extra skin pigment and micro-grain into the existing source body shader. However, it accidentally inserts

```glsl
roughnessFactor=mix(roughnessFactor,...);
#include <roughnessmap_fragment>
```

Three.js **declares** `roughnessFactor` in `roughnessmap_fragment`. Referring to it earlier generates a fragment compile error, preventing the source mannequin's visible skinned surfaces from drawing while independently skinned dress meshes continue rendering. The original source garment is not missing; the skin shader failed.

P152 corrects only this declaration order in the **detached, SHA-pinned P541/P150 donor**, making the code effectively

```glsl
#include <roughnessmap_fragment>
roughnessFactor=mix(roughnessFactor,...);
```

The exact remaining source bytes are preserved. No stored photo, garment, selected owner, original skeletal hierarchy, rig, private data, cloud source or apparel texture is touched.

- `pinned-p118-shader-repair.mjs` refuses unpinned, duplicate or partially changed source and proves exact reversible minimal fragment-order change.
- `install-dual-humanoid-visible-skin-152.mjs` refuses any path outside the named detached `.p150-donor-541` worktree and verifies its exact original PR541 HEAD before making the source change.
- `dual-humanoid-visible-skin-152.test.mjs` checks Three.js shader declaration order and no accidental geometry/source alterations.
- Dedicated no-deploy CI tests full main Node suite and app build; assembles P150 exact source in a temporary P541 donor; renders **the same actual saved original-photo dress and the same original male/female 163-bone figures** at 320/390/430 CSS px in genuine Chromium both **before and after** the shader repair (front/side/rear). WebKit mobile model rendering is checked after the fix.
- `audit-dual-humanoid-visible-skin-152.mjs` independently inspects 36 original PNGs and SHA-256 manifests, requires all 18 same-figure/view/width source-skin head regions to visibly regain skin pixels, and verifies the outfit garment count, original 163-bone rig, face geometry count and account isolation stay unchanged.

## What this does NOT mean

A source figure whose original head and hands reappear **does not automatically become photorealistic**. Independent anatomical realism/face/hair quality, arbitrary personally photographed garment-to-mesh fitting, meaningful cloth movement, real signed two-account hosted RLS, original actual garment backside, physical Android/iPhone acceptance and all Family Alpha release criteria remain unverified. P152 fixes a specific severe blocker and produces reproducible before/after evidence; it does not invent a 10/10 human visual score.

**Visual acceptance must be audited against actual screenshot pixels and not the automated Node suite alone. Actual CI verification and final SHA must be independently checked before calling the research fix PASS. Family Alpha HOLD, unmerged, undeployed.**
