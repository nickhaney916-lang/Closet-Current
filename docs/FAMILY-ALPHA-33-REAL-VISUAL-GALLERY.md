# Assignment 33 — real garment visual acceptance gallery

Separate offline evaluation on #324. **Family Alpha HOLD. No owner approval.** No clipping, body, fitting, recommendation, Auth or deployment source is changed. #325 styling integration is a read-only reference; Work #32 fitting is deliberately not applied.

## Immutable inputs

- Work #30 / PR #324: `dd6bac3fa9ff640d4f562cf925337440bdb5cf8f`, original 15-photo category/scene labels, source checksums, decisions and seven native cutout proposals.
- Previous #320 geometry: `094896d1b0655662787a78bc80d61af822a9e265`.
- Current #326 figure/alpha placement: `e75cd4689356ae468a88504ddb25df4b4ff6cb70`.
- #325 integration reference: `44f288dfdcfa02ec5b2cf89a7c79c08cfcaa3584`.

The two renderer/planner pairs are copied byte-for-byte via git show into separate gallery-only folders. No upstream branch or public file is edited. Only the exact frozen native alpha outputs from #30 are included as small derived fixture assets; their checksums must match #30's published model-results.json. Reapplying those masks with #30's unchanged function reproduces all seven **exact native PNG hashes** recorded from #30. No mask inference, threshold tuning, new crops or clothing pixel invention occurs. No neural model download or runtime is needed.

All originals remain the appropriately licensed source files already in benchmark/fixtures; their original byte hashes are verified. Attribution and per-image license terms are inherited from [Work #30's attribution](evidence/family-alpha-30/ATTRIBUTION.md), including the frozen derived masks and screenshot comparisons. Source manufacturers/photographers and source-page links remain visible in the gallery.

## Gallery and gates

Each example shows original photograph, checkerboard transparent proposal, previous humanoid and current humanoid side by side, with a garment-specific grade/reason. On mobile these form a readable two-column layout. Every proposal and both avatar previews are marked **PROVISIONAL / NOT APPROVED**.

Seven proposals can be inspected; eight cases have no cutout. Those eight explicitly show **NOT RENDERED**. No unmasked original or generic garment is substituted to make coverage appear successful. Shirts, jackets, dresses, skirts, pants, shorts and footwear are represented in the cohort, but the missing categories cannot be claimed as successfully displayed.

This is a localhost-only diagnostic use of the existing low-level photo renderer to inspect **unapproved licensed benchmark images**. It is separate from the application, does not fake approved:true, create an account, store a wardrobe, or enable any normal avatar approval route. No real-user authorization is implied. Default app/staging/release gates remain unchanged.

## Visual findings — these pinned versions only

Assistant inspection covered all seven rendered Chromium 390px examples, with WebKit 320/390px cross-checks. This is not independent external annotation, owner approval or physical-phone verification. It makes no claim about later Work #32 fitting changes.

| Example | On-avatar decision | Observed reason |
| --- | --- | --- |
| 0001 shirt | FAIL | Dark collar/hanger contamination persists; tilted source silhouette does not establish sleeve/arm contact. Print remains recognizable. |
| 0003 long-sleeve shirt | FAIL — NOT RENDERED | No cutout; mannequin/jeans scene blocked. Fit and edge quality are not evaluated. |
| 0065 jacket | FAIL — NOT RENDERED | No cutout; clipped source. No forced whole-photo overlay. |
| 0068 coat | FAIL — NOT RENDERED | No cutout; outdoor scene/hanger. |
| 0053 dress | FAIL | Extra white mannequin neck appears under/in front of the avatar chin. Trim/logos survive, but the source contaminant survives too. |
| 0043 skirt | FAIL — NOT RENDERED | No cutout; mannequin/low-contrast scene. |
| 0033 shorts | FAIL — NOT RENDERED | No cutout; person and textured background. |
| 0021 pants | FAIL — NOT RENDERED | No cutout; person, shirt and shoes remain inseparable in available evidence. |
| 0082 sneakers | FAIL | Side-view footwear composition occupies one shared area; individual soles do not align to the two front-facing feet, and bare body-foot shapes remain visible. |
| 0088 boot | FAIL | Tall boot is scaled into a short central footwear slot; shaft/sole do not align to the body legs/feet. Prior clipping FAIL remains. |
| 0016 blouse | REVIEW | Strongest example: pale background removed, embroidery and hem recognizable; loose torso placement plausible. Sleeve/arm contact, hem size and fine edges still need review. |
| 0079 difficult sneakers | FAIL — NOT RENDERED | No cutout; outdoor support/background. |
| 0089 boots | FAIL | Photographic heel perspective and offset/small shared placement do not match the two ankles. Surface highlights remain visible. |
| 0094 lace-up boots | FAIL | Side profile crosses the foot area instead of attaching naturally to individual legs. Laces/seams recognizable but grounding fails. |
| 0059 difficult dress | FAIL — NOT RENDERED | No cutout; clutter and clipped edges. |

**Summary: 7 rendered proposals → 6 FAIL / 1 REVIEW; 8 additional blocked cases → FAIL / NOT RENDERED. Overall 0 PASS, 1 REVIEW, 14 FAIL.** The eight blocked cases are not eight measured bad fits; they are missing prerequisites. Work #30's separate clipping decisions remain unchanged at 12 REVIEW / 3 FAIL. This assignment grades the complete on-avatar visual requirement, not classifier accuracy or independent full-mask quality.

The newer face/hands and alpha-bounds adjustment do not repair attached mannequin parts or photographic footwear perspective. Native color/texture stays recognizable. Image-aspect preservation and correct decoding do not establish garment-to-body proportions or realistic drape. At mobile size, fine halos, missing thin details and softened boundaries cannot receive full-resolution approval. Those edge limits remain REVIEW, even where the standalone cutout looks clean.

Work #30 receives source-object/edge observations; Work #32/main receives sleeve, scale, ankle/sole and perspective observations. No segmentation, pose warping, per-foot mapping or fitting code is changed here.

## Technical evidence

- Local replay: all 15 original hashes and **all seven exact Work #30 native PNG hashes** match. Both geometry pairs remain byte-identical to upstream pins.
- Initial [no-deploy Actions 40447471490](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/40447471490), code `bf731e7f`: **565/565 Node PASS; 60/60 Chromium/WebKit technical cases PASS** (15 examples × 2 engines × 320/390px). That comprises 28 rendered-proposal cases and 32 correctly blocked cases. No network outside localhost, broken images, page errors or horizontal overflow. [All 60 provisional mobile screenshots and raw results](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/40447471490/artifacts/12709022370).
- Initial screenshots were inspected before these grades were written. A follow-up run will refresh the screenshot labels with the actual findings and confirm image-aspect preservation. Technical PASS is never promoted to visual PASS.
- No model inference, app Auth, private wardrobe, cloud/RLS or actual phone test. Owner visual acceptance **NOT GIVEN**.

## Reproduce

Install isolated test-only Node tooling (sharp 0.35.5, Playwright 1.56.1). Fetch the exact input commits listed above and existing held-build prerequisite pins in the no-deploy workflow.

```bash
node scripts/build-family-alpha-33-gallery.mjs
node --test tests/family-alpha-33.test.mjs
node scripts/test-family-alpha-33-browser.mjs
```

The script produces a separate `dist-family-alpha-33-visual-hold` gallery. Serve only on localhost. Browser outputs go to benchmark/family-alpha-33 with PROVISIONAL-HOLD in screenshot filenames. No model downloads, account credentials, provider changes or paid services required.

## Remaining release conditions

Real cutout/garment positioning must be visually acceptable to the owner on actual phones, with real account/privacy gates verified by the main thread. A cleaner face or green browser suite cannot approve incomplete garments, side-view shoes across two feet, leftover mannequin parts, sleeve/shoulder mismatch or apparent loss of detail. Work #30 owns clipping; Work #32 owns fitting; this assignment records evidence only. No merge/deploy/invitations are authorized.
