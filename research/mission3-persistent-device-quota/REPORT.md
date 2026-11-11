# Mission 3 — persistent owner-specific device-storage cloud restore pause (FAMILY ALPHA HOLD #255)

## Scope and verified parent

Stacked only on independent Mission 3 atomic device quota restore PR #817, exact verified parent `977d87f83cc08350cd9661323f862b6722e35679`; its dedicated NO DEPLOY CI #42942472023 passed 1,412/1,412 Node, 6/6 Chromium/WebKit injected-quota cases and original/outfit rollback, 49/49 PNG SHA audits, and 36/36 zero-axe-violation reports.

**No merge or deployment.** Never modify existing production, existing staging, hosted Supabase, actual owner accounts, private JPEGs, release gate, or parallel Mission 1 / Mission 2. All browser owners and source images are synthetic and generated in CI.

## Reproduction and change

Parent PR #817 stops repeated downloads only while the existing JavaScript page stays alive. Reload or a new PWA instance resets `pausedDeviceStorage=false`, immediately fetches a previously failing large private wardrobe again, despite unchanged local IndexedDB capacity. Atomic rollback protects the owner's old garments and saved outfits but does not protect battery, network bandwidth, or responsiveness.

Keep a *minimal account-specific stop bit*, never a user garment, photo, token or cloud document, under `closet-current:device-quota-pause:v1:<owner-id>`. Write to the small browser `localStorage` API, falling back to `sessionStorage` for same-tab reload when blocked. Both may be unavailable; report that the pause cannot be saved rather than promising persistence.

During authenticated `closetCloud.start`, inspect the owner-specific pause **before any cloud requests or entire-wardrobe photo snapshots**. Leave the owner's existing IndexedDB clothes/outfits/revision intact. Still expose the owner-visible **Sync closet** button. A deliberate click clears the pause and retries; if IndexedDB is still full, the atomic restore aborts and the pause is saved again.

No other account's stop is read or deleted. This is *not* a replacement for PR #814's owner-specific IndexedDB cloud 413/507 capacity marker; the two distinct failures have independent behaviors.

## Deterministic evidence

- Parent-vs-change source assertion for the missing persistent pause.
- Real fault injection via fake-indexeddb at the **first restored garment** and **final cloud revision** (inherited rollback regression).
- New Node tests: page reload blocks cloud GETs, manual retry succeeds preserving exact photo SHA/outfit IDs, owner 2 is unaffected, sessionStorage fallback under blocked localStorage, fully unavailable browser storage gives an explicit warning and remains atomic.
- Real Chromium and WebKit at viewport widths 320/390/430: synthesize an IndexedDB QuotaExceededError in the actual application; verify after a complete browser reload **zero additional cloud network requests**, unchanged old source JPEG and saved outfit, then manual Sync restores SHA-attested original JPEGs, current outfits, revision, and clears the stop.
- Inherited real mobile journeys, accessibility scans, full serial Node suite and build run in scoped dedicated workflow `.github/workflows/mission3-persistent-device-quota-no-deploy.yml`.

## Release boundaries

This branch is **DRAFT, UNMERGED, UNDEPLOYED**. No physical iPhone Safari or Android Chrome, real signed hosted two-account JWT/RLS/Storage checks, or measurable 1,000 distinct-real-JPEG peak heap acceptance. These remain open and Family Alpha #255 is **HOLD**.

**Verification status**: pending exact-head GitHub Actions results. Do not report the new behavior as verified until the final branch SHA's dedicated run is green.
