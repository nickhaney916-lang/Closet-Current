# Closet Current — consolidated, unmerged pilot candidate

**Checkpoint:** October 19, 2026 — research and internal family pilot preparation ONLY.

## Branch and dependency chain

This branch is stacked on [draft PR #27](https://github.com/nickhaney916-lang/Closet-Current/pull/27), which includes the [PR #21](https://github.com/nickhaney916-lang/Closet-Current/pull/21) integrated original-photo-first garment recognition and account-bound two-garment AI try-on, plus the SHA-locked recognition audits and privacy-safe photo-review tools from drafts #22–#26. PR #21 itself includes prepaid two-garment provider-contract software, signed job tokens and stale owner/garment protections, without enabling a paid model.

The only production-main difference detected at branch creation was `public/trend-data.json`. Its latest verified `main` version (updated **2026-10-19T15:11:36Z**, next refresh **October 26**) is copied exactly into this pilot branch, with 7 current trend sources, 11 product references and 11 retailers. The `main` branch was **not modified**.

## What the GitHub suite establishes

- **Full Node regressions and static build**: garment source photo preservation before clipping, type/color indexing and safe review, duplicate/overlap protection, outfit builder, ownership and original photo restoration, versioned trend catalog, signup notice, and AI contract identity safeguards.
- **Local Deno backend**: prepaid two-pass API contract and local HTTP entrypoint regressions. No customer project changes or actual hosted inference.
- **Chromium/WebKit browser emulation**: actual built app, original-source clipping handoff, synthetic whole-outfit garment save/reload, Style This with owned closet items and one-piece swaps, simulated auth recovery and consent, cancel/retry, and top+bottom provider call lifecycle with all responses intercepted. Synthetic mask results are **not** real segmentation accuracy.
- **Release block**: independently assessed real physical phone results and live paid provider fabric/color/details remain unavailable, and all recorded release/paid activation flags must remain false.

### Genuine pilot acceptance still requires

1. The owner to approve a **controlled, private staging environment/deployment** after the code changes are reviewed. No preview site or deployment is created by this branch.
2. Real Android and real iPhone users to test device camera, permissions, true original RGB recognition, long-sleeve shirts vs outerwear, shoes/high tops, skirts vs shorts, whole-outfit layers, real account login/storage, save/reopen, and readable touch controls. Use [the actual-phone checklist](PHYSICAL-PHONE-PILOT-VALIDATION-20261019.md) privately.
3. Actual independent photo-ground-truth review and approved masks for fully separate layered garments. This is absent; 16 licensed original holdout images are not a representative physical-user inventory.
4. Separate **explicit cost approval** for hosted paid model inference, then provider-specific two-pass quality/fabric/face-consent evaluation with spending limits. No paid provider has been called.
5. Privacy/terms review and a deliberate go/no-go decision before any wider invitation or public deploy.

**Branch rule:** Never merge or deploy this pilot candidate, enable a billable service, or change Drive Duel without explicit owner approval. A passing test is only a technical pilot-*preparation* checkpoint.
