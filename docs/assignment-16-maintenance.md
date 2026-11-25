# Assignment 16 application maintenance

The existing app ships a bundled v1 trend library and checks the GitHub-hosted copy. This draft adds an optional same-origin managed source at `./maintenance/trends`. Existing static hosting can continue serving its bundled and GitHub catalogs. Once a managed release is loaded, the app retains that version through connection failures and honors managed rollbacks even when their dates are older. Updated trend references use the existing stylist and outfit board. Updates have access to the public catalog only.

## Local operation

Use Node 22.13 or later. SQLite lives on one persistent local filesystem. Run the commands from the repository root with a writable directory set aside for maintenance state.

```sh
node scripts/maintenance/job.mjs tick /path/to/state/trends.sqlite /path/to/approved-feeds.json
node scripts/maintenance/job.mjs status /path/to/state/trends.sqlite
node scripts/maintenance/job.mjs serve /path/to/state/trends.sqlite 8094
node scripts/maintenance/job.mjs rollback /path/to/state/trends.sqlite
```

The server binds to loopback and exposes a read-only JSON catalog. A host scheduler can call `tick` hourly. SQLite enforces one writer and records the next eligible attempt. A successful update advances that date by seven days. A failed acquisition or rejected candidate keeps the last good data and defers the next attempt one hour. Acquisition is limited to three attempts, with 8-second per-request timeouts, backoff, no redirects, and 128 KiB per response. Each run stages a content-addressed release and switches the active pointer in one transaction. Interrupted writes roll back automatically. A digest or compatibility failure on the active version falls back to the retained prior release. Manual rollback retains the restored release and delays the next update one week.

`status` returns the active digest, next attempt, and latest redacted audit event. It exits nonzero for degraded health, including stale catalogs and automatic fallback. The database keeps the latest 100 attempt events. Operators should alert on degraded or missing status and on repeated `busy` results, verify the feed policy and source availability, and use `rollback` if a valid catalog contains unsuitable guidance. Back up the SQLite database using a SQLite-aware backup process and keep the feed policy versioned separately.

## Feed contract

A trusted, operator-controlled JSON policy contains an array of `{id,publisherGroup,publication,url,license}` records. Supply HTTPS origins for at least two independent publisher groups. Agree on the license and confirm that each publisher permits automated ingestion before adding its feed. Tee up an independently owned, licensed data source or adapter for any publisher that has no conforming feed. The draft includes synthetic documents and no live feeds.

The approved origin returns JSON with `schema_version: 1`, the agreed `license` (`CC0-1.0` or `CC-BY-4.0`), and an `articles` array. Each article has `url`, `title`, UTC ISO `published_at`, and `directions`. Each direction specifies `slot`, `type`, `label`, `color`, `audiences`, `occasions`, and `seasons`. The job checks origin, license, dates, diversity, duplicate signals, supported garment types and existing consumer compatibility. Output retains lightweight attribution and source links, and excludes third-party article bodies and images. Managed versions currently populate fashion directions. Retailer and priced product entries require an independently validated source and availability policy.

## Recognition release admission

`validateRecognitionCandidate` binds an artifact and versioned manifest to a pinned benchmark and a trusted baseline. It compares exact fixture and artifact identities in both browser receipts, rejects case-level regressions, and requires a separately approved digest for major changes. Use an independently administered runner and approval channel. Public licensed or synthetic fixture metadata is admitted. Owner-specific learning belongs exclusively in the owner's account after explicit owner confirmation. The gate does not load, train or publish a model. Browser receipts in offline unit tests are synthetic.

## Hosted handoff

The existing Cloudflare Pages build serves static files. A separate worker or sidecar needs a persistent state adapter with the same transactional semantics, an hourly scheduler, and a read-only same-origin route. This local SQLite adapter assumes one host with persistent storage. A hosted multi-replica version needs a single durable coordination point. The maintenance identity should have no wardrobe storage permissions or user credentials. Use constrained outbound destinations owned by approved publishers. No paid inference or scraping service is configured.

The next gate is independent feed and licensing approval, followed by a separately authorized isolated hosted dry run and repeated scheduler, outage, rollback and health-alert verification. Keep the existing weekly ChatGPT tasks until the app-owned replacement is verified and the owner authorizes retirement. Family Alpha remains governed by #255.

## Acceptance commands

```sh
node scripts/build.mjs
node --test tests/maintenance-1684.test.mjs
node --test --test-concurrency=1 --test-timeout=60000 tests/*.cjs tests/*.mjs
P99_ENGINE=chromium P99_WIDTH=390 node scripts/maintenance/browser-test.mjs
P99_ENGINE=webkit P99_WIDTH=390 node scripts/maintenance/browser-test.mjs
```

Repeat both browser journeys at 320 and 430 px. They use real browser engines, licensed fixture originals, local synthetic accounts, and deterministic maintenance feeds. Hosted RLS, actual publisher feeds, physical devices, and live scheduling are outside that evidence.
