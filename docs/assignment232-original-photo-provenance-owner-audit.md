# Assignment #232 — independent original-photo and owner provenance

Date: October 23, 2026. Isolated audit based on draft PR #231 commit dabca11062aea018f84016069d514641a1e8526f. No customer photographs, hosted Supabase or Cloudflare, production edits, paid inference or deploy.

## Critical finding: "original" has multiple meanings

- **Native camera/import source:** Not demonstrably retained byte-for-byte by current public capture/import pipeline. public/photo-import.js decodes uploaded files and re-encodes canvas as JPEG at requested dimension/quality. public/app.js function snap re-encodes a drawn video frame to JPEG at maximum 2048px on main. Imported full outfit is passed through photoToJPEG before segmentation. Even newer unmerged resolution improvements are still derivatives, not native file/EXIF bytes.
- **Earliest retained in-app original:** ordinary single-garment item.image is re-encoded JPEG; outfit-split items have item.originalPhoto.image containing the app-retained *full outfit JPEG*, item.image containing cropped garment JPEG, optional recognitionPhoto.image and cropBounds, segmentHint, outfitSourceId (UUID grouping). Not all records have these extra fields.
- **Private cloud object:** public/cloud-backup-engine.js recursively maps **every property whose name is image**, independently, including item.image, originalPhoto.image, recognitionPhoto.image, draft and inspiration. public/cloud-backup.js decodes JPEG field bytes, SHA-256 hashes the specific encoded field and uploads it to closet-private under ownerUUID/hash.jpg. Cloud document replaces image data URI with closet-photo:ownerUUID/hash.jpg. Decode verifies retrieved bytes against the named SHA before putting restored data URIs back into IndexedDB. An object's SHA proves those stored JPEG **bytes**, NOT that they are native imported photo bytes, an unaltered full-frame, or correct garment geometry. There is no universal garment-to-full-frame SHA manifest.

## Actual persistence contracts

| Boundary | Verified shape or guard | Gap |
| --- | --- | --- |
| Camera/import | candidate() creates UUID item and image; multi-garment candidate additionally uses originalPhoto, recognitionPhoto, outfitSourceId, cropBounds | Native RAW/JPEG/HEIC file or sensor bytes not retained |
| Local IndexedDB | Database named closet-current-user- plus authenticated user.id; stores items keyed id and state keyed id. saveIndexed uses items/state transaction | Neither item.accountId nor item.originalPhotoId/originalSourceVersion is universal |
| Recognition | Model uses recognitionPhoto.image if present, otherwise item.image, not native import byte buffer | Pixel-fidelity and model ground-truth not established here |
| Outfit Builder | board.slots maps visual slot names to item.id; state outfit-board has current and saved; cloud backs it up. Stylist candidates contain board.slots | Legacy saved boards contain ID refs only, not byte SHA |
| Cloud backup | schemaVersion=1, items array, state draft/looks/outfit-board; recursive JPEG image maps | Object paths include SHA of each JPEG field, not an authoritative parent provenance graph |
| Auth/RLS | auth.js current user and access token; cloud RPC derives owner_id from auth.uid(); SQL declares owner row RLS and owner-prefixed private storage object policies | Live hosted policy and two-account behavior untested in this assignment |

The repository SQL is source evidence, not a fresh live security validation. PR #220's additional async DB/owner guard is an unmerged branch; do not treat it as present in main.

## PR #231 and research overlap

PR #231 adds an *isolated* board-to-3D adapter expecting caller-provided item.accountId, originalPhotoId, originalSourceVersion and colorHex. These fields are NOT universal persisted garment fields in current main. It also currently refuses a repeated original source identity among selected garments, yet multiple legitimate separated garments can share one original full-frame outfit photo; a correct identity uses shared full-frame SHA plus distinct garment ID/crop identity. Do not integrate #231 with live cloud accounts without addressing these contracts. #220 is the guarded 2D line; #224/#226 recognition/review are separate; #228 and 3D branches remain untouched.

## What the isolated audit does

public/original-source-provenance-audit.mjs is read-only and explicitly NOT imported into production. It requires the caller to supply current authenticated session ID, matching named IndexedDB handle and expected cloud owner, hashes the first retained app JPEG separately from garment preview and optional recognition JPEG, and rejects duplicate garment IDs, deleted outfit references, missing/corrupt JPEG envelopes, changed source hashes and account mismatches. It allows two different garments/crops to reference one original outfit full frame. A caller-provided identity string is NOT server authentication; the caller must prove it through actual Auth, database ownership and RLS.

snapshotSourceHashes stores source SHA and wardrobe garment IDs without photo data. verifyRestoredSources checks these against current records even if the preview is unchanged, and refuses cross-account or missing sources. Actual legacy 2D boards do not already carry these snapshot SHA fields: the helper proves how a future migration could behave, not existing historical restoration.

verifyStoredCloudJPEG verifies downloaded JPEG object bytes against ownerUUID/SHA.jpg path, but cannot prove original native file provenance. JPEG SOI/EOI checks are not full decode, semantic content, blankness or mask checks. Real-photo human review remains essential.

## Independent synthetic acceptance coverage

- Byte-stable SHA-256 on app-retained JPEG; crop and recognition derivatives separately hashed
- Full original replacement while cropped preview stays unchanged; stale restoration refused
- Two distinct garments sharing the same full-frame source without collapsing their crop identities
- Duplicate garment IDs, malformed/corrupt original JPEG, deleted outfit references and hash mismatch refusal
- Signed-in user/IndexedDB/cloud-owner mismatches and cross-account restore refusal
- Exact cloud object byte/SHA integrity and refusal of foreign-owner paths
- CloudBackupEngine recursive original/crop/recognition image transformation with unchanged metadata and input
- Chromium/WebKit synthetic real canvas JPEGs in isolated owner-specific IndexedDB at 320, 390 and 430px (emulated phone sizes, NOT physical phone nor live cloud security)

See assignment232-original-provenance-no-deploy.yml CI and tests/original-source-provenance-audit.test.mjs.

## Integration blockers and release verdict: HOLD

1. Decide whether source version tracks real native file bytes or the earliest available app JPEG. If retaining native images becomes a requirement, capture and storage architecture must be redesigned within size/privacy budget.
2. Write a durable authenticated source manifest with owner, parent full JPEG SHA, original byte count, garment item ID, crop/variant IDs and immutable version. Keep separate source/crop/recognition hashes; allow multiple garments per original.
3. Bind saved-board IDs to source versions and compare on every restore/render. Current saved boards use item IDs only.
4. Use actual signed-in Auth, owner-bound IndexedDB and server-side RLS for all live reads, writes, restores and caches. Validate two disposable accounts against isolated staging before release.
5. Pixel-decode, reject empty images and visually check source geometry, pattern/color and model segmentation. Run real physical Android and iPhone and permission/performance tests.
6. Keep 2D Outfit Builder and current recognition behavior untouched until the main conversation approves integration.

No merges/deploys/customer-photo access/paid AI/cloud settings/Drive Duel changes were made. All tests are synthetic, and source enforcement is research only.
