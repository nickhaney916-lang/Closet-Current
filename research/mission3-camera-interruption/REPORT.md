# Closet Current — Mission 3 camera interruption milestone

**Release:** FAMILY ALPHA HOLD #255. This is an independent no-deploy draft and not physical-phone acceptance.

**Verified parent:** Mission 3 cloud owner/session lease repair at `4d1657fa748156ddb4e92dd70731ad01298a33ec` (PR #798, CI run #42914305885 passed exact HEAD, 1,363/1,363 Node cases, 85 individually decoded/hashed browser screenshots, 84 automated accessibility reports without violations). Parent is not merged.

## Gap

The native camera could keep opening when a mobile browser/backgrounds the page; the prior `document.visibilitychange` handler only resumed memory review. A delayed permission grant might yield a live offscreen MediaStream. A canceled old camera request might resolve after a newer request starts, and its unscoped `finally` could unlock shared capture controls.

## Isolated repair

- Stop an active camera or pending camera-open request on `visibilitychange` when hidden and on `pagehide`.
- Immediately release the canceled opening-state busy flag while preserving saved clothing and unsaved review candidates.
- Cancel future captured frames while hidden; reject an acquired stream if its request ID was revoked or the page is hidden.
- Stop tracks for a late permission response; do not automatically restart camera when the app becomes visible.
- Do not let the finalizer of an older async camera request unlock controls while a newer request is opening or streaming.
- Provide explicit pause/restart text; leave owner review, original JPEG proof, recognition, private cloud, outfits, and 3D untouched.

## Verification

`tests/mission3-camera-interruption.test.cjs` tests active stream visibility loss, late permission grant rejection, cross-request stale-finalizer isolation, private draft preservation, and hidden auto-timer refusal. It also checks the previous parent in comparator mode. The pinned `mission3-camera-interruption-no-deploy.yml` workflow runs exact-parent comparator, fixed tests, full Node suite, native camera-to-closet Chromium/WebKit at 320/390/430 CSS px, and reliability/mobile accessibility scenarios with screenshots. Results must be checked at final commit, not inferred.

## Remaining external gates

No physical Android/iPhone video sensor, native browser permission dialog, screen lock, host authentication JWT, real owner data, or genuine hosted Supabase approval is simulated as a real-world acceptance. Existing production and staging remain unchanged. Do not merge or deploy until main controller authorization and Family Alpha HOLD #255 resolution.
