# AI-normalized closet images: opt-in source-linked display gate

The Oct 17 generative comparison is a **visual concept** based on previously supplied benchmark clothing examples; it is not a deployed model, a validated per-garment cutout, or a demonstration of faithful garment identity. Generated examples can invent waistband buttons, logos, seams or fabric finish. No generated demo is authorized for automatic use in the live closet.

## Implemented
`public/garment-display-preview.js` verifies a derived preview as a **separate** optional image. To display it in the existing Grid / swipe Closet View, the preview record must:
- reference the same closet item ID and category;
- have SHA-256 digests matching the *exact* saved photo bytes and generated preview bytes;
- be explicitly marked as user-reviewed, owner-approved and identity-checked;
- remain a data URI rather than loading external image URLs;
- decode successfully, otherwise the normal photo-derived tile is used.

`public/closet-tile-engine.js` now honors only such an approved preview and retains its existing locally centered display fallback. There is no automatic image generation, external provider call, new customer tab, cloud write, budget use, recognition adjustment or source overwrite.

## Release gate
Independent visual review must check color, garment type, sleeve/leg arrangement, seams, logos, and prints against the actual original before signing approval. The generated image is **a rendering**, not evidence of an identical garment. Actual faithful folded-to-unfolded normalization must be evaluated with paired ground truth and user consent before automatic publication. Do not infer that generated examples are sufficient proof.

Workflow: `.github/workflows/closet-rack-tiles.yml`; test: `tests/garment-display-preview.test.cjs`.

PR #7 experimental, unmerged. No live Closet Current or Drive Duel changes.
