# Closet Current — 3D-10 independent mobile QA and source-failure recovery (HOLD)

**Why this is the next main-thread priority:** The owner requested the next Closet Current priority be **completed**, but Work Assignment #59 is independently implementing natural garment drape/shoulder realism. We do not duplicate Work59. Instead, validate that the verified existing **Work56 separate real-photograph garment + Work57 relaxed skeleton**, integrated in main-thread [PR #404](https://github.com/nickhaney916-lang/Closet-Current/pull/404), remains reliable through untrusted source failures, reapplication and repeated pose changes.

This research branch is based on exact PR404 head `b1b3a306aeba7ce490b0f4d4305813e736117bda`, itself independently dedicated-CI green. It changes **no actual application, rigging, fabric algorithm, cutout, cloud, source photo or staging file**; only a new test runner, pure no-deploy test, workflow, and this document. The Work56/57/58/59 branches are untouched.

## What the added real-WebGL testing does

It runs the **entire inherited 3D-10 combined browser integration journey**, including both verified male and female CC0 anatomical figures, 320/390/430px Chromium software-WebGL2, 15-photo original-licensed benchmark rebuild, the unchanged Work47 original JPEG and transparent PNG SHA checks, explicit trusted clothing review, real independent skinned garment, actual source/relaxed/reverse posing, rotation and GPU cleanup, mobile layout and no external network.

At **390px on both anatomical figures**, it then performs a new full fault-and-recovery sequence while the original shirt is removed:

1. Deliberately intercept only local `/benchmark/work47/assets/commons-0003.png` and return **different bytes with the same filename**. User checks source-review and attempts real browser-initiated clothing application.
2. **Require** the real existing loader to refuse the now-untrusted source, show an explicit blocked status, leave the humanoid unclothed of the source shirt, keep the photographic source identity unset, and retain no photo GPU texture. The dummy bytes never enter the actual figure.
3. Remove the interception, reattempt with the **unaltered original source file and mask** and require successful reapplication of the exact original JPEG+PNG source under the same manual review interaction. No automatic approval, no source fallback.
4. Reversibly pose the real shirt **four cycles source ↔ relaxed** and confirm source SHA, original garment triangle count and the GPU geometry/texture resource counts do not drift.
5. Physically remove the source garment and verify the real skinned shirt is gone, no source binding remains and the photo texture has been disposed. All inherited two-figure/three-viewport tests and outside-request checks remain enforced.

This closes a concrete integration acceptance and privacy reliability gap; it **does not** improve the appearance of fabric or claim the 15-photo human-graded quality gate is now green. Actual photo/shape acceptance still belongs to Work55 and current Work59 drape assignment. Four real-family test accounts still need the separate live JWT/RLS, backup, session, Samsung/iPhone and visual go/no-go gate.

## Safety / interpretation

Exactly four paths allowed in the PR against the pinned integration parent. No customer-owned wardrobes, no personal photos, no production/staging writes, no deployments, no Supabase/Cloudflare/Resend changes, no money or Drive Duel changes. The outside browser network must remain **zero**. The CI is a **development test**, not evidence that the protected staging app already contains these new 3D features. Source original and cutouts are never modified or re-saved.

**Known blockers remain:** all PRs are still draft/unmerged, broad inherited camera/indexing scenario CI has a separate failure, physical phone validation and owner-reviewed 3D appearance are pending. Do not invite the four family testers until the staging release gate is satisfied.
