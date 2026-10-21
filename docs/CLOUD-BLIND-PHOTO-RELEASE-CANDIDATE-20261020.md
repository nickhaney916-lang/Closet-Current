# Closet Current — isolated cloud/styling + independent photo-review integration candidate
**October 20, 2026 Pacific (repo CI timestamps may be October 21 UTC). Draft development only — do not deploy.**

## Pinned integration inputs

- **Customer safety base: draft PR #114**, `fix/cloud-db-owner-binding-20261020`, exact head `05f1bdf071a75e2bac2eaf9ecb66c2f1e63d7132`. This includes PR #112's owner/source-stable wardrobe styling, PR #110's original-mask palette evidence guard, and the older original-RGB camera, recognition and cloud checks.
- **Independent source-review input: draft PR #113**, `benchmark/source-holdout-human-intake-20261021`, exact head `71053247402d2e428044ef38b359057011335823`, stacked on PR #111. It introduces exactly **12 new research-only text files**, none of which overwrite customer runtime code, recognition models/vectors, photo masks, account storage or private user data. They were transplanted **by exact Git blob SHA** in commit `45765b19b8db2976ebd66907daa16856f680ac35`, not rewritten or re-generated. The shared `docs/PROGRESS-CHECKPOINT.md` is appended/prepended carefully to retain the full previous customer history rather than replacing it with a divergent branch's progress report.
- This PR creates an **isolated combined branch descending from #114**. Neither source PR was edited or merged; `main` stays unchanged. It does not imply PR #108's parallel broad integration audit was merged or superseded.

## Enforced integration checks

`scripts/check-blind-photo-cloud-integration.mjs` independently enforces:
1. All 12 imported files equal the frozen Git blobs from PR #113. Every important customer runtime file and Supabase migration/design source equals **exact PR #114 bytes**.
2. Changes relative to #114 are limited to the 12 source files, bounded audit code, the CI workflow, this document and a full-history progress checkpoint. No new trained recognition model, customer photo, deployed credential or hosted database setting may enter.
3. The original photo source-lock retains SHA-256 `0ba1fae03ac1021d6ae58ccf17cd32026aabaa73364cf78618ce1cf7212581d9`; all 13 original source identities and previously computed results are unchanged. The packet contains **zero human reviews**. Assistant labels, synthetic test fixtures and previous model predictions are **not human ground truth**. Recognition model promotion must remain **BLOCKED**.
4. Existing camera/cloud dual-source ancestry, human figure, original unclipped photograph, user-owned storage, wardrobe styling and release veto checks still execute, with only this explicitly source-verified set allowed by the additive historical source gate.

Dedicated `.github/workflows/cloud-blind-photo-integration-qa.yml` runs three jobs:
- **Complete Node suite + build** and 4-way cloud session/owned styling/new-source/review unit tests.
- **Android Chromium and iPhone WebKit emulation**: simulated account A to B cloud switch, stale database denial with zero network; save and reopen a new garment outfit with one-piece swaps; offline independent-photo human review form; mobile layout checks. No physical-phone testing.
- **Original-source fidelity artifact**: download the **pre-inference exact 13-photo original-JPEG archive**, validate each image hash, produce a still-blank offline review packet and an explicit zero-submission audit. It does not submit reviewer labels or claim independently verified ground truth.

## Release decision

This is a **candidate for developer review, not a production release**. Passing CI proves bounded integration works in the tested simulations and browser engines, not real customer cloud access, authorization policies, OAuth/SMTP settings, uploads, Cloudflare domain routing, physical-phone camera accuracy, independent human adjudication, or end-to-end real-person outfit satisfaction. The full branch integration/merge backlog still needs controlled conflict resolution and eventual approvals.

**Not authorized:** merging/deploying to `main`, changes to live Supabase/RLS/SMTP, paid AI, public customer storage access, external review requests without consent, or Drive Duel changes.
