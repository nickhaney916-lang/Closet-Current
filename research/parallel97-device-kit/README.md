# P97 physical Android/iPhone acceptance kit — research-only / Family Alpha #255 HOLD

Starting source P94 assembled PR #1223: ef8ce4cc5beab3793b88e7ceaf1fe4964c26da17 (read-only ancestor). Main M4 PR #1210 observed head: 03c995009827c591381c8fcc873edaec8133b28c. No M4, #95, #96, M1/M2/M3 source modifications, merge or deploy.

## What is and is not demonstrated

The optional HTTPS research-only probe measures original input SHA-256, byte count, browser JPEG/HEIC decode dimensions and time, permission/lifecycle observations, and derivative HEIC-to-JPEG SHA when available. Orientation is UNVERIFIED until inspected separately; a converted derivative NEVER replaces the source. The probe is NOT the Closet Current native application.

The device witness ledger checks 21 native app scenarios for each platform: Android Chrome and iPhone Safari. Simulator/desktop Chromium or WebKit results may be recorded ONLY in the separate CI matrix, not as a PHYSICAL PASS. Without witnessed physical phones, all 42 physical scenarios are NOT_TESTED and physical acceptance remains BLOCKED. Submitted reports are self-reported human evidence, not cryptographic attestation of hardware.

P97 CI executes the installed P94 **real application** source path: actual model Worker, separately simulated owner approval and signed-auth HTTP fixture, private IndexedDB, saved outfit, exact original-only 2D, v3 and v4 atomic restore. No family photos or credentials. It does NOT prove hosted signed RLS, independent model truth, real photo-fitted 3D, or actual phone hardware.

## Authorized physical-device execution

1. Check out this exact P97 HEAD on an approved local development computer with Node 22+. Obtain owner permission and disposable photos plus a separate approved HTTPS native app test origin with synthetic, authorized test accounts. If unavailable, mark app-dependent scenarios BLOCKED. NEVER provision/modify hosted storage, production, staging, private accounts or cloud policies merely for this test.
2. For the optional standalone probe, use mkcert or an equivalent trusted development CA to create an IP-SAN cert for a private LAN IP and explicitly trust it under each phone's approved security policy. Never bypass a certificate warning, use a public tunnel, or commit certificate/key/CA material. Command: node scripts/serve-device97.mjs --cert /private/path/cert.pem --key /private/path/key.pem --host 192.168.X.Y --port 8443. Open https://192.168.X.Y:8443/probe?head=EXACT_40_HEX_P97_HEAD in actual Android Chrome or iPhone Safari. The local server exposes ONLY /probe and /health; never the native app, credentials or photo downloads.
3. Use disposable JPEG and HEIC (where supported); compare source digest and bytes with an independent local digest and the app's export receipt, inspect visual orientation, photo import and camera permission/denial, background/foreground and connectivity. The probe records metadata only and keeps image bytes in transient browser memory. An input SHA matching probe receipt does NOT independently certify the app stored the same original.
4. In the separately authorized **real app**, execute each ledger scenario: camera capture, gallery, HEIC outcome, orientation, permission denial, actual Worker start/inference or manual fallback, no silent save, separate multi-garment corrections, verified original 2D, background/resume, cold restart, offline/online, storage pressure, logout and A-B-A owner session/DB revoke, source tamper rejection, thumb/original mismatch, duplicate refusal, v3 and v4 atomic restore and unverified 3D veto. Do not tamper with live hosted accounts; block destructive checks without isolated owner-approved testing.
5. Android: Chrome USB remote debugging via chrome://inspect/#devices; record actual model/Android/Chrome version. iPhone: Safari Develop > connected iPhone on an authorized Mac; record iOS/Safari versions. Report only phase booleans, redacted errors, source SHA/count/dimensions and measurable timings. Memory is null unless genuinely observable. Physical background/restart/offline/permission must not be simulated by Playwright. Check no prior-owner pixels on change of account and IndexedDB generation.
6. Create an untracked local witness file: node scripts/device-acceptance97.mjs --init EXACT_40_HEX_P97_HEAD /private/path/device97.json. For physical results, use deviceKind PHYSICAL only after actual phone use and enter the model, OS version, browser version and witness reviewer initials. Mark each scenario PASS, FAIL, BLOCKED or NOT_TESTED with an observed explanation; no names, emails, paths, credentials, source bytes, screenshots or private photos. Validate locally with: node scripts/device-acceptance97.mjs --verify /private/path/device97.json --allow-physical. This tool emits p50/p95 only if timing samples were measured. No automatic claim of hardware attestation.
7. Revoke disposable test sessions and clear only authorized test storage and temporary artifacts following local policy. Never erase family-owned data. Do not send raw probe reports or phone identifiers to public GitHub comments. Summarize anonymous status counts and sanitized blockers only.

## Verification matrix

| Gate | Android Chrome | iPhone Safari |
| --- | --- | --- |
| Node, source ledger and privacy negatives | CLI locally verified | CLI locally verified |
| Probe browser at 320,390,430 | desktop Chromium ONLY; not physical | desktop WebKit ONLY; not physical |
| Native installed P94 Worker to synthetic reviewed private 2D/v4 | desktop Chromium ONLY | desktop WebKit ONLY |
| Distinct public original sources and v3 restore | desktop Chromium ONLY | desktop WebKit ONLY |
| Physical camera, HEIC/orientation, permission, restart, pressure | BLOCKED until actual device | BLOCKED until actual device |
| Signed two-account hosted RLS, owner acceptance, photo-fitted 3D | BLOCKED | BLOCKED |

## Reproduce in an isolated checkout

node --test tests/device-acceptance97.test.mjs tests/device-server97.test.mjs
node scripts/build.mjs
node --test --test-concurrency=1 tests/*.cjs tests/*.mjs
P97_ENGINE=chromium P97_WIDTH=390 node scripts/test-device-probe97-browser.mjs
M58_ENGINE=chromium P94_WIDTH=390 node scripts/test-parallel94-native-p88-browser.mjs
M123_ENGINE=chromium node scripts/test-main1054-m123-photo119-restore-2d-browser.mjs

Repeat engine chromium/webkit and viewport 320/390/430 using the strict source-pinned P97 workflow. The probe browser test uses an ephemeral self-signed HTTPS certificate and ignoreHTTPSErrors ONLY within the automated test; physical phones require an independently trusted LAN certificate. One green browser or isolated research test NEVER lifts #255.

Source ownership handoff: inspect changes restricted to P97 scripts, probe, tests, documentation and no-deploy workflow; adopt them only after main #1054 integration compatibility review, not via automatic merging.
