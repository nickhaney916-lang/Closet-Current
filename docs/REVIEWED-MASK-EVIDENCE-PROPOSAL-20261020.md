# Closet Current — reviewed garment mask evidence proposal gate

October 20, 2026. Research only, stacked on draft PR #60. Do not merge, deploy or incur paid costs.

## Completed capability
The standalone scripts/prepare-reviewed-mask-evidence.mjs builds a manually auditable PROPOSAL only. It does not import approvals, authenticate reviewers, verify legal claims independently, or score images.

It hashes the original JPEG against BOTH locked manifests; parses original JPEG frame dimensions (not a resized canvas); requires the original exact-byte FIRST human draft together with its unmodified RLE in a distinct second-reviewed, model-blind native-grid mask, independently identified garment ID/category/form, distinct reviewer names, and a matching SHA-256 receipt. Three actual evidence byte files are required: human review proof, original-image redistribution-rights proof, and annotation redistribution-rights proof. Rights metadata must explicitly claim clearance for TEST redistribution.

It writes a new *.proposal.json file under artifacts/ only and refuses overwrites. The canonical benchmark/reference-mask-evidence/registry.json remains empty and unchanged. The resulting proposal includes a reference record in the existing independent verifier's format but declares that this tool has not authenticated identity/rights and cannot authorize production.

## Required inputs after genuine human review
Use the original licensed source JPG from the twelve-photo packet, the original first reviewer DRAFT JSON, an actually human-approved native mask JSON, actual review and rights evidence files, and a manually checked receipt. The receipt must have:
- schemaVersion: 1
- sourceId, sourceSha256, firstDraftSha256, approvedAnnotationSha256, physicalTargetId
- firstReviewer, secondReviewer, reviewDate (YYYY-MM-DD)
- review: {sha256: SHA256 of human review proof bytes}
- imageRights and annotationRights: each with sha256, status verified-for-test-redistribution, actual license and actual https sourceUrl.

Example command (replace each local file path with reviewed actual evidence):

    node scripts/prepare-reviewed-mask-evidence.mjs --source /local/commons-0001.jpg --first-draft /local/commons-0001-item-01.mask.draft.json --annotation /local/commons-0001-item-01.mask.approved.json --receipt /local/review-receipt.json --review-evidence /local/review-proof.bin --image-rights-evidence /local/image-rights-proof.bin --annotation-rights-evidence /local/annotation-rights-proof.bin --out artifacts/independent-mask-review/commons-0001-item-01.proposal.json

PR #62 additionally enforces the exact byte hash of the first-human draft in the receipt, checks every inherited field and the full original-pixel RLE across review, and rejects any second-review mutation to the garment boundary. Corrections must be made by the first person and submitted for a fresh second review. The offline proposal records BOTH draft and approved JSON hashes but still does not authenticate either person.

This metadata is not self-authenticating. Human/legal rights checks and actual first/second-person review are indispensable. Do not create fake approvals, invent reference masks, put customer files or sensitive reviewer identity evidence in GitHub, or confuse synthetic tests with actual masks.

## Remains blocked
- 0/12 original photographs have independently accepted human full-grid masks.
- Real-photo error/precision/recall remain unmeasured, not zero.
- A separate, carefully reviewed FINAL evidence-import procedure must audit proposal and referenced original proof bytes before changing the evaluator registry.
- Binary masks do not establish true transparent fabric alpha or realistic 3D occlusion.
- Physical Android/iPhone try-on remains unverified.

No change to high-resolution original-first recognition/indexing, clothing extraction algorithm, deployed assets, paid inference, or Drive Duel.
