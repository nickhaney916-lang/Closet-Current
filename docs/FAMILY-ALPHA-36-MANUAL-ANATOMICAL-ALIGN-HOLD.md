# Closet Current — direct 2D garment positioning after reviewed cutouts

**Family Alpha #255 · 2026-10-27 · draft offline HOLD**.

## Why this is the next safe fitting improvement
The actual licensed black dress mask after mannequin cleanup in draft #332 preserves the black fabric, logo and V-neck, but its shoulders/waist/hem are still determined by a generic rectangular garment slot. Work #32 / PR #327 found that trying to bend/taper an entire garment by 6% did **not** consistently improve visual quality. The next safe iteration is *human-controlled rigid placement*, not manufactured clothing drape or automatic anthropometry.

## Product behavior
After the user approves the independent original JPEG vs cleaned transparent PNG in the local three-outfit preview, a **Preview-only "Adjust clothing position"** panel appears beneath the real source-backed 2D avatar. Choose a shirt/top, pants/skirt, dress, jacket or layer and use large mobile-friendly Up, Down, Left, Right, Smaller, Larger, Reset buttons. Each move is bounded; every resize applies the **same factor horizontally and vertically** so a photograph does not stretch. Updates directly modify only CSS left/top/width/height of the existing decoded approved PNG on the 2D human. The image source string, garment RGB, alpha, source hash, original JPEG, IndexedDB, outfit/swap/favorite engine and user account never change. No requests, service, ML or payment.

The controls **intentionally do not save fit positions yet**. They reset when the outfit preview rerenders, changes, reloads or account/session ends. The UI labels this limitation explicitly. This prevents storing or replaying stale or wrong-owner fitting metadata before the visual anchor protocol receives user and physical-phone acceptance.

No garment adjustment is exposed for `shoes`. A single photographed shoe/boot remains in its separate framed **NOT WORN** reference display from #332, regardless of any attempted alignment action.

## Immutable layered build
Only the existing developer-only boot wiring is overlaid on the exact [Work35 PR #332](https://github.com/nickhaney916-lang/Closet-Current/pull/332) offline bundle; one new fit-control module is copied into `dist-family-alpha-36-rigid-align-HOLD`. The predecessor [Work34 PR #331](https://github.com/nickhaney916-lang/Closet-Current/pull/331) atomic transaction rollback, refined 2D humanoid, unchanged JPEG/PNG, human mask eraser, true footwear reference, Supabase Auth and style pipeline remain byte-identical. `assert36HOLD` recursively audits ALL compiled files and refuses any extra or modified asset except boot wiring, its precise new manual module and fail-closed HOLD metadata.

## Limitations and real visual gate
Moving/resizing a 2D photo is NOT fabric fitting, sleeve posing, individual trouser leg fitting, depth/layer occlusion, new garment pixels or real AI try-on. A shoulder may align more closely, but the garment still looks pasted on if the photograph has an incompatible pose. Safe bounds reject clipping, over 22% upscaling, over 22% shrink, over 9% horizontal move or over 10% vertical move. No source photo is altered and no user-specific body shape is inferred.

Tests exercise real offline browser styling journey in Chromium/WebKit at 320/390/430 pixels: explicit mannequin cleanup, unchanged source identity, new top + trouser adjustments, exact aspect ratio, reset, single-shoe exclusion, atomic save rollback, 3 recommendations, shoe swap/favorite save/reload. They are synthetic and do not confer licensed garment appearance approval, account isolation or native physical-phone performance. A separate optional actual licensed-photo visual proposal can be reviewed before further integration.

**Release remains HOLD**; no production/staging changes, Auth/Cloudflare/Supabase/Resend modifications, paid models/spending, customer/family photo access or Drive Duel. No Work assignments created.
