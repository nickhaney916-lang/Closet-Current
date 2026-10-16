# Realistic human AI outfit previews — integration contract

Status: **request preparation only**. No AI image backend is configured or invoked. Do not display a "Generate" action until the backend, safeguards, testing, and user consent are implemented.

## User flow
1. The three existing Style suggestions retain original garment thumbnails, Save, Edit, and View outfit.
2. An opt-in Generate realistic preview control (future) requests explicit permission before uploading wardrobe photos to an AI provider. No background upload. Reveal cost/credits before acceptance, and never charge unexpectedly.
3. On approval, call an authenticated Cloudflare Worker endpoint (not a browser-held API key) with the exact selected garment references prepared by `ClosetAIPreview.prepare(board,items)`.
4. The server validates session, request payload size/count, image types, content, and cost quota; requests full-body, consistently posed adult model preserving garment appearance from the reference images; handles rate limits, timeouts, and cancellation.
5. Return a temporary generated preview URL; do not silently save it to public storage. Display **AI visualization, not exact fit**, and retain garment photos alongside it. Never replace recorded clothing photos, recognition labels, or inventory data.
6. Deduplicate requests with a privacy-safe outfit fingerprint; cache only with consent and defined expiry. Never include base64 images in logs/analytics.

## Requirements before release
- Select and configure a garment-reference/virtual-try-on capable image provider; check provider model inputs and current fees. A generic text-to-image endpoint may invent colors, cuts, logos or patterns.
- Keep provider credentials in Cloudflare Worker secrets, enforce authenticated user ownership, per-user quotas, abuse limits, file-size caps, and output expiry.
- Get affirmative image-sharing consent and update the app's privacy disclosure.
- Test photos of shirts, shorts versus skirts, dresses, trousers, jackets/layers and shoes; score both visual quality and fidelity against source garments.
- Verify consent declined, timeout, offline, bad image, duplicate request, app reload, and credit exhaustion.
- Test one consistent adult model without requesting personal body/face photographs.
- Keep the current mannequin fallback until real generated previews meet quality expectations; **do not deploy unfinished previews**.

## Current code
`public/ai-outfit-preview.js`: pure, local request preparer; no external requests or secrets. `tests/ai-outfit-preview.test.mjs` covers reference selection, dress conflict, and rejecting remote reference URLs.

## Provider candidate for first pilot (research 2026-10-15)
FASHN virtual try-on is a practical reference-photo option. The stable v1.6 endpoint takes **one garment image + one existing model image per generation**, not an entire closet outfit in one call. To dress a model in several selected pieces may require sequential calls (with accumulated visual drift and added cost) or assessing the newer Try-On Max endpoint for multi-item fidelity. Neither is yet validated for Closet Current's photos; shoes/layers especially require testing.

FASHN's published on-demand price is $0.075 per credit, minimum purchase $7.50/100 credits; v1.6 try-on is one credit per output. An outfit requiring 3 sequential try-on calls could cost roughly $0.225 before retries or other operations. Never imply this is free or guarantee this cost. Pricing: https://help.fashn.ai/plans-and-pricing/api-pricing

The API key and enabled flag belong only in encrypted Cloudflare Pages secrets/variables. The new `functions/api/ai-outfit-preview.js` is deliberately **fail closed**, returning 503 even when manually enabled until user authentication, per-user quota enforcement, explicit consent, and provider response handling are ready. **Do not set AI_PREVIEW_ENABLED=true** as a shortcut. See https://docs.fashn.ai/api-reference/tryon-v1-6 and https://developers.cloudflare.com/pages/functions/bindings/.

Next engineering milestone: verify that the existing Cloudflare Pages deployment method supports Functions (plain static uploads may not); implement authenticated user ownership and a budget cap; pick a licensed consistent base model photo; run a supervised 2–3-garment image-fidelity experiment after credits are explicitly approved. No actual garment images have been transmitted to FASHN.

## Preferred free-allowance prototype: Cloudflare Workers AI FLUX.2 klein 4B

Cloudflare's FLUX.2 klein 4B supports up to **four reference images**, all **smaller than 512×512**, supplied as multipart `input_image_0` to `input_image_3`. Its free neuron allowance is limited and shared across Workers AI use; free availability and pricing can change. Sources:
- https://developers.cloudflare.com/changelog/post/2026-01-15-flux-2-klein-4b-workers-ai/
- https://developers.cloudflare.com/workers-ai/models/flux-2-klein-4b/

Reserve image 0 for a consistent, licensed adult model photograph, and allow at most three garment reference photos. `ClosetAIPreview.selectCloudflareReferences` returns **both included and omitted** garment references so the UI can disclose when shoes or accessories were excluded. Do **not** claim the generated human exactly wears all clothing when the request omits garments. The FLUX model is reference-image generation, **not specialized virtual try-on**. Test shirt/pants/jacket fidelity against originals before enabling the workflow.

Before sending any photos, resample reference images in-browser to **strictly below 512×512** (for example max 510px), with no upscaling, and validate size/type again on the server. Do not send raw 4096px images to FLUX.2. Limit to three selected garments plus a base-model reference, or investigate an alternative model/API for full outfits with more garment inputs.

The Cloudflare endpoint remains fail-closed; **no account, AI binding, deployment, request processing, or generation was enabled by this commit**. Needed: Cloudflare Pages Functions compatibility, binding named `AI`, authenticated account/session checks, quota and abuse limits, user consent, image preprocessing, credit visibility, end-to-end tests, and a nonproduction test environment.
