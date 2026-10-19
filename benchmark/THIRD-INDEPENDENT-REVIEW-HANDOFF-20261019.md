# Closet Current — third independent original-photo adjudication handoff

**Research only.** This prepares a safe next step after two human reviewers independently inspect complete original photos; it does not create reviewer attestations, physical masks, product garment labels, automatic closet items or a statistical improvement claim.

## Problem fixed

A previous reconciliation could return “the two reviewers agree” when BOTH entered **Unknown**, or BOTH marked a garment **partially visible**. These are matching observations but an unresolved specific form; silently treating them as reliable ground truth would corrupt a future footwear or layered-garment benchmark.

The updated `blind-original-review-submissions.mjs` now distinguishes:
- Exact count / category / specific-form disagreements;
- Differences in visibility of layers (including whether a garment is obscured);
- **Both reviewers agree the form is Unknown or the piece is partly visible** — automatically requires a separate review;
- Identical fully visible labels — does NOT require a third blind label check, but **still requires actual separate per-garment approved pixel masks** before item recall or localization can be measured.

The new independent handoff has two **deliberately separate files**: a PRIVATE adjudicator comparison with previous observers' category/form/count differences, and a THIRD BLIND source-only packet that contains no previous answers. Never give the private file to the third reviewer.

## How to use after real reviews

1. Download the **separate, source-title-redacted** first/second reviewer packets from the successful [PR #24 workflow](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39295252713); never hand out the earlier, combined model review queue.
2. Have two different people complete the full original-source blind inventory using [the local review UI](blind-original-photo-review.html). Each must independently verify SHA-256 against the identical original JPEG bytes and export their own form observation file.
3. On a local private computer, run:

```bash
node scripts/prepare-independent-photo-adjudication.mjs \
  blind-first-reviewer.json first-completed-original-review.json \
  blind-second-reviewer.json second-completed-original-review.json \
  local-private-adjudication/
```

4. Keep `local-private-adjudication/ADJUDICATOR-PRIVATE-comparison.json` with the adjudicator only. It shows which IDs had count, form, visibility or unresolved-uncertainty differences. **It is not approved garment truth**.
5. If any source needs a third independent reviewer, distribute **only** `third-blind-source-only.json` to a **different** person. That person can load it into the SAME local [blind review page](blind-original-photo-review.html), plus just the needed canonical original JPEGs; the page accepts the third review slot with no previous human or model answers. The third person's alias must not match either prior reviewer.
6. After review, assess the third submission with `checkThirdIndependentSubmission(...)`. It validates exact SHA/source and distinct reviewer alias but **does not automatically crown a winner**. The adjudicator still needs original-pixel inspection and approved per-item masks.

## Limitations and product decision

- Merely supplying different aliases does not technically prove two humans genuinely acted independently; human process controls are still needed.
- Even three mutually consistent labels do not prove two overlapping garments have separately identified, approved outlines. Use existing [first-reviser outline drawing](annotate-garment.html), [independent mask approval](approve-garment-mask.html), [full-outfit completeness](assemble-physical-inventory.html), and [one-to-one IoU matcher](physical-garment-inventory.mjs).
- Specific shoe forms (sneakers versus ankle boots) are not validated by the existing DeepFashion2 instance taxonomy, which lacks shoes and hosiery.
- All changes are to a research-only branch. No published production improvements, no paid inference, no actual physical-phone test and **zero completed human submissions** at this checkpoint.

**Completion criterion for this engineering priority:** the third-blind packet and private comparison remain properly separated, unknown/partly visible cases stay unresolved, and Node + phone-browser emulation tests pass. **Actual category/form accuracy, mask IoU, instance recall and public pilot readiness stay blocked** until real human review.
