# Parallel Chat — Mobile 3D-08: hash-verified model loading / bounded memory (HOLD)

**Starting point:** pinned Work58 / PR405 3D-09 integrated rig/head
\`7d05929a1a06d80d04a4ea000c419d30761c3c8c\`. Relevant historical
anatomical source PR396, real source-garment PR397 and separate shell PR400.
This is NOT the garment-building Work56 3D-08 assignment.

## The actual change

The existing \`research/three-d-09/index.html\` is a true baseline. The new
\`research/three-d-mobile-08/index.html\` displays the **same exact Work58
showroom and real licensed shirt** through one research-only boot module.
No existing showroom, fitting, skeleton, body model, garment pixel, account,
original photograph, privacy or production source is edited.

\`verified-model-cache.mjs\` narrowly intercepts only these two same-origin
GLTFLoader \`loadAsync\` URLs:

- male \`male-cc0-rigged.glb\` SHA-256
  \`d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8\`
- female \`female-cc0-rigged.glb\` SHA-256
  \`a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1\`

These are the original MakeHuman-derived CC0 human GLBs, no new models.
Browser checks the **full exact SHA** before GLTF parsing, validates binary
header, accepts only same-origin recognized paths and denies redirects.
Two buffers are held in a bounded session memory cache (~9MB); concurrent
requests for the same model coalesce. Failed/corrupt responses are never
cached. The parsed GLTF is **new on every display**, and old GPU meshes,
skeletons and materials are disposed by the **unchanged** Work58 loader.
No GPU scene/model, garment textures, wardrobe account data, JPEG or source
cutout is cached. Byte cache is cleared on pagehide or explicit disposal.

**Why this architecture:** retaining both loaded 163-bone figures would make
switches faster but doubles GPU mesh/bone storage and risks stale garments.
This design eliminates repeated model downloads while preserving the
one-displayed-body memory footprint and existing photo reacknowledgment.
GLTF reparse remains necessary, and may dominate switch latency. We do
not claim physical-phone FPS improvements from the request reduction.

## Functioning tests and evidence

Run inside isolated, no-deploy CI or a development checkout:

\`\`\`sh
npm install --no-save --no-package-lock --no-audit --no-fund three@0.180.0 playwright@1.56.1 sharp@0.34.3
node research/three-d-06/fetch-licensed-avatars.mjs
# Existing original Work47 licensed benchmark must have been built
node --test tests/three-d-mobile-08-cache.test.mjs
node scripts/test-three-d-mobile-08-browser.mjs
\`\`\`

CI builds the licensed benchmark from exact pinned historical commits and
checks source JPG/transparent PNG identity using original Work58 source tests.
The paired baseline and optimized WebGL tests visit mobile emulated
320×568, 390×844, 430×932 Chromium/SwiftShader. They measure:

- Actual GLB requests (unmodified baseline versus verified-cache preview);
  first load and six repeated male/female switches.
- Wall switching latency and each actual \`work58Diagnostics().loadMs\`;
  report raw samples, not synthetic FPS.
- Geometries/textures after each switch, 163 skeleton bones, original
  109,064-triangle anatomical source and source-side GPU disposal.
- Real front, side and back GPU screenshots at each width;
  render changes, tab background/return, touch rotation and two-finger zoom.
- SHA-256 refusal/retry, an aborted first male GLB transfer followed by
  successful re-download, exact two models, no unexpected outside requests.
- Playwright **WebKit** 390px mobile browser attempt (if container supports
  WebGL); a blocked software WebGL is explicitly recorded, never labeled
  real iPhone Safari or native GPU performance.

Run evidence in \`benchmark/three-d-mobile-08/results-HOLD.json\` plus
per-model baseline/cache screenshots. The dedicated workflow artifact
is labeled \`CHAT-MOBILE-3D08-CACHE-MOBILE-BASELINE-COMPARISON-HOLD\`.

## Risks, integration recommendation

The stand-alone bridge deliberately changes no existing 3D09 model handling.
The original Work58 preview can briefly leave controls enabled following
a GLB fetch failure; main-thread **PR409** owns the separate verified
original-photo fallback and disabled controls. Do not duplicate that code
or enable this module for Family Alpha until it is integrated against the
latest main-thread 3D10/11 candidate and retested.

The same caching module could later be adopted by that preview by
installing it before the original GLTFLoader creates a model. Test source
identity, GLTF file path, context recovery and rollback; only then decide
whether retaining two source byte buffers is worth ~9MB on lower-memory
phones. Do not prewarm both on startup, persist binaries, weaken hashes or
keep both live skeletal GLTFs on GPU.

**Family Alpha 3D HOLD:** real Safari/iOS and Android phones, mobile memory
and native FPS, privacy/RLS and actual garment realism remain outside this
isolated proof. NO MERGE / NO DEPLOY / NO COST / NO CUSTOMER DATA.
