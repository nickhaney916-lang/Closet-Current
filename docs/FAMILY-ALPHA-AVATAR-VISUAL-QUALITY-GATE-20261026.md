# Family Alpha v0.1 — avatar and garment cutout VISUAL NO-GO

**Owner request October 26, 2026:** Fix the embarrassing avatar and poor clothing cutouts **before** enabling the complete four-person staging application. Existing synthetic functional test success is **not** a visually acceptable 2D humanoid or well-fitted outfit.

## Existing reproducible problem

The current source-pinned `public/family-alpha-2d-photo-renderer.mjs` draws the 'person' as a single rectangular `div` with rounded corners, 52% width, 85% height and 0.55 opacity. It places each approved garment `HTMLImageElement` into a fixed normalized box with aspect-ratio containment; it does **not** conform garment pixels to shoulders, torso, arms or knees. This is an obvious reason a user may see blob-like mannequin and floating/pasted cutouts. Code's own comment says **NOT anatomical fit or body drape**. The independently reviewed mask producer uses a conservative single-background pixel difference procedure; it declines busy, patterned, overlapping or clipped image backgrounds. Tests with generated JPEGs cannot demonstrate apparel-photo matting on a real person or native camera.

## First isolated iteration (NOT ACCEPTED AS READY)

- Replaces the rectangular figure placeholder with a front-facing, vector/SVG **articulated 2D humanoid**, inside the exact same 360 × 600 photo frame: individually drawn head, ears, neck, shoulders/torso/waist, both arms and hands, separate legs and feet. Underlying neutral silhouette; no likeness claim.
- Repositions existing photo slot anchors to human shoulders/chest, waist/leg and foot coordinates while **preserving the original accepted cutout's aspect ratio, pixel colors, transparency, source identity and layering order**. No external images, network, generated solid-color garment proxy or distortion is introduced.
- Runs true `HTMLImageElement` overlay, not a pretend 'try-on' AI garment. Real clothing remains approved transparent **photograph pixels**. Retake remains necessary where matting is poor.
- The **source-pinned disabled Family Alpha HOLD builder** replaces only the two reviewed 2D layout modules, preserving stage Auth lock and the existing source-pinned recognition/clipping/provenance code. The manifest records exact asset hashes; any missing/stale version fails closed. Release stage remains disabled.
- Adds browser/Node regression assertions for head + anatomy rather than a rounded rectangle, accurate 3:5 frame and preserved nonstretched photo layers.

**Explicit limitation:** This is a foundation for a visually recognizable 2D person, NOT finished anatomical garment fitting, a guarantee of realistic drape, AI try-on, user-shaped silhouettes, perfect clipping or private family-camera acceptance. Broad generated-slot matching can still look wrong for wide/open jackets, hanging garments, outfit photos and incomplete masks. Do not promise a realistic digital fitting room.

## Hard release criteria before enabling the full four-person session

1. **Visually human body:** Full face/head outline, shoulders, separate arms/hands, waist, hips, two legs and feet visible at Samsung/Android and iPhone sizes; no single oval/cartoon blob. User approves an actual rendered screenshot, not source assertion.
2. **Recognizable garment pixels:** Real approved cutout shows fabric pattern/color/logo/details from original capture, not flat substitute SVG, AI invented garment or blurry upscaled crop.
3. **Cutout quality:** On independently chosen original photos, assess jagged edges, leftover background, missing collars/sleeves/legs/hem, clipped footwear, mannequin/human skin, duplicate garments, person/photo residue, loss of pattern and color bleeding. Poor cutouts must visibly fail back to original/retake/review. Never silently publish the scene crop as a garment overlay.
4. **Actual fit:** Top aligns with shoulders and torso; trousers/skirts at waist with clear legs; separate left/right shoes in foot zone; jacket above shirts; dress hides conflicting trousers and layers. A garment that floats, occludes face, deforms fabric or shows a white rectangle is a FAIL—even if geometric aspect tests pass.
5. **Four-user privacy:** No family photos until protected four-account login and owner-isolation check. Owners see only their own originals, cutouts, avatar and saved outfits. Other-owner/session changes clear old preview.
6. **Real-device acceptance:** On actual Android and iPhone hardware with authorized accounts, user can preview original versus transparent result, reject bad cuts, use good cutouts, select/swap pieces and reopen the saved look without image loss. Time and number of manual corrections measured rather than guessed.

**Gate:** `visualQualityPhoneApproved=false` and `segmentationQualityPhoneApproved=false` in the disabled manifest. Family Alpha **HOLD** until visually reviewed under realistic photo conditions and owner approves. No staging/production deploy, no merge, no camera/customer data, no cloud/provider settings, no cost, no Drive Duel changes.
