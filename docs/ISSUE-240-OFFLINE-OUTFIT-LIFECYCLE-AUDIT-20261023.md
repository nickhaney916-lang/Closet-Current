# Issue #240 — Independent offline Outfit Builder lifecycle audit

**Scope:** Synthetic clothing and owner accounts only; no customer photographs, paid inference, remote API requests, production or deployed changes. This is an independent branch from main commit 54c9e29ede069a05d1268e003f80cbda043c7d6a.

## Main code findings

Reviewed public/app.js, public/closet-stylist.js, public/closet-stylist-engine.js, public/outfit-board.js, public/outfit-board-engine.js, cloud-backup-bridge.js, outfit-matcher.js, prior #201 and #204 tests and active 2D/3D/recognition/cloud/trend PRs #220/#231/#232/#233/#236/#239. No other branch changed.

* Existing main styleOwnedCollection ranks saved item IDs by garment type, weather, occasion, color harmony and optional verified trend references. It returns up to **three distinct** board-slot signatures, not three if the closet lacks compatible items.
* The existing recommendation UI holds results in styledCollectionResults until the user regenerates them. In public/closet-stylist.js, renderStyledCollection checks freshness by comparing the number of surviving slot IDs after cleanOutfitBoard. **An edited color, pattern, garment subtype or original-photo bytes with unchanged item ID and compatible slot can leave an outdated recommendation apparently valid.** Adding a different item also does not automatically rerank the shown three results.
* Current board.slots contains saved owned garment IDs, while board.ideas contains separate shopping inspiration. User manual selection uses selectBoardPiece. There is no unified recommendation-cache pin/unpin lifecycle contract on main; active #220 owns overlapping 2D behavior.
* Saved outfit state persists in owner-named IndexedDB v2 items/state and cloud; saved boards hold only the chosen garment IDs rather than per-source photo/content hashes. cleanOutfitBoard removes deleted, duplicate and incompatible references and dress-covered pants/layers; **same-ID original-photo replacement is not version-checked on restore**.
* OriginalPhoto.image is the app-retained full photo, separately from image (garment crop) and optional recognitionPhoto.image. This is not necessarily the camera/device-native original binary. Parallel #231/#233 own original provenance/cloud integration.

## Independent research-only improvements

New research/issue240/outfit-lifecycle.mjs is **not imported by the customer app**. It wraps the actual unchanged main stylist and board cleaner via explicit callbacks and checks:

* A caller-supplied verified session owner and source-signature cache built using WebCrypto SHA-256 of app-retained source strings and styling metadata. The helper must ultimately be wired to real Auth before product use; its caller-owned ID alone does not authenticate users.
* Explicit refresh after garment additions, deletions, category/subtype changes, color/pattern changes or original-photo replacement—even if cropped preview is identical. Stale recommendations cannot be saved or swapped without refresh.
* Structural top/bottom/shoe pins constrain input to the unchanged real engine, preserve compatibility, reject conflicting pins, and produce three distinct outfits when sufficient valid combinations remain. Optional pins are validated against cleaned boards.
* One-piece swap requires an actual compatible owned ID, protects other selected slots, preserves pinned pieces and rejects dress-related unintended changes.
* Saved outfit research snapshots preserve item IDs, verified owner and each selected item's compact SHA version—not raw photo data. Restoration refuses deleted, recategorized, recolored or changed-source selected garments, but permits addition of unrelated clothing without invalidating a saved look.
* No data writes or network interactions in the research helper; no source photo transformations or paid AI calls.

Tests/issue240-outfit-lifecycle.test.mjs use the **actual unchanged main** stylist and board engine in Node VM with synthetic data. scripts/test-issue240-outfit-mobile.mjs exercises Chromium and WebKit mobile viewport emulations at 320, 390 and 430 pixels with real account-scoped IndexedDB v2 items/state stores, source-photo safety, three outfit suggestions, pins, swap, saved-board round trip and cross-account refusal.

The source-fenced workflow .github/workflows/issue240-offline-outfit-lifecycle-no-deploy.yml explicitly requires **zero changes under public/ and supabase/** relative to main. This PR also does not touch Drive Duel, PR #231 or any other active branch.

## Verified results

[Full successful exact-implementation CI #40008271628](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/40008271628): **273/273 Node PASS**, **six of six Chromium/WebKit mobile viewport cases PASS**, zero external network requests, zero browser page errors and no horizontal scrolling. Source fence and unchanged application build both passed.

## Limitations, integration blockers and release decision

* **These fixes are research-only.** The existing deployed customer interface remains unmodified and still has the identified same-ID/changed-original recommendation staleness gap. A future integration owner needs to review #220 and the 3D board/source contracts in #231 rather than overwriting them.
* The research cache versions stored string bytes of the earliest app-retained full photo, not native uploaded-file original bytes. Existing saved boards do not store version metadata; migrating them must be deliberate and backward-compatible, never silently delete old saved outfits.
* In a production integration, user IDs must originate from authenticated current-user state, and restore/import/cloud reconciliation must remain correctly owner-bound. Async mutation races during pending writes and actual Supabase RLS/Cloudflare and mobile device flows are not established by this test.
* Browser tests are Chromium/WebKit on Linux configured with mobile viewport/touch. **Not actual physical Android/iPhone QA**, nor complete end-to-end deployed UI/real cloud validation.
* Maintain release HOLD until main Closet Current conversation approves integration and later protected hardware/owner/photo validation.

**Disposition:** Independent offline QA and a safe isolated implementation completed. Draft PR only; no merge, deploy, production changes, paid APIs, customer data, Supabase or Cloudflare configuration changes.
