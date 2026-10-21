# Weekly research operations: verified fashion directions and shopping links

**October 21, 2026. Development draft, not active on the default branch until approved and merged.**

Closet Current's customer-facing source-verified research file is `public/trend-data.json`. Currently it declares `updated_at=2026-10-19T15:11:36.941252Z` and `next_refresh_at=2026-10-26T15:11:36.941252Z`. It contains magazine links, observed product URLs, research citations and source-checked timestamps. The app correctly displays the last-verified date, but **did not have a scheduled editor reminder** for a missed refresh.

## This scoped improvement

The offline, read-only script `scripts/audit-weekly-trend-readiness.mjs` checks source/schema, dates, next-refresh interval, unsafe links, provenance coverage, source diversity across publications and shops, direction-to-source references, checked timestamps, and missing/invalid future dates. It publishes a non-personal JSON report, with flags explicitly stating **no live price or product availability check, no historical weekly source rotation verification, and no new catalog content approval**. Schema errors and overdue research are actionable. Coverage warnings do not falsely mark unexpired research overdue.

A GitHub Actions workflow is configured for **17:17 UTC on Mondays** and a manual run. On the default `main` branch only, when source research is overdue or invalid, it opens **one identified maintainer issue** or updates an existing open one instead of creating duplicates. The issue provides a specific editorial checklist: independently research an updated rotating selection of magazines, check products/retailer pages and pricing before claiming current validity, verify direction-to-source evidence, and prepare a separately reviewed `trend-data.json` PR. It does not update customer-facing catalogs, open purchases, deploy code or contact customers.

### Important boundaries

A GitHub Actions `schedule` event only runs workflows present on the repository default branch. This implementation is **not live until the user approves a future merge**. The branch push CI exercises its offline audit, full Node suite, product build, editorial issue formatter, and source-integrity guard; its maintainer issue step is deliberately skipped on non-main branches. The weekly workflow will not automatically author fashion trend content or verify changing purchase inventory. Genuine weekly editorial source refresh remains human-reviewed work; this automation ensures overdue work is not missed.

No paid APIs, Supabase secrets, account data, real-user photos, recognition/model changes, shopping providers, or Drive Duel. No merges or deployments permitted as part of this assignment.
