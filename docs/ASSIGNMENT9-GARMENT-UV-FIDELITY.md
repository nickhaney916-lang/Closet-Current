# Assignment 9: source-detail coverage for shoes and shorts

Research extension of verified draft #248, base `e5a6d7b02097555af6fc06d5d2efe87e672db2b9`. Reviewed #228/#231/#232, #245 at 3c502d3, #250 at f2dea4c and issue #243. The main conversation's browser integration fixture, verified contracts and all original PR branches are untouched. Existing rounded shoulders, contoured body, indexed drawing and original-photo session are reused.

## Defects and corrections

The previous shoe ellipsoid used a body-wide UV formula (`v = .5 - y/3`). Around shoe height -1.2 this samples near v=.9, losing details near the source's middle. The corrected shoe envelope maps the full projected pair extent, x=-.315..+.315 and y=-1.29..-1.11, into the original front image. Both shoes share one continuous coordinate system: the left and right occupy distinct source regions instead of each receiving a repeated complete photograph. This is a generic paired-shoe projection, not automatic alignment of arbitrary single-shoe photos.

Shorts previously retained full-pants y=.05..-1.14 mapping despite ending at -.56. Their waist and both legs now share y=.05..-.56 mapping, allowing the lower original source to reach the shorts hem. Pants, skirts, dresses and body/shoulder geometry are unchanged. This is an explicit garment-dependent projection derivative; the original photograph remains the source of truth and is never rewritten.

`projectFrontUV` copies float32 geometry and changes only UV attributes. Positions, normals, original arrays, source identity, SHA-256 checks, account/source revocation, dress exclusion and indexed drawing are preserved. Invalid envelopes and nonfinite geometry fail closed. The renderer continues to use unlit original RGB on front-facing panels; estimated sleeves, sides and backs do not receive these markers.

## Verification

Local build and full root Node regression: **302 pass, 0 fail, 0 skip**, including five new tests. New tests independently verify shoe source coverage and left/right separation, full-height shorts mapping, unchanged pants/dress rules, immutable geometry and invalid envelope rejection. Earlier root tests remain unchanged.

The isolated workflow retains the unchanged saved-avatar journeys, issue243 source/photo/context-loss checks and issue248 strict indexed-vs-unindexed comparisons. The new browser script compares exact pinned #248 geometry against this candidate in Chromium and WebKit at 320/390/430 CSS pixels. Synthetic PNG sources contain asymmetric magenta/cyan shoe markers and a lower green shorts band. It requires baseline marker absence and candidate visibility, prevents cross-shoe repetition, checks front markers are absent on estimated backs, checks a 360-degree return is pixel-identical, verifies original byte hashes, and separately rejects replaced bytes via SHA-256 after restoring synthetic account scope.

New reports include per-marker pixel counts, upload/prepare wall time, 30-sample software draw + gl.finish p50/p95, mesh counts and buffer bytes. Existing reports retain loading and broader garment tests. Exact final-head CI, screenshots, artifact checksum and measured browser results are reported in the draft PR and issue #243. No phone hardware or total process/GPU memory is measured; buffer bytes are counted allocations.

## Fidelity limits and next priorities

Fixing lost source coverage does not establish physically correct placement, material reconstruction or realistic fitting. Shoe perspective, photographed background, lighting, occlusion, UV stretch and a single-shoe versus pair composition can still look wrong. Front-only projection cannot establish unseen surfaces. Synthetic marker tests are an engineering regression, not a general garment-fidelity or recognition accuracy score.

Retain the existing 2D fallback. Before customer integration: bind reviewed garment crops and geometry metadata through authenticated authority callbacks; evaluate licensed full-resolution photos with human-reviewed masks; assess body/garment intersections and semantic detail placement; collect physical Android/iPhone responsiveness, loading, thermal and memory evidence. Three-dimensional anatomy remains stylized; no realistic fabric, segmentation accuracy or accurate fit is claimed.

No new dependency, external model, third-party artwork or paid API is used. Synthetic clothing only. No customer data, production/backend settings, Drive Duel, merge or deployment changes. Main conversation owns integration/release decisions.
