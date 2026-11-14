# Mission 1 P880 — exact joint-top subtype or manual review

**Family Alpha HOLD #255 OPEN.** Standalone research branch / draft pull request. No production, staging, hosted Supabase, owner wardrobe, account, model-weight change, merge or deploy.

## Source-verified baseline
Immediate verified parent is Mission 1 [P879 draft #1093](https://github.com/nickhaney916-lang/Closet-Current/pull/1093), immutable HEAD `80da08efe40fea39474e1479696e9ef109f1a43f`, [2/2 NO-DEPLOY CI SUCCESS #43533340868](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43533340868): 608/608 native, six desktop Chromium/WebKit owner-review profiles, real FashionCLIP and FashionSigLIP q8 continuous 48 genuine original public JPEG photo comparisons with 48/48 P878 source/historical-manifest and recomputed-arbitration receipts, no automatic admissions or external requests. Previously P878: 87 model-backed choices; P879: 80 choices after 7 abstention shortcuts withheld. There were 11 cross-family subtype disagreements in 48 publicly DEVELOPMENT-exposed photographs. These are model policy coverage, NOT recognition correctness.

## Source-verified defect
With both model families agreeing on the same top subtype, the P879 owner panel still offered *multiple* clickable `Use` buttons for lower-ranked subtype hypotheses that appeared in both top-five lists. Example: independently top-ranked Shorts but both models merely second-ranked Skirt; interface could present both as equally owner-actionable. Example: both independently top-ranked Ankle boots, a known empirically confusing garment, yet Sneakers as a second-ranked shortcut. Merely overlapping lower ranks do not establish that an alternate subtype is the joint top hypothesis. Though existing owner consent and confirmation protect saving, the secondary model hint is not independently agreed top recognition.

## P880 engineering
`public/dual-panel-82.mjs` returns at most the ONE exact top subtype label shared by both models, only with no arbiter abstention or conflict and only if it passes existing empirical subtype confusion veto. If joint top is risky, show **zero** model-backed Use shortcuts; manual Adjust remains available. No owner photo save or automatic model admission added. No change to original JPEG, privacy, signed owner/epoch scope, model scorer/weights, normal recognition, cloud, pair or segmentation logic, 2D fallback.

Updated real owner desktop simulated-browser source checks for joint Shorts top with runner-up Skirt suppressed, known risky Ankle boots top with runner-up Sneakers suppressed, disagreement, cancellation/revocation, explicit owner review and cross-account safety. Added P880 synthetic unit tests and a real public photo audit with **frozen P879 source-level control**, verifying no new clickable shortcuts and that every retained suggestion is the exact jointly top-ranked low-risk label. Baseline 80 choices locked from P879 CI; numerical output is only **AI shortcut coverage**.

**Do not interpret removed buttons as reduced misclassification or higher accuracy.** A user can manually select a correct secondary subtype after examining the original. Development-exposed historical expected strings are NOT independent human truth.

## Verification
- `node --test tests/mission1-top-one-880.test.mjs tests/mission1-disagreement-879.test.mjs`
- `node scripts/test-p82-review-browser.mjs` desktop Chromium/WebKit at 320,390,430; physical devices are NOT implied.
- `P877_FULL_FRAME=1 node scripts/p82-real-browser.mjs chromium benchmark/p880-real-chromium` with licensed SHA-locked downloaded original source JPEGs and locked genuine q8 weights.
- `node scripts/p880-exact-top-risk-audit.mjs benchmark/p880-real-chromium/results.json benchmark/p880-real-chromium/top-one-risk-audit.json`.
- Strict 7-file isolation from exact P879 parent, complete native+build/browser no-deploy and separate genuine photo CI jobs.
- Release validator stays BLOCKED. No independent blind source-disjoint 60+ two-human labels, real continuous phone WebKit inference, real physical Android Chrome/iPhone Safari acceptance, signed owner-account cloud acceptance or 10/10 claim.

**NO-DEPLOY CI PENDING** until exact-head run succeeds. Family Alpha HOLD #255 stays active.
