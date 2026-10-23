# Family Alpha v0.1 — Actual retained-JPEG auto-isolation + explicit review gate

**Main Closet Current integration work — issue #255.** Based on combined draft PR #266 at `f5b0af074e05992d900eb757ac2ec99894613069`. DRAFT, NO MERGE, NO DEPLOY. The product UI and real signed-in accounts are unchanged.

## What this candidate adds

- `research/family-alpha-reviewed-photo/real-jpeg-review-provider.mjs`: decode the **actual app-retained JPEG** with the browser's native image decoder, extract a candidate only using PR #257 conservative near-uniform simple-background connected component logic, independently decode retained JPEG **a second time** through PR #265 RGB/bounds/SHA/crop/owner auditor. This auditor must return `review/source-pixels-match-but-matting-unverified`; an independently absent garment ground truth is never represented as verified.
- Abort/reject missing/corrupt original JPEG, invalid dimensions, source mismatch, stale crop, changed outfitSourceId, foreign owner, account epoch transition, supersession, bad color pixels, stale masked derivative, and ambiguous/blank/multiple/clipped/busy photos.
- Prepare **ephemeral in-memory transparent PNG** of the actual source RGB (when simple enough), then require the caller's **direct explicit human review** of transparent cutout and retained source together. Refusal/retake means NO approved presentation.
- `research/family-alpha-reviewed-photo/preview-confirmation.mjs`: mobile 2-column preview with Original photo vs Transparent cutout, large accessible Retake photo / Use cutout controls, plain warning **"not a realistic fit"**; DOM images removed after resolution. Reject scripted click, pagehide, abort and foreign account through caller's isActive. No photo upload, network, telemetry, file writes or storage.
- On explicit visual approval, rerun original JPEG SHA and crop fingerprint, validate live item and owner epoch, and return a **staging-preview-only** presentation compatible with #260/#264 protected avatar renderer.
- Tests run full Node regressions, live (but synthetic-generated) browser JPEG→transparent PNG→explicit click→mocked Auth/server → owner-scoped 2D avatar, retake, account change and busy-background fallback at 320/390/430 in Chromium and WebKit.

## Important trust boundaries

This is only a **reviewed 2D photo presentation**. Human visual confirmation + exact retained-pixel verification can support a private staging demonstration for clear uniform-background captures. It is NOT independent mathematical ground truth for garment segmentation, and it is NOT live authorization or verified physical virtual try-on.

- All QA uses synthetic clothing photos constructed by code and JPEG-encoded by browser; there has been **no real family/customer photo processing**.
- Real photos can be complex; hard or ambiguous backgrounds **must produce REVIEW**, not guessed pixels, a generic color, or unauthorized derived images.
- `approved:true` is compatible with existing saved-board adapter ONLY after the caller does real Auth/RLS checking and obtains reviewed pixels. Metadata cannot prove that a caller used the approved provider. UI integration must not accept arbitrary caller-supplied presentations.
- The source and PNG are **not persisted** here; original image is never overwritten. Review could be re-requested after reload, until we design privacy-safe immutable approved-derivative caching.
- Review UI is **research-only and NOT attached to the shipping Outfit Builder**. Before physical family alpha, connect behind a protected staging-only feature flag and verified four-user Auth, with clear Retry / Review photo alternatives.
- Need to verify actual Supabase Auth + RLS private object storage; after explicit protected staging deployment approval, test physical Android/iPhone, account changes, photo sync, first-time user flow and latency/quality with consented family captures. Minors' data must never be posted in GitHub feedback.
- No paid AI, Cloudflare/Supabase settings, production site, Drive Duel or real user information touched.

## Expected UI flow, once approved for staging integration

Saved original photo → simple-background automatic conservative isolation → independently checked source pixels → side-by-side Review photo → user selects Use cutout (or Retake) → real scoped and authenticated 2D avatar render.

**Release: HOLD** pending authorization proof, real visual feedback and physical phone acceptance. No release is implied by synthetic CI pass.
