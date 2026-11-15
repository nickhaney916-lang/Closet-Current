# Closet Current Mission #90 — Milestone 19: user-controlled 3D auto-rotate pause (DRAFT / HOLD)

## Source ancestry and safety

M19 stacks on isolated M18 commit `1e22d27a522167cf232a87c87f96b9ae6d5e0232` ([draft PR #1198](https://github.com/nickhaney916-lang/Closet-Current/pull/1198)), which descends from M17/M16/M15 and the immutable pinned PR541 original 163-bone anatomical rigs and original licensed garment photographs. The new work changes **only** the disposable donor research installer, browser interaction checks, Node source guard, no-deploy branch trigger, and this report. It never changes `public/`, `supabase/`, cloud/owner saved outfits, original source JPEG/UV/geometry/skinning/cloth, deployed code or other parallel mission branches.

## User-facing improvement

The real source-attested native 3D research viewer already has **Auto rotate**, but previously lacked an obvious button that stops animation without moving or replacing the photographed outfit. M19 adds a minimum 44px-class **Pause rotation** control in the same mobile control cluster. It invokes the existing original showroom `scene.setSpin(false)` only when the signed-in native research panel is current and an original anatomical scene is active; otherwise it fails closed using the existing private cleanup. No new garment-photo/3D authorization, saved outfit mutation, material upload or source caching.

## Genuine browser acceptance

At 390 CSS pixels in **both actual Chromium and WebKit browser engines** with mobile+touch browser contexts, on each original source-admitted female and male 163-bone figure:
1. Reset to source-front camera; record the actual original garment SHA, 2D gallery item count, WebGL geometry/texture allocations and source owner lease.
2. Click the original Auto rotate button; require that the camera angle visibly advances more than 5° within 8 seconds. This is a real WebGL-rendered anatomical camera, not a fabricated rotation counter.
3. Click the new accessible Pause rotation button, assert minimum 43px width/height and source-honest accessible label. Require subsequent camera drift below 2° after 650 ms (real pause, not only a changed UI label).
4. Require 163 original bones, unchanged original source SHA, photo count, WebGL geometry and texture allocations, and active original owner 2D session. Reset front again.
5. Emit `autoSpinPause19` only upon passing every real browser assertion. Retain all M14–M18 gestures, owner/wardrobe photo hash + revocation, WebGL context loss, original-source photo RGB, contact/collision BVH benchmark and Node checks.

**Limitations:** browser-emulated mobile sizes, synthetic authorized test owner, actual locked-license public JPEG and authentic source model, not physical Android/iPhone hardware touch, FPS/GPU/RAM certification, human rear photo fidelity or signed hosted RLS account. M19 adds a real browser UI capability but does not solve Mission #89 photo-derived full multilayer garment reconstruction or real signed-owner integration.

## Acceptance

Do not claim M19 accepted until an exact M19 HEAD dedicated no-deploy CI run fully succeeds in *both* Chromium and WebKit jobs including inherited Node and source/collision/frame parity. An older ancestor's green result cannot prove this successor. Keep [Family Alpha HOLD issue #255](https://github.com/nickhaney916-lang/Closet-Current/issues/255) OPEN/HOLD. Do not merge, deploy, modify staging/production/hosted Supabase, change original JPEGs or touch private user wardrobes.
