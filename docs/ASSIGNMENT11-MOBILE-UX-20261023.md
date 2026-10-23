# Assignment #11 — Mobile Closet and Camera UX

Date: October 23, 2026. Independent QA branch: qa/assignment11-mobile-quick-closet-camera-20261023. Base: main commit 54c9e29ede069a05d1268e003f80cbda043c7d6a. DRAFT ONLY — no merge, deploy, production account, or paid API use.

## Scope and overlap audit

Reviewed issue #237, current main and active PRs, existing mobile/camera/closet source and tests. PRs #220, #231, #242 and #245–#251 own 2D/3D builder changes; PR #234 owns recognition and crop; PR #233 owns original photo provenance; PR #236 owns storage. No existing issue #237 PR was found. Changes are limited to home/closet navigation, camera choice text and accessibility announcements, and visual adjustment review; no classifier, Auth, Cloudflare, photo pipeline, source image, Supabase, or Outfit Builder changes.

## Implemented changes

1. On home, clearer Add clothes and My closet actions preserve original navigation IDs and views.
2. Four large category shortcuts in My Closet: Shirts (existing Tops), Pants (existing Bottoms including shorts and skirts), Shoes, Dresses. Each displays a count and accessible name. Selecting filters the actual owned clothing collection without modifying the outfit figure, wardrobe image bytes or current saved outfit. Search/season/sleeve filters are cleared to avoid confusing empty results; focus moves to the existing Categories back control.
3. Camera choice simplified to two large buttons: Manual photos and Auto every 5 seconds. A single short explanation replaces repeated sentences. Existing real camera capture implementation and the 5/8/10-second cadence, Done action, photo compression/cap, controls, permission and error behavior are preserved. Default still 5 seconds.
4. Auto countdown previously changes every quarter-second. To avoid overwhelming screen readers, that visual countdown is no longer live-announced; a separate polite status announces opening/start/photo captured/stopped at meaningful events only.
5. The existing Adjust garment-details dialog now shows the garment photo directly above the editable fields. It uses the existing full item image string, does not re-encode or downsample the source photo, and never makes manual crop mandatory. Previously available separate Crop photo action remains for advanced correction.
6. New scoped responsive CSS provides large touch targets, 2-column shortcut layout on small devices, readable labels, high-contrast focus and photo reference.

## Regression verification

Node suite runs all existing app tests and the additional independent shortcut tests, including auto capture timing, empty/duplicate and permission denial scenarios. A discovered Node harness slicing issue initially caused undefined announcement helper errors. The helper was relocated inside the existing captured camera section without changing camera behavior; full Node run then passed 253/253.

scripts/test-assignment11-mobile-ux.mjs starts the actual locally built app in Chromium and WebKit at 320, 375, 390, 430px with a disposable synthetic Auth stub, in-memory 600x800 synthetic JPEG items, no real customer photos, and locally mocked external font/trend requests. It tests home action names, four category counts/tap areas, Bottoms/Shoes/Dresses collection routes, back-button keyboard focus, unchanged source images, 5-second default camera controls, accessibility announcements, and Adjust dialog photo with native pixel dimensions. Headless browser viewports are not physical devices.

Dedicated CI source fence requires selected UI/test/doc files only and checks backend, Auth, cloud, recognition and model files remain unchanged. Existing production site is untouched; no database or hosted service changes are allowed.

## Limitations and remaining steps

- The existing camera scales extremely large frames to a maximum 2048 px longest side. This assignment preserves that behavior; it does not claim sensor-original resolution. Physical Android/iOS camera and exposure tests remain required.
- Pants includes all Bottoms such as shorts and skirts; Shirts includes Tops. Separate taxonomy changes should be designed with the recognition owner before narrowing filters.
- Browser screenshot/viewport and automated DOM tests cannot establish actual TalkBack/VoiceOver usability, physical finger ergonomics, camera permissions on phones or production account restoration.
- Camera, original photo classification, automatic cropping, high-resolution persistence, AI cost, model timeouts and 3D/2D builder development remain with their existing owners.
- No real customer images, account services, paid inference, live cloud backups, production deployments, merges, Supabase/Cloudflare settings or Drive Duel changes.

STATUS: Isolated implementation and automated QA; main Closet Current conversation owns integration and release decisions. HOLD until mobile-device pilot and protected integration review.
