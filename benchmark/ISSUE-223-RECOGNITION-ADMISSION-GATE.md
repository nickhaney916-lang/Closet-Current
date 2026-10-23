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

## Verified existing paired-model inference evidence (2026-10-23)
The source-locked record `benchmark/SOURCE-LOCKED-RESULTS-20261023.json` identifies CI run `39958489407`, artifact `12503668083`, and 59 original-source hash matches. It contains baseline and candidate output records for the **same** reviewed-32, holdout-16 and fresh-11 cohorts. It is not a new third-party model experiment or independently adjudicated physical-phone validation.

| Cohort | Garments | Candidate category coverage | Unsafe automatic subtypes |
| --- | ---: | ---: | ---: |
| reviewed-32 | 32 | 90.63% | 1 (`commons-0064`) |
| holdout-16 | 13 (plus 3 negatives) | 53.85% | 2 (`commons-0014`, `commons-0078`) |
| fresh-11 | 11 | 100% | 0 |

The record reports zero incorrect automatically emitted **categories**, three incorrect automatic **subtypes**, and three rejected non-garment controls. It explicitly sets `recognitionPromotionDecision: BLOCKED` and `independentPhysicalGarmentLabelsVerified: false`. Thus neither the 100% fresh-set category coverage nor the zero unsafe category count justifies unattended autosave or production promotion.

**Disposition:** Existing paired offline inference evidence is sufficient to conclude **NO-GO for recognition promotion today**. A claim that a new external catalog/model is superior remains **NOT EVALUATED**; do not fabricate paired third-party measurements. The next experiment must first identify a candidate with separately verified commercial model weights and source-image rights, then run the locked 59-photo comparison with independent subtype review and mobile performance evidence.

## Targeted subtype failure triage (same-source paired results)
All three observed incorrect auto-subtypes occur in **both** baseline and candidate, so the candidate did not repair them. The manifest's accepted type is the comparator; there is no basis to silently relabel source truth or count these as correct.

| Fixture | Locked expected type | Baseline and candidate emitted | Safe disposition |
| --- | --- | --- | --- |
| `commons-0064` | Jacket | Blazer (strong) | Require subtype review; preserve Outerwear category |
| `commons-0014` | Blouse | Tunic (strong) | Require subtype review; preserve Tops category |
| `commons-0078` | Sneakers | Ankle boots (strong) | Require subtype review; preserve Shoes category |

A targeted uncertainty guard must be based on **real classifier evidence**, not on fixture IDs, exact photo hashes, or fabricated type conversions. It must also retain a valid, visible category and request review when the subtype is not reliable. A blanket change of all jackets/blouses/high-top shoes to `Unknown` is not an acceptable proven improvement without an independently measured false-abstention and mobile impact analysis. Therefore **no production subtype heuristic is changed in this milestone**.

### Reproduction requirements for the next code change
1. Reproduce all three failures in the pinned browser inference harness (`scripts/run-source-locked-recognition.mjs`), with original SHA-256 verification.
2. Inspect top-k logits and agreement/confidence for competing subtypes on these photos **and matched correctly classified garments**, so the guard does not over-abstain.
3. Implement a narrowly evidenced review fallback, without replacing correct type labels or weakening category/non-garment rejection.
4. Rerun all 59 source-locked photos plus browser/mobile regression; compare false-autosave count, abstention count, latency and original-photo immutability.
5. Keep promotion blocked unless zero unsafe autosaves and independent review are established.
