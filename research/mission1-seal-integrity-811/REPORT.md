# Mission 1 P811 — cryptographic integrity of prospective independent human source seal

**FAMILY ALPHA HOLD #255. DRAFT, UNMERGED, UNDEPLOYED.** Directly stacked on green P810 exact HEAD `d0419384542f3d05198a55d8d60c05c8184be781`, [successful no-deploy CI](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42959262359). Only offline researcher interface, browser QA, report and dedicated NO DEPLOY CI can change.

## Implemented

Before P811, the offline reviewer accepted any JSON with `photos` and any 64-character `sealSHA256`, even if the registered photo metadata had been altered. The blinded human annotator could spend time outlining a photo falsely described as belonging to the prospective cohort, only to have the signer later reject the forged seal. The UI now canonicalizes the complete sealed source registration with the same recursively key-sorted deterministic schema as `prospective-gate.mjs`, SHA-256 hashes that canonical body, and requires an exact match to its registered `sealSHA256` **before enabling original JPEG input**. Invalid/missing/tampered SHA, malformed or duplicated photo source identities and oversized cohort input are rejected. Existing P810 source leases ensure an old seal's async digest cannot supersede a newer selected seal.

In actual Chromium/WebKit synthetic browser tests at 320 and 390 CSS widths, a correctly canonicalized seal is accepted, its exact registered JPEG SHA validates, disconnected outer/hole mask annotations are exported, a stale original-photo decode after selecting another JPEG cannot re-enable controls, and a seal with a changed original JPEG width but the previous digest is rejected **before** original-image selection. The prior signed offline source-label adapter remains unchanged.

## Strict boundaries

This is a **seal checksum**, NOT a proof of independent photo rights, external coordinator signer's identity or pre-inference witnessed holdout enrollment. The actual external Ed25519 coordinator witness and human reviewer signatures are still checked later by the research evaluator; do not confuse this UI validation with independent audited ground truth. No real photo, person, new independently recruited annotator, certified IoU, physical mobile device, production or staging is involved.

Dedicated P811 CI must pass 2 jobs at exact HEAD: full app Node/native build regressions, strict four-path allowlist, both genuine Chromium/WebKit engines and 12 independently SHA-verified synthetic screenshots. **Do not claim completion until exact-head CI is green.** Mission 1 still requires real rights-cleared unseen photographs, blinded dual-human segmentation/category/type/color truth, representative held-out scoring, and physical-device acceptance.
