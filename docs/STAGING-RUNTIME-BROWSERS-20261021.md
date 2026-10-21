# Generated staging runtime isolation in mobile browser emulation

Continues verified PR #148 on a new isolated branch. Runs the actual generated staging HTML and scripts in Android Chromium and iPhone WebKit emulation. No customer runtime, schema, production workflows, photos or user data are modified.

The fixture uses an invented Supabase ref, synthetic email and synthetic account UUID. Browser-context routing is installed before navigation: localhost assets are served from staging-dist, staging Auth/backup endpoints receive synthetic responses, every other external request is aborted, and any attempted live Closet Current/Drive Duel URL fails the test. Service workers are blocked so requests cannot bypass the interception layer; installed PWA behavior is not tested here.

Scenarios: signed-out gate and no backend calls; reset callback pinned to staging; successful synthetic password login; automatic and manual empty-closet backup reads routed to staging; direct paid try-on start rejected before fetching; no uncaught browser exceptions. Existing source guards and full regression suite preserve original-before-mask recognition, full-resolution photo handling, wardrobe functionality and atomic staging generation.

This checks client routing with intercepted responses, not real Supabase Auth, email delivery, cloud writes/restoration, RLS, Cloudflare Access, installed PWA or physical phones. Separate hosted database and protected staging site remain required. The free-project cap remains unresolved; no paid resource or public deployment is authorized. Production promotion remains BLOCKED.

Dedicated CI installs pinned Playwright 1.56.1 and both browser engines, builds only the synthetic staging fixture, runs the complete Node suite, then runs `node scripts/test-staging-runtime-browsers.mjs`. It never uploads staging-dist or invokes deployment.

## Photo-bearing backup recovery extension

New isolated branch `test/staging-photo-backup-recovery-20261021` from PR #150 exact SHA `0dbcab844ea5e0d48aa0cacbf08d22ff1ff5c33d` extends the same generated-app browser test. Each engine creates a 32×32 canvas JPEG locally, saves it through the actual app write queue, and checks immutable SHA-256 photo paths and reference-only metadata. A fresh browser storage partition signs in through the actual UI and restores identical JPEG bytes and color metadata.

Failure scenarios include offline edits surviving reload and later syncing; an RPC accepted by the mock whose response is lost, followed by retry with no duplicate wardrobe item; an intentionally corrupted photo download leaving both the fresh app and IndexedDB empty, followed by successful recovery when correct bytes return. Unexpected routes remain blocked; no real account, image, database, email or inference provider is accessed. This validates synthetic client behavior only, including mock storage writes, not hosted permissions or recognition accuracy.

Local full Node regression: 1,490 passed, 0 failed, 3 skipped. Local browser execution could not start because Playwright browser binaries are absent. The dedicated no-deployment workflow installs pinned browser engines and must pass at the exact published source SHA before this extension is considered verified.

Owner authorized publishing these bounded test/documentation/workflow changes after the explicit approval request. Local Playwright installation failed because browser downloads returned invalid/truncated archives. Exact-head GitHub CI must verify the new browser scenarios. No production or paid-resource action is authorized.
