# Family Alpha — Dress-versus-Tunic original-photo review HOLD

**Date:** October 26, 2026 (Pacific). **Scope:** Staging/offline Family Alpha artifact ONLY, development draft, not deployed. Relates to issue #255, stacked on draft #316.

## Actual evidence and scope

The archived October 13, 2026 **100 real-photo** broad-category benchmark in `docs/recognition-holdout-results.json` recorded **70 automatically accepted** category predictions, **68 correct** and **2 wrong**. One true dress was incorrectly auto-accepted as a **Tops / Tunic** at a top-label score of **0.8348**. There were **7 Tunic predictions** on this frozen historical set; **6 were already held for review**, and the **only automatically accepted Tunic was the incorrectly categorized dress**. The other wrong accepted example was a hat incorrectly labeled a sweater. These are broad categories only, not color/fit/type guarantees.

These are *historical results from an earlier worker/runtime*, not a current model evaluation. Do not claim the current scanner reproduces those counts. Merely **replaying the existing recorded predictions through a Tunic acceptance veto** would change accepted 70→69, correct accepted 68→68, wrong accepted 2→1. This is a retrospective **decision simulation**, not newly measured classifier improvement, not real-photo image re-inference and not proof of 98.6% field accuracy.

## Narrow source-locked change

`applyTunicDressAutoReviewHold()` is composed **after** the original source-pinned recognition + worker recovery + mobile Adjust implementation, and after draft #316's Outerwear safety overlay. It changes only the assembled, disabled Family Alpha staged artifact, not `public/app.js`, the classifier model, vectors, camera capture, Supabase settings, staging deployment or production.

- When automatically recognized as **Tops / Tunic**, with **or without** color, retain the item in the original-photo review queue instead of setting `recognitionReviewRequired=false` or automatically saving.
- For `Tops / Tunic` with missing color, **do not show the one-choice Choose Color quick-save escape hatch**; guide the tester to Adjust.
- Adjust remains the only explicit manual path. The mobile dialog already requires original image, category, item type and color inspection; users can correct the dress to **Dresses** or confirm a genuine **Tunic**, without inventing additional attributes.
- Preserve draft #316 Outerwear hold. Existing non-Tunic Tops and all other categories retain their earlier auto-save behavior. A true dress misclassified as an unrelated Tops subtype is *not* fixed by this filter.
- The new transform fails closed if expected source anchors move, if prior Outerwear gate disappears or if applied twice.

## Tests and remaining blockers

`tests/family-alpha-recognition-integrated-hold.test.mjs` checks: the **exact archived 100-photo data accounting** and limited retrospective decision simulation; ordering of hold versus both final automatic admission and color fallback; synthetic execution of the **actual compiled quick-color predicate** for T-shirt, Tunic, Sweater and Coat; source-anchor drift and duplicate overlay refusal; byte-exact frozen source composition.

CI is `family-alpha-recognition-combined-hold.yml` with 543+ Node and synthetic Chromium/WebKit checks. Treat all new results as pending until **the exact PR head's run** is successful. Staging/Auth remain disabled with release HOLD and no cloud/third-party writes.

**Not proved:** real-photo color accuracy, effectiveness on updated current scanner or actual family phone pictures, physical-phone experience, live account A/B JWT authorization, real family data isolation. A human should decide Tunic versus Dress from the **original JPEG** during the first family pilot after security gating. Keep children out until adult account isolation is proven.

**Restrictions:** No merge/deploy, real photo ingestion, real accounts, Supabase/Cloudflare/Resend changes, paid AI, spending, production or Drive Duel modification.
