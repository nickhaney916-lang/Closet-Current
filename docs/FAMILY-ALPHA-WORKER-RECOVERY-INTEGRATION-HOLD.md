# Family Alpha — verified scanner failure isolation integrated with source/backup protections

**Development only · October 24, 2026.** Draft child of Family Alpha staged source+data integrity PR #286. No merge/deploy, customer photo, production backend, SMTP, Cloudflare/Resend or paid AI changes.

## Source integration approach

The previous combined Family Alpha Stage-HOLD package uses immutable PR #283 source `795ad6637f8d4f782bc99751211b25e8e72a3a7d`, preserving PR #282's original-source classification and human color approval and Work #22's atomic original-JPEG/save/backup invariants.

Parallel Chat #21 PR #281 has separately verified handling for worker responses:

1. Reject malformed/null worker events immediately, terminate the active worker, and leave captured images in review.
2. Enforce `load -> ready` and `classify/features -> result`, never interpreting arbitrary events as a final garment classification.
3. Treat explicit per-image JPEG decode failures as **recoverable** without destroying an otherwise healthy loaded model. Runtime/memory/asset failures remain fatal. The source/photo mismatch and manual correction precedence remain authoritative.
4. Do not mark the entire scanner unavailable for that recoverable image error; future independent garment scans continue.

Its original parent is #279 whereas the current source includes #283 and #282. **Do not replace `app.js` entirely from #281**: that would discard the later human-color and wardrobe-integrity fixes.

`scripts/build-family-alpha-recognition-integrated-hold.mjs` now loads #281 from immutable commit `08ed6ac4a3fc921eae5d5d3df3bd3966429559d2` and overlays **only** the exact `localRequest` function and `categoryStillCurrent && !userAdjusted` recoverable-error condition onto the otherwise pinned #283 app. The builder rejects unexpected source structure/protocol markers, checks existing deep-cloned source/crop data and current-draft supplier, and hashes the compiled artifact. The staged worker engine, source photos and image recognition model weights remain untouched.

All existing Stage-HOLD safeguards continue: separate Supabase staging project `fbnplztkbsteuzrmbgib` with missing callback/key, paid try-on disabled, no production Auth or cloud calls, original reviewed JPEG and 2D preview preserved. The offline package remains **NOT DEPLOYABLE**.

## Reproducible checks

`tests/integration/family-alpha-worker-recovery.test.mjs` runs the actual *compiled combined app.js* worker/recognizer functions through synthetic workers and photo identities (adapts #281's proven 11 checks; does not recopy product policy). Cases cover expected result types, malformed/unknown events, image-only recovery, fatal errors, watchdog, stale replies, manual edits, duplicates and original image review state.

CI must first fetch both pinned source refs plus #281 revision, then:

```sh
node scripts/build-family-alpha-staging-auth-hold.mjs
node scripts/build-family-alpha-recognition-integrated-hold.mjs
node --test tests/integration/family-alpha-worker-recovery.test.mjs
node --test tests/integration/family-alpha-assignment22-integrity.test.cjs
node --test tests/*.test.cjs tests/*.test.mjs
```

Existing Chromium/WebKit combined blocked-startup + synthetic original JPEG-to-local IndexedDB-to-reviewed 2D avatar plus owner swap, isolated staging Auth and reviewed-original photo tests still run. No inferences, family photographs, native phone captures, real JWT/RLS/storage denial tests or actual email delivery are performed.

## Next blocking technical and release steps

Review #284's original-photo-aware manual Adjust checkbox and schema validation, then integrate in a separate composition with the existing queued save supplier and original scene/mask checks. Run mock browser regression and controlled original-photo accuracy benchmark. Actual protected staging callback, verified email and live JWT A/B RLS/storage plus physical phone remain distinct owner-approved decisions.

**Family Alpha remains HOLD.**
