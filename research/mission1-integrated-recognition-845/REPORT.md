# Closet Current Mission 1 — P845 integrated safe photo intake + owner-confirmed wardrobe review

**RELEASE DECISION: NOT COMPLETE / NO-GO for recognition acceptance. FAMILY ALPHA HOLD #255 OPEN.** This integration branch is DRAFT, UNMERGED and UNDEPLOYED. No production/staging, hosted Supabase, private wardrobe, login credentials or sibling branches modified.

## Exact baseline, independent research and why P845

- **Main Mission 1 source parent:** [P844 PR #942](https://github.com/nickhaney916-lang/Closet-Current/pull/942), exact verified `c2c79eace58409b635833d9419f458d945e66048` ([NO DEPLOY Actions #43322288298](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43322288298): 2/2 jobs, 318/318 native tests, 6/6 before+after browser scenarios per engine/viewport). Includes P843 default required owner photo confirmation, P842 unsafe auto-admission refusal, P844 in-flight save/Cancel/Remove/Escape lock and rollback/retry.
- **Compatible advisory source:** [Parallel #73 PR #944](https://github.com/nickhaney916-lang/Closet-Current/pull/944), verified exact final research HEAD `a69f3bd9861fb2c36eff8670e3b9befa19cd8129` ([NO DEPLOY Actions #43323873059](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43323873059): 3/3 jobs), directly based on P843. Its independent tests confirm the new pixel inspector is OFF by default, bounded, advisory only; its existing 11 legally verified originals produced 1 limited-resolution warning without human-rated quality labels.
- P845 manually ports ONLY compatible #73 source+tests+nonimage evaluation into exact P844 parent without merging sibling history. All P844 save-review code remains intact. It adds an integration regression that actually executes the combined original source code under synthetic worker/photo fixtures, tests a featureless dark/white-like photo remains an unsaved original when opted in, and binds advice to a photo/owner snapshot.

## Source-level behavior

- User must explicitly check `photoQualityResearch73` to enable additional 256px diagnostic sample of the **already decoded** JPEG. The scanner still receives original photo bytes/crop and unchanged underlying FashionCLIP result.
- Optional advice describes luminance, highlights, limited resolution and a focus **proxy**, not real blur/mask/garment boundaries. In opt-in mode an otherwise uniform dark or light garment is kept for the user to review instead of auto-skipped; default legacy scan behavior stays unchanged.
- Advice is held in an in-memory Map (never persisted into wardrobe), verified against the same garment object, original recognition source reference and owner ID on display, plus source/owner checks when async quality resolves. Keep/Retake are user choices, and never change recognition verdict, category/type/color, owner approval or storage.
- The P843 `reviewFirst836=true` literal remains in force: **zero silent first-photo saves** from AI inference, even when it says strong. P844's per-editor save lock and failed-write retry remain, preventing double wardrobe entries during long writes.
- This integration does **not** merge #72 owner-learning, #70 shoe reconciliation, #67 alternative model or #74 review queue. Each remains in its own research branch until specifically validated for integration. No attempt to promote #67 M4 supervised model that was objectively worse than its own zero-shot comparator.

## Reproducibility / evidence boundaries

No ML inference/model weights altered; no claim of category/type/color accuracy improvement. The exact P845 CI runs:
1. strict immutable P844 parent and changed-path allowlist; full Node tests and research builds, plus additional native source-level advice→scanner→pending confirmation/owner/source fences;
2. actual Chromium and WebKit 320/390/430 CSS px tests for photo-quality guidance, P843 owner-review-first admission, P844 no-duplicate-write and failed-write retry, and P841 manual review completion;
3. SHA-verified, lawful public-original-image descriptive photo-quality re-evaluation of the unchanged 11-source historical cohort, with **no photos or embeddings uploaded as artifacts**.

### Explicit acceptance gates (do not mark green without evidence)

| Gate | Current evidence | Release determination |
|---|---|---|
| Owner must approve first garment | P843/P844 scripted browser tests; P845 integration regression | Safe research behavior only |
| No double save/cancel race | P844 real browser engine with controlled in-memory write | Safe research behavior only |
| Photo-quality advisory non-destructive | #73 real-source 11-photo descriptive diagnostics plus P845 source binding | Advisory only; precision unmeasured |
| Real garment category/subtype accuracy | #71 historical 13-garment audit: category 8/13 Chromium, 7/13 WebKit; exact supported type 4/10 each | **NO-GO** |
| Alternative supervised category/type accuracy | #67 M4 on historical set: category 9/13 vs its zero-shot model 12/13; broad subtype 6/13 vs 8/13 | **NO-GO: do not promote** |
| New blind independently labeled held-out original photos | 0 newly source-disjoint human independently labeled held-out samples in the available combined studies | **UNKNOWN/NOT MET** |
| Human-rated masks, colors, true footwear pair units | Verified independent adequate denominators not established | **UNKNOWN/NOT MET** |
| Real signed two-owner isolation / cloud / session revocation | Sibling Mission 3 branches still isolated; this CI is in-memory | **NOT PROVEN HERE** |
| Physical Android Chrome + iPhone Safari photo→review→closet | Scripted desktop engines are not physical phones | **NOT TESTED HERE** |

No legitimate inference of 10/10 recognition, family trial or full Mission 1 completion follows from synthetic fixture success or previously exposed photo tests. Do not unfreeze #255.

## Verified executable-head P845 results — November 12, 2026

**Functional exact SHA `f26a7c9cb0cf581710af2ef9551812cd73fbe494`** passed [NO DEPLOY GitHub Actions #43330919517](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43330919517): **all 3/3 jobs SUCCESS**, pinned P844 parent plus strict ten-path changed-file list. New combined **15/15 focused native tests**, complete **333/333 Node tests (zero failure/skip)** and both normal/research-preview app builds succeeded.

Actual Chromium & WebKit at **320/390/430 CSS px**:
- **6/6** original-photo advice/keep/retake/source+owner fences, feature off by default, no page errors;
- **6/6** P843 scanner cases block strong/broad prediction and direct automatic storage;
- **6/6** P844 original before-fix baseline reproduces **two** write attempts on double submit; candidate **6/6** makes **one** attempt and blocks Cancel/Remove/Escape/field edits during the write and supports failed-write retry;
- **6/6** inherited P841 owner-confirmed editor save paths succeed with zero browser errors.

Original lawful photographs re-evaluated from SHA-verified publisher sources: **11/11 downloaded originals** match frozen digests. Original near-uniform checker rejected **0/11**, the additional optional advisory flagged **1/11** limited-resolution image, **0/11** other quality pixel warnings. **No independent human quality labels (0), matched real retake pairs (0), newly blind human garment accuracy labels (0); recognition accuracy gain is UNKNOWN.** No private photos or original images are uploaded to CI artifacts.

P845 additionally fixes the #73 research-only advisory-retention problem: `purgePhotoQualityHints845()` removes ephemeral original source references when their draft is saved/removed, cropped, replaced or their signed-in owner changes. New source-executed tests cover these cases; combined full regression and browser acceptance is green.

**Document-only follow-up:** this report update does not modify executable code, but a new exact-final-HEAD no-deploy run must pass before marking the documentation SHA verified. Family Alpha HOLD #255 remains OPEN and release decision remains **NO-GO**.
