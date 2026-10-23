# Assignment #233: original-photo recognition safety

## Isolation and overlap review

New branch `work/assignment233-original-recognition-20261023` starts at PR #226
`b06f606b0cbd4ecf9e10875a8b6188111a069011`. Reviewed open PRs #220, #224,
#226, #228 and #231; #224 owns subtype-admission evidence, #226 separates native
photo inference from browser setup, #228/#231/#232 own separate 3D research.
Coordination posted to #224 and #221. No changes to their branches, app/storage/
Auth integration, original photos, model weights/vectors, labels or thresholds.
The main conversation owns integration and release.

## Verified defects and fixes

* `classifyIsolatedGarment` previously bypassed #224's subtype review policy.
  Apply that same policy before provisional identity or detail inference. A
  mask score cannot independently validate Tunic, Blazer or Ankle boots.
* Zero/nonfinite/out-of-frame/reversed crop geometry could produce empty or
  black pixels rather than an explicit failure. Validate original and model
  dimensions and integer bounds before allocating or sampling. Reject mask
  length mismatches and nonbinary selections in display/color consumers.
* RGBA color sampling previously forced alpha to 255. A fully transparent red
  buffer was confidently labeled Red. Retain original alpha so the existing
  palette's alpha gate rejects hidden RGB. Opaque JPEG behavior is unchanged.

Nineteen new synthetic tests cover admission, geometry, masks, exact patterned
RGB copies and transparency. They are software invariants, not real-photo
classification or segmentation accuracy measurements. Existing full-suite tests
also exercise blank/corrupt photos, duplicate indexing, color disagreement,
skirt/dress ambiguity, recognition deadlines and source-replacement races.

## Source and accuracy audit

Ordinary captured garments classify `item.image`; outfit pieces classify their
unmasked `recognitionPhoto`, never the masked display/try-on image. The full
outfit scene remains in `originalPhoto`. The existing outfit worker decodes the
source up to 3072 pixels, extracts RGB at that resolution, then JPEG-encodes each
crop. Thus the pieces are original-derived, but they are NOT byte-identical
full-scene inputs and do not receive independent full-scene classification.
Do not claim otherwise. Adding a whole-scene vote to a particular garment needs
grounded instance correspondence; a scene containing a top, skirt and shoes
cannot safely supply a single garment identity. This branch preserves those
interfaces while awaiting independently reviewed instance/mask annotations.

Exact #226 artifact baseline: workflow 39991911492, artifact 12517508938,
ZIP SHA-256 `c67d25bfdf2818332c959a4eb34cb054ffe6e3e02041bde8ea8b7fcc5cb31fd4`.
Its downloaded bytes were independently hash-verified. Native original JPEG
source coverage: 59/59 (56 garments + three nonclothing controls). Category
correct on 47/56 garments (83.93%), nine abstentions; 35 automatic subtype
decisions, 12 category-only reviews, all three nonclothing controls rejected.
The raw recognizer still makes Jacket→Blazer, Blouse→Tunic and
Sneakers→Ankle boots errors; #224's review policy suppresses these automatic
subtype assignments. Zero wrong admitted automatic subtypes on this small,
reused cohort is not proof of universal accuracy or independent generalization.

`scripts/check-assignment233-recognition.mjs` checks every immutable original
hash/license, compares fresh results with #226 per photo using the existing
regression checker, and additionally requires exact unchanged unhinted decisions.
It records the existing admission report without authorizing release. New CI
runs baseline/candidate native inference twice, blocks post-warmup network,
and runs full tests twice plus available Chromium/WebKit mobile journeys.

## Validation and remaining gates

Local full repository + avatar suite: **1881 passed, zero failed/skipped**.
Local browser attempt is blocked by missing installed Playwright browser
executables; pinned official Playwright CI supplies both engines. Exact-head
CI run URLs/results and artifact digests belong in the draft PR and issue handoff.
No physical phones tested. Synthetic crop pixel fidelity is verified; real
garment separation, mask IoU, fabric coverage, color accuracy across lighting,
and multi-person/occluded instance separation remain unmeasured without human
ground truth. No benchmark criteria or release gates were weakened.

No merge/deploy, customer photos, paid AI, spending, production changes,
Supabase/Cloudflare configuration changes or Drive Duel edits. Separate 3D work
does not block this independent safety proposal.
