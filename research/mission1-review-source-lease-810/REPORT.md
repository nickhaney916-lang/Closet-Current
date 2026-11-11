# Mission 1 P810 — prevent stale original-photo verification in prospective blind human reviewer

**FAMILY ALPHA HOLD #255 — DRAFT, UNMERGED, UNDEPLOYED.** Stack directly on independently green P809 head `fd3d16d10a1083cd327365303130b8f5a06e9068`, [verified full and actual Chromium/WebKit checks](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42957212793). No public app, private owner photo, model, cloud, benchmark or release changes.

## Actual problem and source-integrity correction

The offline human-reviewer's asynchronous `file.arrayBuffer()`, `crypto.subtle.digest('SHA-256')` and `HTMLImageElement.decode()` formerly could finish after a reviewer replaced the source JPEG or switched sealed photos. The old verified-image completion could re-enable annotation and export controls while a *different selected file* was on screen. This is dangerous for immutable source-pixel independent masks even if the later signing adapter independently rejects a mismatched source.

The reviewer now gives every source file/registration change a monotonic cancellation lease, snapshots the exact source record and File object at start, re-checks the lease and source identity after each async stage, and only enables annotation after the *currently selected* original JPEG digest and dimensions pass. A late result has **no authority to set verification status, draw old source pixels, or export annotations**. The file-backed object URL is revoked even if decoding was already underway when the source was replaced. Loading a new seal invalidates any old seal/photo while it parses, avoiding an old registration identity after a malformed upload.

The targeted test deliberately freezes a real browser image's decode, swaps the JPEG input, then releases the stale promise. It asserts that export, garment capture and hole tracing remain disabled, the SHA verification proof remains absent, the orphaned blob URL was revoked, and zero external HTTP requests occurred.

## Required exact-head acceptance

Dedicated `.github/workflows/mission1-review-source-lease-810-no-deploy.yml` gates only four human-reviewer research/CI/report paths on the exact P809 parent; full application Node/native build regression and actual Chromium/WebKit mobile 320px/390px event races; eight independently SHA verified synthetic QA screenshots. **Do not report PASS until final HEAD CI concludes successfully.**

This fixes review-tool integrity only. The test image, reviewer actions and all screenshot evidence are synthetic. **Actual trained recognition accuracy, real human-independent blind labels, rights-cleared unseen photographs, mask IoU, and physical phone acceptance are still NOT verified.** No synthetic event is counted as a human review, and no release is authorized.
