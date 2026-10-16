# Isolated Cloudflare AI preview quota worker — not deployed

This directory is a *separate Cloudflare Worker* which owns the `AIPreviewQuota` Durable Object. Its public fetch handler always returns 404; quota requests must be made internally by the authenticated Closet Current Pages Function.

## Safe deployment checklist

1. Review the new Cloudflare Worker and Pages environment in a **nonproduction** account or staging project. Do not modify production.
2. From `workers/ai-preview-quota`, configure and deploy its `wrangler.json` using Wrangler after explicit approval. The SQLite Durable Object migration must succeed.
3. In the **staging** Pages project only, add a Durable Object namespace binding named `AI_PREVIEW_QUOTAS` referencing class `AIPreviewQuota` from script `closet-current-ai-preview-quota`; use Cloudflare Dashboard bindings or equivalent Pages Wrangler configuration. Re-deploy staging to apply the binding.
4. Verify Pages Function `reservePreviewQuota` reaches the namespace for a verified Supabase user. Run concurrent requests to prove the limit is enforced across devices and Workers instances.
5. Configure staging Workers AI binding `AI` separately; do not enable generation while identity, consent, quota, cost/usage stop conditions, and image-fidelity tests remain incomplete.
6. Keep `AI_PREVIEW_ENABLED` unset or false on every deployed environment. The current Pages endpoint intentionally rejects all generation attempts, even if set true.

The code must never trust a client-supplied user ID: the Pages endpoint derives the identity by verifying the bearer token with Supabase. The Worker itself has no public reservation route. A successful local Node test or CI build is **not** proof that Cloudflare bindings exist, that deployment works, or that generation is free. Cloudflare notes Workers AI calls can consume paid usage even from local development.

Docs: https://developers.cloudflare.com/pages/functions/bindings/ and https://developers.cloudflare.com/pages/functions/wrangler-configuration/
