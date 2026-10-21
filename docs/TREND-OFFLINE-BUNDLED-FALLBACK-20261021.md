# Trend recommendation reliability when offline — 21 October 2026

**Isolated draft on verified PR #127. Not a new fashion recommendation research run or deployment.**

## User-visible bug
Closet Current fetches weekly trend recommendations from a published `trend-data.json`, with a local-storage cache, a built-in library that ships with the web app, and a background update from the source repository. Previously, when a phone already held any *valid* trend cache, the app never checked its bundled version. With a stale cache plus failed remote refresh, it could keep obsolete magazine/shopping suggestions even if the web app had shipped newer, source-checked data.

## Fix
The in-app recommendation loader now **always reads its bundled `./trend-data.json`** after reading whatever saved library exists, validates it through the existing `normalizeTrendLibrary()`, and adopts it only if its independently checked `updated_at` is strictly newer. The same strict freshness choice applies to remote weekly refreshes. A same-dated remote library with different content cannot replace an already verified library simply due to refresh order. Updating a library refreshes the cache where writable. Corrupt/broken bundled sources never wipe the existing valid cache; a missing network never discards locally verified trend ideas.

Original garment photos, classification-before-clipping, model/index, outfit wardrobe ownership, auth, cloud, masks, human review, price values, retailer links and trend catalog metadata are unchanged. This changes **no** external network destinations, and makes no claim that the 2026-10-19 catalog has been editorially refreshed after that date. Content source curation and weekly publication cadence remain a separate operational task. Automatic suggestions should still show the existing last-verified and overdue status.

## Technical QA and limits
- Source lock verifies entire `public/outfit-board.js` against exact PR #127 and permits only two known replacements in cached/bundled adoption and remote timestamp tie-handling. All other app/privacy/cloud/human code and trend-source data are byte identical.
- Node tests cover cached-vs-bundled-vs-remote monotonic dates, old cache plus offline network, corrupt cache, invalid bundled library, remote ties, and no-cache recovery.
- Android Chromium and iPhone WebKit emulation execute the real extracted customer source and actual trend normalization with synthetic catalog metadata; network requests are mocked/offline. This verifies logic, not live source truth or shopping availability.
- 0 real physical phones, 0 independent real garment approvals, model accuracy unknown, production approval BLOCKED. No paid AI use, merge, release, or change to Drive Duel.

Next release work remains genuine Android/iPhone saved-photo testing, two independent reviewers, live owner-bound cloud/email/account deletion and branch integration review managed separately in Work mode.
