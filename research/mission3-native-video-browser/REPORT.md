# Mission 3 — native decoded video owner-draft browser acceptance

**FAMILY ALPHA HOLD #255, QA ONLY, NO DEPLOY OR HOSTED SUPABASE.**

Baseline: verified green draft Mission 3 [PR #871](https://github.com/nickhaney916-lang/Closet-Current/pull/871) exact HEAD `061a50f9f4318aa7c964d0f066e346d47fd39f4d`, [GitHub Actions #43102035301](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43102035301) **2/2 success** with both synthetic evidence artifacts uploaded.

## Why

P871 fixed the *actual* application's verified-source video import to await the owner-private IndexedDB draft commit before acknowledging a frame. However, P871 tested the exact `upload(file)` function in a controlled Node VM, not the media engine's real `loadedmetadata` / `seeked` / canvas / JPEG / stored-review pipeline.

## This acceptance addition

`scripts/test-mission3-real-video-frame-browser.mjs` serves the ordinary `public/index.html` locally. Real Playwright Chromium and WebKit, each at 320, 390 and 430 CSS pixels, decode a tiny original synthetic (colored rectangle) video clip in the browser, call the actual application's video uploader, wait for its native frame seek, obtain a real JPEG canvas snapshot and SHA-256 receipt using the existing canonical-photo module, then verify owner-bound IndexedDB draft receipt and exact source SHA. A full page reload must recover exactly one original photo with the same owner and SHA. A visual screenshot and JSON evidence record are produced for every case. The browser selects VP8/WebM or baseline H264/MP4 by reported codec support; no real user photographs or videos are used. All nonlocal requests are intercepted or refused.

Strict 3-path evidence-only branch: one new browser test, one report, one isolated no-deploy workflow. No app code or Supabase SQL changes. Dedicated CI requires exact green P871 ancestry, syntax, all six browser cases and attached synthetic-only artifacts.

## Limitations

- Browser mobile emulation is **not** physical Android Chrome or iPhone Safari.
- Successful source SHA verifies captured bytes, **not** garment recognition, owner consent, or realistic 3D geometry.
- Mocked local signed-in owner is **not** actual hosted Supabase Auth/Storage.
- Release and Family Alpha remain blocked. Manual physical-phone + hosted two-account testing still required.

**Exact-head CI status pending.**
