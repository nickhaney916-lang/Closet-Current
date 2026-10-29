# Closet Current — 3D-14: original photographed dress on a separate skinned A-line garment (HOLD)

**Independent main-thread priority, October 29, 2026.** [Work60 PR #414](https://github.com/nickhaney916-lang/Closet-Current/pull/414) owns real anatomical neutral pants. The user directed focus on real 3D clothing and reuse of the verified 2D recognition/cutout pipeline. This separate development candidate handles the **dress** rather than duplicating Work60 pants, Work59 shirt drape, Work57 anatomy QA, PR410 model cache or PR411 photographic fallback.

**Exact parent** Work59 [PR #408](https://github.com/nickhaney916-lang/Closet-Current/pull/408) at `d09786163eb52a4a0fa05a5ffc546fc171896080`, with verified male and female commercial-reusable CC0 GLBs, 163 original rig bones, original reviewed shirt and relaxed pose. All new files only; no edits of predecessors, original pixels, customer data, account code, staging, production or Drive Duel.

## Real source and separate 3D garment

- Source: existing Work47 locked licensed `commons-0053` dress with provisional transparent original-RGB cutout. Both the source JPEG and PNG bytes must match the Work47 frozen source SHA-256 manifest and the licensed photo ledger. Existing `loadLicensedCutout` integrity checks, source identification, alpha bounds and explicitly checked user review apply. Work53 fine isolation is **not altered**.
- Creates one **new genuinely separate `THREE.SkinnedMesh`** with a fitted upper bodice and continuous A-line skirt. Nine continuous circumferential rings and 64 segments; waist and neck located from the actual 163-bone anatomical skeleton and local waist body envelope. Mesh is skinned to the **same exact original skeletal bones, bind matrix and 4 normalized bone weights** as the humanoid; no new skeleton or flat 2D image card.
- The exact decoded source photograph and transparent cutout enter a local SRGB texture, sampled only on the frontal fabric panel in the shader. An explicitly declared median original-RGB material colors the inferred lateral/rear fabric; **no synthetic pockets, fake photographed back, new mask or invented body photo**.
- Female and male CC0 research models can wear the same sample; source/relaxed poses, true orbit rotation and front/¾/side/back. Source cutout stays identity-bound and a body change clears the dress and its review.
- A generous but schematic hem flare establishes separate lower-body clothing topology. This is **not** a fitted customer's dress, cloth physics, realistic sleeve/strap reconstruction or validated collision clearance. It will need manual visual judgment; original 15-photo appearance baseline still **0 PASS / 5 REVIEW / 10 FAIL**, and no new PASS can be inferred from a GPU test.

## Local preview

`research/three-d-14/index.html` shows original licensed JPEG and actual provisional transparent PNG side by side, with a review checkbox OFF by default and a disabled Apply button. The wearer is a neutral monotone anatomical mannequin until an explicit trusted research click; removing review, clearing, or switching male/female releases the dress mesh and never auto-approves a source.

To prepare on a local development machine (not staging/production):

```sh
npm install --no-save --no-package-lock --no-audit --no-fund sharp@0.34.3 three@0.180.0 playwright@1.56.1
node scripts/build-work47-benchmark.mjs
node research/three-d-14/cc0-pinned-download.mjs
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/research/three-d-14/index.html`.

## Independent no-deploy verification

Dedicated PR-triggered workflow changes only the eight new research, test and CI files. Builds the locked Work47 15-photo benchmark from exact historical source pins and downloads both exact-hash CC0 bodies through the provider-owned `files.innerscene.com` distribution host; tests source refusal (wrong ID, wrong type, unreviewed, invalid alpha crop), flare geometry, skeleton binding, front-only original RGB and no cloud. Genuine Chromium software-WebGL2 browser journeys at 320/390/430 verify both anatomically distinct adult bodies, visible original source image changing the framebuffer, full 3D camera rotation, real shared skeleton, source/relaxed pose, independence on model switch and removal, no external runtime network and screenshot artifacts.

**Not Family Alpha-ready:** these are research images on source-licensed stock dress and adult generic mannequin, not user wardrobe outfits. Separate QA grade, real Android/iPhone and live JWT/RLS and cloud save/restore, all prior source security gates and owner signoff are required before inviting four people. No merges, deployments, paid AI services, customer photos, account/Cloudflare/Supabase/Resend changes, private image uploads or Drive Duel changes.

## Live source-host redirect observed, retained exact-hash protection

The first no-deploy CI rebuilt the licensed images but failed closed on the older 3D-06 script's overly narrow final-URL host check. The original `www.innerscene.com/api/library/.../download` endpoint currently redirects to `https://files.innerscene.com/library/<exact-original-slug>/<version>/<model>.glb` (same published model provider). We do **not** edit 3D-06 or weaken a general URL rule. A new 3D-14-only acquisition helper accepts HTTPS from **only** the two exact provider hosts, under the exact source-specific `/library/<locked-model-slug>/...` path and `.glb` suffix, enforces maximum size and both previously pinned SHA-256 hashes, verifies real GLB skeleton geometry, and refuses any different bytes/host/path. The browser still issues zero external requests. This is not permission to substitute, redistribute or modify an unverified model.

## Actual screenshot-driven geometry defect and fix

The first full WebGL2 3D14 run **passed all functional tests**, but reviewing the real female 430px screenshot exposed a large gray anatomical torso **penetrating through the black dress bodice** (human visual FAIL). Source photo and cutout were not the problem; original ring depth was guessed from waist width. `fitDressEnvelope` now samples the actual original body geometry in source pose at each dress ring, computes separate positive/front and negative/rear depth requirements at the sampled torso offsets (with a bounded 35mm ease), retains an intentionally open neckline, and expands only the affected front/rear envelope. It does not expand the entire body symmetrically or pretend this is a collision solver. A synthetic source-geometry regression now requires chest/abdomen depth coverage. The real GPU screenshot must still be inspected independently and remains HOLD even with passing tests.

## Correct photo-facing normals — actual screenshot finding

After anatomical bodice clearance removed gray breast/abdomen breakthrough, the second real WebGL screenshot showed a **plain black garment with no licensed source's small white chest logo**. The dress ring triangles were wound inward, so `vDressNormal.z` (used to permit photo only on the real front) was negative; the source photo never contributed despite a GPU upload. Reverse triangle indices to outward-facing orientation, preserving the original JPEG/PNG, source color and actual bone binding. The browser now checks real visible light-colored source-print pixels on a dark front bodice and rejects another source-photo-free solid black dress. This remains an experiment, not an appearance PASS.
