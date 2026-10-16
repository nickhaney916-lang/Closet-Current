# Closet Current — pause checkpoint (2026-10-15)

Branch: `fix/mobile-recognition-timeout-diagnostics` | PR #4
Do not merge, deploy to production, enable paid Workers AI, or modify Drive Duel without explicit approval.

## Verified
- GitHub Actions AI Preview Quota Safety run 38837183310, job 116768817683: **25 tests passed; 0 failed**. This verifies unit/config safety checks only, not cloud deployment.
- Existing Closet Current public app, closet indexing/recognition and outfit recommendation work have been developed on the diagnostic PR. Do not confuse simulated tests with validated user-photo accuracy.
- AI preview reference preparation, Supabase session verification, isolated Durable Object quota Worker (2/day) with commit/refund and alarm cleanup, staging config template and manual-only deploy workflow are committed.

## Not verified / blocked
- Staging Cloudflare Pages project and Worker deployment **not performed**.
- GitHub staging environment reportedly created by owner, but cannot independently verify.
- Owner reports adding a GitHub secret, but **a valid Cloudflare staging API token is not confirmed**; owner cannot locate existing token. Confirm secret type/name and ensure both `CLOUDFLARE_STAGING_API_TOKEN` and `CLOUDFLARE_STAGING_ACCOUNT_ID` are present as environment secrets; do not request values in chat. Cloudflare token values may only be visible at creation; create a restricted replacement if necessary.
- Manual `workflow_dispatch` on a branch-only workflow may be unavailable without a minimal, separately reviewed default-branch dispatcher. Do not merge whole PR merely for dispatch.
- Staging binding, real authentication response, concurrency quota, Durable Object alarms, Cloudflare Workers AI inference, and photo consent UI remain untested or incomplete.
- AI endpoint deliberately disabled/fail-closed, and realistic human output not available to users. Free tier availability/cost ceiling must be separately verified before using model.

## Tomorrow's ordered work
1. Confirm staging GitHub environment secrets and restricted Cloudflare token; obtain staging account ID inside GitHub without sharing secrets.
2. Resolve isolated workflow dispatch and review staging-only deployment permissions, then authorize staging deploy separately.
3. Deploy Worker and staging Pages; test disabled endpoint and quota concurrency/alarm behavior; do not enable generation.
4. Build consent flow, harden image-validation and provider usage caps, then evaluate a controlled realistic human outfit image in staging.
5. Retest real closet photo recognition/indexing and mobile crop fidelity against measured release targets, then plan family pilot.

## Estimated readiness, not measured test coverage
- Core closet app / navigation and image capture: ~75% (real-device pilot remains)
- Recognition, indexing and crop reliability: ~65% (broader real-photo evidence needed)
- Account sign-in / onboarding / policies: ~60% (user journey and email flow need verification)
- AI realistic human preview: ~30% (infrastructure code, no running generation)
- Cloudflare staging readiness: ~65% (configuration/tests present, no deployed resource)
- **Overall readiness for a small invited pilot: ~65%**, subjective planning estimate only; production public launch readiness is lower. Do not present these as instrumented QA results.

## Revised product strategy — agreed before next session

The three defining product requirements for Closet Current are:
1. **Recognition substantially better than competitors:** one-tap camera, automatic crop, background removal, category and fine subtype indexing. Explicitly challenge shorts vs skirts, jeans vs trousers, sleeve length, layers, dresses, footwear, multi-garment photos. Gather a larger representative real-photo evaluation dataset and report class-by-class confusion, false positives, manual correction rates and mobile latency. **98% broad-category / 95% subtype are aspirational goals, NOT measured outcomes or competitor-validated claims.**
2. **Photorealistic outfit visualization of the user's actual saved garments:** assess garment color, logos, pattern, texture and fit fidelity, not merely pretty human images. Existing Cloudflare AI prototype is fail-closed and general image generation is not yet proven accurate virtual try-on. Require photo-sharing consent and free-cost control before staging inference.
3. **Radically simple mobile UX:** large tap targets, clean uncluttered dashboard, no duplicate navigation or redundant tabs, primary paths 'Photograph Clothing', 'Photograph Full Outfit', 'My Closet', 'Create Outfit'. Minimize steps and manual classification; when uncertain ask one brief meaningful confirmation. Treat camera-to-saved-closet and closet-to-outfit tap counts as release metrics.

### Tomorrow — FIRST PRIORITY: CLOTHING RECOGNITION
- Establish a reproducible realistic labeled test corpus, including difficult shorts/skirt, sleeve-length and whole-outfit cases, sharp mobile camera photos, lighting/background variations.
- Measure baseline broad and subtype accuracy, auto-crop clarity, confidence calibration, correction rate and processing time against that corpus; keep original photos unmodified.
- Fix highest-frequency confirmed confusions and run regression tests; prioritize hands-off point-and-click identification.
- After recognition: realistic outfit-on-human AI fidelity, then large-button clutter-free UX validation; staging credentials and commercial subscriptions remain tracked but should not distract from this product-quality order.

### Monetization — planning only
Favor free basic tier plus an optional premium monthly/annual subscription, with metered realistic AI previews; floated pricing to **test**: $4.99/month or $39.99/year. No fees or feature gating enabled. Validate willingness to pay, retention and actual AI inference costs before choosing prices.

This revised prioritization supersedes the older 'tomorrow priorities' list above. Do not touch Drive Duel, production, or merge PR #4 without approval.
