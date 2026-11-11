# Mission 1 P812 — coordinator Ed25519 prospective seal witness, offline human original-photo review

**FAMILY ALPHA HOLD #255. DRAFT, UNMERGED, UNDEPLOYED.** Directly stacked on green P811 exact head `3825cdb8263a9327dcb12a60ee2c19136743caa9`, [successful no-deploy CI](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42960142317). Only offline human reviewer HTML, research browser harness, NO DEPLOY workflow and report may change.

## Reason for this checkpoint

Before P812, the prospective offline blind reviewer UI validated `sealSHA256` and source JPEG identity, but accepted a newly computed SHA for an arbitrary registration JSON with no coordinator evidence. The existing independent prospective holdout evaluator requires that the **pre-inference** registration was signed by an enrolled coordinator Ed25519 key using the payload `{purpose:'register-before-inference',sealSHA256}` and its canonical signed-message domain. The UI formerly did not verify that signature until its separate evaluation stage.

## Implemented research integration

The offline UI now requires three files: the prospective seal JSON, separately enrolled reviewer **public**-key registry JSON, and coordinator's pre-inference witness JSON. SHA integrity and exact registry SHA binding are checked before the coordinator witness. The browser extracts a recognized Ed25519 SPKI PEM coordinator public key, rejects duplicates among coordinator/reviewer keys, builds the same signed message as the prospective evaluator (`closet-current-M1-v1:` + SHA-256 of the canonical payload), and checks the witness signature with native browser WebCrypto Ed25519. A missing, invalid, mismatched or replaced witness/registry keeps the original JPEG input, photo controls and unsigned human label export inaccessible. Source-switch leases also invalidate pending asynchronous verification; no private key or original JPEG is sent to any service. Unsupported WebCrypto Ed25519 **must fail closed**, not silently fall back to unauthenticated annotation.

The CI browser fixture generates ephemeral synthetic Ed25519 keys, creates a synthetically signed seal/witness, checks the exact positive signature, deliberately corrupts the signature, and requires the browser to reject it. It also retains the P809 inner hole / original pixel RLE, P810 stale decode, and P811 tampered/undersized seal regression cases at 320 and 390 CSS width in both Chromium and WebKit.

## Boundaries and verification

This verifies a signature **against the uploaded public-key registry**, not whether the key actually belongs to an independently recruited coordinator, whether that registration was externally timestamped before model inference, whether users have image rights, or whether the annotators were real distinct blinded humans. Those require separate audited registry enrollment/chronology and human input. **Never claim real unseen human ground truth, mask IoU, on-device SAM2 or Family Alpha acceptance from the synthetic test actor.**

Run the dedicated exact-head NO DEPLOY Actions workflow: 4-path isolation, full Node/build regression and browser tests with 16 independently SHA-verified screenshots. **Do not claim completion before green final-head CI.** Mission 1 remains incomplete pending independent rights-cleared unseen cohort, two independent human masks and category/subtype/color truth, actual model precision/recall, and physical Android/iOS browser acceptance.
