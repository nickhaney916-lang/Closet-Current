# Independent human review: prepared, not performed

Isolated from PR #115 `6ebcf6d9dcfd18611c3248242b62208eb9923385`.
All previous customer, model, locked-label, measurement and review-tool source
bytes remain unchanged. No changes to PR #115 or its branch.

## Evidence review and actual blocker

PR #111 provides 13 verified original photographs and actual model measurements
against **provisional source/assistant labels**. PR #113 provides offline human
observation intake, with zero real submissions. PR #115 verified the integrated
cloud/styling/review sources and 1,306 Node passes, including synthetic review-form
browser tests. Their comment threads contain no supplied reviewer submissions
at this audit. Do not infer a human review from CI, aliases, prior captions,
model agreement, an assistant's inspection or this software exercise.

**Independent human-reviewed accuracy is unavailable.** No actual independent
human submissions are present. Existing proposed-label category agreement
10/12 and allowed-family agreement 8/12 are not human-gold accuracy. The strong
flannel shirt/Jacket disagreement remains ambiguous, as does the compression
shorts/underwear boundary. Do not relabel those photos after seeing predictions.

## Bounded improvement

The prior form hashes selected originals before enabling a completed submission,
but its Record handler only checked file verification. An incompletely displayed,
failed or stale image could still accept an observation. This new handoff wraps
the unchanged PR #113 HTML with a presentation gate: the displayed image must
be the selected verified blob, complete, and have positive intrinsic dimensions.
A capture-phase click check also blocks forced clicks while a source is not
displayed. It does not authenticate a human or establish that the image was
actually inspected. Earlier source HTML and all original JPEG bytes stay intact.

The readiness harness uploads all 13 **real unchanged originals**, displays every
one in both Chromium and WebKit emulated mobile viewports, and checks intrinsic
EXIF-oriented dimensions against Sharp metadata. It injects incomplete-display
and broken-image conditions to exercise the guard. It never fills family labels,
aliases, attestations or exports a completed human submission. It reports **zero
observations and null human accuracy**, even when all 26 display checks pass.
Automated software tests cannot become independent garment review.

The dedicated workflow also runs the full integrated Node/build, frozen PR #115
source guards, actual unchanged FashionCLIP on the 13 full original-derived
inputs, and supported original JPEG/EXIF/import/before-mask crop browser checks.
Model results remain explicitly provisional. No thresholds, classifiers,
recognition vectors, old reference manifests or customer saves change.

## Concrete human handoff

```sh
gh run download 39538230372 -n new-source-originals-before-inference -D /tmp/review-originals
node scripts/human-original-review-readiness.mjs prepare /tmp/review-originals /tmp/independent-human-review
```

Give separate copies of the resulting complete folder to **two actual people**.
Each should extract it and read START-HERE.txt, open review.html in a computer
browser, select the 13 JPEGs, inspect every entire original, record visible family,
explicit uncertainty and evidence, and download their own JSON before closing.
Review separately; do not send either person proposed labels, model results or
the other person's observations. If a person has already seen those answers,
they cannot truthfully attest to blind review. Ask another person. Read source
credits after recording labels; original EXIF retains possible source hints, so
blinding remains procedural. Keep attribution/credits with the photographs.

Retain both raw returned JSON files separately, with raw-file hashes and external
identity/blinding verification. Do not commit personal information. Use unchanged
`scripts/source-holdout-human-review.mjs audit OUTPUT FIRST SECOND` to validate
coverage/hashes/attestations and reconcile family observations. This produces
self-attested agreement only: uncertainty/disagreements and ambiguous physical
garment boundaries need independent adjudication. It cannot automatically approve
gold labels, exact subtypes, physical item counts, masks, classifier changes or
production release. No messages or invitations are sent by this work.

Actual independent reviews and untouched physical-phone confirmation data remain
external dependencies. No merge/deployment, paid AI, live Supabase/Auth/customer
data, Drive Duel or physical-phone validation is included. Exact final CI results
and artifact receipts belong in the draft PR after the run; pending runs are not
credited as passing here.
