# Mission #90 Milestone 14 — native mobile touchscreen control acceptance (research/HOLD)

## Objective

The existing original-photograph-attested anatomical 3D native viewer has real Chromium+WebKit mouse drag/keyboard/button checks, plus synthetic mobile (320, 390, 430 CSS px) and 390px landscape checks. However, ordinary Playwright `.click()` can use pointer/mouse emulation; it does not prove the real touch-generated tap handler path. Keep original avatar camera and source/photo/owner identity stable while validating the actual browser touchscreen control path.

## Implementation (no app product changes)

In `scripts/check-parallel90-interactions.mjs`, the existing 390px verified browser fixture (Playwright `isMobile:true,hasTouch:true`) now uses **actual `page.touchscreen.tap()`** on three original 44px-class mobile controls for **both** original female and male 163-bone rigs, in **both** Chromium and WebKit: rotate-right, zoom-in, and reset-front. Before the test, the original source-attested camera is reset. Each touch-generated tap verifies actual camera angle/distance changes and front-view restoration, exactly **163** bones, unchanged selected source-photograph hash identity and unchanged original geometry/texture/renderer counts. All existing 16-turn mouse controls, keyboard, landscape viewport, source admission, context-loss and explicit re-open tests remain and execute afterward. The receipt `touchButtons90` records each real research-browser success for both figures at 390 CSS px; this is **not** a physical Android/iOS touch event or display benchmark.

Additional full-Node source regression requires the actual mobile+touch context and dual browser engines, distinct touch taps for all three controls, and source/bone/resource parity. There is no change to authenticated source admission, outfit selection, source JPEGs, collision mesh, 163-bone skin, consumer editor writes, cloud requests, production, staging, owner accounts, or fallback. This is browser test coverage only.

## Acceptance gate

Require dedicated **exact-head** no-deploy Chromium and WebKit, full Node, M11/M12 controlled BVH source/pose/collision/RGB parity, M13 WebKit mobile hidden/freeze source-revoke and all current camera/context loss checks. A failure in touch validation must be investigated rather than skipped. These CI browser contexts emulate mobile sizes and touch APIs but **do not establish physical Android Chrome or iPhone Safari acceptance**.

**Family Alpha issue #255 stays OPEN/HOLD, no merge or deployment.**
