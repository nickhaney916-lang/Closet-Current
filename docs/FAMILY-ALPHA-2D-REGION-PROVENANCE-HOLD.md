# Closet Current — original-JPEG garment region and 2D avatar layer review

**October 24, 2026 PT · Family Alpha (offline test only) · RELEASE HOLD**

## Reproduced admission mismatch

For an outfit capture, the product's actual clothing classifier can use `recognitionPhoto.image` — the **unmasked individual garment RGB JPEG** — while the 2D photo preview validates `originalPhoto.image` — the **complete scene JPEG**. These sources should both be preserved. The preview previously pinned the full original scene, display crop and garment ID, but a user retake or changed garment-specific unmasked image / clipped region could leave the whole-scene hash unchanged and permit a previously approved avatar presentation to be reused.

This is a **review/provenance integrity issue**, not demonstrated malicious account access or measured inference error. It matters for choosing shorts vs skirt, distinguishing dresses, and layered shirt/jacket captures. Existing private Auth and row policies must still be independently verified.

## Changes

1. `public/family-alpha-2d-saved-board.mjs` now exports an optional `fingerprintAlphaReviewContext` SHA-256. For garments with a separately captured recognition JPEG or segment hint, it hashes their unmasked garment JPEG fingerprint, segment hint, category, type, sleeve length and source group. It refuses missing/mismatched review evidence instead of trusting an unchanged full-scene hash.
2. `research/family-alpha-reviewed-photo/real-jpeg-review-provider.mjs` captures an immutable source/category/segment snapshot before async JPEG decode. Re-verifies it during pixel audit, after the user photo review and just before a presentation is approved. Exposes `reviewContextVersion` in the ephemeral human-confirmed presentation so the downstream 2D adapter rejects stale garments. Approved PNGs are still in memory only.
3. Existing single-item saved garments without segmented evidence remain compatible; no migration, new cloud write, photo upload or classifier weight change.
4. `tests/family-alpha-2d-saved-board.test.mjs` covers both short- and long-sleeve Tops at layer 0, Jackets at outer layer 2, dresses excluding trousers/jackets, and rejects changed original region, segment hints, confirmed subtype and missing review-context proof while keeping the full source scene.
5. `tests/family-alpha-reviewed-region-provenance.test.mjs` injects simulated async changes to recognition region, classification, scene/crop and ensures no stale review can reach the approval action. Synthetic JPEG bytes only.

Existing no-deploy CI builds the complete Family Alpha **HOLD-NO-CALLBACK-OR-KEY** candidate, reruns the full Node suite, staged Auth HOLD, existing synthetic source→closet→2D avatar path, and Chromium/WebKit mobile-width browser tests.

## Important limitations

This prevents **stale reviewed cutouts** from proceeding when garment-specific source or region changes; it **does not change classifier accuracy, improve real fabric matting, prove physical-phone camera capture, or authorize cloud accounts**. Current licensed-photo broad category benchmark was 47/56 (83.9%), with jackets previously weakest. Continue to require user-visible preview/retake and independent original photo benchmark.

Nothing is merged/deployed; no live family/customer photos, Supabase/Cloudflare/Resend settings, paid inference or Drive Duel changes. **Family Alpha HOLD.**
