# Family Alpha v0.1 — Combined integration development candidate

**NO MERGE · NO DEPLOY · NO CUSTOMER PHOTOS · NO PAID AI**
Related to GitHub issue #255. This integration branch is based on the exact head of #264, itself stacked on #263, #262, #260, #258 and #256.

## What is genuinely integrated and tested

1. Existing draft #264's signed-in-account preflight and stale-avatar cancellation, #263's per-account IndexedDB snapshot, #260's original-JPEG fingerprint and 2D photo layer rendering remain unchanged.
2. Exact independent **#15** saved-outfit / one-piece swap validator and 3-outfit tests (including actual main app stylist), plus its six-view Chromium/WebKit synthetic browser fixture, copied on isolated branch.
3. Exact independent **#16** retained-original versus transparent RGBA source pixel auditor, 22-case synthetic matrix and six-view Chromium/WebKit real-JPEG decoding fixture. Imported #257 conservative garment-preparation source must retain its pinned blob hash `12ad1234b44d1257a1f1e697e61468f91595148c`. Only relative imports changed for local composition.
4. NEW: `research/family-alpha-integrated/prepare-audited-synthetic-presentations.mjs` composes #257 mask preparation and #16 independent ground-truth/source-pixel audit into #260's presentation input, while strictly rejecting missing synthetic truth, ambiguous background, changed original/crop, foreign account and async account transitions. This is **development-only** under `research/`; not loaded by the shipping app.
5. NEW: `tests/family-alpha-combined-candidate.test.mjs` demonstrates three saved-wardrobe outfit options, one-piece swap preserving other source fingerprints, audited synthetic garment photos into the authenticated 2D renderer, and safe refusal when trusted ground truth/masks/owner are unavailable.
6. NEW: `.github/workflows/family-alpha-combined-no-deploy.yml` executes full Node regressions, source audit matrix, PR15 three-outfit browser checks and PR16 real-synthetic-JPEG/transparent-PNG browser checks in both Chromium and WebKit with no external production calls.

## Critical limits — **why no family link yet**

- The independent #16 auditor intentionally does **NOT** authorize real photos. `auditMask(...)` produces `canDisplay:false` even on synthetic PASS. The combined research presenter demands separately labeled synthetic ground truth, and only exercises the renderer to prove integration wiring. Matching JPEG hash and visible source RGB do NOT prove garment correctness without verified segmentation.
- Current product UI **does not yet import or display** this research combination. Actual source-to-transparent-derivative review, user-friendly fallback and staging feature flag are not integrated. The current family alpha requires a real photo capture-to-avatar workflow.
- The Github repo contains RLS policy *definitions* but real Supabase Auth, storage permissions and cross-account isolation have not yet been verified in an approved private staging environment. Synthetic mock user IDs cannot prove RLS.
- Live protected staging build, four accounts (two adults, two children), private feedback plumbing, physical Android/iPhone testing and specific approval are pending.
- 3D, paid virtual try-on, billing and trends are explicitly unnecessary for Family Alpha.

## Planned next safe gate

1. Review PR #265 and reconcile source-mask trust boundaries; implement a truly trusted production presentation producer that handles a normal clothing photo without independent synthetic ground truth. Fail to **Review photo / Retake**, not a solid-color replacement, when confidence is low.
2. Design an **off by default** protected staging-only avatar UI behind verified local owner/remote Auth, keeping existing Outfit Builder as fallback.
3. Test backend authorization using two isolated, consented test accounts and no family photos; verify cloud-backup and private JPEG bucket RLS. Do this only after approval to use protected staging.
4. Run actual phones and four-account smoke test before family invitation.

CI claims must quote an exact run/head. This document alone does not prove run status.

**No PR is merged. No deployment occurred.** All user clothing and login settings remain unchanged.
