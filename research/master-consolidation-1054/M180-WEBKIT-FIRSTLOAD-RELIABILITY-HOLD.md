# MAIN1054 M180 — unmodified native WebKit first-load reliability gate (NO DEPLOY / HOLD)

## Exact parent and owned scope
- Parent/held Mission 4 M179 integration source: `38322b2c48e27f7b0d636395306a68777115487b`, draft #1210, never default `main`.
- Isolated branch: `research/main1054-m180-unmodified-webkit-firstload-gate-HOLD`.
- Only added files: this ledger and `.github/workflows/main180-unmodified-webkit-firstload-no-deploy.yml`.
- Family Alpha release #255 remains **OPEN/HOLD**; no merge, deploy, real-account access or hosted changes.
- This is a strict **reliability acceptance gate**. M178 draft #1250 separately owns disposable-worker error-versus-empty-mask diagnosis. M180 does not patch or duplicate that owner’s diagnostic, and it does not claim a model root-cause fix.

## Why it exists and why a single green result is inadequate
The original protected M177 7-job event #44025345373 failed **both** native WebKit attempts: one actual M58 Worker and then an independent P94 installed Worker were unable to produce the required 1–12 genuine proposals even with pinned public model HTTP 200. The separate M178 instrumented passes were baseline only. M179 7/7 passing is evidence of *one* accepted source, not proof against intermittent genuine first-load failures.

## Exact-source nonmock repeat gate
One no-deploy CI workflow runs **three independent, clean GitHub Actions WebKit jobs**, each with its own container and no cached inference, no mutated worker, no synthetic model result, no retries masking failures. Each job runs both:
1. **Original unmodified M58** `scripts/test-main58-actual-p88-wasm-browser.mjs`: licensed immutable Commons-0003 JPEG SHA, pinned real browser WASM + SegFormer, native owner review, zero unreviewed private saves, cross-owner refusal and same-owner byte-exact 2D restore.
2. **Original unmodified installed P94** `scripts/test-parallel94-native-p88-browser.mjs` at mobile-width 390: independent fresh WebKit process, genuine installed worker, native owner/review/outfit/restore and source/3D denial asserts.

Neither test’s model output, timeout, catch block, assertions or fitted-3D admission is modified. In particular, a zero-proposal, worker error, red native owner lifecycle or source mismatch **remains an immediate nonzero test failure**. Two actual browser processes per job × three fresh jobs = **six unmodified real-model browser journeys** if every stage executes; a failure can stop a job early, so count only witnessed runs.

Before execution the workflow checks exact M179 ancestry, intact product/test/worker SHA blobs, unmodified donor P88 import graph, private save/owner/2D/EXIF guards, and allows exactly the two M180 report/workflow paths changed from M179. The donor is extracted only to a disposable CI directory. The same pinned Playwright/WASM runtime and public model egress rules are inherited from the tested M58/P94 scripts.

## Acceptance / interpretation
- **M180 gate PASS:** all three independent jobs completed successfully; six genuine unmodified first-load inference/owner journeys executed with full source-safe assertions. Record exact SHA, event, run IDs and number actually executed. This supports this sample only, *not* a WebKit reliability guarantee or a fix of previous M177 failures.
- **M180 gate FAIL:** any one red job; preserve all failure evidence and M177 blocker. Do not retry-to-green or soften assertions to promote readiness. Pass a sanitized error classification to M178 owner if available; fix only on separately scoped evidence and rerun original seven-job protected suite.
- **M180 gate PENDING/NOT TESTED:** CI not complete or not launched; do not claim success.

## Not proven by this scope
Physical Android Chrome/iPhone Safari (neither WebKit desktop mobile viewport nor simulated touch count), independent true-garment masks/classification, photo-derived multi-category human wearable 3D, real hosted JWT/RLS/storage and four-owner cloud restore, owner release sign-off. No 100% Mission 4 or Family Alpha release based on this source-only gate.

## Next integration dependency
Do **not** fast-forward this workflow into the held Mission 4 branch solely because its workflow passes. First review its CI result beside independent M178 root-cause evidence, ensure no concurrent main research branch advance, and retain source-locked protected M58 seven-job acceptance as the definitive integration gate. #255 stays HOLD.
