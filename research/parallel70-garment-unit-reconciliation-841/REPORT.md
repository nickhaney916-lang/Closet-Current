# Parallel #70 — P841 source-bound footwear and garment-unit reconciliation research

**FAMILY ALPHA HOLD #255. DRAFT / UNMERGED / UNDEPLOYED.**
Exact P840 parent: `c44166443e52ac7487ea84d8218098ff629610d2` (PR #922).
Changes belong only to the isolated `research/parallel70-garment-unit-reconciliation-841-HOLD` branch.
No private photos, external owner accounts, hosted Supabase, staging, production, weights or family alpha access.

## What this milestone actually implements

1. `public/garment-unit-reconciliation-70.mjs` is a deterministic, pure **review proposal** adapter. It has three distinct statuses: `suggested_pair`, `distinct_items` and `uncertain_requires_review`. Each result retains **all observed region IDs**, source-scoped identity, confidence-limited reason and `saveAuthorized:false`. Original JPEG source ID is not falsely advertised as a verified SHA; any supplied 64-hex SHA is recorded as unverified until independent source attestation. Image bytes are never included in returned diagnostics.
2. Pair hints require exactly two connected shoe components with similar source-region size/alignment, compatible reported color, non-clipped bounds, non-overlap and no conflicting subtype. This is a **weak visual heuristic**, never a human label or owner consent. A lone shoe, unknown color, disagreeing boot/sneaker evidence, cropped component, multiple apparent pairs or overlapping regions stays in review without an invented item count. No matching algorithm silently merges or discards sources.
3. The opt-in P840 source worker now includes `instanceMethod`, `instanceIndex`, `requiresReview` and `requiresPairReview` **inside the already-persisted segment hint**, so the actual capture queue can retain the separation provenance. Default worker mode remains unchanged.
4. The P840 connected-component adapter no longer drops small-but-previously-accepted shoe mask pixels. Insufficient small islands are grouped as `unresolved_footwear_fragments`, specifically for human review. This is a preservation repair, not new detection or validated human instance counting.
5. `validateOwnerUnitDecision70` checks explicit owner action and source/region membership. It returns **no save authority** even on approved grouping, because existing camera→review→private-closet admission remains a separate mandatory operation.

## Evidence and limitations

Tests use actual source segmentation grouping, actual worker event source, and actual capture adapter with artificial source logits / test JPEGs. Cases include two shoes, one shoe, mixed colors/types, four shoes, clips, overlap, malformed bounds, size and position mismatch, separate matching-color shirts, invalid/foreign IDs, explicit confirmation, original-image preservation, and no dropped already-accepted shoe pixels.

**Not yet completed:** source-disjoint human-labeled original-photo pairing benchmark, true mobile Chromium/WebKit owner-interface pair/unpair flow, both shoe images in a single owned pair record, owner-confirmed per-instance decisions, independent precision/recall, realistic phones and full user-journey acceptance. The adapter is **not yet invoked to collapse the existing captured-photo queue**; doing so before the new pair/unpair review UI would silently change wardrobe semantics and is prohibited. The P840 option is still OFF by default.

**Important:** A source ID identifies a capture session, not a cryptographic source identity. No real-photo ground-truth accuracy is claimed. This milestone cannot be called a completed #70 mission or satisfy family alpha.
