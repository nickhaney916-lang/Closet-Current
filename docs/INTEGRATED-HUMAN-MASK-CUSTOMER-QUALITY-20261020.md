# Closet Current — customer + original-photo human-mask integration
**2026-10-20 · controlled draft integration only**

## Complete integrated development lineage

This is a genuine Git **two-parent merge commit** `b8adbe5beb1a31593b61af8a4fdd5d0028b3665b`:

- Parent 1 = `36d55cccb782d012885d7fd970804826b9262208` (customer integration and in-house fitting, draft PR #82, incorporating #81, #80, #79, #78, #77, #74 and #69).
- Parent 2 = `4acc449a5292f8254fdc1d4edf90520ca053c079` (model-blind, two-independent-reviewer native original-grid UI and validations, draft PR #76).

The common ancestor is `8d009ec056f8b7178185efb422beb94cd085a07c`. Git blob/SHA inspection before the merge identified exactly **50 human-only review files**, **5 matching changed shared files**, and **8 divergent paths**. The 50 review files were transplanted **byte-for-byte via original Git tree blob SHAs**; the five already-matching files remained identical. For the eight divergent paths, **the most recent customer branch won**, because its changes contain newer color/indexing, styling, source-guided fitting, mobile previews and tests. The provenance gate `scripts/check-dual-parent-review-integration.mjs` audits exact parentage and verifies every one of these decisions against real Git objects. No customer files were reverted, and human-review editors/evidence are not silently stubbed.

### Eight conflicting paths explicitly resolved in favor of customer implementation

- `public/index.html`
- `scripts/test-reusable-figure-phone-browsers.mjs`
- `tests/source-guided-mask-refinement.test.cjs`
- `scripts/benchmark-source-guided-boundaries.py`
- `scripts/measure-source-guided-boundaries.cjs`
- `.github/workflows/reusable-figure-local-preview-qa.yml`
- `.github/workflows/source-guided-boundaries.yml`
- `docs/PROGRESS-CHECKPOINT.md`

These were **integration choices**, not approvals of garment quality. No unreviewed mask, classification result or synthetic browser gesture was promoted to human truth.

## Real-photo accuracy and first genuinely usable worklist

The **12 SHA-locked original, licensed fixture photographs** are available in `benchmark/fixtures/`; the source manifest `benchmark/local-fitting-real-photo-manifest.json` documents visible garment hazards. Exactly **0 genuinely approved independent native-grid full garment reference masks** exist. The human reference registry `benchmark/reference-mask-evidence/registry.json` is empty and proposed-unapproved.

- `scripts/check-integrated-real-photo-readiness.mjs` verifies **each original image's actual bytes, source SHA-256, native JPEG pixel dimensions and locked source roster**.
- It uses `auditReviewHandoff` to check local first-human native-grid draft and distinct second-human review files, then creates `artifacts/private-human-review/integrated-status.json` (honest **null** IoU/false removal/false inclusion/boundary metrics) and `integrated-status.html` (private reviewer worklist with exact originals and two offline editor links). It never authenticates reviewer names or rights and never imports labels.
- Run with a **local folder containing only real human .mask.draft.json and .mask.approved.json**:
  ```bash
  mkdir -p artifacts/private-human-review/incoming
  node scripts/check-integrated-real-photo-readiness.mjs --reviews artifacts/private-human-review/incoming --out artifacts/private-human-review/integrated-status-01.json
  ```
  Use a **new output filename** each time to protect prior human-review evidence. The input and generated reports are ignored by Git; reviewer identity files must remain private.
- `python scripts/stage-independent-twelve-mask-review.py` builds the original unmodified JPEGs, source attribution/rights warnings, `FIRST-REVIEW.html`, `SECOND-REVIEW.html`, `FIRST-ANNOTATE.html`, and `SECOND-APPROVE.html` as an **offline, model-blind review packet** under `artifacts/independent-mask-review/`. GitHub Actions archives that *licensed research packet* with only source photos, **no real customer uploads and no personal human draft files**.
- **Review steps:** have one real human open the FIRST-REVIEW worklist and independently draw ALL visible fabric at the full original native image dimensions, assign the real separate physical garment/form, and export the raw first draft; a **different** real human opens the exact original and prior draft in SECOND-APPROVE and independently checks all garment boundaries. Any correction must return to the first person and be re-reviewed.
- Human legal/rights and identity provenance must then be audited independently; only a reviewed, approved registry entry and suitable proposed measurement output can enable reliable actual real-photo boundary comparisons. Existing `benchmark/verified-mask-quality.mjs` exposes the strict mask-quality evaluator, but current authentic accuracy metrics remain **unmeasured** (not 0%, 100%, or a success rate). A synthetic first/second pair cannot unlock it.

The first independent masks must be genuinely drawn and approved by real people with evidence. No code can complete this real-human step by itself. Source-photo labels and synthetic pixel proxies do not solve that dependency.

## Combined verification and release rules

`.github/workflows/integrated-human-mask-review-qa.yml` runs:

1. Byte-for-byte dual-parent Git merge verification (50 transplanted, 8 resolved, 5 matching)
2. Build and the **entire** Node garment, UI, figure, recognition, account safety and human-mask tests
3. Actual SHA-verified originals against the manifest; private local-only reviewer progress HTML and accuracy=null report
4. Python twelve-original reviewer packet and packet-validity tests
5. Actual Chromium human-annotation original-grid editor, second reviewer, mobile paint, pan, multi-touch, sparse undo and async source switch tests
6. Mobile Chromium/WebKit male/female local fitting, high-res figure, source contamination and real licensed-photo **HOLD** tests
7. End-to-end Style My New Clothes and owned-only outfit save/reload in Android Chromium and iPhone WebKit
8. Release gate denying paid inference, unapproved figures, fabricated accuracy, real-phone completion or production approval.

The screenshot/artifact evidence is **browser emulation**, not a physical phone or authentic human segmentation label. The production rights and native male/female figure master assets remain unapproved for launch.

## Do not merge/deploy yet

This PR is intentionally stacked on #82 and isolated from `main`. The branch integrates review tooling and supplies the right human worklist and reusable scoring safeguards but **does not** claim real-photo accuracy, legal approval, true garment realism or physical-phone performance. No new paid services, customer photo uploads, fabricated reviewer signatures, or Drive Duel changes. Production merge requires an explicit release decision after real human and physical-phone validation.
