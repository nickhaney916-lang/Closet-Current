# Parallel #75 — independent annotation & dataset custody codebook (v1)

**FAMILY ALPHA HOLD #255.** No AI-generated, filename-derived, rule-derived, model-suggested or synthetic annotation can count as independent human ground truth.

## Separation of duties

Acquirer: request Commons imageinfo metadata and download the full-size original; verify SHA-1 from source API, SHA-256 of actual bytes, exact length, original source page, content-type and decode/dimensions/orientation. Search categories are **not** labels.

Rights/source curator (independent human, approved offline): inspect Commons File: page, creator and attribution, license version and conditions, source collection/catalog ID, genuine clothing subject, likeness/consent where relevant, and shared source group for alternate views and crops. Metadata on a public page is not automatically a license warranty or human-curated legal clearance. Approve source grouping and rights separately with externally pinned registrar signature.

Independent rater A and B: both directly inspect the unaltered original bytes with **NO model prediction and NO other rater notes**. Record source SHA-256, time, anonymous reviewer ID, fields below and separate Ed25519 signature. The curator must independently verify these are two real distinct humans (public keys alone cannot establish this). Resolve differences with a third verified human, recording signed adjudication and reasons. Until disagreement resolved, quarantine.

Custodian: retain photos, approved registrar fingerprint and keys, signed human labels, blind source URLs, original file identity, license evidence, private random split salt and any sensitive agreement data OUTSIDE the public repo and CI. #71 may consume sealed blind only once, without giving the answer key to #67.

## Human labels (current public/taxonomy.js vocabulary)

1. **Presence:** single-garment / multiple-garments / whole-outfit / nonclothing / uncertain. A whole outfit is several clothing pieces worn together; paired shoes are two image regions but may be one closet unit. Uncertain is valid.
2. **Category/subtype:** Tops, Bottoms, Dresses, Outerwear, Shoes, Accessories, or Unknown; subtype must be a legal current taxonomy subtype or Unknown. Hard cases include skirts vs shorts, dress vs skirt, jacket vs shirt, sneakers vs boots, sandals vs flats, and trousers vs jeans. Do not guess a subtype from an ambiguous crop.
3. **Color:** primary garment fabric color, optional secondary and multicolor flag: Black, White, Gray, Brown, Beige, Red, Orange, Yellow, Green, Blue, Purple, Pink, Multicolor, Unknown. NEVER label based on backdrop, skin, hanger, lighting or filename. Record color cast when lighting interferes. Unknown is allowed.
4. **Instances:** explicitly visible article regions, count 0–20. Provide individual IDs and normalized [x,y,w,h] boxes with each coordinate in 0–1 and within frame. Include occluded or clipped flags for hems, sleeves, straps and soles. Optional mask SHA-256 ONLY when a human physically drew and reviewed a pixel mask, not because a model segmented it.
5. **Physical wardrobe unit:** single-unit / matching-pair / separate-items / multiple-pairs / unknown. Two matching shoes are two regions but one wearable pair. Matching-pair requires at least two regions, multiple-pairs at least four; contradictory annotations are invalid. Use unknown for ambiguous pairing.
6. **Quality:** lighting (ok / dim / overbright / unknown); focus (ok / soft / unknown); framing (ok / clipped / unknown); backdrop (ok / busy / unknown). A dark shirt is not automatically underexposed. Actual blur cause cannot be inferred from a rough edge-density proxy.
7. **Reviewer proof:** method independent-human, predictionsExposed false, ISO timestamp, SHA-256 of the exact original, approved pseudonymous independent-human identity, human key signature and independent registrar verification. No sensitive traits should be inferred for people visible in photos.

## Dataset inclusion, duplicate controls and blind hygiene

Original JPEG/PNG/WebP only from exact Wikimedia Commons File: metadata and original upload URL, no thumbnails, social images, private wardrobe uploads, AI art or commerce pictures without compatible rights. Explicit CC0, CC BY, CC BY-SA with matching license URL/version and author credit. Human curator must assess photo and redistribution/consent risks separately.

A **source group identifies the same physical garment and linked gallery**, even across filenames, metadata catalogs, resized images, alternate angles or near-duplicate crops. Use publication/gallery series, object numbers, manufacturer IDs, matching originals, Commons canonical File: URLs, exact SHA-256 and decoded-image perceptual dHash. Perceptual matching is only a suspected-leak signal; manually review flags rather than assert same identity.

Source-group-level planning target: 120 TRAIN / 60 DEVELOPMENT / 60 SEALED BLIND, totaling 240 NEW distinct garment groups; these are NOT actual counts. Historical exposures include locked-photo-sources, the 16 holdout, 32 reviewed and 11 fresh public manifests; all such images and near duplicate groups are ineligible for NEW blind. Public Commons search output in this workstream is **development-exposed** and may NEVER become blind. A separate entirely private novel acquisition stream is required.

Before blind assignment: actual curator rights/source group approval, two verifiably different independently signed human reviews, no label disclosure or model scoring, complete signed perceptual-hash coverage of earlier exposed originals, source-disjoint splits, private manifest and cryptographic sealed commitment. Disagreements or incomplete human/photo evidence mean QUARANTINE. Publishing labels/thumbnails or score-guided tuning contaminates blind: retire the set instead of reusing it.

## Independent practical workflow (outside ChatGPT)

- Curator verifies each original and records rights, human-readable object identity, source group and reasoned permission/consent notes. Store offline, restricted; never commit photos/labels/PII.
- Custodian recruits independent real reviewers A and B, verifies identity/pseudonym/key ownership, and pins externally trusted registrar public-key SHA-256 outside Git. Registrar signs each identity-public-key certificate.
- Each rater reviews original photograph with model outputs hidden and fills a **private** draft from annotation-template.json. Offline signing tool: scripts/p75-review-offline.mjs sign ABS_DRAFT ABS_PRIVATE_KEY ABS_RECEIPT. It refuses CI and paths inside repo, and requires manual human confirmation. Crypto signature verifies key custody; registrar is still required to prove the person.
- Custodian assembles private source rows, reviewer receipts, signed curator approvals and independently signed full old-image visual hash ledger. Verify with scripts/p75-review-offline.mjs audit ABS_PRIVATE_BUNDLE ABS_PRIVATE_REVIEWER_REGISTRY and a pinned P75_APPROVED_REGISTRAR_FINGERPRINT. For blind commit, also set secret P75_PRIVATE_SEAL_SALT. Console output shows only aggregate counts, failures and a commitment hash; never labels.
- Give #67/#68/#70/#73 approved TRAIN/DEV human labels relevant to those missions, #71 controlled blind media and answers for one sealed evaluation, and #72/#74 only safe authorized feedback; never reveal blind answer key for tuning.

## Quantification standard

Always separate independently human-labeled photos, double-human consensus photos, exact agreement denominator, instances, human masks, shoe-pair judgments, verified original bytes, distinct source groups, legal curator approvals, train/dev eligibility and sealed-blind eligibility. An empty human cohort has **0 labeled and undefined agreement**, not 100%. Independent recognition gain belongs to #71 and remains UNKNOWN without a real evaluation. Physical devices, consent/rights vetting and human labeling remain external blockers.
