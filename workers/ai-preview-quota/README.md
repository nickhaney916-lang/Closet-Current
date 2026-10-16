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

## GitHub staging deployment prerequisites

The isolated manual workflow lives at `.github/workflows/deploy-ai-staging.yml`. **GitHub normally exposes `workflow_dispatch` only when that workflow file exists on the default branch.** Since this workflow currently exists only on PR #4's diagnostic branch, it may not appear in the Actions Run workflow menu. Do **not** merge all PR #4 into `main` merely to expose this button. A separately reviewed, minimal dispatcher on the default branch or an approved alternative trigger is needed before the workflow can be started through GitHub Actions.

In the GitHub repository, open **Settings → Environments** and create `closet-current-ai-staging`, preferably with required reviewers. Open **Settings → Secrets and variables → Actions** and configure the secrets `CLOUDFLARE_STAGING_API_TOKEN` and `CLOUDFLARE_STAGING_ACCOUNT_ID` (repository or staging-environment secrets). Never paste tokens into chat, a PR, source files, or workflow inputs. Use a Cloudflare API token restricted to the required staging account and Pages/Workers/Durable Objects capabilities; inspect permissions before use. The existing production workflow uses different credentials and must not be changed.

Once the manual dispatch is safely available, choose branch `fix/mobile-recognition-timeout-diagnostics` and enter the exact confirmation text `DEPLOY_STAGING`. The workflow verifies or creates only Pages project `closet-current-ai-staging` with production branch `staging`, deploys the isolated quota Worker, then uploads the static staging Pages site. The Pages deployment is **not proof that a live AI endpoint or binding works**: afterwards, verify that `/api/ai-outfit-preview` returns 503 `AI_PREVIEW_NOT_ENABLED` and that the Durable Object bindings are present on staging. Do not enable AI until explicit consent, quotas and generated-image behavior have been tested.

**Current state:** this is a plan, not a cloud connection. No secrets have been configured or staging deployment executed by ChatGPT.
