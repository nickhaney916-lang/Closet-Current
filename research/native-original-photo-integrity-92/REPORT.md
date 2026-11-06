# Closet Current — Priority #92 — Native original-JPEG byte-level 3D admission

**Research only. Family Alpha Issue #255 HOLD. Never modify, merge or deploy production/existing staging.**

**Verified parent:** [Priority #91 draft PR #645](https://github.com/nickhaney916-lang/Closet-Current/pull/645), commit `6ee127e65ed4f29fb7fe6ab884cd16fb81885534`. Strict [dedicated no-deploy CI #42147142036](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42147142036) PASS: 836/836 Node, 12/12 pinned PR541 anatomical 3D tests, three real Chromium WebGL widths 320/390/430, and 17 independent browser screenshot audits.

## Defect and scoped remedy

#91 compares native owner-private original photo **SHA metadata** but does not independently compute a cryptographic digest over the actual stored JPEG bytes at 3D admission. If a stored original JPEG data URL changes but both recorded SHA fields remain the same, the metadata-only receipt cannot detect it. Such a source should never enter the genuine photo-textured 163-bone renderer.

NATIVE92 adds an owner-bound, bounded **actual WebCrypto SHA-256 digest of decoded original JPEG bytes**, not just source metadata. It checks owner ID, valid original-source SHA fields, canonical bounded JPEG data URL/base64, JPEG start marker and real hash equality. Original bytes remain inside the original authenticated native-wardrobe controller, are never returned, uploaded or logged through this new receipt, and are not used as a secondary write path. This attestation is independently repeated **after the native auth lease and before dynamic donor import**, then **after the WebGL model load and before the final saved-source preview is selected**, catching common admission-time async integrity races.

To avoid expensive continuous rehashing on every 3D status read or animation frame, visible-scene source ID, category, subtype, colors and SHA metadata continue to use #91's conservative synchronous revocation gate. Unchanged-SHA data tampering that occurs **after the second attestation while the scene remains visible** would not be detected without fresh cryptographic attestation; this is a known limitation, not a continuous photo integrity promise.

The original rendering donor, 163-bone body, saved outfit controller, source photo assets, cloud backup, production UI and authorisation policies remain unchanged. Parallel Work #90's new photorealistic fabric-drape investigation is out of scope.

## Required independent acceptance

- Pure independent Node tests use genuine locked licensed Commons JPEG bytes, verifying exact SHA, forged original photo under same garment ID and unchanged SHA, owner mismatch, source SHA fields mismatch, invalid/malformed or oversized JPEG data URLs, non-JPEG bytes, unavailable browser WebCrypto, no leaked returned JPEG and no private source mutation.
- Real 390 CSS pixel Chromium test edits actual account-A private IndexedDB under an existing saved outfit's garment ID: insert **a different licensed JPEG** while keeping the original SHA metadata unchanged. Refresh owner wardrobe, confirm #91 metadata still passes, require original-photo WebCrypto reject before donor/WebGL import, ensure no private photo remains displayed, saved outfit/owner unchanged, and restore original bytes. Then run existing #88 donor-import race, #89 post-open saved selection revocation, #91 valid photo+SHA replacement and actual anatomically correct original-photograph 163-bone WebGL with real mobile screenshots at 320, 390, 430.
- Original 15 WebGL screenshot SHA audits and #89 and #91 one-shot cleared-view audit retained; one new negative-integrity screenshot independently audited to actual licensed photo manifest. Strict changed-file exact-parent no-deploy workflow, full inherited Node tests and pinned original 12 donor tests.

**Limits:** This protects photographic byte integrity at 3D **admission**; it is NOT scientific AI detection/category/color accuracy, 10/10 photorealistic garment quality, live signed-cloud RLS, or physical Android/iPhone hardware acceptance. No ungrounded pass claims before final exact-head CI. Historical older workflow ancestor scope checks remain independent merge blockers and must not be bypassed.

**Engineering verdict: PENDING exact final no-deploy CI; release readiness: HOLD.**
