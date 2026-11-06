# Priority #118 — dual-humanoid photorealism research

**Research only · Family Alpha #255 HOLD · no merge or deployment.**

## Baseline

The branch starts at the newer 3D saved-outfit/lifecycle integration snapshot PR #669 head `5a225aa9c6530cc178bb7f48a4525be7527bcf7c`. It references P110/PR #665, which in turn is based on P109; P111/PR #669 adds lifecycle-aware mobile outfit reopen. PR #669's description did not claim an Actions pass. The latest separately documented green 3D mobile visual assessment is PR #661 / P107 head `80faa003c8e73d7aea51995545bac5679c1b32cc`, run [#42283142046](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42283142046): 997 Node tests and 384 actual Chromium WebGL screenshots. It reports no independent human realism score or physical-phone result. The visual tests use the original CC0 PR541 163-bone donor `df6885d6011cb33fb22dceb81a08f35a0ac4dd61`.

The P107 baseline screenshots show both models with bald, smooth, light-grey heads/skin and an A-pose; source photographs are correctly integrated only in that research donor. This is direct visual evidence of the mannequin-like gap, not a human rating.

## Implemented P118 overlay

P118 adds a detached-donor-only, query-opt-in renderer overlay. It retains the original CC0 GLB, 163-bone rig, clothing meshes, original-photo UVs, clothing texture bytes, source SHA, owner policy and fallback. When enabled, the body material uses warm, low-amplitude spatial skin-color variation, a roughness range suitable for exposed skin, and keeps the existing neutral clothing coverage mask. The overlay adds generated, rights-clear geometry for a fitted scalp cap and swept strands. The female style adds shoulder-length side/rear falls; the male style adds close temple/crown strands. Hair attaches to a detected head bone when available; the original rig remains authoritative.

P118 is intentionally a render-only research overlay, not a wardrobe/photo reconstruction, not production bundle code and not a claim of full photorealism. The generated hair meshes are static relative to the current supported head pose.

## Independent acceptance

The dedicated workflow rebuilds the original donor and accepted P103–P107 measurement overlays in a detached worktree, produces baseline/after side-by-side images for both models, samples front/left/right/rear/two three-quarter views at 320/390/430 CSS px with source-reviewed garments, verifies the unchanged rig and garment SHA identity, and runs inherited Node and source-contact checks. Chromium WebGL is the required engine; WebKit is recorded as pass or unsupported only when actually attempted. The contact sheet and all SHA receipts are generated from actual browser screenshots. No artificial/promotional images are used as evidence.

An independent numerical realism score is **not assigned** unless independent human reviewers complete the blind scorecard. Visible remaining stylized/mannequin features are reported directly.

## Acceptance record

P118 exact-head CI result, screenshot counts/hashes, renderer/browser measurements, clothing/body-contact comparisons, and issues are appended after final exact-head verification.

**Family Alpha remains HOLD. No production/staging modification, merge or deployment.**
