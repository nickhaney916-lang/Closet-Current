# Closet Current — Family Alpha #13: Original-photo garment preparation and 2D overlay QA

**October 23, 2026.** New isolated branch `qa/family-alpha-photo-isolation-assignment13-20261023` based on main `54c9e29ede069a05d1268e003f80cbda043c7d6a`. **NO MERGE / NO DEPLOY / NO PRODUCTION CODE ALTERED.**

## Scope and coordination

Reviewed Family Alpha issue #255, current main, PR #256 latest reviewed commit `3438e23ce68133cc43d5a03dd52f95aad8ca4f1e`, main mask engine, crop engine, photo-import, recognition-photo input, current Outfit Builder, and active parallel recognition #234/#249/#252, avatar #231/#245/#246/#247/#248/#250/#251, cloud/provenance #233/#235/#236, mobile #254 and 2D main #256. Account security belongs to Work #12. **PR #256 remains untouched.** The QA branch copies only its exact, Git-blob-pinned *read-only reference* `family-alpha-2d-layer-plan.mjs` and `family-alpha-2d-photo-renderer.mjs` to `research/family-alpha-13/reference/` for browser interoperability. Neither is installed into or imported by the production application.

PR #256 renders already-masked, preloaded `HTMLImageElement` clothing and orders layers but DOES NOT produce transparent garment images, verify photo ownership or integrate with saved closets. This separate assignment focuses on the missing source-to-transparent-derivative step and records fitting limitations.

## Implemented isolated photo preparation

`research/family-alpha-13/garment-photo-preparation.mjs`:

1. Accepts an already decoded, RGBA **app-retained original image**, bounded to 8 million pixels. Never alters or resizes the input, saved photo or original file.
2. `hashRetainedOriginalJPEG` SHA-256 fingerprints the validated base64 JPEG **byte stream**; `prepareVerifiedOriginalDerivative` refuses a changed, missing or mismatched expected original SHA. This binds a derivative to the saved JPEG bytes, **not** to native camera bytes or a Supabase Auth identity. The caller must verify the image was actually decoded from that same JPEG and belongs to the current authenticated user; an arbitrary `sourceVersion` is not sufficient.
3. For **near-uniform photographed backgrounds only**, estimates a background from four consistent corners and image-border samples. Forms an automatically isolated foreground, filters tiny components and keeps either one major connected garment or the two components of a recognizable shoe pair. Rejects blank, low coverage, hard-clipped, background-ambiguous, noisy or multiple unrelated garments. Never silently substitutes a solid-color sprite for a real photo. Real/complex scene segmentation remains with the upstream garment isolation worker.
4. Supports an **upstream supplied instance mask** (strict size/values). It is a presentation mask only; source ownership, category inference and mask-to-original geometry must be independently verified by integration. This can preserve pale/white fabric on pale backgrounds when a verified mask exists.
5. Outputs an **uncompressed native-resolution RGBA** derivative with zero-alpha background, original RGB pixel values for every retained garment pixel, conservative padding and exact crop bounds. Browser export to **lossless PNG** retains alpha and source-derived patterns/details. No JPEG re-encoding of the original, quality slider, sharpening, resizing, persistent storage write, paid API, or remote network call.
6. `containGarmentInSlot` calculates aspect-preserving geometry against the actual normalized slot contract from PR #256. It DOES NOT alter the PR #256 renderer, claim garment body fit, estimate true fabric drape, clip proper sleeves or verify hidden surfaces. The current PR #256 renderer explicitly uses `objectFit:'fill'`; our tests detect **three stretched garment overlays among four** on the current 4-layer synthetic look. Main avatar owner should consider a verified `contain` placement/slot crop adapter after testing.

**Two negative boundaries:** any `status:'review'` result includes no presentation image; any `status:'prepared'` result carries `verifiedOwner:false`, `autoSaved:false`, and `requiresOwnerVerification:true`. Even a correct SHA does NOT establish account isolation.

## Synthetic test corpus and verified QA

`research/family-alpha-13/synthetic-garments.mjs` generates seven shapes **Tops/Shirt, Bottoms/Pants, Shorts, Skirt, Dresses, Outerwear/Jacket, Shoes** with alternating red/green pixel-defined stripes and contrasting background. These are deliberately clean computer-generated images; no licensed, real or customer photographs and no AI generation/inference.

`tests/family-alpha-13-garment-prep.test.mjs`: strict source RGB/pattern/pixel invariance, transparent bounding backgrounds, paired shoe isolation, native 1200×1600 RGB detail retention, explicit crop/mask checks, externally provided white-cloth masks, source JPEG SHA parent identity/version changes, invalid/base64/corrupt images, duplicate/multiple-object masks, corner/edge clipping, rejected complex backgrounds, and PR #256 slot order/dress/duplicate/scale geometry. Runs alongside full root Node suite.

`scripts/test-family-alpha-13-mobile.mjs`: browser-generated real 256×320 **synthetic JPEG** → native browser decode → original JPEG SHA-256 verification → transparent pixel-accurate **PNG** → actual pinned PR #256 research renderer. Chromium and WebKit at 320, 390, and 430 CSS px, verifies seven garment images per browser; original JPEG not changed; pattern/source-pixel preservation; four garment overlay layers with optional jacket, dress+shoes fallback, safe missing-image refusal, aspect-preserving research geometry, actual distortion count of current renderer, no horizontal overflow/errors/external requests. **This is headless mobile-size browser emulation, not physical phone testing.**

`.github/workflows/family-alpha-13-photo-prep-no-deploy.yml` locks all `public/`, `supabase/`, `benchmark/` paths identical to main; limits file modifications to this research/tests/docs/workflow; additionally checks Git blob hashes **85781889229b325a70ac60e4c85e0b9ced6119b9** (PR #256 layer plan) and **837d45cc8970f71830df991e8feec437918a457a** (PR #256 renderer), builds unchanged application, runs all Node regression tests, and runs six Chromium/WebKit viewport cases. CI is strictly **NO DEPLOY** and outputs synthetic-only QA markers.

## Fitting recommendations for main renderer (nonbinding)

- **Shirts, long sleeves and sweaters:** preserve full garment aspect ratio, sleeve edges and shirt hem; do not stretch front-facing image to a tall layer rectangle. Accurate anchor points need a future garment type-specific detector.
- **Pants, shorts and skirts:** maintain waist alignment and visibly different lower silhouettes. Current generic normalized `bottom` slot covers them all; heights and skirt drape remain estimates.
- **Dresses:** use dress slot only, remove/conflict top, pants and outer layers as defined by the existing PR #256 planner. Preserve original dress hem and avoid crop clipping.
- **Shoes:** keep both disconnected shoe elements from a single verified original and use a shoes-specific placement area. No side-view geometry is invented.
- **Outerwear and multiple layers:** use independent jacket/coat overlays, draw back-to-front in PR #256's known order, ensure crop excludes large background patches, handle realistic sleeve occlusion only after independent real-photo masking is evaluated.
- **Rendering:** use lossless PNG derivatives and `contain`-style sizing so the full photographed silhouette and pattern remain recognizably intact; never claim 3D fit or physically modeled drape. Plan precise body anchor/clip and layering design with the main avatar owner, not this parallel branch.

## Limitations, HOLD / next steps

1. **Real-scene automatic segmentation not solved** here. The background estimator works only for simple nearly uniform backgrounds, and rejects photo interiors/corners that look complex. Busy homes, hanging garments against multicolored walls, people in whole-outfit photos, similarly colored garments/backgrounds, patterned backgrounds and occluded clothes need existing model-assisted masks and human-reviewed failure fallbacks; no real-photo accuracy, precision, recall or mask-IoU claims.
2. Hard 0/255 transparency at foreground edge can produce visible aliasing, color halo or lost bright fabric in real photos. No true alpha matting, occluded geometry repair, arm/waist/shoulder landmark detection or texture warping. The original photograph remains available to recover lost details.
3. SHA comparison authenticates **bytes only**. Real Auth user, Supabase row and photo storage owner, correct decoded-JPEG-to-source correspondence, cloud restoration, original capture version and user permissions remain Work #12 / main integration responsibilities. Do not activate this for customer records until these contracts are verified.
4. Current pinned PR #256 `objectFit:'fill'` stretches **three of four** synthetic layered garment images. The research `containGarmentInSlot` math preserves proportions but is NOT currently installed in that renderer. Fitting position/order and synthetic photo quality do not prove real clothing fit on a body.
5. Actual iOS/Android camera quality, app memory/thermal usage, service-worker caching, tactile controls, physical-device performance, avatar outfit swap, three distinct saved owned outfits and end-to-end multi-account testing remain unverified.
6. Do not merge, deploy, touch production/Cloudflare/Supabase, access customer photos, activate paid AI, spend money or modify Drive Duel. Main Closet Current conversation controls all integration and Family Alpha v0.1 release decisions.

**Disposition:** isolated reusable research preparation adapter + synthetic regression suite. **NOT Family Alpha-ready.**
