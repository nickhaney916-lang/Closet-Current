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
