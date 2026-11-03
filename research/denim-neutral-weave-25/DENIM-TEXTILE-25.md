# DENIM-TEXTILE-25 — Modeled original-source neutral side/rear textile (research DRAFT/HOLD)

## Mission
Build a more fabric-like view on the *unphotographed* sides and rear of the two SHA-verified genuine 3D denim examples. DO NOT invent back pockets, photographer-observed yarn texture, a rear photograph or any previously unseen visual source truth. The material effect is a clearly modeled/procedural textile, not a new source photograph. Main development track only; Parallel #13 owns original-photo indexing and Parallel #14 owns saved wardrobe-to-3D outfit integration. Never edit those branches.

## Actual research implementation
- Exact fully visually verified parent MOBILE-24 PR #538 SHA `04d5850a332276a424f6957fe11717e94429d47d`, itself based on successfully QA'd P23 true photographed jeans.
- One new `source-neutral-weave-25.mjs` wrapper changes ONLY the shader of the existing skinned, exact-source-projected pants MeshStandardMaterial; no new photo assets, geometry, texture maps, UV/rest attributes, scene lights, meshes, materials or screenshot alteration. Original 3D30 photo sampling stays untouched. It installs ONLY when both P23 and explicit `?denimWeave25=after` are opted in on the synthetic localhost research viewer.
- Two crossing low-amplitude spatial twill terms use the original existing rest UV coordinates as a modeling coordinate (NOT a reconstructed photographed back); derivative antialiasing `fwidth` prevents aggressive phone moire; modeled tonal variation <=11% of underlying source-neutral RGB, physically measured original side/back weave = **NO**.
- The existing *actual* P23 `sourceNeutralUnphotographed23 = 1.0 - smoothstep(0.01,0.10,sourcePantsOpacity)` is multiplied into every modeled textile contribution. A photographed original front region with source opacity >=10% therefore receives **zero** modeled weave. If P23 source mask, authenticated original IDs, SHA/cutout or owned original shader is absent, opt-in fails closed.
- Exact authored source front JPEG/alpha, actual verified source SHA and cutout SHA, vertex UV/rest/skin and 163-bone actual body geometry remain unchanged. No new body contacts should appear since no mesh vertices move.
- Real live diagnostics distinguish P23 baseline vs P25 opt-in, whether the actual skinned denim shader compiled, and whether source-photo/rear-neutral protections remain active.

## Acceptance and limitations
- Unit regression for both licensed source IDs, rejection of unverified IDs/owners/SHAs, no double injection, preservation of P23 shader and no new source textures or network.
- Dedicated no-deploy GitHub Actions build original verified JPEG source fixtures, restore exact CC0 approved 163-bone female/male GLBs, then run real Chromium mobile WebGL. 3 width (320/390/430) × 2 true rigs × 2 original denim SHA sources × 4 views (0/90/135/180) × 2 modes (P24 baseline / P25 modeled neutral textile) = **96 actual PNG screenshots / 48 matched pairs**.
- Each side/rear pair must have >=20 genuinely changed source-blue denim pixels (not the mannequin or background), at least 80% original blue denim retention, source-original SHA and no new BVH contact. Front-view before/after blue change must remain <=55% of baseline to fail visibly destructive source photo changes; exact shader mask ensures photographed regions have zero modeled weave. Every screenshot saved before assertions, even on failure.
- Human inspect the actual 96 genuine PNGs and measured pixel results before claiming research technical success. 3D material front remains photographer original; rear is NOT the photographer original, and new modeled yarn pattern is an approximation only.
- No claim of physically accurate source fiber, 10/10 human realism, captured 360° photo, physical Android/iPhone QA, production deployment or Family Alpha release.
- PR remains DRAFT/UNMERGED with Family Alpha #255 HOLD. Do not modify INDEX-01/02/03, OUTFIT-3D-01, production, Drive Duel or Delta Ebb.
