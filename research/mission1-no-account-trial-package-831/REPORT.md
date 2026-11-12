# Closet Current Mission 1 P831 — reproducible no-account recognition-only trial artifact

**FAMILY ALPHA HOLD #255 — no deployment, no public preview URL, no family account onboarding.** This is an implementation research delivery, not permission to collect customer photographs.

## Why P831 exists
P829/P830 already verified a no-account single-item tester with broad category, subtype and optional independently supplied primary-color labels, and a clear pass/wrong-auto/review/unknown outcome. Exact-head [P830 Actions #43115684402](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43115684402) completed all 3 jobs: 265/265 Node native checks, real SHA-reviewed source-photo FashionCLIP workers in Chromium and WebKit, 320/390/430 CSS widths, original JPEGs not in report. That code is still draft and is NOT a hosted family trial.

P831 turns that verified diagnostic into a tiny **recognition-only, no-account build artifact** so the owner can inspect it and, only after separate approval, arrange a protected HTTPS preview. It does not create a live URL, email invitation, cloud photo database, or deploy anything.

## Implementation
1. `scripts/build-m1-no-account-trial-831.mjs` copies exactly **13 required prebuilt diagnostic assets**, including actual original worker, FashionCLIP compatibility modules, and 2.36MB text vectors, into an isolated directory. No index.html, account login, wardrobe, Supabase, photos, screenshots, source photos or private keys. Strips "Back to my closet" navigation; adds an explicit recognition-only notice. Frozen 12-character release ID and 64-hex recognition vector index are validated against actual `dist/phone-photo-check.html`. Generates SHA-256 manifest for every shipped file and a practical owner-only README. Refuses unbuilt or nested output.
2. `scripts/test-m1-no-account-trial-831.mjs` verifies exact 13-file allowlist and all SHA digests, no photos, no account/index, correctly versioned original worker, immutable release metadata and failure cases. Synthetic schema/fixtures do not impersonate human photo truth.
3. The **real unchanged `scripts/run-phone-photo-check.mjs`** can now point to the isolated static preview root. It runs actual production FashionCLIP in Chromium and WebKit with the existing two SHA-reviewed positive/negative source photos, browser downloads photo-free sanitized results, and verifies 320/390/430 mobile viewport, correct manual review, restart/cancel. A new browser-context network privacy audit checks every request for POST/upload methods, data:image or identifiable private filename in URL/payload; fails on any original-photo upload or private data leak. It does not retain full request URLs or private image bytes in CI artifacts.
4. Dedicated CI enforces exact P830 green parent and **only five research/CI paths**. The build job uploads the 13-asset static preview **as an archived artifact only**, not a website; browser workers test that same preview directory. Artifacts have short retention and contain no customer photographs. No Cloudflare Pages, GitHub Pages or hosted Supabase calls beyond the existing publicly downloaded model required by inference.

## Remaining acceptance before wife can use it
An actual physical Android Chrome/iPhone Safari test with consented new garments, device-memory and elapsed-time receipts, and an **explicit separate approval for a protected HTTPS preview** are still outstanding. Merely extracting a ZIP on a phone cannot run the worker (file:// and missing secure hosting restrictions); the archive is **not yet a convenient wife-testable URL**. The user should not create or use live family alpha accounts. Specific subtype/color and whole-outfit performance remain unproven on a new independent source cohort.

This package is intentionally narrower than full Closet Current. The already-exposed 23-garment multi-item SegFormer benchmark still missed 13 in both browsers, and no classifier model weights/thresholds changed.

**To claim P831 complete, require exact final-head full Node + both actual browser jobs success. Family Alpha HOLD #255 stays OPEN.**
