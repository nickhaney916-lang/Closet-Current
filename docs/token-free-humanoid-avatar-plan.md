# Token-free humanoid Outfit Builder — implementation gate

Status: research/design only. No customer-facing feature flag enabled. No paid AI, external inference, deployments, or production changes.

## Product contract
- Build on the existing 2D Outfit Builder; preserve its three outfit recommendations, pin, one-item swap, save/restore and style-new-with-existing workflows.
- Use the account's saved garment **original photo and immutable source identity**. A crop is only a visual derivative; never replace the original as the recognition source.
- Avatar rendering must not silently alter fabric color, print, logos, sleeve/hem geometry or garment identity. If confidence is low, display the existing original-photo 2D view rather than a fabricated photorealistic result.
- No customer photo leaves the user's authorized app storage for third-party model inference. Account isolation applies to every intermediate asset and cache key.
- No per-token, per-image or third-party paid API dependency. Open-source model weights must be vetted for commercial use; avoid asserting that a model is free to host or redistributable until licenses are checked.

## Staged implementation
1. **Baseline**: record current avatar/outfit renderer behavior, original-photo fidelity, latency and memory at 320/390/430px, and existing acceptance suite. No changes to production.
2. **Humanoid v0**: introduce an optional, local-rendered articulated 2D human silhouette (head, neck, shoulders, torso, arms, hips, legs) with deterministic pose and proportions. Layer garment photos using masks and existing outfit state; no generated garment pixels. Reuse the current renderer as fallback.
3. **Garment fidelity**: create synthetic, consent-safe reference fixtures with stripes, checks, logos, distinct colors, sleeve lengths and overlap. Measure color drift, pattern continuity, clipping, occlusion and source identity changes. Reject bad masks and blank originals.
4. **Try-on research**: compare browser-side lightweight pose/segmentation with locally hosted open-source virtual try-on. Record weight license, redistribution, hardware requirements, per-render latency, storage and hosting costs. Never download or activate weights without a license/security review.
5. **Pilot gate**: test Chromium/WebKit responsive layouts and actual Android/iPhone hardware. Human review is required for real-garment fit and mask quality; synthetic passes are not sufficient.

## Required acceptance checks
- 3 distinct outfits from the account's own saved garments; no cross-account assets or remote inference requests.
- Pin/swap/save/restore and new-with-existing produce consistent avatar and 2D fallback views.
- Original source-photo identity invalidates stale recommendations and rendered caches even if the cropped preview is unchanged.
- Invalid, blank, foreign-account or duplicate sources cannot produce misleading outfits.
- Color, texture and patterns match source within documented measurable tolerances; failed fidelity falls back to original 2D.
- Mobile 320/390/430px tests plus Chromium and WebKit; zero browser errors.
- No new paid infrastructure, no production deploy, and no release approval implied.

## Open decisions
- Avatar shape: default neutral humanoid vs optional body measurements; avoid making fit claims without measured garment geometry.
- Commercial rights for any avatar art, 3D assets, model weights and training data.
- GPU availability/cost if photorealistic virtual try-on is later attempted; zero API token fees does **not** imply zero compute cost.

## Release status
The existing protected staging, independent human-reviewed masks, real physical-phone testing and commercial-art licensing gates remain independent blockers. This document authorizes no release.
