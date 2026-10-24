# Assignment 20 — original-photo recognition accuracy

Branch: `qa/assignment20-original-photo-benchmark-20261023`, stacked on PR #279 exact head `5ef76452649b016ba76fef42ec05a9d19108173d`. Reviewed #255, #234, #249, #252 and #279. No overlapping runtime changes: this adds independent scoring, negative tests and an inference workflow only.

## Evidence and denominators

All 59 licensed original fixture SHA-256 values verified locally, with license metadata present. These are the locked repository source files, sometimes licensed thumbnails rather than native camera originals; no re-encoding is performed by this audit. Corpus contains 56 garments and three nonclothing controls. Existing labels, accepted subtype alternatives, weights, vectors, prompts and thresholds are unchanged. Reused benchmark photos are not an unseen holdout and do not establish generalization.

The committed JSON is **metadata-only rescoring of archived actual model outputs**, not fresh local inference. Historical `regression-*.json` results and verified #226 artifact-derived decisions are kept separate. #234 reports the same #226 decisions; #279 changes review state, not model inference. Improvements below predate this assignment.

| Labeled group | Historical category | Verified #226 category | #226 exact / accepted subtype |
|---|---:|---:|---:|
| All garments | 43/56 (76.79%) | 47/56 (83.93%) | 30/56 / 35/56 |
| Shoes | 18/20 | 19/20 (95%) | 12/20 / 13/20 |
| Dresses | 7/9 | 7/9 (77.78%) | 1/9 / 5/9 |
| Shorts | 1/2 | 2/2 | 2/2 / 2/2 |
| Skirts | 4/6 | 5/6 | 5/6 / 5/6 |
| Jackets | 1/4 | 1/4 (25%) | 0/4 / 0/4 |

Abstentions count in accuracy denominators: 13 historical versus nine #226. #226 retains 35 strong subtype decisions and 12 category-only reviews. Historical wrong strong subtype decisions: four; #226: zero on this reused cohort. `strong` is an inference admission flag, **not proof of completed app auto-save**. Three nonclothing controls rejected in both archives. Numeric confidence calibration cannot be computed from these archived decision-only rows.

## Specific unresolved failures and priorities

- Jackets: `commons-0064` previously emitted Blazer, now Outerwear/Unknown; `commons-0060`, `commons-0062`, `commons-0065` abstain. Prioritize independent jacket/coat/blazer labels and unmasked native original-region evidence before tuning.
- Shoes: `commons-0078` sneaker is category-only; five boot photos are Shoes/Unknown; `commons-0095` abstains. Zero wrong admitted shoe subtypes comes with substantially lower subtype coverage, not universal correctness.
- Dresses: `commons-0053` and `commons-0059` abstain; `commons-0052` and `validation-0001` are category-only. Exact Dress differs from acceptable named dress subtypes, so both metrics remain visible.
- Shorts/skirt: two shorts is too small for a reliability claim. `commons-0036` skirt remains unresolved. Expand independently labeled hem/leg-opening, occluded and on-person cases without relaxing disagreement review.
- Color: no independently reviewed real-photo expected colors/masks in this corpus; **real-photo color accuracy is null**. PR #252's controlled synthetic RGB result is not a substitute. Next cohort needs frozen garment-level color labels under shadows/casts, black/navy and white/gray, prints and background contamination. No color percentage or model improvement is invented.

## Reproduction and safety improvement

`node scripts/report-assignment20-recognition.mjs` verifies licensed bytes then scores archives. Optional inference directory adds separately identified fresh and immutable baseline measurements. Scoring rejects duplicate/missing/foreign IDs, keeps abstentions in denominators, excludes runtime errors from correctness and separates literal/accepted subtype scores. Three unit tests demonstrate these safeguards.

`assignment20-original-photo-benchmark.yml` builds and runs full regression, then existing pinned FashionCLIP runner on all 59 full stored source files; post-warmup remote requests denied, no paid inference. Existing checker compares every candidate decision to #226. A disagreement is a visible CI failure, never silently rewritten ground truth. All `public/`, `supabase/`, licensed fixture bytes and manifests are fenced unchanged from #279.

Local build PASS. Full app/avatar regression **1,897 PASS, 0 FAIL, 0 SKIP** after populating benchmark/photos from the verified bundled files. Local fresh inference could not start: browser absent and browser download returned invalid/truncated archives. CI run `40063660896` started on implementation head `8cf48aa501c66c2f21c76f8632429a4520e61708`; final fresh results must be read from its evidence, not inferred from green unit tests.

No merge/deploy, production changes, customer photos, paid AI, spending, Supabase/Cloudflare settings or Drive Duel changes. No physical-phone or independently reviewed segmentation evidence. Main conversation controls integration and release; Family Alpha remains HOLD.
