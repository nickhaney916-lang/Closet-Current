# Blind original-photo inventory → independently approved garment-mask gate

**Research-only, October 19, 2026.** This is a software evidence bridge, not a recognition upgrade. It does not create human observations, mark masks as approved, change product classification, or send original photographs to any network.

## What this prevents

The existing [two-reviewer source workflow](BLIND-ORIGINAL-PHOTO-REVIEW-GUIDE-20261019.md) asks two independent people to inventory **every visible article of clothing in the original full-resolution photo**, before seeing the AI answer. The [physical-item mask scorer](physical-garment-inventory.mjs) requires independently drawn and approved masks and can match them one-to-one against predicted regions.

These two workflows formerly had **no direct gate** between the blind human item counts and the human-approved garment masks. A reviewer could omit a visible shoe or jacket from the *physical mask inventory* and unintentionally inflate recall by reducing the denominator.

`benchmark/blind-inventory-mask-gate.mjs` now compares the **exact original source SHA**, the first and second completed blind source reviews, and the proposed approved per-piece mask inventory. It:
- **Blocks** any count, category, specific-form or visibility disagreement, unknown type or partly visible garment until independent adjudication.
- **Blocks** physical inventory counts/categories that differ from the two prior blind inventories, including leaving out shoes, socks or other categories the instance model does not support.
- **Blocks** a blind **skirt** observation from being silently accepted as a final **shorts** outline merely because both are `Bottoms`. It compares the human-reviewed skirt/shorts/trousers form counts against the approved target forms. Unknown Bottoms forms stay blocked rather than being guessed; other categories may still have only broad mask forms, so exact shoe subtypes are never certified.
- Uses the existing independent-mask validator and one-to-one IoU scorer; original RGB and approved human masks remain unchanged.
- Reports conditionally measured localization only if the independent original-photo inventories, mask review, and SHA identities are all present and agree.
- For truly empty licensed negative-control scenes, **does not invent a garment-recall denominator or claim a model proposal is a background false positive**.
- Leaves real-world reviewer identity assurance, unresolved shoe subtype truth, and independent instance correspondence as review obligations; JSON attestations alone cannot prove genuine independence.

## How to run against real human files

First obtain truly independent blind original-scene reviews from [PR #24](https://github.com/nickhaney916-lang/Closet-Current/pull/24) and resolve disagreement using [PR #25](https://github.com/nickhaney916-lang/Closet-Current/pull/25). Have humans separately annotate and approve **every physical piece** in the exact same unchanged source JPEG, using `annotate-garment.html`, `approve-garment-mask.html` and `assemble-physical-inventory.html`.

Run locally:

```bash
node scripts/audit-blind-physical-inventory.mjs \
  scene.json locked-source.json \
  first-packet.json first-completed-review.json \
  second-packet.json second-completed-review.json \
  physical-inventory.json approved-masks.json \
  model-proposals.json output-garment-evidence.json
```

The JSON inputs are:
- `scene.json`: `{"id":"commons-XXXX","image":"commons-XXXX.jpg","sourceSha256":"<64 hex>"}`.
- `locked-source.json`: corresponding record from `benchmark/locked-photo-sources.json` with **verified SHA** and license.
- First/second packet and completed human review JSON: unchanged outputs of the previous blind reviewer page; neither includes AI guesses or descriptive filenames.
- `physical-inventory.json`: the separate, completed, signed two-human source-wide physical-inventory output.
- `approved-masks.json`: array of `{"id":"commons-XXXX-item-01","annotation":{...approved mask...}}` entries, exactly one per independent physical item. No AI seed-derived reference is accepted.
- `model-proposals.json`: array of `{"id":"commons-XXXX-candidate-01","prediction":{...model proposal...}}` entries from the unchanged, locked original image; use `[]` only if the model produced **no** proposals.
- `output-garment-evidence.json`: local output. The script creates no report if input validation fails.

Pass `-` instead of the physical inventory and masks only when they do not exist; in that case **no positive-garment recall can be reported**. One scene at a time prevents mixing unlike photos or mass-loading user images.

### Scores do not prove shoe subtype accuracy

The independent DeepFashion2 segmentation model does not offer actual shoe or hosiery classes. A correct localization of the same *broad* item category is not proof that “Sneakers” versus “Ankle boots” is correct. The output explicitly leaves `specificFootwearSubtypeAccuracy: null`, `canPromoteModel: false`, and `canRelease: false`. Human-blind evidence is still missing in this repository: all successful scoring fixture tests use **synthetic claims and synthetic masks** to prove code behavior, not physical item accuracy.

## QA and restrictions

The branch's dedicated automated suite tests lost shoes, wrong source SHA, conflicting human classifications, unknown/partly visible garments, fake mask approval, safe empty originals, and local CLI rejection. **No garment accuracy improvement** is claimed until genuinely independent reviewers produce approved original-photo forms and outlines for a fresh untouched holdout.

Do not merge or deploy, change production recognition thresholds, incur paid inference costs, process real customer photographs in GitHub Actions or modify Drive Duel without explicit user approval.
