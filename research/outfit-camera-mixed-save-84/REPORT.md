# CAMERA84 — NATIVE OUTFIT CAMERA TO MIXED OWNER-PRIVATE CLOSET ACCEPTANCE

**Research-only / HOLD.**

Exact starting verified integration: Priority #82 draft PR #637, commit `955afd0018df32d3d893dc64d1232b79406b56d2`, dedicated no-deploy Actions #42128560598 SUCCESS (798/798 Node; 24 native-browser workflow cases).

## Acceptance gap
The existing Priority #82 tests independently verify native single-item camera input and mixed existing/new garment review from the **saved-photo** whole-outfit input. They do not exercise the exact `#outfitCamera` rear-camera file input through the complete private mixed-save flow in the same Chromium/WebKit case.

## Changes
Only add independent test code, a dedicated audit, three Node guard tests, and no-deploy CI. No application source, model, auth, production, staging, or deployment changes.

In `CAMERAMIXED84=1` native-browser acceptance: select a SHA-pinned genuine CC BY-SA full original JPEG through the actual `#outfitCamera` DOM file input (capture=environment), verify crypto SHA and input reset, manually crop/confirm shirt, jeans and shoes; first save only shirt, then re-confirm shirt as already-saved and select unsaved jeans/shoes. Dispatch a picker cancel event and prove unchanged reviewed photo/crops, human corrections and private DB. Dismiss owner consent, then accept and prove previously saved shirt byte-identical and exactly two new private garments committed. Re-import exact source through `#outfitCamera` to prove duplicate refusal. Continue native owner-private Style/outfit/backup restore/logout and separate owner B isolation.

Run six Chromium/WebKit 320/390/430 browser cases with 78 hashed PNG screenshot captures and independent audited visual evidence. Preserve inherited MIXED80 and CAMERA79 separate suites; run full app build and Node tests. Pinned photo SHA e3df4503a89c244b28fa344ec170d6554fc06ad1d7cd331014fcb277df19d5ff.

**Engineering verdict PENDING until exact-head CI.** Passing prior tests proves neither this new exact camera path nor physical Android/iPhone acceptance. Browser file selection and cancel events are simulated, not a real phone's OS picker; full-resolution original JPEG, canvas crops, WebCrypto, IndexedDB, UI review and save are real in-browser. No fresh independent learned garment segmentation, category-color accuracy or 3D cloth verification claimed. Family Alpha Issue #255 HOLD. NEVER merge/deploy/modify production or existing staging.
