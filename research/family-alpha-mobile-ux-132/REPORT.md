# Priority #132 — Family Alpha Mobile UX

**Research only · draft PR · Family Alpha Issue #255 remains HOLD · no merge, deployment, production change, existing staging change, account change, or other project work.**

## Baseline and isolation

- Starting point: independently green Priority #130 draft PR #684, exact commit `5ce8f51ebbf65d275197a21bdaa7818801b4b49b`.
- New branch: `research/family-alpha-mobile-ux-132-parallel-52-20261107-HOLD`.
- The local branch starts at that exact P130 commit. P131's separate branch was inspected for its stated relationship and was not edited.
- Earlier Issue #237 is the matching mobile UX/accessibility audit. Existing work already provides a fixed bottom tab bar, focus outlines, responsive layouts, and 44px+ targets; this priority adds test-backed accessible names, clearer actions, saved/review explanation, and corrects the contrast defect below.

## Changes

1. The bottom navigation now exposes full accessible names: **My Closet**, **Add Clothes**, and **Style My New Clothes**. The short visible tab labels stay compact on small phones.
2. Home shortcuts now use the same clear names, and the hero action names the Style My New Clothes flow.
3. The single-item capture hint now says recognized pieces go to My Closet and unclear pieces remain for review.
4. Mobile tab-label spans no longer inherit the generic colored badge background. Mobile tabs use stable contrast colors without a color transition that passed through unreadable intermediate shades.
5. Added a Playwright + axe-core acceptance script and a dedicated no-deploy GitHub Actions workflow. The synthetic wardrobe is written into disposable browser-local IndexedDB; no live account, photo, cloud, or server is used.

## Defect found and repaired

Axe found a WCAG AA text contrast failure in mobile bottom navigation. The inherited span badge styling gave the small tab labels a tinted background; the active tab's background-color transition also passed through partially transparent colors. The stylesheet resets the nav label background and padding and removes that transition. On the final local Chromium run, all **13 axe scans passed with zero WCAG 2.1 A/AA violations**.

## Automated evidence

- `node scripts/build.mjs`: PASS.
- Focused navigation, camera, outfit board, matcher, and styling Node tests: PASS.
- Full repository Node regression: **1,161/1,161 PASS**.
- Genuine Playwright Chromium at 320, 390, and 430 CSS-pixel portrait widths: PASS. No horizontal overflow; all five fixed bottom navigation controls measured 66px high. Minimum measured width was 52px at 320px viewport.
- Chromium at 390 and 430 also rotated to 844×390 landscape and back: PASS without horizontal overflow.
- Keyboard Tab produced a visible focus outline; axe scans covered Home, empty Closet, camera permission-denied, empty Style, filled Closet, recommendations, and saved outfit screens at the tested widths.
- Synthetic user journey at 390 and 430: seed five owned pieces; generate three distinct recommendations; save a recommendation; navigate to Outfit Builder; replace the top garment while preserving bottoms; save an outfit-board state; reopen the saved board. PASS.
- Camera-denial UI returned a readable error/retry path; no browser JavaScript errors were observed.

The local machine could not start Playwright WebKit because its host is missing WebKit libraries (`libgtk-4`, `libgraphene`, `libwoff2dec`, `libharfbuzz-icu`, `libhyphen`, `libmanette`, and `libGLESv2`). The added GitHub Actions browser job uses the repository's pinned Playwright container and requires both Chromium and WebKit. Its result and screenshot artifact are the final cross-browser acceptance gate; no WebKit pass is claimed locally.

## Screenshot artifact names

The successful exact-head CI browser job archives 42 PNGs (Chromium and WebKit) plus 26 axe JSON reports and `results.json` under artifact `P132-family-alpha-chromium-webkit-320-390-430-screenshots`. The local Chromium-only screenshot set contains 21 PNGs. Local screenshot names include:

- `chromium-320-home.png`, `chromium-320-camera.png`, `chromium-320-camera-denied.png`, `chromium-320-closet-empty.png`, `chromium-320-style-empty.png`
- `chromium-390-home.png`, `chromium-390-camera.png`, `chromium-390-closet-empty.png`, `chromium-390-closet-filled.png`, `chromium-390-style-empty.png`, `chromium-390-recommendations.png`, `chromium-390-saved-outfit.png`, `chromium-390-review.png`
- the corresponding 430px home, camera, closet, style, recommendations, saved-outfit, and review screenshots

`Review` is shown in an empty synthetic-review state. These screenshots do not contain personal wardrobe photos.

## Acceptance assessment

| Criterion | Result | Evidence / limit |
|---|---|---|
| Isolated P130 baseline and branch | PASS | Exact parent SHA recorded above; P131 untouched. |
| Home actions and accessible nav labels | PASS | Playwright role-name assertions at 320/390/430. |
| Bottom navigation and touch targets | PASS | Chromium fixed nav measured 66px high, no horizontal overflow. |
| Keyboard focus and WCAG A/AA scan | PASS | Visible focus indicator; 13 local Chromium scans and 26 exact-head Chromium/WebKit CI scans, zero violations. |
| Single photo capture and save/review explanation | PASS for UI copy | Actual photo recognition and owner confirmation were not re-run in this synthetic UI task. Existing full regression passes. |
| Camera permission denied and recovery | PASS in Chromium | Denied camera path surfaces a readable device/permission message; capture unit tests pass. |
| Empty closet and no matching look | PASS | Empty state and no-match Style state captured at 320/390/430. |
| Three distinct recommendations with sufficient owned pieces | PASS | Five synthetic garments produced three distinct outfit cards in Chromium at 390/430. |
| Replace one piece without losing others; save and reopen | PASS | Browser assertion confirms the bottom selection survives replacing the top; saved board reopened. |
| Dresses/layers and unsupported outfit combinations | PASS in existing regression | Full outfit-board and matcher suites passed; dedicated UI journey used shirt/pants/shoes. |
| 2D fallback when 3D renderer fails | REVIEW | Standard Outfit Builder presents a 2D board, but this run did not force an actual 3D renderer failure. |
| Invalid image, missing image, reload mid-edit, save failure, offline, and expired-session UX | REVIEW | Existing full suite passes, but this assignment's new E2E did not independently exercise every named fault injection in both browsers. |
| WebKit 320/390/430 browser acceptance | PASS in CI | Exact-head pinned Playwright container completed the 320/390/430 viewport matrix and 390/430 orientation changes. |
| Android phone and iPhone Safari | REVIEW | No physical devices used. |
| Live private cloud backup, two-account security, and account recovery | REVIEW / outside scope | Not attempted; requires separate Priority #129/#51 signed-owner verification. |
| Family Alpha release readiness | **HOLD** | No family invitation or release authorization; issue #255 remains unchanged. |

## Existing contracts and ownership boundaries

Changes are limited to interface labels/styles and this isolated acceptance harness. No recognition engine, camera image processing, source-photo identity, original/cutout JPEG bytes, outfit recommendation algorithm, 3D geometry, auth, cloud writer, database, RLS policy, production, or existing staging files are modified. The fixture only exercises already-existing browser-local save controls and uses synthetic SVG garment images. Real owner-approved source-photo review, signed cloud behavior, family accounts, and physical device support remain unclaimed.

## CI and delivery update

- Exact P132 implementation commit: `8824ae666bbe80f0127609c6e66e3e625c90a809`; it contains all UI, test, and workflow changes. Its exact parent P130 is `5ce8f51ebbf65d275197a21bdaa7818801b4b49b`.
- Draft PR #688: https://github.com/nickhaney916-lang/Closet-Current/pull/688 (open, unmerged).
- Exact implementation-head P132 workflow run #42384547901: https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42384547901 — both Node regression and genuine Chromium/WebKit mobile browser jobs passed. The subsequent report-only commit also passed the same workflow in run #42384751612: https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42384751612.
- The exact-head browser job used a pinned Playwright container, required both engines, and completed six engine/viewport cases (320, 390, 430 CSS-pixel portrait; 390/430 landscape and return). The job captured both browser engines; no physical phones were used.
- Screenshot/accessibility artifact `P132-family-alpha-chromium-webkit-320-390-430-screenshots`, artifact ID `13579072611`: https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42384547901/artifacts/13579072611. Includes 42 PNGs, 26 axe JSON reports, and `results.json`.
- Node report/script artifact `P132-family-alpha-mobile-ux-node-report`, artifact ID `13578074357`: https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42384547901/artifacts/13578074357.
- An inherited unrelated `CAPTURE-PROOF-01 Original Camera+Import Chromium WebKit NO DEPLOY` PR-triggered workflow failed at its `INDEX-04` path-scope check because the diff includes `.github/workflows/allowlisted-review-snapshot-78-no-deploy.yml`, a file outside that workflow allowlist. It is not the P132 workflow; no file in that other assignment was changed.
- The PR remains draft and the P130-based research branch remains isolated. No merge, deployment, staging/production modification, live-account verification, or family release occurred.
