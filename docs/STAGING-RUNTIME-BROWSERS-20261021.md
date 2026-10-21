# Generated staging runtime isolation in mobile browser emulation

Continues verified PR #148 on a new isolated branch. Runs the actual generated staging HTML and scripts in Android Chromium and iPhone WebKit emulation. No customer runtime, schema, production workflows, photos or user data are modified.

The fixture uses an invented Supabase ref, synthetic email and synthetic account UUID. Browser-context routing is installed before navigation: localhost assets are served from staging-dist, staging Auth/backup endpoints receive synthetic responses, every other external request is aborted, and any attempted live Closet Current/Drive Duel URL fails the test. Service workers are blocked so requests cannot bypass the interception layer; installed PWA behavior is not tested here.

Scenarios: signed-out gate and no backend calls; reset callback pinned to staging; successful synthetic password login; automatic and manual empty-closet backup reads routed to staging; direct paid try-on start rejected before fetching; no uncaught browser exceptions. Existing source guards and full regression suite preserve original-before-mask recognition, full-resolution photo handling, wardrobe functionality and atomic staging generation.

This checks client routing with intercepted responses, not real Supabase Auth, email delivery, cloud writes/restoration, RLS, Cloudflare Access, installed PWA or physical phones. Separate hosted database and protected staging site remain required. The free-project cap remains unresolved; no paid resource or public deployment is authorized. Production promotion remains BLOCKED.

Dedicated CI installs pinned Playwright 1.56.1 and both browser engines, builds only the synthetic staging fixture, runs the complete Node suite, then runs `node scripts/test-staging-runtime-browsers.mjs`. It never uploads staging-dist or invokes deployment.
