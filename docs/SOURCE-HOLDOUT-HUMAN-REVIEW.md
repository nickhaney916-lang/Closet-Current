# Source-locked garment-family review intake

This follow-up stacks on PR #111 `47da6d3e854d2cf6cbb79d7a8fd0ef83e7faa7a2`.
It makes the review handoff usable and auditable. It changes no original photo,
locked reference label, measured model output, classifier, threshold, recognition
vector, customer code or earlier PR branch. PR #112's outfit work remains separate.
Existing physical-inventory/outline review tools remain unchanged: this intake
records coarse family observations only, without claiming item counts or masks.

## Current evidence

- Thirteen originals remain locked to manifest SHA-256
  `0ba1fae03ac1021d6ae58ccf17cd32026aabaa73364cf78618ce1cf7212581d9`.
- PR #111's actual measurements are unchanged: 12 garment sources, one sculpture
  control; FashionCLIP 10/12 broad categories and 8/12 allowed families against
  provisional source/assistant labels. This follow-up performs no new inference.
- **Zero real independent human submissions have been supplied.** Test fixtures
  and automated form interaction are explicitly synthetic, never human evidence.
- Blank, partial, uncertain and disagreeing submissions cannot become gold labels.
  Even two confident matching submissions yield only self-attested agreement;
  software cannot verify that aliases belong to independent human reviewers.
- Model promotion remains BLOCKED; approved model accuracy remains null.

## Reproduce the handoff

Use Node 22, a checkout of this branch and the original collection from Actions
39538230372, artifact `new-source-originals-before-inference`. Requires GitHub
repository access. Preserve verified archives before the 14-day retention expires.

```sh
gh run download 39538230372 -n new-source-originals-before-inference -D /tmp/closet-originals
node scripts/source-holdout-human-review.mjs prepare /tmp/closet-originals /tmp/closet-family-review
node scripts/source-holdout-human-review.mjs audit /tmp/closet-pending.json
```

The output directory must be new, so a prior review is never overwritten. Every
original is verified before copying; there is no reencoding, clipping or masking.
The packet contains neutral IDs and hashes, a blank JSON template, offline form
and source credits to open **after** reviewing. Original EXIF and credits may
reveal hints; blinding is procedural, not cryptographic. Keep predictions,
reference manifests and other reviewers' answers out of the review environment.

Give two actual people separate copies without conveying expected families.
Each opens `review.html` locally, selects all 13 original JPEGs, inspects every
entire image, records a family, explicit uncertainty and visible evidence, and
checks only truthful attestations. Boundaries such as shirt/jacket and compression
shorts/underwear should remain uncertain when the photograph cannot resolve them.
Other garments and uncertain observations are valid responses. No fine subtype
is inferred from a coarse boot or dress label.

Download observations before closing; the form has no automatic persistence or
server upload. Retain each downloaded raw file separately and record its exact
SHA-256 outside the form. Do not commit reviewer personal information to git.

```sh
node scripts/source-holdout-human-review.mjs audit /tmp/closet-comparison.json /path/to/first.json /path/to/second.json
```

The validator rejects blank/partial submissions, unexpected fields, invalid
timestamps, changed packet/photo hashes, duplicate/missing sources, placeholder
or repeated normalized aliases, absent attestations and unsupported labels.
Receipts hash the parsed submission serialized as JSON, **not raw file bytes**;
preserve raw files and their separately recorded hashes for chain of custody.
The report retains per-source agreement/uncertainty/disagreement without updating
the original locked reference. A third blind review and external identity/blinding
verification may help resolve disputes; this intake does not fabricate that work
or automatically adjudicate by majority.

## Verification and limits

Focused regressions exercise source binding, zero/one/two submissions, uncertainty,
disagreement, alias normalization, required attestations, malformed/changed inputs
and the actual pending-audit CLI. Full Node/build and original-source guards run
in the dedicated workflow. Actual Chromium and WebKit run the offline file form
using synthetic colored JPEGs, checking incomplete/tampered files, uncertainty,
edits, required attestations, valid JSON export and mobile widths. Original-camera
JPEG/EXIF/import/crop preservation checks also run. This is browser emulation,
not physical-phone testing. No synthetic fixture is a new source-photo sample.

Independent humans, untouched phone photographs, ambiguous-boundary adjudication
and a demonstrated classifier improvement remain outstanding. These exposed
discovery images cannot become an untouched confirmation set. No merge,
deployment, paid inference, live Supabase/Auth/customer data or Drive Duel change.
