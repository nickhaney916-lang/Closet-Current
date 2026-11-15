# MAIN1054 M49 — real licensed original photo → reviewed private save → Outfit Builder 2D fallback (RESEARCH ONLY)

**No merge, no deployment, no default app/public/hosted Supabase mutations, no real owner accounts or private family JPEGs, no 3D admission. Family Alpha #255 OPEN/HOLD.**

## Why this is next
The master integration track has successful separate proof for M47/M48 original photographed V-neck 3D shader *visibility and veto*, and for M31/M39 native reviewed photo/private wardrobe and owner-scoped 2D fallback. But green separate components do not prove a single owner-confirmed original photograph can traverse **the same transaction→saved owner row→actual board normalization→source-verified outfit→2D original image UI**, with revocation. M49 adds this bounded exact-source integration smoke without importing or overwriting Mission 1 #88, Mission 2 #89, or 3D viewer #90.

## Actual implementation
- **Genuine licensed public photo**: read real checked-in `benchmark/fixtures/commons-0053.jpg`, SHA-256 verify against M48 original photograph constant. No synthetic photo bytes in the positive test.
- **Real commit and private rows**: execute original `commitHumanReviewedPhoto119` against local simulated signed owner `fake-indexeddb` in `closet-current-user-<test-id>`. Test fixture includes synthetic explicit owner confirmation of a dress category, subtype and color. This verifies workflow, **not** correctness of real owner labels or fresh human agreement. Verify actual resulting owner-reviewed saved source row and exact original JPEG bytes retained.
- **Real Outfit Builder**: call the actual `public/outfit-board-engine.js` native `cleanOutfitBoard` in a Node VM (as existing integration tests do) and actual `preflightOwnedOutfit1054` with genuine saved row. Assert original SHA, owner, category+slot, no silent normalization, no 3D.
- **Real original-photo 2D preview module**: exercise `mountOwnerOutfitPhotoPreview1054` against an isolated DOM-like EventTarget fixture; assert exactly the saved original JPEG base64 is displayed, with 2D-only and zero releases/3D admission. This is a local model of a UI, **not** a real Android/iPhone/native browser screenshot.
- **Adversarial controls**: before review no private save/disclosure; same-owner auth object swap, private IDB connection replacement, source SHA change, logout and board slot mutation or capture epoch change revoke/deny stale private original pictures. Result and status must not include private original data/auth refs.
- **M48 handoff**: retain source-specific `M48.consumer3DAdmitted=false` and release HOLD. A known public original-photo shader cutout is not an actual sewn neckline, nor does it license arbitrary private owner 3D.

The new test file is `tests/main49-licensed-original-photo-private-outfit-2d.test.mjs`, and its dedicated no-deploy workflow independently runs inherited M31/M39/M40 existing source tests, M16/M17 original photo display lease, complete app Node regression and unchanged build. Research branch diff has only the new test, this report, and no-deploy workflow. Parent is exact accepted M48 draft head `53498ac014eb054e028036dea97e0f793afaf581`.

## Acceptance needed
Exact-head M49 no-deploy CI must pass and source JPEG SHA must match M48. If the source verified registration rejects owner-selected Dress/top or the public source JPEG SHA is not the expected donor, investigate source evidence rather than disabling the check. The new positive test cannot prove image-recognition model accuracy; the owner's choice is synthetic, not independent human adjudication. No live JWT, hosted Supabase RLS/private backup or real physical Android/iPhone session is tested. Separate M47/M48 Chromium/WebKit real native 3D/NO-GO and Mission #89 unphotographed rear safeguards remain binding.

**CI status at first draft submission:** NOT YET VERIFIED. Do not transfer any previous head's green checks.

## Next if green
1. Verify actual owner-confirmed record and signed owner source path with true browser and user private account only when owner authorizes pilot/account access; otherwise keep isolated real public source + fake IDB scope.
2. Independently measure mobile repeated recognition and unknown-subtype/color errors before any no-silent-save release claim.
3. Hand genuine source-fidelity and physical topology/collar/back/body motion deficits back to Mission 2 #89.
4. Maintain Family Alpha #255 OPEN/HOLD until authentic integrated acceptance, 4 protected users, physical phones and owner approval.
