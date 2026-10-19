# Two reusable figure asset readiness

This is a procurement/acceptance specification, not a purchase, license grant, legal opinion or authorization to replace the figures. Reuse exactly one fixed female and one fixed male master. All rights evidence remains unknown until verified against the actual selected files and intended product use.

## Current evidence

The checked-in `female-preview.webp` and `male-preview.webp` decode to **160 × 297**. Display at a canonical 647-pixel width already enlarges them **4.04×**; a 2× pixel-density export would enlarge them **8.09×**. Upscaling cannot establish native detail. Full-resolution masters referenced by `scripts/stage-ai-model-figures.mjs` are not present in this repository. Hashes and filenames alone prove neither possession nor commercial rights. Existing previews wear gray clothes; their sleeves/trousers can show under customer overlays. No neutral-base approval, body/hair/hand occlusion masks or independently approved anchor set is recorded.

## Proposed technical acceptance

- At least **1294 × 2398 native pixels** per master, matching a 2× rendering of the canonical 647 × 1199 stage. This is a proposed product target, not a universal quality standard. Preserve the uncompressed/lossless master and produce web derivatives separately; record source/output SHA-256, decoder, ICC/sRGB conversion and orientation.
- Same front camera angle, scale, light and body anchor system for both figures. Aspect ratios within 1% are only an initial consistency check; shoulders, elbows, wrists, waist, hips, knees, ankles and face oval need visual calibration for each figure.
- Neutral, modest base clothing that does not protrude into the supported garment silhouettes. Entire head/hands/feet in frame, arms separated from torso, simple stance, no crossed limbs. No logos, jewelry or background clutter that could be confused with customers' garments.
- Separate reviewed hair/hand/body occlusion layers, face anchor/oval and approved default garment rectangles. These are auxiliary masks for the same two bodies, not additional figures. Test sleeveless/long-sleeve tops, trousers, shorts, skirts, dresses, jackets and shoes without inventing hidden fabric.
- Compare both figures at 1×/2×, near/far zoom, pale/dark clothing, optional local selfie and 200% UI zoom. Browser emulation and physical Android/iPhone tests are separate from visual approval.

## Rights evidence required for the exact two masters

Record provenance/creator, acquisition date, original file hash, agreement/receipt reference, permitted commercial use, modification/clothing overlays, app distribution/caching, user composite exports, and optional face replacement. For recognizable real people, obtain and review permission applicable to these uses; for fictional/generated figures, preserve creation/provenance and the applicable tool terms. Keep contracts/releases outside the public repository and store only non-sensitive evidence references here. Unknown fields remain `null`, never presumed true.

Stock licensing generally grants use rights rather than exclusivity; terms differ by provider and use. Adobe's current FAQ, as one primary example, says its stock licenses are non-exclusive, non-editorial assets may be edited subject to restrictions, and recognizable people in commercial stock require model releases. It does not certify this app's specific distribution/face-replacement use: review the actual license before acquisition. [Adobe Stock licensing FAQ](https://helpx.adobe.com/stock/web/common-questions/usage-licensing.html)

AI output should not be assumed to provide exclusive copyright ownership. The U.S. Copyright Office states that protectability depends on sufficient human-authored expressive elements; prompts alone are insufficient. That is distinct from contractual permission to use an output. [Copyright Office, January 29, 2025](https://www.copyright.gov/newsnet/2025/1060.html?loclr=licop)

Fixture photo permissions do not license the standard figures. The real-photo packet retains each fixture's existing title, credit/source/license URL, plus derivative change notices. CC BY requires attribution; CC BY-SA also imposes share-alike on adaptations, and neither eliminates every privacy/publicity/trademark concern. Diagnostic derivatives must retain their corresponding terms if shared. [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) · [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)

Sources checked October 19, 2026. No images bought, generated, substituted or deployed.
