# Closet Current — Mission 1 P835 experimental cross-view subtype safety gate

**FAMILY ALPHA HOLD #255 — draft research, unmerged, undeployed. No real family accounts, owner photo uploads, model fine-tuning, production/staging changes, or family preview website.**

## Original verified evidence
[P834 draft PR #888](https://github.com/nickhaney916-lang/Closet-Current/pull/888) exact HEAD `beb7f27b18f70faa32c94ca2ac5d4260e83f0f0f`, [successful 6/6 job original-model GitHub Actions #43144750475](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43144750475), pinned SHA-approved 16 public publisher-original JPEGs, 13 annotated garments and 3 negatives in both Chromium and WebKit. Pre-existing development-exposed photos, NOT a fresh independent human blinded test. P834 baseline observed 3 wrong automatically accepted garment subtypes in BOTH browsers, including T-shirt → Sweatshirt, Blouse → Tunic and Sneakers → Ankle boots. Both also had uncertain dresses. This baseline demonstrates a safety problem but does not justify source-specific hardcoded fixes.

## P835 hypothesis
Rather than retrain on 16 previously exposed originals, test whether **two other framings of the same unchanged FashionCLIP model** can serve as a conservative check before the private, no-account phone preview announces that an automatically selected **subtype** is accepted.

A decision candidate is eligible ONLY when the existing production `recognizeWithRecovery` already returned `strong:true`. For the optional `classify-guard835` trial mode, score the **full catalog** again on both the source-long-side padded view and source-native center-cropped view already implemented in the pinned worker. Do not change text prompt embeddings, trained weights, processor, category threshold, original JPEG semantics, fallback model, private save, owner cloud, or normal `classify` API.

- Retain a subtype automatically only when BOTH alternative views' top category AND subtype equal the original category/subtype, and both meet conservative fixed softmax-score and top-two margin checks. These are **correlated same-model views, not independent human corroboration or calibrated probabilities.**
- If both views retain original broad category but subtype evidence conflicts or is weak, return `strong:false, categoryConfirmed:true, itemType:'Unknown'`: review the subtype rather than automatically saving a wrong type. Drop unverified color/fit/pattern details; preserve broad category only as review.
- If original broad category also fails independent **view** corroboration or the required alternate inference errors, return `strong:false, choices:[]` for manual category review; do not promote a category or invent a type.
- Never replay the original JPEG on crash, never exceed the one bounded worker recovery from P833, never expose the source/filename or model tensor in the JSON receipt.
- Keep the **original default `classify` byte-level behavior**; the gate is opt-in via `?subtypeGuard835=1` in the no-account trial and flagged **EXPERIMENTAL**.

## Acceptance
Native app build and full 290-case Node regression/adversarial tests; exact pinned P834 parent, 12 allowlisted branch-specific trial/research/test/CI paths; P831-P833 recognition-only archive SHA checks for 15 assets; actual unchanged FashionCLIP in Chromium and WebKit on the **same 16 real source JPEGs each**, 2 predefined eight-source halves, signed original SHAs. An identical genuine browser run with guarded mode is evaluated by the exact P834 fail-closed original-ID aggregator.

Compare **each source and both browsers** to the exact previously verified original P834 numeric aggregate from run #43144750475, not to a model simulation: count previously wrong automatic subtypes prevented, previously correct automatic subtypes lost, any lost correct broad categories, and unchanged negative rejection. Do not conceal losses or declare any result a blind improvement. If the gate is too conservative, keep it experimental; only a NEW separately collected and independently human-labeled real-phone dataset can justify promotion.

## Open release gates
No hosted preview URL, no physical iPhone Safari or Android Chrome acceptance with original family photos, no fresh prospective label cohort, no independent color-accuracy evidence, no reliable whole-outfit segmentation acceptance, no authorized family account. The candidate is for controlled research, NOT production or public trial release. **Family Alpha HOLD #255 remains OPEN.**
