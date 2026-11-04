# REVIEW-SOURCE-SAVE-UNIFICATION-35 — coordinated source epochs and committed save receipts

**RESEARCH ONLY — NO MERGE, NO DEPLOY, NEVER MODIFY EXISTING STAGING OR PRODUCTION. Family Alpha #255 HOLD.**

## Why this research integration exists
Two independently verified research PRs were developed from the same verified SCENE-CLASS-TRUST-32 parent:
- [PR #590](https://github.com/nickhaney916-lang/Closet-Current/pull/590), exact source-epoch race baseline `a163fdf785466bf1b1e937aec6f87422824c6bee`, handles stale same-owner photo import/crop callbacks and authenticated owner/source epoch before queued writes.
- [PR #591](https://github.com/nickhaney916-lang/Closet-Current/pull/591), exact save-finality source `ca400c890c84ce751ff4e10d2d1c7e396905f7ad`, handles deep immutable confirmed-piece snapshots, cancel locking during commits, and honest postcommit notification/display-failure receipts.

Both changed `research/multi-garment-capture-01/review-ui.mjs` on **divergent research-only branches**. Neither may simply be assumed merged. This branch starts from the exact #590 commit and explicitly transplants #591's independently audited helper and acceptance coverage, resolving the conflicting UI changes while preserving all source epoch guards.

## Integrated behavior
- A new photo or invalidated account epoch makes all prior pending proof/decode, mask worker, crop-editor callback and queued storage preflight results stale, even for the *same* owner.
- A manually confirmed save deep-clones all reviewed facts and crop bounds before any async storage operation; category/type/color/crop/confirm/add/remove/cancel cannot mutate that snapshot during saving.
- The Cancel button is disabled while a commit is in flight. A trusted account/session invalidation can still revoke the old review; the source epoch and authenticated owner check fail closed.
- The original full-resolution JPEG and SHA-256 stay unchanged. The IDB transaction persists in the existing owner-named private store. Actual atomic commit is the persistence boundary; postcommit failed UI notifications or refreshes never display "nothing saved" or leave committed garments in a retryable list.
- No garment-class model, mask accuracy, image data, production UI, deployed staging, user accounts, 3D meshes, Supabase policy, other project or unrelated branch is modified.

## Evidence
A dedicated no-deploy workflow checks exact #590 ancestry and an explicit changed-path allowlist, builds the real app, runs **all inherited Node tests**, plus both formerly independent browser acceptance scripts in Chromium and WebKit at 320/390/430 viewport widths. **12 actual review UI/IndexedDB cases**, **18 independent PNG screenshots**, real WebCrypto original SHA and actual IndexedDB transactions. One suite forces a new same-owner photo then fires a late crop callback and trusted session invalidation during preflight; another forces stale user input/cancel during a deferred actual commit and intentionally fails the postcommit notification and refresh. All original images are locally generated synthetic JPEGs, with simulated worker proposals. This is not genuine SegFormer precision/recall or physical-phone/hosted-account acceptance.

Do not claim technical acceptance until exact-final-head workflow success and screenshot audit. Never merge/deploy this draft research branch; the main controller decides integration only after independent review. Parallel #27 owns model improvements and genuine annotated clothing accuracy.
