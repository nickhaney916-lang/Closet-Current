# Recognition enrichment admission gate — issue #223

Source reviewed: PR #220 commit `0f62e253c1fd0024a939cd401710dcd3784a9e77`. This is a source-evidence audit, **not a new model benchmark**.

## Existing work to reuse
- `benchmark/ORIGINAL-PHOTO-FIRST-INDEXING-CONTRACT-20261018.md`: classify from unmasked original-RGB recognition crops, with original scene retained for context. Display composites are never classifier inputs.
- `benchmark/NEXT-MODEL-DECISION-GATE.md`: SegFormer/MODNet comparisons already explored; model agreement does not establish ground-truth segmentation.
- `benchmark/ISSUE-211-OFFLINE-RECOGNITION.md`: 59 licensed fixture records with source hashes and diagnostics; color estimates on 43/59 require review. Fixture originals are not necessarily native camera originals.
- `benchmark/issue201-results.json`: outfit mechanics checks use **synthetic 2x2 swatches**, not human clothing photos. These are useful for logic regression, not proof of garment fidelity.
- `benchmark/local-fitting-real-photo-manifest.json`: **zero independently approved reference masks**.
- `benchmark/figure-readiness/production-policy.json`: avatar art status remains `proposed-not-production-approved`; commercial rights and visual review still required.
- `scripts/check-customer-pilot-release-gates.mjs`: explicitly blocks interpreting technical CI as human/physical-phone/rights acceptance.

## Required candidate admission evidence
Each third-party dataset, catalog or model needs a separately reviewed record containing:
1. Model architecture and precise weights revision; architecture license **and** weights license.
2. Training data rights, underlying photograph rights, annotation rights, commercial-use permissions, attribution and redistribution constraints.
3. Any outbound photo transfer, account data exposure, tracking, paid endpoint, or runtime download.
4. Offline inference footprint: model bytes, cold-start, median and p95 time, memory peak and failure/abstention rates on supported mobile hardware.
5. Same-source paired comparison against the existing baseline: category, subtype, original RGB color, negatives, dresses versus skirts/shorts, shoes, and multi-garment scenes.
6. Source hash and original RGB immutability; duplicate and cross-account guards; rollback.
7. Human-adjudicated ground truth. Model-to-model agreement alone cannot pass accuracy or masking gates.

## Decision
**HOLD — no external model or reference database is admitted to the app.**
Current fixtures, contracts and tests support an independent offline experiment but do not establish a candidate's commercial rights, accuracy gain, mobile performance or production suitability.

## Separation of work
- Protected pilot: issues #221 / draft PR #222. Offline synthetic bundle passed, but it is NOT a deployable protected staging candidate.
- Recognition enrichment: issue #223, offline only. Do not modify live app recognition, customer photos, Supabase, Cloudflare, or paid AI.
- Physical Android and iPhone evidence and approved commercial avatar masters are still external acceptance gates.

## Completion criteria for this audit milestone
The existing evidence is inventoried, misleading pass interpretations are excluded, and the admission decision is explicit. A subsequent experimental milestone must produce independently reproducible candidate comparisons before integration.
