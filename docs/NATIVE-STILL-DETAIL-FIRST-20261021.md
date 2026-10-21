# Native camera manual still — detail-first JPEG budget

**21 October 2026 | source-locked isolated draft | not production**

## The issue and scoped improvement

After the verified PR #123 import-photo quality ladder, the **native phone still capture** still used a single JPEG quality .94 encode per pixel size and immediately downscaled the source frame when its storage-bounded data URL exceeded 2,850,000 characters. High-resolution item details were needlessly reduced for patterned garments or high-top shoes when slightly more JPEG compression at the *same pixels* would have met that existing limit.

In `captureCameraStill()` only, the native ImageCapture still now tries quality `.94`, then `.88`, then `.82` on the **same already rendered original RGB source** before reducing frame size (3072, 2560, 2048, 1536, 1024 longest edge). It does not upsample, resharpen or alter browser color/EXIF handling. Additional `isCurrent()` check before **each** encoding attempt prevents an old session from finishing after a camera mode switch. Decoded bitmap is closed even when an encode fails.

The output is an orientation-corrected **JPEG derivative**, not byte-for-byte original smartphone sensor content. JPEG quality .88/.82 can lose compression detail. Maintaining a larger pixel frame is not the same as proving improved subjective garment detail or model recognition accuracy, which requires genuine independent review and physical-phone testing.

## Tests and preservation

Exact customer file blob `2bac7dae8c9d13f7b8ed1baf9d41750bb0878b48`; the scope check compares the entire app to base PR #123 with **exactly one authorized camera-still block replacement**, verifies all other customer and cloud source blobs frozen and forbids unexpected file changes. Dedicated Node tests verify .88 preserves 3072×2304 dimensions, .82 fallback and eventual pixel reduction, no duplicate canvas redrawing, and fail-closed camera session cancellation. Full Node+build and Chromium/WebKit real synthetic JPEG emulation remain mandatory at exact final head.

No release approval, merge, production, paid AI, upload, Supabase change, physical camera testing or Drive Duel work. Thirteen locked real original-photo reviewer pages remain intact but **zero authenticated human review submissions**, `approvedModelAccuracy: null`, recognition model gold promotion `BLOCKED`.

## Pilot next step

On an actual Android phone and iPhone, capture detailed fabric, white-on-dark, dark-on-white, work boots, high-top sneakers, skirt/dress and layered items, verify no photo loss or wrong account after cancellation, and record on-device sharpness/color in the existing private phone pilot checklist. Do not upload original personal photos to public CI or PRs.
