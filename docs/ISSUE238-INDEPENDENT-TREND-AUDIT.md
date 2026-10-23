# Issue #238 — independent offline trend and inspiration quality gate

## Scope and coordination

New branch `work/issue238-trend-link-reliability-20261023` starts from main
`54c9e29ede069a05d1268e003f80cbda043c7d6a`. Reviewed #220/#224/#226/#228/#231,
active avatar/provenance #232/#233, recognition #234 and storage #236. A second
fresh trend branch `qa/issue238-offline-trend-link-quality-20261023` was found;
scope split posted to issue #238 before editing. This proposal leaves its
trend-library, board engine/UI, data and refresh code unchanged. No integration,
recognition, storage, Auth, cloud or configuration changes. Main owns release.

## Findings from source review

* Main's recorded data is dated October 19, next review October 26. At the
  reproducible October 23 audit clock it is within seven days; on October 30 it
  is stale and overdue. Dates are recorded evidence, not proof of a current site.
* Seven source rows represent **six publication hostnames**, not seven distinct
  sites. Eleven products represent **eight hostnames**. Eleven retailer rows
  represent eight retailer names; multiple products from one retailer are valid
  and must not inflate diversity. Hostnames/names do not prove independent
  business ownership. Three article publication dates are missing.
* All eleven retailer rows lack `checked_at`. A fresh payload date cannot prove
  that every linked retailer/product was rechecked. Main's normalizer also
  inherits missing source/product checks from the payload; the independent gate
  deliberately flags that missing evidence instead. Retailer URLs also appear
  in dated product rows: a future integration may explicitly bind those exact
  URL checks rather than require duplicate date fields. Missing retailer fields
  alone do not prove that the merchant URLs were never reviewed.
* Main's refresh code warns after eight days and retains prior data on errors;
  it does not block stale suggestions. `next_refresh_at` is not enforced there.
  Main has no weekly editorial research workflow. PR #220 includes the existing
  weekly freshness **watch**, which audits/alerts but does not itself research
  or verify new articles/products. This branch adds no schedule or automation.
* Direction validation accepts slot/type mismatches and arbitrary product types.
  A fixed fallback can attach the first current source to a shoe suggestion even
  if that source is a general menswear article. Article meaning is not verified
  by a syntactically safe URL or this offline gate.
* Saved inspiration URL parsing accepted embedded credentials, numeric/private
  hosts, local DNS names and unusual service ports. This boundary is hardened
  before `validLook`/backup restoration and saved-link rendering. Public HTTP
  references remain accepted for compatibility; shopping audit links require
  HTTPS. Initial-URL validation cannot certify later live browser redirects,
  DNS resolution, merchant identity, current stock or content.

## Delivered

`scripts/issue238-independent-trend-gate.mjs` is a deterministic, offline,
maintainer-only preflight. It checks explicit timestamps/calendar dates, weekly
deadlines, duplicate IDs/canonical URLs, source dependency, slot/type matching,
audiences, availability flags, price shape and diversity counts. Canonical
identity removes fragments/common tracking parameters but retains SKU/color and
functional query parameters. No HTTP request or data mutation is made.

Synthetic HTTP observations test failed status codes, timeout/offline cases,
bounded same-host redirect chains, loops, missing locations, protocol downgrade,
credentials, private hosts and unexpected content types. They remain explicitly
synthetic: even a passing fixture 200 never becomes live stock/price/article
verification. Unknown checks remain unknown. Reports always retain false
production approval and false live verification. CLI completion is not catalog
approval; inspect `structuralPassed` and issue codes.

The audit reports eleven missing retailer timestamps on the fixed current
snapshot; it does not falsify/rewrite timestamps or remove products from the
customer app. Companion PR #239 also supplies research-only audit logic; neither
gate is wired into the customer normalizer. Runtime stale-source/category
filtering remains future main-approved integration. Main can compare these
independent gates instead of integrating duplicate policies. A historical data fixture pins findings without
freezing future weekly updates to `public/trend-data.json`.

`public/outfit-matcher.js` is the sole runtime change. Existing owned garment
matching, search generation and taxonomy stay unchanged. Browser verification
uses isolated synthetic IndexedDB and tests six engine/viewport configurations
(Chromium/WebKit, 320/390/430px), unsafe-source persistence/rendering, offline
retention warnings and three distinct owned-only recommendations even when
shopping products are present. Missing garments stay gaps; shopping products
never become owned items. All external requests are blocked.

## Evidence and limits

Baseline inspiration URL tests: 20 total, 13 fail / 7 pass before the fix; the
fixed boundary passes all 20. Independent gate tests cover synthetic source and
transport evidence. Final local suite **315 pass, zero fail/skip**. Source commit
`87d186e2e3fde98f9a24a99a596d1e63705947a2`, Actions run 40007626020: **315/315
Node tests and six Chromium/WebKit configurations PASS**, no page errors/outside
requests allowed. This documentation follow-up changes no runtime/test code;
exact final head and CI are reported in the draft PR and issue #238.

Pinned October 19 data SHA-256:
`63703736affd1feb0d78211f44b724b286fd461c5e8b73202a8f3e93818a1182`.
No live merchant/article HTTP checks, purchases, paid API calls, customer data or
physical devices. No merge/deploy, production/Supabase/Cloudflare changes or
Drive Duel work. External sites can change; approval of this software is not
verification of every shopping link or commercial editorial claim.
