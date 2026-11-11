# Closet Current — Mission 3 bounded JPEG upload manifest

**FAMILY ALPHA HOLD #255 remains active. Draft research only. No merge, deployment, existing staging or production, hosted owner data, other missions, or confidential photograph changes.**

## Exact previous verified parent

Mission 3 bounded private JPEG restore PR #809, HEAD `6c594ecc02255231365162284b6b6fa80f02ebe4`, independently verified [GitHub Actions #42930326936](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42930326936): 1,395 / 1,395 Node; real Chromium/WebKit 320/390/430 fixture-driven mobile flows; 37 valid screenshots and 36 zero-axe-violation reports.

## Remaining resource problem

The native cloud encoder walked an entire original-photo wardrobe and built `encoded.photos = Map<private path, Uint8Array>`. This map retained **every uniquely decoded full JPEG byte array simultaneously**, in addition to the full owner-local snapshot and source data-URL strings, throughout upload and any cloud conflict handling. PR #803's four-at-a-time transform bound limited concurrency but did not bound this end-of-encode byte retention. PR #809 addressed the restore-side cache, not outgoing uploads.

## Scope of this change

- `encode()` still validates the **entire** owner-local document and existing original/cutout source SHA receipts before any network write; it still computes SHA-256 from true JPEG bytes, refuses invalid images or source receipts, and creates owner-private content-addressed JPEG references.
- Rather than storing newly decoded JPEG `Uint8Array` objects in an unbounded manifest, it keeps references to **immutable data-URL source strings already in the local snapshot**, deduplicated by SHA-256.
- `upload()` then decodes exactly one data-URL JPEG per sequential network upload, recomputes and verifies the SHA against the owner-private object path **before** sending it, and preserves the existing 400/409 immutable-object re-fetch verification.
- On interrupted upload, no `save_closet_backup` RPC is sent, the owner-local JPEGs and saved outfits remain unchanged, and the next explicit sync can retry safely. Owner/session generation checks remain in place.
- Does not cap peak full local snapshot memory or transfer bytes; this is a reduction in **additional retained decoded JPEG buffers**. Not a claimed measured physical-device heap limit.

## Parent-versus-repair evidence

New `tests/mission3-bounded-upload-manifest.test.cjs` compares the exact previous parent (which retained `photos.set(path,bytes)`) and this repair (which retains `photos.set(path,image)` and only `imageBytes(image)` during current sequential upload).

Dynamic tests exercise **1,000 saved synthetic private items** with 48 distinct original/reviewed-cutout pairs (96 unique JPEG objects), complete source SHA preservation, de-duplicated upload, no base64 in cloud JSON, and untouched local wardrobe. A forced mid-upload server failure cannot publish a partial backup; retry verifies already-existing SHA content. A synthetic digest inconsistency injected *at the upload boundary* fails closed. An account-session lock during suspended upload must not publish.

The dedicated strict NO DEPLOY workflow also performs the full serial Node regression, real Chromium synthetic-owner cloud original/cutout backup and cross-browser restore, and automated genuine Chromium/WebKit mobile 320/390/430 camera-to-review-to-private-closet/styling, quota recovery and accessibility. Verify the **final exact commit** in GitHub Actions before stating any result.

## Unresolved release acceptance

True physical Android Chrome and iPhone Safari camera/process interruption, full 1,000-photo real JPEG peak heap and quota profile, independently approved disposable hosted Supabase two-account signed Auth/RLS/Storage testing, human photo ground truth and full Mission 1/2 integration remain unverified. Supabase catalog RLS read-only metadata has been inspected on existing projects, not signed cross-owner acceptance. Family Alpha HOLD #255 remains OPEN.
