# Closet Current — Original collar finish + responsive native-clarity figures

October 19, 2026. Main chat, isolated draft stacked on verified [PR #55](https://github.com/nickhaney916-lang/Closet-Current/pull/55). Preserve the existing in-app 160×297 avatars; high-res models are **development candidates awaiting independent commercial-art and legal review**.

## Target 1 — substantive collar art without image hallucination

The shirt's raw derived upper front edge still reads like a bare geometric cut. The Blender source scene now optionally adds a *thin original neutral-tone front collar binding*, following **only verified boundary edges of the generated front neutral shell**, rather than bridging the neck or fabric gaps. It uses a 0.00115-scene-unit curve bevel, no external fabric texture, no new source model or paid image generation. The candidate's shell/base source remains separate and unchanged. Each scene records number of actually selected front trim segments, radius, and explicit `unreviewedOriginalArt:true`. The selector ignores edges wider than 0.045 scene units and disconnected/unverified contours. This does **not** create properly engineered garment collars or sleeves: independent appearance review is still necessary, and a worse image must not be adopted simply because scene tests pass.

## Target 2 — phone/tablet clarity without unnecessary download weight

Existing native original Blender figure masters: **1941×3597 PNG** (roughly 3.3 MB each). Existing mobile lossless WebP at 970×1798 (roughly 271 KB each) and minimum 1294×2398 PNG (roughly 795 KB each). The new derived tiers are:
- 647×1199 lossless WebP for a 270 CSS px view up to DPR 2 (~135 KB for previous figures in a local baseline, actual renewed source must be remeasured).
- 970×1798 existing lossless WebP for DPR 3 at 270 CSS px (no change to the source).
- 1294×2398 lossless WebP for larger zoomed screens (expected roughly 480 KB for prior figures; verify final new file bytes).
- 1941×3597 untouched original native master for screens/zoom requiring more pixels; retains editable original .blend scene and full-size PNGs.

No lossy compression or blurring: each new WebP tier has to decode with **identical alpha and RGB on every visible pixel** compared with the correctly resized source master, preserve the pinned sRGB profile and clear image borders, and show smaller file size than the previous same-purpose choice. Transparent RGB under completely invisible pixels may be normalized by the WebP format; these do not contribute to visual appearance and are intentionally excluded from visible RGB equivalence.

`responsive-asset-policy.mjs` selects the smallest available tier satisfying `cssWidth × DPR × cssZoom`; the browser test checks **both female/male, Chromium Android and WebKit iPhone, DPR 1/2/3 and zoom 1/2**, with 24 fully decoded figure displays, unchanged canonical stage geometry and no external requests. The test reports total selected-vs-master byte budget over its 24 controlled cases (a theoretical transfer-size comparison, **not measured real-device download latency**). Full-size masters remain available for detailed review.

## Ground rules / blockers

- Don't silently replace `public/ai-models/female-preview.webp` or `male-preview.webp` because the newer character art **still lacks independent production appearance/rights approval**.
- Original high-res **user clothing photo** stays the source of classification/indexing before cutout. No model photos, camera code, database, selfies or clothing source changed.
- 3D collar detail does not solve sleeve hems, skin/face/hair, actual body-part occlusion, physical fitting, independent garment masks, credible cloth physics, photo fidelity or vendor parity. Real customer photos are not uploaded.
- Performance evidence is decode, required native sampling and encoded byte counts—not a claim of real physical-phone FPS, network latency or user-perceived speed.
- No merge, deploy, paid AI inference, new cost, asset purchase or Drive Duel changes. CI can pass while both assets remain **0/2 approved**.
