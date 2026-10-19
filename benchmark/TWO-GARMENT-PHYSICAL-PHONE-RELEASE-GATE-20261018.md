# Closet Current — Two-garment AI try-on and physical-device release gate
Research checkpoint: October 18, 2026 Pacific. This is NOT a physical-phone test result.

## Feature definition
A true multi-garment render requires an actual AI inference on a standard full-body model for a saved **owned top**, then a separate real AI inference for the **owned bottoms**, using the authenticated first job's generated image as the model input of the second job. Merely stacking garment PNGs on a human-shaped background does not qualify. This existing FASHN v1.6 integration accepts one garment per run; no evidence has yet established that the second pass **preserves** the first garment.

The draft client and server now include a two-pass signed predecessor protocol. The server independently reads the previous authenticated, same-owner, signed first-job result from the provider, checks it is completed, and would send that returned image as the next model image. A second step must be the opposite category from the first (`tops` / `bottoms`); shoes, jackets and accessories remain unsupported by v1.6. A one-piece dress is a single step. The client rejects stale final images if a photo, garment category, item, slot or model figure changes mid-flight; it never silently saves the AI output into the wardrobe or reclassifies a source photo.

**The second paid provider pass is hard disabled** (`CHAINED_PAID_INFERENCE_APPROVED=false`), independent of any environment variable. Approval requires a secure server-enforced per-account limit, idempotency, a global provider budget cap, approved licensed model images, third-party data disclosures, explicit customer consent and human visual fidelity review. These are NOT in place. No live two-garment inference or paid service was executed.

## Device-emulated CI (not real hardware)
`scripts/test-multigarment-device-emulation.mjs` runs against a Chromium Pixel 7 profile and WebKit iPhone 13 profile on a GitHub Linux worker. Network interception replaces every provider request with synthetic results. It asserts no passive paid calls, the correct *top → bottom* signed-token progression, no client-supplied alternate model photo, output state, disclosure for shoes not rendered, changes to original garment source invalidating the preview, and stale second-pass results remaining hidden.

Browser emulation does NOT prove physical touch, real Android/iPhone camera sensors, native phone memory, OEM webview bugs, permissions, sleep/wake, authentic Supabase login, network transitions or real AI model fabric fidelity.

## Required genuine physical-phone runs — NONE EXECUTED
Two independent human testers should use a **real** up-to-date Android Chrome and a **real** iOS Safari phone, on the test branch hosted in a protected staging site with real authorized test accounts and billing still disabled. Do not test on production. Each tester should record actual phone make/model, OS/build, browser/build, local date, account role (not ID), test branch SHA, screen size, hardware camera orientation, connection type, consent selection, and screenshots of each flow. Never include face/selfie, location, private source JPEG or access token in published CI logs.

Per physical device:
1. Open the staging URL, sign in to an approved test account, reject camera permission once, grant permission once, and take a genuine full-resolution image and a flat-lay new garment. Confirm raw original SHA persists through close/reopen, login restore and a second device login.
2. Verify identification comes from original unmasked RGB pixels and full-scene context, not AI-cleaned try-on imagery. Confirm tops, bottoms, dresses, shoes and overlapping sleeves only save when genuinely identifiable.
3. Select a newly saved top and **Style this**. Check it is pinned in each available option, all other garments belong to the same signed-in closet, direct shoe swap cycles owned shoes, and Save → reload does not change original photographs.
4. Select a full top+bottom+shoes outfit. With **paid inference disabled**, confirm AI Generate is unavailable and tapping its disabled control makes **zero** paid calls. This is the only approved physical test without paid authorization.
5. *After separate explicit owner approval for limited paid tests*, enable a capped staging-only provider with licensed standard model input assets and a hard quota. Deliberately start exactly one two-pass top/bottom job; inspect final generated image against BOTH original garments and source image identities. Try at least 3 contrasting real owned top/bottom pairs and 2 poses per standard model before deciding whether chaining genuinely preserves fabric, collar, print, sleeve, fit and earlier garments. Log any garment change; **do not mark pass** if the second inference changes or erases the first.
6. Cancel or swap a garment during each stage; ensure a late provider result never replaces the current item. Interrupt network, background tab, lock/unlock screen and restore; assert no silent paid retry, duplicate jobs or unintended image retention.
7. Test accessibility and responsiveness: no horizontal overflow at actual viewport, readable buttons with text zoom, VoiceOver/TalkBack focus, screen rotation, camera switching, consent prominence, and large clothing cards. Measure memory/time on the real devices and document any crashes.
8. Retest data deletion, auth expiration, account isolation and cross-device restore. Do not retain provider outputs longer than explicitly disclosed retention.

## Gate thresholds
- **Required before claiming this priority complete:** two genuine physical device records + screen captures, independently rated *actual provider* two-pass images covering owned clothing variety, meaningful pass/fail criteria established beforehand, no unauthorized cost, no source-photo mutation, secure quotas/idempotency, and no observed cross-account exposure.
- Any missing physical test or unapproved paid inference **keeps the gate blocked**. Passing Linux/Playwright tests, screenshots, generated sample mocks and code coverage do not satisfy it.
- Fidelity metrics, genuine Android pass, genuine iOS pass, production release approval: **null / not yet performed**.

## Release policy
Draft PR only. Do not merge/deploy, enable FASHN credits, upload customer photos/selfies, create cloud secrets, or change Drive Duel without separate explicit approval.
