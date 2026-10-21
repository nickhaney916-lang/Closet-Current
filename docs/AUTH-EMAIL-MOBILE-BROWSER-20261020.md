# Emulated Android/iPhone email callback and password-reset acceptance

**October 20, 2026 Pacific — isolated draft; no production changes.**

## Why this priority

Draft PRs #99–101 verified the frontend Auth callback contracts, inspected both actual public deployments (which still return email links to GitHub Pages) and exercised real **disposable local** Supabase Auth/Mailpit confirmation, used-link denial and password recovery. That still did not test the actual browser DOM and touchscreen interactions users will encounter when opening those links on their phones.

## Isolated browser verification

`scripts/test-auth-email-mobile-browsers.mjs` launches **Android-like Chromium and iPhone-like WebKit** at 390×844 with touch enabled and serves the real `public/auth.js` and `public/pilot-notice.js` through a loopback HTTP fixture. It preserves each engine's native DOM, history, reload, input validation and localStorage.

Each engine exercises the **root** or **nested GitHub Pages-style** URL with eight independent synthetic scenarios:

1. Expired link: no Auth calls, no wardrobe access, one-time error removed from history.
2. Malformed token hash: no Auth calls and wardrobe stays locked.
3. Unsupported unmatched PKCE code: no token exchange or wardrobe access.
4. Valid token-hash signup: verify, independently re-read user, unlock, sanitize URL, save session, reload/refresh original account.
5. Token-hash identity mismatch: deny session, no stored token.
6. Legacy implicit-fragment callback: independently verify and accept original account.
7. Verified recovery link: keep app locked while editing password, exercise **touch** show/hide password toggle, require authenticated password update before unlocking.
8. Recovery identity substitution: refuse to unlock after update returns a different account.

The fixture's `window.fetch` is replaced **before page scripts run**, so even the unchanged hardcoded hosted Supabase URL never sends real HTTP requests. All scenario accounts and secrets are synthetic, and the harness never reads or changes live Supabase settings, email sender, redirect allowlist or private wardrobe photos. No photographs, JWTs, email addresses or customer data are included in outputs. All 16 scenario checks must pass in real browser engines; this is still browser **emulation**, not physical-device or hosted-inbox evidence.

Dedicated workflow: `.github/workflows/auth-email-mobile-browser-qa.yml`, including the full application Node suite, integrity lineage, customer-release veto, Playwright Chromium and WebKit. Review the workflow at the **exact PR head** before citing results.

## Explicitly unresolved pilot gates

Public Auth settings showed email enabled, signup enabled and auto-confirmation disabled at the last read-only audit, but public settings cannot prove hosted SMTP sender/domain, exact Dashboard Redirect URLs allowlist, external inbox delivery or mobile email-client navigation. The source still hardcodes `https://nickhaney916-lang.github.io/Closet-Current/` while the documented shared origin is `https://closet-current.pages.dev/`. Do not silently change the canonical app URL; confirm remote Auth configuration, owner approval, backup preservation and actual Android/iPhone behavior before any launch or invited real user.

No hosted configuration edit, real mail sending, merge/deploy, paid AI activation or Drive Duel change was made.
