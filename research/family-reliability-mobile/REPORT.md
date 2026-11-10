# Everyday reliability and mobile usability side mission

Family Alpha #255 HOLD. Isolated draft; no merge, deployment, production/staging or hosted account changes.

## Source and scope

Direct parent: verified native full-app P167 `faac51857d57356fb5568f035566a171cadaa418` (PR725), including Work719's photo-to-closet/owned styling integration. This branch does not modify those branches or ongoing recognition/3D work. Its PR targets the P167 development branch, not main.

## Reproduced defects and repairs

- Actual ordinary My Closet editor silently overwrites a concurrent saved edit. Baseline Chromium reproduces the overwrite at 320/390/430. Revised ordinary editor compares the normalized expected and actual persisted rows inside one IndexedDB readwrite transaction, rejects deletions/changed rows, verifies the same account/database after queueing, and keeps the input draft. Existing opt-in source/owner correction CAS remains authoritative in research mode.
- Save failures previously appeared only behind the modal. Status now appears in its sticky action row, with usable Save/Cancel, preserved draft and a retry path; quota failure has a specific explanation. Failed transactions do not mutate in-memory clothing.
- Unsaved Cancel/Escape requires discard confirmation; declining retains edits. Reload/navigation receives a native beforeunload guard while dirty or saving. Successful save or close removes the handler. Browser recovery does not claim automatic persistence of unsaved editor text.
- Ordinary saved editor receives accessible heading/name, bounded width, large controls, 16px inputs, sticky actions, focus restoration, and short-landscape reference sizing. The clothing picker is labelled by its visible title. Motion respects reduced-motion preference.
- Failed photo loads get a visible, accessible explanation while stored item details/photo source remain intact. This does not recover absent original bytes.
- Outfit changes announce saving, committed success, or failure. Failure/retry and saved outfit reload are exercised; failed explicit outfit save does not add a phantom saved outfit.

## Verification

Local full suite: 1,325/1,325 tests, zero skips/failures (final result recorded in CI as well). Four new tests execute the actual ordinary-editor transaction function with fake-indexeddb, including concurrent update, deletion and owner switch. Existing confirmation/color provenance VM tests continue to execute the actual editor submit handler; their extraction markers/stubs reflect the new guard/status/transaction call.

New genuine Chromium matrix: 320/390/430 portrait plus 844x390 landscape. Actual app controls, synthetic signed-in account fixture, real browser IndexedDB, synthetic JPEG fixtures, no research URL flags. Each case exercises persisted editing/reload, discard refusal/acceptance, beforeunload protection, quota failure and retry, concurrent edit denial, deleted-item resurrection denial, missing photo, picker, outfit save rollback/retry/reload, reduced motion, and document/dialog width. Six axe WCAG 2.1 A/AA scans per case: closet, editor, save failure, missing photo, picker and saved outfit. Zero violations locally; this is not full manual accessibility certification.

Inherited native P167 Chromium photo-import/review/three-owned-looks/swap/two-outfits/reload cases all completed locally. Its aggregate six-case guard refuses to certify a Chromium-only execution; hosted workflow runs both engines unchanged rather than weakening that guard.

Local WebKit requires unavailable system libraries. Hosted no-deploy workflow installs both browser engines/dependencies, reruns baseline, new matrix, complete Node suite and the unchanged six-case native-photo flow, and uploads actual PNG/axe/JSON evidence. A hosted success is required before claiming cross-engine verification. See the PR for final exact-head run and verdict.

## Limits and remaining gates

No physical Android/iPhone, real mobile keyboard or assistive-technology user testing, real camera sensor, signed live two-owner cloud/offline reauthentication, quota eviction recovery, recognition accuracy or arbitrary-photo 3D acceptance is certified. Existing photo/2D fallback and original source bytes remain. No recognition/model/cloud/auth contracts changed. The work is complete only as scoped browser-tested engineering; Family Alpha remains HOLD and release acceptance remains separate.

Reproduce:

```
npm install --no-save --no-package-lock playwright@1.56.1 sharp@0.34.3 fake-indexeddb@6.2.4 three@0.180.0 three-mesh-bvh@0.9.2 axe-core@4.10.3
npx playwright install --with-deps chromium webkit
node scripts/build.mjs
node --test tests/*.cjs tests/*.mjs
git worktree add --detach /tmp/closet-side-baseline faac51857d57356fb5568f035566a171cadaa418
BASELINE_ROOT=/tmp/closet-side-baseline node scripts/test-family-reliability-baseline.mjs
node scripts/test-family-reliability-mobile.mjs
node scripts/test-native-canonical-original-167-browser.mjs
```
