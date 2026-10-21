# Closet Current — consolidated security + original-first phone diagnostics

**Developer-only integration.** Source parents: verified phone-trial PR #167 `89216b5fa2568c5254e6c8693aa1887c799b4f9d` and all-static-assets audit PR #165 `53c2f49517d89ef6074cdfa0eee99c4fb5fbba2d`. This branch never targets production main. Both source parents retain their original Git ancestry; their branches are untouched.

The full asset security check is `node scripts/check-staging-anonymous-access.mjs --bundle=staging-dist https://closet-current-staging.pages.dev https://ACTUAL-PREVIEW.closet-current-staging.pages.dev`, **only** after separate owner-authorized staging is available and actual Access policy and preview inventory have been separately checked. All CI in this branch uses fake local origins and synthetic HTTP replies, not a hosted service. A redirect does not prove real Cloudflare Access; a single public script/icon/image on any preview fails. The bytes and file list of a generated restricted staging bundle must be SHA-256 verified first.

Original-first 24-scene/30 garment-slot worksheet is available in the offline artifact from passing phone/mobile CI, but no physical Android or iPhone, real customer photo, human-gold benchmark, live Auth/email or separate Cloudflare/Supabase staging has been tested by this integration. The pilot and production promotion remain **BLOCKED**. No customer changes, paid Supabase or AI, production deployment, main merge or Drive Duel changes.

CI contract: run all regressions, 207 local disposable Supabase HTTP security checks, both synthetic phone browser engines, installed Chromium PWA, fully sealed staging inventory and 12 dedicated anonymous-route checks. Check latest exact-head GitHub Actions conclusions before calling integration complete.
