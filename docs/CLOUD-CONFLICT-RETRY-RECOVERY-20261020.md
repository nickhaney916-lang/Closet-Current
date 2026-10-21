# Closet Current — Preserve Keep both through overlapping cloud backup and interrupted saves
**October 20, 2026 Pacific — isolated draft development; not hosted customer data.**

## Reproduced customer failure

A manual **Keep both versions** selection is expressed by `closetCloud.sync({keepBoth:true})` when a user has edited the same garment on two separate devices.

Previously, if any cloud sync request was already in flight, `sync()` recorded `activeSync.needsAnotherPass=true` and **discarded the supplied `keepBoth` option**. The resulting queued follow-up invoked the default `sync()`, which attempted an ordinary merge, encountered the same field conflict, and asked the user to choose again. Likewise, if the user chose **Keep both** and the photo upload or backend RPC response failed, automatic retries did not retain that explicit selection. This could leave a legitimate edit stuck waiting for another tap. It did **not** justify silently replacing one garment or claiming the cloud already held both.

## Bounded fix

In `public/cloud-backup.js`, retain `pendingKeepBoth` **only after** an explicit signed-in user's `sync({keepBoth:true})` call. While its database owner and auth generation still match:

1. Concurrent syncs record the resolution intention as well as the need for another pass.
2. Transient failures **before** the cloud RPC or loss of the response **after** server commit leave that intention intact for the next pass. Existing deterministic `resolutionIds` prevent duplicate saved copies when a server did save but its reply was lost.
3. Once a clean cloud write is acknowledged or an unmodified closet is successfully synchronized, clear the decision.
4. On a new `start` (including account switch), `pagehide`, or BFCache `pageshow`, clear the decision. The old user's choice cannot silently flow to another account.
5. Ordinary background sync never initiates Keep both by itself. Same-field conflicts still require an explicit customer decision. The server CAS revision/RPC and private per-owner cloud storage policy are unchanged.

**No changes** to garment recognition, pixel masks/camera, existing wardrobe/style suggestions, human photo source labels, original-JPEG hashing, Supabase SQL/RLS/SMTP/auth, live configuration or Drive Duel.

## Verified test plan

- **New actual-client tests** `tests/cloud-conflict-retry.test.cjs`: overlap during remote fetch; drop before backend commit; response lost *after* backend commit (same copied ID, no extra closet items); **photo POST persisted but response lost** (retry receives 409, fetches identical SHA-256 content, then saves one copy); ordinary sync conflict requires user review; account-switch clears prior resolution. The test executes the real client and merge engine against an artificial IndexedDB/REST fixture.
- **New mobile-browser script** `scripts/test-cloud-conflict-retry-browsers.mjs`: Android Chromium and iPhone WebKit browser engines with a real IndexedDB store and intercepted synthetic remote GET/RPC. While the first cloud read is still pending, tap Keep both, release it, and verify both local and cloud copies contain the same two distinct garments with one CAS write, no browser exceptions or owner mismatch.
- **Existing regressions**: full Node suite, prior original-camera/recognition and independent human photo lock, owner-bound DB, previously verified styling one-piece swaps, and pilot-release veto.
- Scope gates reconstruct all historical cloud owner authentication checks unchanged and require the exact reviewed conflict-retry source Git blob from `9137b448d24b4904c0477b2f854171c546b25a16`. They also block changes to PR #115's 12 exact independent photo source files, original manifests, model metrics and human-review toolchain.
- CI `.github/workflows/cloud-conflict-retry-qa.yml` runs the full suite and actual mobile Chromium/WebKit emulation; exact final PR SHA must be verified before declaring this development priority complete.

## Unresolved for public pilot

These are deterministic offline/synthetic backend experiments. They do **not** validate true outage conditions, remote bucket/RLS permissions, email sign-in, Cloudflare domain configuration, migration safety, durable sync across physical iPhone/Android devices, real customer data or an independent human-approved garment recognition benchmark. Do not merge to `main`, deploy, change hosted Supabase Auth/Storage/RLS or activate paid AI without approval.
