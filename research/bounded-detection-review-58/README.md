# BOUNDED-DETECTION-REVIEW-58 — Mobile detection flood resource containment

**Research only / Family Alpha #255 HOLD / no merge or deploy.** Exact inherited verified DETECTOR57 HEAD `f2aaf736f19213c2dadc25ad0d12bcc575129ee0`, [dedicated no-deploy success #42045305005](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42045305005) (628/628 Node, 12/12 native browser, 132 screenshots). Parallel #36 independently owns actual instance segmentation model accuracy; this priority does not alter model weights, source privacy or accuracy numbers.

## Issue

An automatically returned `piece` worker message was immediately queued into the native UI for crop generation, high-resolution JPEG encoding and an entire review-card redraw. There was **no** maximum on worker proposal count, number of automatic cards, number of total UI cards or hint metadata held in live review state. A misbehaving semantic model returning repeated fragments could exhaust phone memory or freeze the app long before the existing 24-piece atomic save boundary. Workers could also send bulky arbitrary nested metadata and retain it in the review panel.

## Mitigation

- `intakeProposal58` validates and bounds worker data before JPEG crop generation and DOM rendering. Only tiny bounded segment identity, normalized finite crop, sanitized known category/type/score/clipping hint, boolean person flag and a known-color suggestion enter UI state; arbitrary worker fields never enter state.
- Limit **128 received detector proposals** per original source, **12 accepted automatic regions**, and **24 total review regions**. Preserve room for human Add missed piece and manual correction, and never suppress distinct same-category overlapped garment instance IDs just because their boxes overlap. Duplicate IDs and invalid crops are dropped.
- Add and plain-backdrop manual suggestions stop at 24 review cards. A visible concise status reports excluded automatic proposals instead of falsely claiming all pieces were found. Users can remove incorrect regions and manually add missed garments.
- Each accepted automatic crop remains `cropReviewed:false` until explicit crop-editor Save crop, with human taxonomy/color confirmation, and the immutable final writer also requires `cropReviewed===true`. Atomic owner IDB, original SHA-256, duplicate and V4 backup/restore unchanged.
- An isolated `DETECTOR58=1` Playwright experiment sends **1,000 intentionally synthetic plausible untrusted detector messages** per original JPEG through the actual native Worker message interface, asserting 12 UI auto regions and 988 rejected messages, then user removes extras, marks two other real regions and saves the source-provenance-protected private wardrobe. All app UI, source proof, saved board, duplicate and restore mechanisms are genuine.
- Retest six normal native Chromium/WebKit mobile browser workflows, six earlier detector-single-proposal workflows, and six high-volume flood workflows at 320/390/430 CSS pixels. Source + screenshot hashes audited in a no-deploy GitHub Actions workflow.

**Scientific limitations:** This is adversarial resource resilience, not a real SegFormer accuracy improvement or physical Android/iPhone acceptance. Genuine PR #612 SegFormer precision 22.2%, recall 41.7% on 24 single-reviewer bounding boxes still NEEDS REWORK; no new category/subtype/color or instance accuracy claim. No customer photographs or accounts touched.

**Exact-head acceptance:** Strict research-parent file allowlist, full Node regression, 18 browser flows, 78 new flood-mode screenshots, SHA evidence, and no network uploads. A run only counts after actual SUCCESS; until then engineering remains pending.
