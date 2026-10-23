# Assignment 229: token-free 3D humanoid validation

## Scope and status

Research-only branch based on draft PR #228 (commit d950673497a7d912f5f16dfd723f798790eafe83). Nothing is imported into the customer app or enabled in production. No deployment, merge, paid inference, Cloudflare/Supabase changes, customer photos or Drive Duel modifications.

PR #220 owns the guarded 2D Outfit Builder and source-account isolation; its newer changes are NOT inherited by this older research branch. PR #224 owns the recognition license/mask-quality gate and still requires review. PR #226 only restructures recognition CI; no renderer overlap. PR #228's own branch remains unchanged.

## Implemented

- Humanoid body: locally authored ellipsoid/tapered 3D anatomical-proxy shapes, separated head/neck/arms/legs/hands/torso and 3 clothing shells for sweaters/jackets/coats plus dress and shoes. No skeleton or physical measurement system.
- WebGL display: smoothly shaded 3D surfaces with camera yaw rotation, separate optional layers, depth test, 1200-pixel maximum canvas resolution, and fallback when GPU unavailable. Drag, angle range, buttons.
- Owner-scoped saved-board bridge: uses the existing outfit board slot names top, bottom, layer, layer2, layer3 and shoes. Accepts only owner-matched approved original raster photo records with source IDs. Rejects duplicate garment IDs, duplicate (source ID,crop identity) inside one outfit, blank/missing or malformed photos, incompatible categories, and cross-account records. Source fingerprints also cover source image bytes and color/pattern metadata. Saved snapshot excludes raw photos. On reload, a replaced original invalidates the old snapshot, including when the cropped display preview is unchanged.
- Synthetic-only interactive demo: 3 distinct actual wardrobe combinations when possible, pin, one piece swap, style new top from preexisting synthetic wardrobe, save/restore, account switch, and visible original-photo comparison. No customer wardrobe is connected. SessionStorage only persists a synthetic owner-scoped IDs/fingerprints snapshot.
- Node/Chromium/WebKit QA at 320/390/430 mobile viewports.

Fidelity caveat: the 3D garment is a SOLID COLOR geometric proxy from metadata. The unaltered original PHOTO reference retains true visible stripes/checks/colors/pattern pixels, but they are NOT reconstructed into the 3D surface. The actual unseen garment backside, sleeve detail, physical fit, drape, and human likeness are unknown. No production-ready photorealistic avatar has been built. Data URI header screening cannot prove a photo is sharp or nonblank; integrate original-photo decoded-pixel screening and human review before any live rollout. A provided account ID is not authentication; future hosting must establish actual Supabase Auth and current owner-bound storage before using this read-only adapter.

## Commercial-compatible tools investigated (no assets downloaded)

- Three.js: MIT license, commercially permissive with preservation of notice. https://threejs.org/license/
- Babylon.js: Apache 2.0, include applicable licenses/notices and inspect dependencies. https://github.com/BabylonJS/Babylon.js
- MakeHuman: official bundled character exports may be CC0; separately downloaded community assets can carry different restrictions and require file-level license audits. https://www.makehumancommunity.org/makehuman/faq/can_i_sell_models_created_with_makehuman.html
- SMPL-X: standard research-model/data license excludes commercial use; separate commercial agreement required. DO NOT import the research model into a business. https://smpl-x.is.tue.mpg.de/modellicense.html
- OOTDiffusion try-on: licensing of code/models/weights/dataset is unsuitable or unresolved for commercial use as distributed; no download/activation. https://github.com/levihsu/OOTDiffusion

None of these third-party engines, weights, photos or meshes was added by this branch. A permissive rendering engine license is not a commercial cloth-fitting license.

## No-token compute analysis

Client-side WebGL costs Closet Current $0 in per-image AI fees and $0 in server inference GPUs for this lab. User-device energy, graphics resources and ordinary hosting/data bandwidth are not free. A future self-hosted licensed model, if ever approved, entails GPU rental, storage, bandwidth, operations, compliance and output review. Example public price as of August-October 2026 for RTX 4090 Runpod pods: from $0.34/hour Community or $0.74/hour Secure, location and availability dependent: https://www.runpod.io/gpu-models/rtx-4090 . A GPU running 720 hours at $0.74/hour would be roughly $532.80 in compute charges, excluding storage/taxes/network; ten active hours roughly $7.40. These are illustrative budgeting examples, not committed expenses. https://www.runpod.io/pricing

## Independent release hold points

1. Merge neither this branch nor PR #228 automatically. Main Closet Current conversation owns decisions.
2. Review exact reusable figure/garment rights and independently verify body/garment mesh licensing before exposing it to customers.
3. Test 20+ real, legally usable non-customer original clothing images with independently reviewed masks including seams, logos, lace, dark/white fabric, dresses, skirts and shoes.
4. Check chromatic pixel fidelity against originals, side/back abstention, fabric texture/prints, non-overlap, and anchor correctness; if unverified keep existing 2D.
5. Test real accounts A and B with Auth/RLS, storage, browser cache isolation and revocation. No cross-account requests.
6. Verify physical Android Chrome and iPhone Safari, including GPU context loss, thermal/60s rotation, 320/390/430 layout and offline photo recovery. Emulated CI is NOT physical hardware proof.
7. Record measured cold-load, frame-time p50/p95, GPU memory, fallback rendering and actual energy, not inferred FPS.

No paid API keys, tokens, weights, cloud security mutations or customer artifacts are involved.
