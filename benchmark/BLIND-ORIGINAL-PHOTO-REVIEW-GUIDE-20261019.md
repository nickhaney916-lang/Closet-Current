# Closet Current: independent original-photograph garment review

This is a **research tool, not a feature in the customer app**. The goal is to turn unverified original-photo labels into actionable *independent observations* for garment form, shoes, skirts, and layers. A completed questionnaire is **not** proof of a correct mask, model recall, nor consent to training.

## Preparation

- Download the two **source-only**, separate first/second blind-reviewer JSON packets from [the verified original photo review workflow](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/39289879093) (artifact `original-form-review-queue-real-photo`). The tool displays only source IDs, not the model prediction or its original manifest label. Keep the `review-queue.json` (contains model predictions) **away from reviewers** until both passes are finished.
- Reproduce exact original JPEGs by running `node scripts/download-reviewed-photos.mjs benchmark/locked-photo-sources.json` in the repository. This downloads and SHA-validates the public licensed references; 16 locked holdout files are named `commons-0003.jpg`, etc., in `benchmark/photos/`. Use the **original files**, not clipped or AI-normalized crops. Do not upload private customer photographs to a public GitHub artifact.
- Run `python3 -m http.server 8765` at the repository root, then visit [http://127.0.0.1:8765/benchmark/blind-original-photo-review.html](http://127.0.0.1:8765/benchmark/blind-original-photo-review.html) in a browser. The server only serves the local page, and the page itself sends no photo data to any server. The page also works directly as an HTML file where the browser provides a secure Web Crypto context.
- Give **one individual** the `blind-first-reviewer.json` packet and a *different* reviewer the `blind-second-reviewer.json` packet. They should review independently in separate browser sessions, with no discussion or access to each other's results until export.

## Reviewer procedure

1. Load the assigned packet, then select its 16 original JPEGs with the local file picker. The page must say **16 of 16 original JPEG hashes verified** before a completed review can be exported. The source URL and descriptive original filename are never shown as an item/type label in the UI.
2. Work one original at a time. Count **all separately visible pieces**, including coats, visible undershirts, trousers, skirts, shoes and visible socks/tights. One left/right pair of shoes may be recorded as a paired wardrobe item; explicitly describe the pair. Never infer covered clothing or count two model mask islands as two actual garments.
3. Record each item as Category, specific form (or **Unknown**), visibility, and the **visible image evidence** supporting the observation. Describe uncertainties/occluded clothing in Notes. For a negative-control image with zero visible clothing, leave item rows empty and explain the scene in Notes.
4. Confirm the complete scene was inspected and every visible item considered, then save it. Repeat until all 16 originals are complete.
5. Export the review JSON, keeping each reviewer's result separate. No user photo pixels or AI model guesses appear in the exported JSON. Don't edit another person's submission.

## Independent reconciliation

Once both completed review JSONs have been collected:

```bash
node scripts/reconcile-blind-original-reviews.mjs \
  blind-first-reviewer.json first-completed-original-review.json \
  blind-second-reviewer.json second-completed-original-review.json \
  original-photo-review-disagreements.json
```

The validator refuses incomplete photos, wrong SHA identities, duplicate source IDs, malformed garment forms and reused reviewer identities. Reconciliation flags all **count, category, subtype and visibility disagreements** for additional review. Identical labels **still do not prove independent physical-instance outlines**.

For true layered clothing mask/recall measurement, reviewers must next independently draw and approve complete per-piece outlines using the existing `benchmark/assemble-physical-inventory.html` process and `benchmark/physical-garment-inventory.mjs` scorer. These checks do not fabricate a garment inventory or quantify physical item recall without real humans and genuine masks.

## Safety and completion boundary

The offline collection page can be tested with synthetic colored JPEGs on Chromium and WebKit; those are NOT real clothing recognition, genuine human review, or physical phone validation. A successful offline flow only proves that the review mechanism functions. No paid provider inference, server upload, release approval, production deployment, automatic garment creation or Drive Duel changes are included.
