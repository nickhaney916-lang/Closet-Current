# Closet Current — Family Alpha mobile original-photo review integrated offline

**2026-10-24 · Draft HOLD artifact only · no merge/deploy or live credentials**

## Verified work selected

Parallel Chat Assignment #23 [draft PR #284](https://github.com/nickhaney916-lang/Closet-Current/pull/284) improved mobile clothing review. This main-thread integration follows prior draft PR #287 which already includes Work #22 original-JPEG/crop/draft/backup integrity from #283 and Chat #21 recoverable photo/worker failures from #281.

These source trees have different parents. Copying #284's complete older `public/app.js` would undo late-queued draft commits, the reviewed source-category/color admission, and decoder failure isolation. **The integration intentionally does NOT do that.**

## Exact source-locked integration

- Recognition/model/data-integrity `RECOGNITION_REF` = `795ad6637f8d4f782bc99751211b25e8e72a3a7d` (#283).
- Worker recovery `WORKER_RECOVERY_REF` = `08ed6ac4a3fc921eae5d5d3df3bd3966429559d2` (#281).
- Manual Adjust `REVIEW_REF` = `1ecac1079e75f1f25dc70a4c712b2448eb87dca8` (#284).
- Staging source remains pinned to `879f1b92fb15f9bc9a7f0429c7ee178f7bbf1373`.

`scripts/build-family-alpha-recognition-integrated-hold.mjs` overlays only the vetted #284 `adjustPhoto` function and one category-review text label onto the combined #283+#281 source, and appends only #284's mobile CSS rules to the existing local CSS. It replaces the old #284 call

```js
await savePiece(value,batch.filter(x=>x.id!==item.id),editorCurrent);
```

with the later #283 correct queued supplier:

```js
await savePiece(value,()=>batch.filter(x=>x.id!==item.id),editorCurrent);
```

**Never restore the stale array form.** The compiled app must keep the previous `structuredClone(item)` saving admission, `verifiedColorAdmission` original owner/source photo provenance, and #281 worker recoverability and protocol contract.

The staged manual review now makes the actual unmasked source JPEG visible when masked display differs, expands layered original outfit, pins display/scene/mask/owner against stale approvals, validates category + type + human color before manual Save, demands an explicit original-photo acknowledgement for uncertain Shoes, Dresses, Shorts, Skirts, layered outfit captures and duplicates, and gives readable inline save state with larger touch controls.

## CI and scope

CI produces the **same separate disabled local staging candidate**, not a hosted site or real family login. The exact compiled app and stage CSS are checked against the source-pinned overlay functions. The new adapted Chromium/WebKit browser test `scripts/test-family-alpha-mobile-review-hold-browser.mjs` exercises real combined-app manual Adjust at 320/390px using *only* generated synthetic canvas photos and a browser-local fake Auth user, not live Supabase. It checks unknown category/color rejection, Bottoms Shorts→Skirt re-acknowledgement, explicit save/correction, unmasked/scene visibility, layered no-approval denial, cancel, stale-photo block, message feedback and horizontal overflow.

In parallel, the combined staging Auth HOLD, original-JPEG photo-to-IndexedDB/2D avatar flow, #281 worker recovery and #283 source integrity regression suites must still pass, and nothing may make external network calls or activate paid AI.

## Remaining release blockers

These are synthetic photo and emulated browser tests; they do **not** demonstrate category/model accuracy on new family photos, physical phone camera/autocropping quality, photorealistic avatar, hosted stage Auth emails, actual JWT RLS/storage A/B isolation or production readiness. The Resend domain is verified based on the owner's dashboard, but SMTP integration remains a separate owner-approved step. No changes to Supabase, Cloudflare, Resend, production, paid services, client/customer photo data, or Drive Duel.

**Family Alpha release HOLD; do not merge, deploy, send invitations, or claim live readiness.**
