# Generative folded-to-clean garment normalization — provider contract only

The user's goal is more than small-angle correction: a user may photograph a sweater/pants folded or wrinkled, with a clipping mask containing 90% of the item. They want a **clean canonical-looking garment in closet tiles and hanger browsing**, while the exact saved source remains unchanged.

### Evidence and decision
- Geometric normalization `public/garment-pose-normalizer.js` passed 24 UI/unit tests in [GitHub CI](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39072365298), but **all 4 real-photo comparisons were unchanged** (shorts, jacket, jeans, shoes). Clean-white isolated cutouts are rare in our current benchmark. Do not advertise this as folded garment reconstruction.
- FASHN's **Edit** endpoint documents `model_name:edit` with input image, prompt, 1k fast mode and base64 output: https://docs.fashn.ai/api-reference/edit . It is a **potential paid generative candidate**, not proven to preserve unseen garment identity.

### Next gated prototype
`supabase/functions/garment-normalize/protocol.mjs` now validates exactly one explicit, user-initiated, source-hash-linked preview. Its request builds the documented image-edit payload to unfold and present the actual garment while requesting preservation of true color, pattern and stitching. The returned image, even if valid, remains **unverified preview only**.

**This is NOT a deployed Edge Function. No network calls are performed by this contract, no provider key is read, and the app does not import it. Feature default = disabled; no billing or photo upload.** Before building/deploying a paid server endpoint, add durable per-user rate/spend caps, provenance, consent to transmit a photo, result validation against actual source details, and independent side-by-side trials on folded-shirt/pants/skirts photos. After visual quality is established, the output may be stored as a **separate display asset** (not an overwritten source/recognition crop).

No consumer tabs, no hidden garment speculation, no Drive Duel changes.
