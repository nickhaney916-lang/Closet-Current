# White-background garment color evidence: conservative recognition gating

**October 20, 2026.** Isolated main-chat PR stacked on PR #77, and thereby PR #74 and PR #69. Not merged or deployed.

## Reproducible production issue

The original-photo color checker samples a central 16px RGB grid. When that sample is confidently **White**, it already attempts a 64px conservative extraction of a colored garment against near-white corners. **But if the second extraction fails, the original White sample was still treated as confirmed.** A small blue/black item against a white product-photo background could therefore be auto-saved in the customer's closet as **White**, even without convincing garment-color evidence.

A second defect: even when a dark cloth region IS independently verified by the 64px original-RGB foreground sampling, the garment details merger could replace that verified color with the final recognition model's **White** prediction. The model had looked at the same background-biased photo; it is not independent proof of the fabric color.

## Implemented customer behavior

1. If center White is not supported by verified foreground, mark it as **needsConfirmation** with reason `white-foreground-unverified`. Still keep the original photo and category/type recognition available for customer review. No guessed color is auto-saved.
2. When final classifier suggests White in the same unresolved original-RGB scene, withhold **that color**. A confirmed garment category survives and offers the existing one-choice **Choose color · save** control. Genuine user edits are never overridden.
3. A strongly verified dark/blue/etc foreground gets a distinct `colorMethod: 'uniform-light-background'` and retains it against contradictory model color, much as an independently supported garment mask already does. This signal uses the **unclipped source photograph**. It is NOT a segmentation mask, genuine human benchmark annotation, independent color truth or AI fitting output.
4. Existing color fields from manual user selection take priority. Other uncertain central-color estimates remain corrigible by model detail as before. The foreground and recognition pipelines do not change source pixels, category taxonomy, frame-cropping or ML weights.

## Tests and honest limits

- Standalone pixel/metadata regressions in `tests/photo-foreground-color.test.cjs` and `tests/clothing-details.test.cjs`.
- Production automatic-index logic tests in `tests/automatic-indexing.test.cjs`: reject unverified White, preserve verified Black against model White, keep genuine White eligible when not ambiguously sampled.
- Actual Chromium script `scripts/test-original-photo-color-evidence-browser.mjs` synthesizes full source JPEG images with an off-center dark garment / ambiguous small colored item / real white object against a dark background / blank white photo, decodes each into canvas and evaluates the actual `photo-check.js` and `photo-color.js` implementations at original aspect ratio. It asserts conservative label handling without source modification.
- Full Node tests, app build and local browser test in an isolated GitHub Actions workflow; exact HEAD requires SUCCESS before verification.

**Not proven:** real-phone capture / frame rate, independent labeled real-photo color or garment-category accuracy, confidence in skin/multi-person scenes, user preference, production cutouts, paid AI, licensing approval, two genuinely independent human-reviewed masks. These require genuine annotated physical photographs and hardware testing. Zero billable services; no Drive Duel or PR #76 changes.
