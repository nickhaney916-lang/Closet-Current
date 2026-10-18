# Free studio-background shoe preview — actual source evaluation

**Why:** The four licensed source-photo previews from the previous pose benchmark were effectively identical. A quick, offline original-pixel color-separation proof of concept showed a visually cleaner result on the original black/coral sneakers against light gray studio background, **without generative AI**. The same naive techniques contaminate orange shorts with wood racks and leave dark jackets/gray jeans unisolated, so forcing them would misrepresent the actual items.

**Narrow change:** `public/closet-neutral-matte.js` applies a high-confidence, exterior-only neutral-light background detector **to Shoes only**, as a secondary alternative when strict white-matte fails. Requires a clean border, a substantial dark colored foreground with visible nonneutral color, valid margins and uncertainty limits; preserves all RGB pixels and generates alpha for proven exterior connected background, never inventing an article. Pale shoes, white fabric, cropped shoes, colorful rooms and all other garment categories automatically retain their original photo. Internal neutral pixels that might be shoe details are not confidently classified; true identity still requires visual evaluation.

**Actual original-photo benchmark:** `scripts/run-real-neutral-matte.mjs` downloads/checks SHA-256 for four existing CC-licensed reference photographs and renders genuine originals side by side with the free preview. Records rejection reasons and **never labels a passing heuristic as a measured pixel-accurate garment mask**. Derived previews are not saved to cloud accounts. The benchmark is not a source-conditioned paid AI model or a verified apparel cutout fidelity evaluation.

This is a safe, isolated incremental preview for qualifying colored shoes, not proof all garment categories can be reconstructed for free. User's paid AI services remain **$0**. Never deploy/merge until evaluated on a real phone and against pale/white shoe edge cases. Drive Duel untouched.

**Benchmark correction:** The first before/after shoe artifact revealed an error in the test renderer: Sharp expands RAW grayscale to RGB by default while resizing. Treating those three channels as one shifted the transparency and removed shoe material. The runner now forces grayscale, verifies the one-channel image dimensions, and asserts that foreground retention matches the original small preview. The production browser's mask rendering did not use Sharp and was unaffected.

## Expanded nine-photo regression checkpoint

The review now checks nine licensed, SHA-256-verified source photos (six footwear,
three non-footwear). The added `validation-0023` patterned high-top case exposed a
real defect: pale soles connected to the exterior were removed while dark shadows
remained. A conservative vertical-gap guard now rejects that ambiguous mask and
retains the complete source photo. The real-photo runner asserts this fallback,
plus continued eligibility for the previously reviewed black/coral sneaker pair.

Result: one preview accepted, eight originals retained, all nine checksums verified.
This is coverage and fallback evidence, **not 9/9 segmentation accuracy**. Complex
background segmentation remains unresolved. The guard does not establish that all
pale soles are protected, particularly scenes without a darker shadow underneath.
No broader category enablement, paid calls, merge or deployment is included.
