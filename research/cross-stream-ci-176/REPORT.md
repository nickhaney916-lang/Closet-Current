# Closet Current Main P176 — cross-stream original photo 3D CI reliability

FAMILY ALPHA HOLD issue #255. Source branch starts from P175 verified exact HEAD ed37811efd44c9920c5c67bc743e34911a57b578, PR #735. This P176 branch modifies exactly seven research / CI-only paths; it does not modify production/staging, public code, hosted cloud, private user originals, the P175 photographed dress or P174 photographed shirt, source 163-bone rig, or parallel Work assignments.

## Root cause

Three original-feature GitHub Actions pull-request workflows NATIVE-INDEX-LIVE-07, NATIVE-RESTORE-3D-06 and NATIVE-PHOTO-READINESS-08 compared the ENTIRE history of cumulative research branches against ancient separate source bases (PR559, PR557, PR561). They immediately rejected unrelated historical workflow and geometry files such as allowlisted-review-snapshot-78-no-deploy.yml before reaching their functional browser tests. Their original restricted-scope assertions are correct for their original isolated feature branches, but their red status is misleading for later stacked integration PRs.

## Correctness-preserving fix

Keep every prior original workflow SHA pin, blocked public/cloud/owner file list, and real browser assertion unchanged. Add an explicit read-only scope-check job to each legacy workflow. It securely compares the immediate PR against its ACTUAL base commit (merge-base diff) and runs the original full fail-closed legacy workflow only when the PR actually changes that workflow's original authored feature source (index, backup/restore or photo-readiness). Manual workflow_dispatch always runs the original. Any unknown/unsafe paths or missing SHA cause the classifier to reject rather than silently skip. Shared later native 3D bridge research paths are tested by this P176 new cross-stream acceptance, not falsely measured against historic original untouched code.

The NEW P176 no-deploy CI tests all three workflows' ACTUAL consumer functionality together against the unchanged P175 latest branch:
- Index: exact original Commons JPEG, human subtype/color review, current private owner closet, unsaved new item, V4 source recovery, real 163-bone WebGL, account isolation, 18 independently SHA-verified phone viewport screenshots.
- Restore: original JPEG atomic V4 export/import/rollback and recovered owner 163-bone 3D isolation, 15 screenshots SHA verified, live preview replacement denied.
- Readiness: actual original photo readiness, no arbitrary fake 3D, foreign-owner/logout protection, 24 genuine WebGL photo readiness screenshots and 15 untouched source JPEG original photo-only/review classification with nine separate review screenshots.
- Exactly seven file research scope, P175 immutable parent, adversarial applicability classifier tests and all inherited Node regressions.

The 3 actual browser suites use Playwright Chromium 320/390/430 CSS pixels and the exact pinned original donor P541 df6885d6011cb33fb22dceb81a08f35a0ac4dd61. Synthetic Auth HTTP response fixtures are NOT hosted real Supabase / JWT / signed RLS; actual physical Android/iPhone remains untested. The original photographed back is inferred. No arbitrary private camera photo-to-3D photorealistic reconstruction is claimed.

## Completion gate

Only call P176 complete if the new exact-head scope/full-Node job and the three independent actual original source private browser/WebGL matrix jobs PASS; the three old original isolated feature jobs must classify the P176 changes as inapplicable rather than false red, without any of their historic stop guards removed. No release, deployment, production/staging mutation, family invitations or merge.

## P176 current canonical original-photo UI test migration
The original INDEX-LIVE-07 and PHOTO-READINESS-08 browser harnesses were written before today's required owner photo review gate (the P120/P167 confirmed category, item type, color and single-garment original-source checkboxes). An independent P176 run reached the actual save but timed out waiting for an item the original app intentionally did not save without those checkboxes. P176's disposable CI-only browser adapter now **checks the two real UI controls after the existing human-style Tops/T-shirt/Red corrections**, requiring visible, checked confirmation. It does not change app logic, commit hidden confirmations, suppress errors, or change any original photo SHA or account checks. The other original per-feature benchmark scripts remain immutable in the source branch. The P176 strict scope allows this eighth research-only adapter and correct first-parent-from-P175 lineage across verification/fix commits.

## Real browser SHA audit false-positive correction
P176 genuine readiness Chromium actually PASSED its own browser and photo audit on first functional execution, but the new combined SHA wrapper incorrectly required all 24 screenshot content digests to be unique. Independently inspected archived results prove exactly three legitimate duplicates at 320, 390 and 430 CSS px: stage 06-B-private-missing-source-fallback and stage 08-B-private-missing-source-readiness deliberately render the identical foreign-owner-safe fallback at each width. The cross-stream wrapper now checks **all 24 original PNG SHA/width receipts**, all 24 unique stage+width identities, and permits duplicates only for this exact two-stage pair at the same width. It requires precisely 21 distinct hashes. Any other repeated screen or fabricated original/source/owner data remains a hard fail.
