# DETECTOR-PROPOSAL-NATIVE-ACCEPTANCE-57 — final atomic crop-review gate

**Research HOLD; never merge or deploy.** Exact verified parent: SAFETY55 `77af898d0cf67f963d13f487da1ecfe2e96fe035`, [SUCCESS no-deploy run #42042431250](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42042431250), 626 Node / six browser flows / 60 screenshots.

## Actual defect and correction

SAFETY55 correctly guarded the native review UI and final click-to-save handler against unreviewed automatic SegFormer crops, but the underlying `verifiedRecord24()` atomic row constructor still checked `piece.manual&&!piece.cropReviewed` and would allow `confirmed:true, manual:false, cropReviewed:false`. A bypass or future caller of `atomicSaveGarments24` could therefore persist a model-detected crop as if a human had reviewed it.

DETECTOR57 changes the **last immutable row-construction boundary** to demand `piece.cropReviewed===true` for BOTH manual and automatic regions. This is independent of claimed model confidence, scene person evidence, category, color, or the calling UI. Two adversarial Node tests verify failure of unreviewed direct record/transaction requests, zero partial writes from mixed batches, and acceptance of explicitly reviewed pieces. No other source photo, owner auth, storage schema, 3D, or model logic changes.

## Real native user flow with untrusted detector message replay

A new Playwright-only `DETECTOR57=1` mode injects a deterministic fake *worker message* through the normal app `Worker.postMessage/onmessage` channel at the original JPEG capture moment. It **does not** call app review functions or alter owner IndexedDB. Synthetic region: `seg-0-100-100-700-700-1`, valid bounding box, category Tops, color Blue, max uncalibrated model score 1, and affirmative person flag. This is deliberately adversarial: even a plausible prefilled identity must not bypass crop review.

Per real Chromium/WebKit browser at 320/390/430, the native original JPEG is source-hashed against the locked license-backed image. Before any crop editor interaction: the model region displays as `unreviewed`, warning is visible, a manually entered valid subtype still cannot enable confirmation, Save is disabled, owner IndexedDB contains zero garments. The real crop editor Save crop transitions to `reviewed` but not `confirmed`; the human then chooses/accepts taxonomy and color and confirms. Two other manually marked reviewed pieces join the actual native batch; the fully saved owner-private wardrobe drives one real Style look, outfit editing, duplicate rejection on reimport, V4 backup and restore, and account-B isolation. Screenshot SHA, dimensions and source SHA are audited.

This does **not run a real SegFormer model**. Worker responses are synthetic, not an accuracy sample. Raw SegFormer remains 22.2% precision, 41.7% recall on 24 frozen single-reviewer boxes in parallel #35 PR #612. This priority verifies the native detector-response to human review and atomic save *safety boundary*, not improved automatic detection, same-class instance separation, real mobile device performance, or account-cloud E2E.

## Final acceptance criteria

- Strict no-deploy changed-file audit against exact verified SAFETY55 parent.
- Build and full inherited Node suite including final transaction adversarial tests.
- Six original manual three-piece native private browser regression cases.
- Six synthetic-worker native auto proposal → real crop review → source SHA → private wardrobe → outfit → backup/restore → owner isolation Chromium/WebKit × 320/390/430.
- 72 synthetic-message native browser screenshots, source and screenshot SHA audits, screenshots of unreviewed model regions and explicit blocked confirmation.
- No customer photos, real accounts, merges, or production/staging changes.

**Verdict** must distinguish engineering pass from scientific detection NEEDS REWORK. Family Alpha Issue #255 stays HOLD. Evidence depends on exact-head CI completion; no pass is asserted without it.
