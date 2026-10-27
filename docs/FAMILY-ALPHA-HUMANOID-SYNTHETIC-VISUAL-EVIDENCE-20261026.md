# Family Alpha #255 — independently inspectable 2D synthetic visual proof (HOLD)

**Scope:** Development-only, source-backed visual QA for #320 anatomical humanoid + #322 alpha-footprint alignment; 26 October 2026 Pacific. **No real garment or user photos have been examined.**

## What was missing

Passing Chromium/WebKit aspect-ratio and transparent PNG tests does **not** show anyone what the actual combined garment layers **look like** on the avatar. The owner explicitly reported that the figure and clipping looked unacceptable. Code assertions alone cannot close this blocker. This PR creates **viewable CI screenshots**, so the shape and proportions can be inspected rather than inferred from green tests.

## Source and evidence

The existing `scripts/test-family-alpha-2d-aspect-browser.mjs` runs the **real** `public/family-alpha-2d-photo-renderer.mjs` under Chromium and WebKit mobile viewports (320/390/430px). After its original account/session/source/aspect tests it draws a **code-generated** shirt, trousers, jacket, shoes or dress as a transparent PNG using canvas, calls the actual photo-layer renderer, and takes a full screenshot.

CI `family-alpha-2d-qa.yml` uploads **12 synthetic screenshots** in the `family-alpha-2d-human-outfit-SYNTHETIC-HOLD` artifact, with `visual-evidence-manifest.json` clearly stating `releaseGate:HOLD`, `ownerApproved:false`, `realPhotosUsed:false` and `actualClothingQualityProved:false`.

All screenshots are visibly labeled **SYNTHETIC ONLY**. They show two outfits (everyday layers and dress+shoes) × 3 phone widths × 2 browser engines. They are not real photographs, actual AI/segmentation clipping, realistic fabric fit, customer/avatar likenesses or proof of a good garment. No external resource can load. They contain no private data, Auth, tokens, backend connectivity, family images, production site artifact or paid AI.

## What must happen next

1. Inspect the synthetic figure screenshots for anatomy and obvious coordinate errors. Fix embarrassing geometry before attempting full staging.
2. Await Work #30's independently licensed **real-cutout before/after benchmark** (no customer/family photos), then compare a fixed set of approved cutouts on the updated head-to-toe 2D figure under actual phone-sized screenshots.
3. Real matting acceptance must evaluate sleeves, neckline, cuffs, pants legs, skirt hems, shoes, jacket overlap, color/pattern retention, mannequin background and accidental truncation. **Approve by visible output, not just programmatic pass.**
4. Four real family accounts will eventually test together, but only after the owner accepts the visual quality and account isolation is proven, starting the same session with harmless test items before any minor photos.

**Restrictions:** no merge, deployment, production/staging/provider update, customer/family photographs, spending, paid AI or Drive Duel change. Existing #320 and #322 are separate draft dependencies.
