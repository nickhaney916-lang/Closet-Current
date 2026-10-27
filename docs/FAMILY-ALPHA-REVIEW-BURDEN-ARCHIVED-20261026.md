# Family Alpha v0.1 — measurable recognition review burden, source-pinned

**October 26, 2026 PT · ISSUE #255 · DRAFT HOLD · NO DEPLOY**

## Why measure this

Two staged draft guards (#316 and #317) avoid silently adding uncertain **Outerwear** and **Tops/Tunic** predictions without original-photo inspection. Their safety rationale is genuine: jacket subtypes were unreliable in a small independent cohort, and an earlier 100-photo worker archive wrongly accepted one dress as a Tunic. But forcing good predictions into Adjust costs family time.

The existing [Assignment #20 independent frozen-original benchmark](https://github.com/nickhaney916-lang/Closet-Current/pull/280) offers a defensible **metadata-only replay** of a different archived classifier revision (#226). This is NOT new FashionCLIP inference, not the 2026-10-13 hundred-photo archive, and not live Family Alpha.

## Actual result on 56 labeled garments + 3 negative controls

| Metric | Before staged #316/#317 review guards | Hypothetical after guards |
| --- | ---: | ---: |
| Strong subtype decisions from the frozen #226 archive | 35 | 32 |
| Correct accepted subtypes within those decisions | 35 | 32 |
| Incorrect accepted subtypes within those decisions | 0 | 0 |
| Non-strong records already needing review / unknown | 21 | 24 |
| Newly held strong decisions | — | **3** |
| Correct broad categories over all 56 clothing photos | 47/56 (83.93%) | **unchanged** |

The three newly held cases were `commons-0067`, `commons-0068`, `commons-0069`: all correct **Outerwear/Coat** strong subtype predictions. The source-pinned cohort contained **zero strong Tops/Tunic decisions**, so #317's Tunic hold did not alter this specific archive.

**Tradeoff:** In this particular reused corpus, a blanket outerwear human-review rule would add **three manual confirmations and prevent zero observed wrong strong subtype admissions**. This does **not** prove the rule is useless in the field: jackets are only 1/4 correct broad-category in the same small corpus; three other jacket cases abstain; new family images will differ. It proves that a green CI result and safety wording alone are not evidence of a recognition-accuracy gain.

The three negative controls were rejected in the original independent scorer. Review-burden scoring deliberately counts only labeled garment decisions. We did **not** inspect original picture pixels or re-run the model or release any classifier, nor can the archival decisions establish actual saves (real save also requires trustworthy color, mask, source ownership, duplicate check, cloud/write gates).

## Reproduction / locked reference

1. **Immutable #280 head:** `d0ff131a4e5617e1a3f4fcfb40d00602fdce9833`.
2. Archived #226 decision JSON: `benchmark/assignment233/baseline-226.json`, its internal source commit / run / artifact SHA checked before calculating.
3. Frozen source labels: `benchmark/manifest-reviewed-32.json`, `benchmark/manifest-holdout-16.json`, `benchmark/manifest-fresh-11.json`. Byte-for-byte compared against the pinned commit. No labels may silently be updated to make an acceptance rule look better.
4. `node scripts/audit-family-alpha-review-burden.mjs` in CI uses `git show` on that exact pin and emits numeric, photo-free results with `realPhotoColorAccuracy:null`, `currentModelAccuracy:null` and `actualSavedWardrobeItems:null`.
5. `node --test tests/family-alpha-review-burden.test.mjs` checks real archive totals, all three correct held coats, no Tunic strong cases, synthetic incorrect Outerwear/Tunic cases, unchanged ordinary Tops, and rejection of forged/duplicated/missing source records.
6. CI fetches the benchmark SHA **only into the test runner's git object database** and uses read-only local files. No photo upload, paid AI, backend calls or application builds with credentials.

## Decision and next necessary evidence

**Do not loosen or expand guards based on this archive alone.** Keep the staging release HOLD and keep drafts separate until the main thread reviews the actual-family experience. After adult JWT A/B privacy passes, evaluate a **new, independently labeled, consented, private original-JPEG phone-photo set** across jackets, coats, blazers, dresses/tunics, shoes, skirts and shorts. Preserve source/photo hashes, label before seeing classifier output, keep positives and negatives, and score all of:

- Correct broad category and specific subtype, among ALL attempted photos;
- Wrong automatic-save admissions **and** correct automatic-save coverage, not only model `strong` flags;
- Correct color on garment pixels under shadows/prints (currently **unknown**);
- Human-review count and minutes per item; manual corrections accepted vs rejected;
- Cropping completeness and failure, recovery and saved-cloud restoration by account.

A useful future optimization may be **selective** Outerwear review based on reliable independent corroboration, but no thresholds or subtype promotions should change until true new original-photo evidence supports them.

No PR merge, staging/production deploy, Supabase/Cloudflare/Resend changes, family accounts or photos, paid services/spending, or Drive Duel modifications. All artifacts remain **offline, blocked and explicit NO-DEPLOY**.
