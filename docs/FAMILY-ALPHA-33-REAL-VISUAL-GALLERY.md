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

## Current evidence

- Local exact replay builder PASS: 15 originals, 7 matching native proposals, 8 blocked cases; both upstream renderer/planner hashes unchanged.
- Local new Node tests: 4/4 PASS for source replay/geometry identity, honest coverage, false-approval prevention and localhost boundary.
- Chromium/WebKit 320/390px screenshot run prepared; execution and screenshot inspection pending exact-head CI. Automated display checks are technical checks, never visual acceptance.
- Garment findings start as REVIEW pending screenshot inspection, or FAIL/NOT RENDERED where no cutout exists. The final findings file will record actual visual observations; no owner acceptance or physical-phone verification is implied.

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
