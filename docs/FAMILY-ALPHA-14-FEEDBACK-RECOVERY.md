# Family Alpha #14 — private feedback & failure recovery (draft only)

## Boundary and prior work (2026-10-23)

- Source reviewed at exact `main` SHA `54c9e29ede069a05d1268e003f80cbda043c7d6a`; this branch is intentionally independent of unmerged 2D PR #256 and photo-preparation PR #257.
- Existing `public/app.js` already handles recognition load/save retry and photo correction; `public/outfit-capture.js` handles split failure and retry; `public/photo-crop-editor.js` preserves an original separately; `public/device-check.js` and `device-check-engine.js` support opt-in sanitized local diagnostics. These are not a new feedback intake system.
- Current main has no dedicated simple `Report a Problem` flow, and main does not yet include the actual photo-layered 2D avatar. Do not claim that the fixture tests actual avatar error handling.
- No changes to `public/`, `supabase/`, login, paid models, live storage, Cloudflare, staging, PR #256, PR #257, Work #12 security or Assignment #11 mobile UX.

## Implemented in isolation

`research/family-alpha-14/feedback-recovery.mjs` exposes:

```js
categories // six string labels
makeReport({ category, description }) // prepared plain text; never sends
mountFeedback(container) // returns { start, dialog, select, description, preview, status, launchStatus, phase }
recoveryFor(code) // deterministic fail-closed text/allowed action keys
renderRecovery(container, code, { callbacks, verifiedOriginal })
```

The independent fixture (`fixture.html` + `fixture.css`) has 48px main report/recovery actions, browser-native modal focus and Escape behavior, labeled controls, a live status message, an optional 500-character description and manual copy. It explicitly distinguishes **prepared** (not sent), **copied** (not sent), **copy failed** (manual select), and **canceled** (clears report). It cannot submit, upload or save reports. Unknown failure codes get generic advice, not inferred source data.

Report text is built only from the chosen category and manually entered note. It does **not** read user accounts, wardrobe IDs, actual photos, device data, cookies, IndexedDB or storage. Common emails, image data URIs, phone numbers, UUIDs and web URLs in the **user-entered text** are scrubbed on report preparation. The UI warns that this is not complete PII detection; the tester must review for names, addresses, or sensitive free text before sharing. No automatic public GitHub filing, notification or endpoint is provided.

`renderRecovery` is **display-only**, and cannot mutate or delete photo records. It shows action buttons **only when the caller supplies a function**. `original` appears only for a mask failure when the caller affirmatively provides `verifiedOriginal:true` **and** `callbacks.original`. Even then, it only invokes an explicit callback—it never loads or assumes a source photo. This is not ownership verification.

## Failure mapping for the approved future integration

| Failure code | User recovery | Never do |
| --- | --- | --- |
| `photo_rejected` | Supported JPEG/PNG, retry | Insert rejected image into closet |
| `unrecognized` | Open Adjust/manual details or retry | Auto-label uncertain item as confirmed |
| `blank_image` | Retake garment photo | Use colored proxy or sample clothing |
| `photo_missing` | Review My Closet / re-capture | Replace expired source with synthetic image |
| `mask_failed` | Explicitly view **verified** original or retry masking | Treat opaque original as transparent avatar mask |
| `outfit_failed` | Inspect saved clothes and retry | Modify closet after failed recommendation |
| `avatar_failed` | Inspect saved garment or retry affected layer | Show different garment without warning |
| `cancelled` | Check already-saved pieces before retry | Claim interrupted work finished or silently delete records |
| unknown | Review My Closet and retry | Invent cause/source provenance |

## Integration guidance to the main conversation

1. After security Work #12 and photo-source provenance gates pass, integrate **only** the `Report a Problem` button into a visible Help/More surface. Keep existing `device-check` optional diagnostics **separate**; never automatically attach the diagnostics or account IDs.
2. Call `renderRecovery()` from approved capture, recognition, photo-check, outfit and avatar failure handlers, mapping explicit errors to the codes above. Supply callbacks for actual app navigation; do **not** ship fixture callbacks.
3. Gate `verifiedOriginal` on Auth ownership, source-identity integrity, and a real saved original. Hide the button for expired/unauthorized originals. Do not use an image guessed from color, category, crop, or another user's clothing.
4. Decide with testers **where** they share manually copied reports; until a private intake route is reviewed, avoid any network sender or public issue creation. Test cancel/clipboard denied on each actual phone.
5. Test actual saved-wardrobe availability, reload, account isolation, capture/recognition/mask/2D layer and outfit swap on physical Android and iPhone **before** considering Family Alpha release.

## Verified versus outstanding

Isolated Node test: `node --test tests/family-alpha-14-feedback-recovery.test.mjs`.

Browser fixture: `node scripts/test-family-alpha-14-browser.mjs` using Playwright Chromium and WebKit for widths 320, 390, and 430. `ALPHA14_INLINE=1` is an optional offline development fallback when local networking is prohibited; CI uses HTTP-served ES modules. Browser tests exercise success/failed copy, Cancel and Escape, recovery actions, source gating, no uploaded image elements, mobile controls, no overflow, zero unexpected external requests, and zero browser exceptions.

The tests are synthetic. They do **not** prove actual device camera permissions, source ownership, garment recognition quality, end-to-end photo persistence, real masking or 2D image fidelity. CI run links and final counts belong in the PR after the workflow finishes. **Release gate: HOLD.**
