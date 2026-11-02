# MOBILE-PINCH-13 — genuine two-finger mobile inspection and source-exact reset

**Parent:** SOURCE-TOUCH-12 draft PR #524 exact SHA b38e056aa8ae63c164227d38fb71051b6d13e88b, dedicated research no-deploy run #41513029727 SUCCESS.

## Product gap
Single-finger rotations were verified, but the real two-finger pinch zoom and safe return to a complete crisp source-photographed front were not. The mobile research viewer offered existing safe zoom limits (2.5–6 meters), but only yaw-based front reset, not full camera reset.

## Implementation and acceptance
- Preserve all source photographs, source JPEG identities, mesh UVs, anatomical rigs and body-contact tests.
- Add user-facing accessible Reset view button. Auth-gated control restores a saved canonical full-body original front, camera distance and target, clears previous damped controls and stops spin. Update real original-photo front/side/rear provenance.
- In 8 independent original synthetic-account 3D wardrobe sessions, send genuine two-point Chromium browser-engine Input.dispatchTouchEvent touchStart/touchMove/touchEnd with finger IDs 41 and 42 and 20 steps. Expand then contract pinch; not synthetic DOM events or app.zoom.
- Original male/female 163-bone skinned humanoids, widths 320/390/430px, both separate licensed original jeans photo sources at 390px. Camera bounded 2.5–6m. Each pinch direction must visibly change 50+ real WebGL RGB pixels.
- Verify owner and source SHA intact, photo/UV/skin unchanged, no added skinned-body BVH contacts, real truthful original-front status after reset. Require canonical camera distance within 0.02m and original full-body WebGL pixels restored within 2 changed pixels, not a re-baselined screenshot.
- 8 touch sessions x 4 WebGL screenshots (initial/near/far/reset) = 32 genuine comparison images. CI asserts the JSON witness, image counts, old F12/F11 touch/mouse tests and all earlier strict anatomical dress reset tests unchanged.

## Honest limits
This is native *Chromium browser engine* multi-touch dispatch with synthetic licensed assets at mobile width. NOT real fingers on a physical Android or iPhone and NOT Safari tested. The source photographed denim front remains real; the sides and rear are modeled and cannot be called original photographs. Human 10/10 photorealism REVIEW, Family Alpha #255 HOLD. No production merge, deploy, staging edit, private customer photos, or other apps. Completion requires exact head CI success and independent artifact review.

## F13 strict regression diagnosis (2026-11-02)

First no-deploy F13 run #41517650938: the first true two-finger native browser gesture **already worked** and rendered changed photos, but a generic reverse-pinch assertion failed. Second diagnostic run #41518352698 measured original 320px female denim F13 actual camera values: canonical 4.650526851873882m → pinch-expand **2.5000000000000004m** (67,270 changed original WebGL pixels) → pinch-contract **6.000000000000001m** (67,000 changed pixels). The 6.0m safe OrbitControls limit was enforced; only IEEE-754 floating-point representation differed by ~1e-15m from 6.0, making the mathematically strict <=6 JavaScript comparison falsely fail. Corrected **only** the numeric bound assertions to `>=2.5-1e-9` and `<=6+1e-9` (one billionth of a meter tolerance); did not alter viewer zoom min/max 2.5/6.0, source fidelity, screenshot thresholds >=50, exact reset <=2, owner, or any inherited tests. Exact final-head CI success and screenshot review remain necessary for acceptance.
