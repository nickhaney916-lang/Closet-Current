# Issue #238 — Independent offline trend/source and shopping-link quality audit

**Audited October 23, 2026 (Pacific). Research-only isolated branch:** qa/issue238-offline-trend-link-quality-20261023, based on current main SHA 54c9e29ede069a05d1268e003f80cbda043c7d6a. No customer photos or app accounts examined. No paid API, external retailer probing or deployment.

## Existing real application architecture and problems

- **Bundled library:** public/trend-data.json, schema_version 1. Updated **2026-10-19 15:11 UTC**, next_refresh_at **2026-10-26 15:11 UTC**. Seven source entries from **six** distinct publication domains, 15 sourced trend directions, 11 product example entries from **eight** shop domains and 11 retailer link records. Current bundle passes offline freshness as of October 23, but link reachability, stock and prices were **not tested live**.
- **Original validator:** public/trend-library.js normalizeTrendLibrary screens HTTPS/private-address strings, schema, and some category names, requiring >=2 sources and >=3 directions. It currently doesn't dedupe source IDs/URLs or product URLs, enforce separate verified source websites or verify every source/product checked_at and published_at. It does not prove that retailer pages are reachable or products in stock.
- **Refresh:** public/outfit-board.js reads a local cached copy from localStorage, then bundled JSON, and fetches the main-branch raw GitHub JSON with a 15s timeout; focuses/visibility/interval trigger refresh. Client fetches **new JSON**, but doesn't generate **newly researched** sources itself. next_refresh_at is descriptive metadata, not proof of a weekly publishing automation. Up to 8-day overdue warning uses updatedAt. Network failure displays a warning and may retain a previously loaded cached library: offline use does not mean the references were reverified.
- **Item matching:** public/outfit-board-engine.js wardrobeGapIdeas matches trends by direction slot, type, audience, occasion, season and uses trend library retailer/product links filtered by type. Product listings can lack price checks; a general Google Shopping query is still available when no product example exists. This is **not evidence of a validated live purchase link**.
- **Owned vs shopping:** public/closet-stylist-engine.js styleOwnedCollection selects ranked saved items by item.id and returns board.slots; shopping examples/ideas are a separate display flow. public/outfit-board.js labels unowned suggestions **"Shopping idea · not owned"** and stores those as board.ideas, separately from board.slots. The independent gate reinforces this contract without modifying the 2D flow.
- **Known bundled data gaps:** three sources have blank published_at (opumo-autumn-2026, www-knit-2026, www-accessories-2026); valid style directions **Jeans**, **Ankle boots**, **Belt** have no exact-type matching catalog product (do not invent one or promise availability).

## Research-only additions

**research/trends/trend-quality-gate.mjs** is not loaded into or wired to public/index.html, public/outfit-board.js, trends.js or the commercial app:

1. safeExternalLink returns only absolute HTTPS destinations without credentials, untrusted nonstandard ports, local/private/IP hosts, unsafe URL schemes, fragments or recognized redirect parameters. This is syntactic protection only: DNS rebinding, server-side redirects, link longevity and malicious *public* hosts still require separate evidence.
2. normalizeQualityLibrary requires verifiable timezone-aware updated/check times, checks freshness, deduplicates sources by id and canonical URL, demands multiple independent publication domains, matches clothing item types to actual slots, drops unsafe/unavailable/duplicate/stale product URLs and retains missing-publication-date diagnostics. It does NOT invent a new updated_at date; stale data cannot masquerade as current. No HTTP calls or scraping.
3. chooseTrendResearch evaluates network-supplied/bundled/cached objects as **data only**. A stale/incomplete remote payload cannot overwrite genuinely fresh cached data; when none is verifiably current it returns **general-styling-only** and null library, rather than promising updated live trend research. A future integration must clearly show the fallback on screen and avoid representing old sources as live.
4. shoppingForSlot exposes separate directional product/retailer matches and rejects wrong garment category. Missing a product of that type yields an unmatched styling direction, not a manufactured product.
5. inspectExternalLink takes an **injected** response probe; fake HTTP 404/410 => broken, 403/429/server error/timeouts/offline => unverified, any redirect => needs review, unsafe redirect => refused, HTTP 200 => **reachable only, not stock or price confirmed**. No network probe default.
6. ownedOnlyOutfitView enforces actual owned item IDs only in saved outfit slots and exposes shop ideas separately. No shopping SKU is converted into a garment ID, and no photo strings or original wardrobe object values are changed.

**tests/issue238-offline-trend-quality.test.mjs** covers bundled library, source diversity, stale/future/absent timestamps, malformed/duplicate/redirect URLs, synthetic 404/410/403/429/302 and offline failures, duplicate product/retailer and wrong-category filtering, source match, multiple shopper audiences, owned-vs-shopping preservation. **scripts/test-issue238-trends-mobile.mjs** exercises real existing browser trend + 2D board modules on a local server, synthetic category and owner checks in Chromium and WebKit at **320/390/430px**, with zero permitted external requests. **scripts/audit-issue238-trends.mjs** produces reproducible evidence JSON from bundled data with a fixed October 23 check date; it does not change the checked timestamps in the app.

**Source fence:** .github/workflows/issue238-trend-link-quality-no-deploy.yml runs the whole available root Node regression, bundles data audit and both browsers. git diff against main of **public/** and **supabase/** must be empty. This research branch does not alter app code, cloud records, database or settings, paid subscriptions, protected rollout or any other active parallel assignment.

## Baseline evidence from audited bundled data

| Check | Verified offline |
| --- | --- |
| Updated | Oct 19, 2026 15:11 UTC |
| Scheduled next refresh | Oct 26, 2026 15:11 UTC |
| Publication sources and distinct hosts | 7 / 6 |
| Trend directions | 15 |
| Shopping product examples / retailer records | 11 / 11 |
| Distinct product hostnames | 8 |
| Publication dates missing | 3 |
| Directions without exact catalog product | Jeans, Ankle boots, Belt |
| Tests of link reachability/stock/price | **None: external sites NOT accessed** |
| Existing app deployment changed | **No** |

## Release/integration gates still outstanding

1. Real publisher/licensed-source editorial quality, valid article content, merchandising categories and **commercial usage rights** are not proven by source URL syntax or unit tests.
2. Verify live external URLs with a permission-respecting independent process. Avoid unapproved scraping, hostile traffic and interpreting 403/429 as link death. Validate redirects and URL destinations before recommending purchase. Product inventory and pricing must always be marked "check at retailer".
3. Prove scheduled backend ingestion (rotation and freshness) separately. Existing JSON timestamp and browser refresh do not demonstrate automated weekly source diversification. Confirm actual publication dates and existing 3 missing dates.
4. Explicit UX for current/research overdue/general style fallback with appropriate source-verification labels, source article dates and last checked time; currently only the research module has the new gates.
5. Test current safe URL transformations with actual partners, branded links, redirects, accessibility and size/price availability before integration. Double-check all mixed/unknown item categories.
6. Preserve saved-closet-only 2D workflow and source-photo identity through any future trend integration. Main Closet Current chat owns code integration and release approvals.

**Final status: offline research-only gate. No merged or deployed app fixes; blockers above remain HOLD.** Browser emulations are not physical devices; tests use only bundled data or synthetic URLs and mocked responses, never customer account data or hosted cloud services.
