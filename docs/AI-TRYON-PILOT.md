# Closet Current — real AI virtual try-on pilot (draft only)

## Scope

This is the **first functional integration stage**, not a finished AI try-on launch. It replaces neither the existing customer closet nor the outfit builder. The customer chooses **one of exactly two standardized, realistic full-body model photographs (female or male)** and explicitly taps **Generate AI try-on** after selecting clothing. A server-side FASHN v1.6 model changes one recognized garment on that standardized model; the returned image is actual generated inference, **not a cutout layered with CSS**. All remaining selected garments stay visible in the normal outfit board but are explicitly **not claimed to be rendered**. The customer keeps the untouched clothing photo.

Neither live inference nor either of the two source model images is provisioned yet. No credits should be consumed on a repository build. The function defaults to disabled.

## Provisioning checklist — do not activate until secure

1. Create or license **two fixed full-body studio model images**, one female and one male, photographed from the same camera angle in neutral poses and lighting. Host them at HTTPS URLs accessible to FASHN. Use genuinely authorized human/model imagery; do not copy third-party photos without rights.
2. Test those exact model photographs with a held-out set of tops, bottoms and dresses. Check sleeves, hems, color/pattern, body continuity and output stability. The visual output is an approximate styling preview, not a sizing tool.
3. Select an account in Supabase and deploy the **reviewed** Edge Function at `supabase/functions/ai-try-on/index.ts` only after running the contract and mobile tests. It accepts the signed-in user's JWT and must not run as anonymous. It uses **FASHN v1.6**, POST `https://api.fashn.ai/v1/run` and GET `https://api.fashn.ai/v1/status/{id}`.
4. Configure server-side Edge Function secrets through the Supabase dashboard, never browser or repository source:
   - `FASHN_API_KEY`: provider secret.
   - `TRYON_JOB_SIGNING_KEY`: at least 32 random characters for per-user signed status tokens.
   - `TRYON_FEMALE_MODEL_IMAGE_URL`, `TRYON_MALE_MODEL_IMAGE_URL`: two approved HTTPS standard model assets.
   - `TRYON_ALLOWED_ORIGIN`: exact origin of this website (not the path).
   - `TRYON_PILOT_USER_IDS`: comma-separated test account UUIDs; no wildcard.
   - `TRYON_ENABLED=true` **only after** the model photos, provider API account spending cap, consent and usage limits have been configured.
5. **Before opening to paying customers:** add server-enforced persistent per-user request quotas, global spend alerts/caps, abuse monitoring, authenticated request logs that never include image bytes, privacy notices and failure recovery. The pilot-user allowlist alone is not an adequate public paid-compute rate limit.
6. Run a real *single-garment* smoke test using an authorized pilot account on a supported mobile browser, test failed/incomplete provider jobs and malformed input, then explicitly decide whether to enable the user-facing feature.

## Data privacy

- Clothing stays in existing private closet storage until the user explicitly requests try-on. The browser sends **only the clipped catalog garment** to a signed-in server function—never the account's entire closet or the original whole-outfit photograph.
- The provider receives the standardized model and the selected garment. It returns a **transient base64-generated image**; we don't automatically save it to account backup, clipboard, file system or a public CDN.
- Provider request records and retention are governed by the third-party contract: review [FASHN retention](https://docs.fashn.ai/api-overview/data-retention-privacy) and show a concise consent/privacy disclosure before enabling for customers. Do not assert zero data retention.
- **Selfie face clipping / personalization is NOT implemented in this stage.** It requires explicit selfie upload and permission, separate face segmentation, an independently reviewed identity-preserving model, optional deletion and clear retention policy. Never silently send a selfie to a third-party AI service.

## Technical limitations and next stages

- v1.6 supports `tops`, `bottoms`, `one-pieces` and auto. Current prototype performs one **paid** single-garment generation per user click, even when the outfit board contains multiple garments. The second requested garment, shoes, sweaters, coats and stockings are NOT yet shown in that generated result.
- Next: evaluate genuinely reliable two-piece incremental try-on and layers against photos, with provider costs and image consistency measured.
- Then: add optional face clipping/selfie personalization on the same two base models; require explicit consent and test same-identity stability across swaps.
- Do not promote this draft to production before live provider credentials, correctly licensed model images, credits, quota enforcement, first-run disclosures, and phone QA are present.

Provider documentation: [FASHN v1.6](https://docs.fashn.ai/api-reference/tryon-v1-6), [API fundamentals](https://docs.fashn.ai/api-overview/api-fundamentals), [privacy](https://docs.fashn.ai/api-overview/data-retention-privacy). No unrelated changes to Drive Duel.
