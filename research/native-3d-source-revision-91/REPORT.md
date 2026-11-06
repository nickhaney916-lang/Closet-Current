# Closet Current — Priority #91 — NATIVE-3D-GARMENT-SOURCE-REVISION-91

**Research-only / Family Alpha Issue #255 HOLD / NO PRODUCTION OR EXISTING STAGING DEPLOYMENT.**

**Exact verified parent:** main-controller Priority #89, [draft PR #644](https://github.com/nickhaney916-lang/Closet-Current/pull/644), SHA `e6c2ef87499b354bc8440bfdc9ab3a92980f92f0`, green [strict CI #42145274548](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42145274548): 828/828 Node, 12/12 independently pinned 163-bone donor unit, 3 actual 320/390/430 mobile-width original-photo WebGL cases, 16 independent screenshot audits. Historical PR-wide narrow changed-file checks remain red and must not be disabled.

## Concrete source identity gap

Priorities #88 and #89 bind 3D admission to the correct saved outfit ID, owner, selected index, displayed name and clothing SLOT IDS, both during loading and **while visible**. They do not verify the private wardrobe records *under those garment IDs*. An item correction or removal may preserve the same selected garment ID and saved board snapshot but change its original licensed JPEG's SHA, category, subtype, primary or secondary color. Leaving an old photographed 3D texture visible after that source revision misrepresents the owner's live wardrobe despite the selected outfit ID remaining the same.

## Code scope

Add a **bounded research-only read-only source receipt** to the authenticated native consumer board. This consults its current owner-private wardrobe snapshot without returning or logging JPEG bytes, requires exact owner, unique selected IDs, both agreed source metadata SHAs and JPEG data URI presence, and exposes SHA + category/subtype/color receipts only with the explicit native 3D research URL flag. This is a metadata/source-revision guard, **not** a second independent byte-by-byte cryptographic rehash; the original 3D donor itself verifies source JPEG SHA when creating its textured source mesh. Do not suggest it catches forged unchanged SHA metadata when bytes were tampered out-of-band.

The native 3D read-only bridge captures these source receipts alongside Priority #88's admitted saved outfit and revalidates source receipts at every existing async boundary and Priority #89's already-visible scene observer/state check. When wardrobe refresh changes underlying source SHA or classification under the SAME garment ID, it destroys the stale private 3D/photo view, leaves consumer's owner authenticated, preserves saved board IDs exactly and permits reopening only after fresh explicit source verification. No original JPEG bytes copied into this new receipt, and no new cloud or wardrobe write path.

## Independent acceptance scope

- Eight Node tests for identical source receipts, same garment ID but different photo SHA, category, subtype, primary and secondary colors, missing/foreign item, forged receipt, source API access, original JPEG privacy and fail-closed stale viewer integration.
- Genuine mobile Chromium 320/390/430/WebGL 163-bone original-licensed dress source tests; retain real #88 delayed donor-import user selection switch and #89 post-open saved-outfit switch acceptance at 390. In addition, swap the genuine licensed original dress JPEG for another genuinely licensed original JPEG in same owner A garment ID and update exact two SHA metadata fields in real IndexedDB while keeping saved outfit unchanged; refresh the real native consumer owner wardrobe (not a mock worker); old source scene must clear. Verify source-reverted original dress can reopen and no cross-owner leakage; independently screenshot-audit additional 390 cleared view.
- Pinned real PR541 donor `df6885d6011cb33fb22dceb81a08f35a0ac4dd61` unchanged. Exact parent/scope gate, no-deploy CI, all inherited Node tests and evidence audit. No source images stored in public CI artifact; only sanitized original photo screenshots and source hashes from permitted Commons fixtures.

**Engineering verdict PENDING exact-head CI**, scientific texture realism NEEDS REVIEW. Model recognition accuracy not established by this test; no physical Android/iPhone or real signed Supabase account RLS acceptance. Historical PR-wide narrow changed-file checks may remain red; not merge-ready.
