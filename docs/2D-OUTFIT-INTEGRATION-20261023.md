# 2D Outfit Builder integration — assignment #218

## Review and branch choice

PR #217 was inspected at 9f7c7cf9e5e7875e16ba761f753222959363c644, then
refreshed to 8a7f1d69e4150b8600adbc39dda91df0adb34db6. Its avatar QA run
39962644473 and camera/indexing 39962637053 succeeded. These are unit/source
checks, not customer browser or physical-device evidence. PR #216 supplies the
strict layer planner. Both are standalone research on older main. Their avatar
sources/tests are selectively retained here; their old app is not substituted
for the current account/source protections. PR #218 already exists for the
previous recognition assignment; this assignment does not overwrite it.

New isolated branch: `work/2d-outfit-integration-20261023`, based on verified
cfd722e4f242234afc5629afc34b6a0b71fc64a9. This stacked review depends on the
unmerged safe development line (#209 → #213 → #218); the main conversation must
choose final integration. No competing branches were moved.

## Customer path

The existing My Closet → three styled choices → Outfit Builder flow remains.
Recommendations, selected-item pins, one-piece swaps, saved-board restoration
and dress exclusion retain their existing acceptance criteria.

Previously the reusable-figure planner selected `item.image` and compared only
that display image. An original-only or crop-only change could leave a stale
cutout. It now selects the saved original and validates crop geometry into that
original. Native pixels are cropped into a temporary display canvas, followed
by the existing bounded conservative extraction/placement. Original, display,
recognition and saved wardrobe data are never rewritten. Legacy single photos
without an original wrapper still use their saved image. An outfit piece needs
both its original scene and valid crop; a whole scene cannot masquerade as one
garment. Explicit foreign owner/account aliases on the item or its photos fail
closed, in addition to the existing account-scoped database check.

Original bytes, crop and provenance changes invalidate pending work and cached
previews. Cached display masks are not reused as original pixels. Invalid or
unusable originals are held with the existing saved-photo/retake fallback.
An opaque photo whose background cannot be safely separated may therefore show
fewer figure layers than a prior unbound display cutout. Its saved source and
recommendation remain available; we do not invent fabric to fill the gap.

The research compositor remains separate from production: its supplied mask
review/hash fields are caller assertions, not authenticated reviewer evidence
or independent byte-integrity verification. It must not become a launch path
until review provenance and an actual encoded-byte/decode binding are supplied.
The adapter now prevents nested account override; dress/top/bottom/outerwear
conflicts are consistent with the customer board. No synthetic demo gradients
are presented as real garments.

## Verification and limitations

Initial ported avatar suite: 43/43 pass. After incorporating latest #217 tests:
46 avatar tests. Local full regression with all 59 SHA-verified licensed source
fixtures: 1842 passed, zero failed/skipped (before final report-only changes).
Independent existing product benchmark: 22/22 PASS, byte-identical to its locked
expected JSON. New five source/owner/crop tests include original-only fallback,
changed original/crop/provenance, stale display mask, explicit foreign aliases,
invalid geometry, missing scene source, and no source mutations.

Final exact-head repeated regression and Chromium/WebKit evidence are recorded
in the draft PR. A workflow installs ephemeral browser dependencies, blocks
remote app requests/writes in the test harness, checks existing recommendation,
pin/swap/backup/isolation behavior and new original RGB/cache/mobile tests.
Only browser emulation is performed; physical phones tested: zero.

No segmentation accuracy, physical drape, sizing, fit or photorealism claim.
The fixed body references have limited resolution. Extraction may hold cluttered,
low-contrast, opaque or mannequin photos. Original photos above the existing
20-megapixel preview decode budget remain saved but are held for this display.
No new human-reviewed masks or independently reviewed garment-fidelity set.

Recommendation: review the 2D collage as a clearly labeled styling aid with
saved-photo fallbacks; do not label it realistic virtual try-on. Public-launch
approval remains with the main conversation after exact-head CI, physical
mobile and independent human garment/fidelity checks and existing security
release gates. 360° 3D remains a separate future track and is not a dependency
of the 2D work. Existing commercial-license research remains applicable; no
third-party model, weights, paid provider or new asset license was activated.

No merge, deployment, customer photos, paid AI, spending, production/cloud
settings, Supabase/Cloudflare or Drive Duel changes.
