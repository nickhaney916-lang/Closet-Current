# Issue #204 — original provenance and readable-photo outfit guards

Isolated fix branch based on QA PR #203 exact head
`ad16d788e386e1e52d02aae3b94aa02791cc4cda`, which includes PR #184
`93252a3b6f570b7e38473bd1683ed3468aad84d1`. PRs #184/#203 heads and staging
integration #189, safe-Clear #195, package #197, deletion and mobile QA branches
remain untouched. The main conversation owns review/integration/release.

## Before / after and independent benchmark contract

The original #203 runner was executed unchanged on its exact head before this
fix: **20 PASS / 2 FAIL**, exit 2. The source-race defect remains directly tested
with the same original-replacement operation and rejection assertion. The
independent `oracle()` is byte-identical; the new scope check enforces that.

One legitimate fixture change is explicit: the old “blank-photo” fixture erased
only `item.image` but retained a valid embedded recognition crop and full original.
Issue #204 specifically requires these fallbacks to work. After the provenance
fix, that unchanged historical fixture correctly becomes a fallback case rather
than a no-photo case. The **zero-outfit assertion is unchanged**, and its input
now removes *all three* image sources. Separate positive tests preserve both
recognition-only and full-original-only fallback behavior; negative controls
reject empty, remote, path-only, SVG and malformed raster inputs and foreign
owner metadata. No acceptance assertion was inverted to hide a failing case.

After fixes, current independent benchmark: **22 PASS / 0 FAIL (22 total)**,
exit 0. This is code/record quality acceptance, not photo-recognition accuracy,
actual garment-color assessment, realistic try-on fidelity or release approval.

## Changes

### Prepared-source identity

`public/closet-stylist.js` captures immutable original/source/recognition/crop/hash
metadata snapshots, including nested values and dimensions. It also binds each
snapshot to the original owner and IndexedDB handle. Exact image strings are
compared without re-encoding, recoloring or modifying the garment record.

Snapshots are taken when the recommendation is prepared/rendered, **not only
at a later Save/Preview click**. The same snapshot is checked after decoder waits,
before preview, and inside the real queued save callback. A changed original,
hash, source ID, metadata, removed/remapped item or owner/DB switch rejects stale
work. Swaps retain the anchor, check both old and new sources across decoding,
and then bind the updated selection to a new prepared snapshot.

### Photo input and fallback contract

`public/closet-stylist-engine.js` admits embedded JPEG/PNG/WebP data only. It bounds
encoded size and verifies plausible format signatures, header dimensions (JPEG/
PNG), JPEG ending and WebP container size. It does not accept external URLs,
blob/private-object paths, arbitrary strings or SVG. Explicit foreign `ownerId`
or `owner_id` on the garment or original/crop container is rejected. Legacy records
without owner metadata remain usable **only in the caller's tenant-scoped closet**;
the raw scorer is not a server authorization layer.

Order: valid display image → valid unmasked recognition crop → valid full-scene
original. This resolves a display choice only; it **never writes a replacement
to item.image or originalPhoto**, changes recorded color/type or creates clothing.
The same resolver serves recommendation thumbnails and 2D board thumbnails.
Fallback notices tell the user to check the garment/background together.

The synchronous scorer checks byte-container structure; it cannot prove pixel
decodability or garment content. Before UI recommendations/swaps, actual browser
`Image.decode()` with bounded concurrency/timeout validates pixels/dimensions and
releases decoder resources. A corrupt but plausible PNG is therefore rejected
by the UI. Generated swatches test that layered contract; no garment recognition
is required merely to keep a legitimate known-category/color record usable.

Metadata-only, missing, undecodable or unsupported legacy photos are **not
deleted, migrated or recategorized**. They stay in My closet, excluded from
automatic suggestions until a readable local photo is added. Guidance makes
that distinction explicit. No inference model, network photo fetch or customer
image is used to repair malformed data.

## Validation matrix

| Case | Verification |
| --- | --- |
| Original changed, display unchanged | Same independent #201 gate; new source assertions and actual rendered-card Save rejection |
| Hash/source/metadata changed | Original/nested/top-level hash, source ID, recognition ID/bytes, dimensions, crop and nested mutation tests |
| Deferred save/preview | Actual queued save callback and delayed preview reject original replacement; browser blocks hash-only preview and queued source-ID save |
| Account/DB change | Snapshot retains owner + handle; changing both Auth/DB cannot adopt an old same-ID suggestion |
| No usable photo | Raw anchor excluded, invalid swap choices excluded, UI clears suggestions and preserves metadata |
| Valid original fallback | Original-only and unmasked-only positive tests; browser thumbnail uses original while stored display remains empty |
| Corrupt raster | Header/path/malformed negatives plus browser structurally plausible PNG without IDAT pixel data; no UI outfit |
| Three options/pins/sparse | Independent 22 checks retain three distinct owned combinations, pin/swap, dress/layer rules, truthful 0/1/2/partial cases |
| Save/reload/backup conflict | Existing real Chromium/WebKit app/IndexedDB/export/import path retained; conflicting IDs remap pin and preserve source RGB/identity |
| RGB preservation | Before/after saved-record strings and source ledger unchanged; no automatic source overwrite or destructive migration |

Old engine unit fixtures used strings like `photo-shirt` or fake JPEG payloads.
Those have been replaced with genuine generated 2×2 JPEG swatches; their existing
styling, layer, swap and category assertions are unchanged. Isolated UI mocks now
supply their photo-decoder/DB dependencies. Two static wiring checks now require
the **prepared** snapshot rather than a dangerously fresh click-time snapshot.

Local full regression: **1,688 PASS / 0 FAIL / 3 existing SKIP (1,691 total)**.
Exact final counts/commit/browser/CI evidence are posted in issue #204 and the
draft PR. No local browser binaries are available; browser validation uses the
dedicated exact-head GitHub Chromium/WebKit emulation, not physical phones.

```sh
node scripts/check-issue204-outfit-scope.mjs
node scripts/build.mjs
node --test tests/*.test.cjs tests/*.test.mjs
node --test tests/issue204-outfit-source-guards.test.mjs tests/issue201-outfit-benchmark.test.mjs
node scripts/issue201-outfit-benchmark.mjs artifacts/issue204/benchmark.json
# reviewed Playwright/browser setup required:
node scripts/test-issue201-outfit-browsers.mjs
```

Use the #204 scope/workflow, not the historical #201 QA-only scope/expected-fail
workflow. Backend, settings, old workflows, original fixture ledger and independent
oracle remain unchanged. The no-photo input adjustment is documented above.

## Remaining limits and recommended handoff

The main conversation should independently review this draft against its chosen
outfit integration candidate. This branch does **not** incorporate the separate
staging Auth/logout/routing/security fixes. Hosted tenant/RLS tests, physical
Android/iPhone, independently labeled real garment/color/crop accuracy, licensed
detailed avatars and faithful multi-garment rendering remain separate gates.
No hosted endpoint, service setting, customer data, selfie, deletion feature,
paid AI/model, spending, production edit, deployment or merge is authorized.
