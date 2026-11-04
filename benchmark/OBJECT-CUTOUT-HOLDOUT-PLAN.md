# Independent BiRefNet Lite cutout holdout — October 17, 2026

This is an **experimental follow-up**, not a shipping recommendation. The earlier six original Commons photos favored BiRefNet Lite visually over sharp MODNet 128 for shoe shadows and missing fabric. Those observations must be checked on *different* photos before generalizing.

## Added comparison set (seven previously unused in the six-photo segmentation review)
- validation-0001 — dress in an outdoor scene
- validation-0003 — museum dress
- validation-0010 — layered/worn dress
- validation-0017 — grey jeans
- validation-0019 — studio sneaker
- validation-0023 — high-top sneaker
- validation-0024 — metallic sneaker

These are existing, source-hash-locked photos from `benchmark/manifest-fresh-11.json`. Each source's photo, license and attribution must be retained with the artifacts. The clothing *category labels* here are not pixel outlines or approved cutout references.

## How to interpret the next workflow
Workflow: `.github/workflows/object-cutout-holdout.yml`
Output artifact: `experimental-birefnet-independent-seven-photo-holdout`.

The job validates source checksums, runs the same pinned experimental model (BiRefNet Lite fp32, 1024-square input, alpha threshold 128), and exports original-versus-cutout PNGs, alpha masks, candidate mask JSON and a timestamp-free timing summary. The original source RGB is retained. No masks are silently chosen for production.

Human review should inspect: disconnected fabric, shoes missing soles or laces, false background/shadow attached to clothes, garment holes incorrectly filled, mannequin/tag/hanger inclusion, and how the cutout appears on a contrasting background. Look at native-resolution alpha images as well as 540px-wide review panels.

A pass here means **the experimental pipeline produced reviewable outputs**, not that segmentation accuracy passed. Numeric foreground counts do not measure garment preservation or shadow removal. Independently approved pixel-level reference masks are needed for those claims.

## Go/no-go for production (unchanged)
1. Compare on diverse new clothing and actual phone-camera photographs, not just source images already used for recognition.
2. Independently approve source-matched garment and background boundaries; record both preservation and contamination errors.
3. Test real phone/browser loading, inference time, memory pressure and crashes. Nine seconds on Node CPU is not evidence of acceptable mobile performance.
4. Check that hanger, price-tag and mannequin removal does not delete clothing details.
5. Only then consider changing the deployed segmentation model. **Do not change the customer-facing app or Drive Duel as part of this experiment.**
