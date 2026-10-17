# Verifiable one-photo-in, one-result-out pipeline — safe dry run

The previous comparison pictures look cleaner but are generated visual **concepts**, not cryptographically verified individual FASHN image-edits of exact originals. This step implements the missing provenance/transport foundation WITHOUT misrepresenting that an actual paid provider has been tested.

## Implementation
`supabase/functions/garment-normalize/verified-pipeline.mjs`:
- requires explicit pilot enablement, server-authenticated scoped user, single preauthorized *simulation* reservation, and a mock-only adapter;
- validates and decodes the actual garment source byte stream, checks its MIME/magic and exact declared SHA-256 BEFORE invoking a mock editor; preserves the exact source image bytes in the provider payload;
- restricts output to one magic-verified PNG; checks different source/output hashes;
- creates an expiring HMAC-signed **mock provenance receipt** with user, garment, category, original-photo SHA, generated SHA, request ID, model and timestamps. Altered IDs/hashes, user substitution, forged signatures, and replay after expiry are rejected by verification.
- returns **preview-only** results with no source replacement, no auto-save, no implicit garment identity approval and no provider billing. This is neither a deployed Edge Function nor a real provider API integration.

`scripts/run-verified-normalization-dry-run.mjs` uses the four existing SHA-locked and licensed real photos (orange shorts, black jacket, gray jeans, black/coral sneakers), verifies the original image bytes, and feeds them into the mock adapter exactly one at a time. The mock response is intentionally a **1-pixel valid PNG**, NOT an AI reconstruction. Its role is to prove photo identity and proper binding, not to claim quality or output fidelity.

**Not yet done:** A FASHN/or other paid provider needs an explicitly consented user test, authenticated endpoint with durable per-user usage/spend reservation, production-mode receipts, provider-job binding, expiring poll tokens, data retention and visual garment comparison. Until then the actual normalization feature remains disabled and the previously added closet-display image review gate still blocks unverified images.

This does not touch Closet Current live deployments, main, Drive Duel, or customer photos. Tests report no semantic-mask accuracy or garment-color identity fidelity. GitHub Actions should pass both unit and real-byte simulated pipeline, but success does **not** mean an AI has unfolded any item.
