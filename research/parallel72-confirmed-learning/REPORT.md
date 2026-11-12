# Closet Current — Parallel #72: owner-confirmed correction learning

**FAMILY ALPHA HOLD #255 OPEN. DRAFT / UNMERGED / UNDEPLOYED.** Tracking [#934](https://github.com/nickhaney916-lang/Closet-Current/issues/934). Independent from main Mission 1 P842, parallel #67–71 and Mission 3. No staging, production, hosted Supabase, owner account, private photo, real wardrobe, model weight, classifier prompt, instance algorithm or cloud change.

## Verified starting baseline

Pinned exact SHA `0de0b712f5c02feb5fc173194eec775f068f499b` from [Mission 1 P842 PR #932](https://github.com/nickhaney916-lang/Closet-Current/pull/932), [NO DEPLOY Actions #43294490409](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43294490409) two jobs succeeded, 310/310 Node regressions, 6/6 Chromium/WebKit source editor mobile-width test cases. Parallel #71 [PR #933](https://github.com/nickhaney916-lang/Closet-Current/pull/933) is a separate sibling, not incorporated. Main and other mission branches never touched.

## Defect and remediation

**Observed source defect:** Existing `ClothingMemory.confirm(item)` copied the current category, specific item type, pattern, sleeve and fit into `confirmedDetails` whenever called, even though the caller's Save action was not independently recorded as user consent to use that image/model as a *training reference*. Both new-photo and existing-saved-item editor call sites invoked it as a side effect. `ClothingMemory.suggest` treated these values as trusted future references. Model/automated fields could therefore be laundered into presumed user corrections without any evidence of owner learning consent. Existing weak-context protection only guards a *suggestion* against stale application, not provenance of its training examples.

The **OFF-by-default** `?confirmedLearning72=1` research path now:
- **Separates saving from learning**. The actual photographic Adjust and saved-item editor each display a distinct consent checkbox, disabled if a valid per-owner session is not supplied. Unchecked saves are allowed but clear unverified `confirmedDetails` and `correctionReceipt72`, so they cannot become learning examples on this opt-in path. Consent resets if fields change.
- Uses a new explicit `open72/begin72/accept72` owner-session protocol. An affirmative owner-checked action creates an in-memory nonserializable one-shot review token, then accepts only the *same* item, current session and unchanged source, crop, mask, model/features and category/type/color/attribute snapshot. `crypto.subtle` hashes actual JPEG bytes for original source identity and hashes the crop, mask metadata, model vector, and selected field snapshot. Unsupported image/model or invalid learning evidence is withheld, never invented.
- **Field-level learning proof:** category and specific type are included only after the owner explicitly acknowledges the garment photo. Pattern, sleeve and fit are included **only when the owner actually edited those fields** during this review; existing AI-prefilled values are never silently promoted to corrected truth. These explicit reviewed-field names are persisted with the receipt and verified before reuse. Color is source-bound for validity but is never learned/transferred from nearest-neighbor embeddings.
- **Crop, version and refresh lifetime:** crop operations strip prior correction receipts, source/mask/model/field changes invalidate them, and automatic weekly feature refresh is suspended in this opt-in learning study rather than silently rebinding an old owner approval to a new model. A serialized receipt can be rechecked by the *same* owner in a new active session; an old approval token cannot be replayed.
- Stores only a *small owner-scoped receipt* with hashes/model key and manually reviewed fields. No source JPEG or raw 512-dimensional embedding is placed in the receipt, public CI logs, Git history or downloaded artifacts. Client-side hashes are integrity anchors, **not cryptographic proof of a real person's identity**. Caller-supplied owner scope is explicitly a research adapter and must be integrated with actual signed auth before deployment.
- `verified72/suggest72` exclude existing legacy `confirmedDetails`, unconfirmed AI examples, same-photo/crop reuses, duplicate owned unit IDs, wrong model, changed category/color, clipped masks, stale source, inactive/different owner and conflicting categories or subtypes. Requires **at least two distinct owner-consented independent source hashes/owned-unit records and >=0.90 cosine similarity**. In addition to source and unit deduplication, almost-identical normalized reference vectors (cosine >=0.999995) are conservatively counted as correlated clones, even if separately re-encoded source JPEGs changed their SHA; this reduces coverage, is **not empirically calibrated**, and does not substitute for authentic owner-unit labels. The inherited threshold is a conservative guard, **not calibrated probability or a claimed optimal threshold**. Any contradictory eligible example abstains; no majority-vote poisoning.
- All suggestions remain **draft, owner-review-only, one-shot** through `apply72`; no automatic save, no automatic acceptance, no owned-pair inference, no learning from a suggestion itself, and no color/brand/size/material transfer. Crop and image/model/field edits invalidate receipts and proposal contexts.
- The optional P72 research mode blocks `saveIndexed` auto admission; normal default P842 behavior is byte-semantically preserved outside the feature flag. The actual editor uses the independent check to save corrected details only after owner consent, source/session receipt verification and current editor state checks. There is no change to model, weights, FashionCLIP or SegFormer.

## Reproducible safety and before/after evaluation

`tests/parallel72-confirmed-learning.test.cjs` exercises owner-unconfirmed null, two explicit examples, deliberate rejected proposal, category/type and color independence, duplicate/revised origins, contradictory/poisoned sample, model/version mismatch, stale crop/mask/source/field/model, cross-account sessions and one-shot apply. One test checks SHA hashing on a genuine licensed publisher original JPEG; *feature vectors/owner confirmations in these unit tests are synthetic*, not genuine recognition proof.

`scripts/test-parallel72-owner-browser.mjs` executes the **actual `public/app.js` Adjust editor and `public/clothing-memory.js`** in Chromium/WebKit at **320/390/430 CSS px** with locally generated valid JPEGs and synthetic normalized model embeddings. A photo is saved unchecked → **zero learning receipts**; two separately corrected/consented photos → **two owner-scoped learning receipts**; fresh third image → **one review-only item-type suggestion**; cancel → **zero additional storage writes**; switch to a different simulated owner → **no cross-owner suggestion**. This is **actual browser/source behavior**, not physical devices, new independent real photo classification or hosted authenticated two-user integration. Test fakes local storage rather than writing family wardrobes.

For **genuine original-photo model regression control**, the no-deploy CI runs unchanged real FashionCLIP worker on 16 existing, historically publisher-reviewed SHA-locked public Commons originals (13 garments +3 nonclothing) in four browser/partition jobs, then verifies fixed publisher manifest, source-index hash and all 16 IDs per engine with `scripts/parallel72-historical-control.mjs`. This is historical **development-exposed** data; it **does not have independently owner-confirmed learning labels**. The evaluation must output model-only category/type numerators/denominators and **owner-learning accuracy UNKNOWN** (training=0, independent validation=0, independent held-out=0). It must never relabel publisher text as a newly verified owner correction. No score improvement may be attributed to the P72 model, which is unchanged.

## Privacy, risk, and integration boundaries

- **Actual trusted owner/session source not wired in P842**: the research adapter requires `window.__closetCurrentOwnerScope72` to be installed and revoked by a future authenticated caller; it is NOT an authorization credential and is not active by default. Actual signed two-owner JWT/RLS and account-switch proof are outside this isolated branch. Never promote from this adapter directly to production without Mission 3 owner lease integration.
- Client-side persisted evidence can be edited by a person with local DB control; hashes are for accidental stale/tamper detection, not signatures or server-authenticated human labels.
- Source SHA-256 is of original JPEG bytes; mask SHA covers the stored hint, not a independently validated SegFormer binary mask. New human masks, owned pair truth, color labels and genuine phone original photos are unavailable.
- No new genuine independently human-labeled source-disjoint training/validation/test sets exist. Therefore true learning precision/coverage delta, color correctness, pair count accuracy and generalization are **UNKNOWN / NOT ESTABLISHED**. A green source-safety test is not 10/10 recognition.
- If original JPEG, compatible model embedding, permission, trusted owner context or explicit consent is absent, save can remain legitimate but **learning must abstain**.

## Acceptance and release

No main/staging/production/hosted Supabase; no private wardrobe data, family photos or external model re-training. PR must remain DRAFT; branch changes must pass strict exact-parent path allowlist, full native tests, real source-editor Chromium/WebKit proof and four real-original FashionCLIP numeric jobs. **FAMILY ALPHA HOLD #255 stays OPEN.**

## Verified empirical checkpoint — November 12, 2026

[NO DEPLOY Actions #43302802201](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43302802201), exact candidate HEAD `1e453d513700e082d63e68665a69f5947877b094`: **7/7 jobs SUCCESS**. Exact pinned parent, seven-file path allowlist, no-deploy restrictions, both builds, 11/11 focused source/consent/poisoning tests and **321/321 full Node regression tests PASS** with 0 failures/skips. [Camera and indexing Actions #43302802074](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43302802074) independently checks the same source checkpoint.

### Before/after: owner-review lifecycle (synthetic demonstration only)

Genuine Chromium and WebKit engines at 320, 390 and 430 CSS pixels each executed the **actual app editor and memory source** using distinct locally generated JPEGs, synthetic normalized embeddings and simulated in-memory owner scopes, with no live owner data.

| Controlled outcome | Without opt-in owner-confirmed learning | With two explicit owner-confirmed references |
| --- | ---: | ---: |
| Existing unsaved draft manually saved without separate learning consent | 1 save; **0 learning receipts** | Not applicable |
| Eligible owner-confirmed independently sourced examples | **0** | **2** |
| Fresh third synthetic photo: eligible subtype suggestion | **0** | **1**, visible and review-only |
| Save triggered solely by suggestion without owner submission | **0** | **0** |
| Suggested subtype reused after owner switch | **0** | **0** |

All six browser configurations verified **3 deliberate local in-memory writes only** (one unconsented initial photo plus two consented ones), **2** consented receipts and **no fourth save** from merely using/canceling the proposal. Existing all-pending owner review guard passed **6/6** mobile-width scenarios without browser exceptions. This before/after is a **synthetic logic exercise**, not measured real-original accuracy or physical-phone/authenticated-tenant acceptance.

### Genuine-original recognition control — actual model, no simulated inference

The exact unchanged P842 FashionCLIP model worker processed all **16 existing publisher originals per engine** (13 clothing, 3 nonclothing), with all original-JPEG SHA-256 verified before inference; browser halves and source receipts were independently aggregated with historical fail-closed conservation. Dataset was previously development-exposed, and none of its photos has a separately obtained owner-learning correction label.

| Metric | Chromium | WebKit |
| --- | ---: | ---: |
| Correct broad category including review-only | **8/13** | **7/13** |
| Correct automatic broad category | **4/13** | **4/13** |
| Wrong automatic broad category | **0/13** | **0/13** |
| Exact correct subtype, among truth-supported records | **4/10** | **4/10** |
| Broad type accepted within predeclared labels | **4/13** | **4/13** |
| Wrong automatic subtype | **0** | **0** |
| Nonclothing correctly rejected | **3/3** | **3/3** |
| Runtime errors | **0** | **0** |

The model and its classification gates were **untouched by #72**, so the real-photo **before vs after model results are unchanged by construction**. Do not attribute any category/type improvements to learning. Historical-source manifest SHA-256: `05d6604566dad006221d643c55df24ce719e83652c424046e043851d6534dc27`. Original source/permission index SHA-256: `6064df4fafe5633313f9825d349746332ae14ecf4d32f3a058b56131e7b234f3`.

[Numeric-only original model evidence artifact #13983170714](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43302802201/artifacts/13983170714), ZIP SHA-256 `6beef086996f9cb0f3be0ed645e1da5432dda6446d2cc8e69ad1602cef202f38`. Includes SHA-verified source index and numerical scores, **no JPEGs, private embeddings or owner data**.

### Explicit unresolved acceptance blockers

Independent, legally permitted, source-disjoint genuine photo **human correction learning**: training **0**, validation **0**, untouched held-out **0**. Therefore the numerator/denominator for new owner-learning precision, coverage, abstention and real-photo improvement are **UNKNOWN / NOT ESTABLISHED**, not 100%. Independent color and SegFormer masks/owned shoe-pair truth are also **UNKNOWN**. This isolated branch has not integrated a verified owner scope backed by actual signed authentication, cloud two-account RLS/privacy, physical Android Chrome, iPhone Safari, or genuine private local-IndexedDB through Cloud restore. Feature remains **OFF BY DEFAULT** and cannot serve as release proof.

**Checkpoint SHA and CI above describe verified full execution; any later report-only commit needs its own exact-head successful workflow before final status is claimed.** Keep draft PR unmerged and undeployed. **FAMILY ALPHA HOLD #255 MUST STAY OPEN.**
