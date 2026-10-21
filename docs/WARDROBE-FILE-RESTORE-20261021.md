# Assignment 134 — private wardrobe file recovery

Isolated branch based on verified PR #133, `801b70926283ffe920cbfa2d05560288b3afaaf4`, stacked on #131. PR #126 recognition, #128 integration, #130 auth and #132 styling remain separate. The complete app outside its old two file-backup handlers, including #133's video block and original-photo recognition, is byte-identical to #133. Cloud/Auth/RLS, recognition, styling and all independent benchmark evidence are unchanged.

## Confirmed defects

Executing the exact PR #133 import handler in an isolated VM reproduced a late invalid-outfit error **after** a garment write: the existing Red correction had already become Blue despite the error. Repeating with an account switch inside `File.text()` still admitted the write with Bob active. No customer data or hosted service was involved.

Code inspection also confirmed that file restoration replaced the entire saved-outfit list, matching garment/inspiration IDs overwrote existing corrections, validation could silently discard malformed inspiration photos, IDs were truncated before merging, and export refused an outfit-only collection. None of the old restore's separate item/look/outfit writes could roll back the earlier collections on a later failure.

## Implemented recovery

- Validate the whole supported backup, unique IDs, original/display image fields, complete outfit references, safe keys, collection capacities and actual decodability of each distinct photo before confirmation/writing. Photo checks are time-bounded, deduplicated and yield to mobile input. Never recompress or resample saved photos.
- Use one IndexedDB read/write transaction for clothing, saved inspiration and outfit state. Merge from the latest durable rows inside the serialized write, preserving drafts and unrelated state. Any validation, quota or explicit abort failure rolls back all restored collections and does not publish partial UI success.
- Never clear the wardrobe or replace existing corrections. Matching content is reused; conflicting IDs get separate copies. Imported outfit selections point to the corresponding copied garments. Existing saved outfits and current selection survive; a different restored selection is retained as a saved outfit. Repeat restores reuse matching copies/boards. Capacity overflow refuses the complete restore rather than truncating it.
- New version-4 exports identify the source account, contain a consistent durable snapshot including outfit-only collections, and preserve photos exactly. Refuse preparing exports above the same 100 MB restore budget rather than producing an unusable file; larger wardrobes still need cloud recovery. Inspiration validation also refuses a normalizer that would silently discard a photo. Mismatched source accounts are refused. Versions 1–3 remain readable with an explicit warning that their original account cannot be verified and a confirmation naming the signed-in target. File owner metadata is an accidental-import safeguard, not cryptographic proof or authorization. Backups are private plaintext files containing photos; they are not encrypted. Unfinished photo results are explicitly excluded from file export; existing cloud draft behavior is unchanged.
- Pin identity and the owner-named database before file reading, after every async preparation step, before/after cloud preflight, inside transaction callbacks and before UI publication. A stale account cannot start a restore into a different database. Existing cloud dirty/conflict/retry machinery is reused. Local restore success does not claim cloud synchronization succeeded.
- Clear mobile labels, live status, target confirmation, progress and retry messages. Disable repeat file actions during an active backup/restore. No added paid provider, hosted settings or production customer access.

## Verification

Local production build and full Node suite: **1,378 passed, 0 failed, 3 skipped (1,381 total)**, including 20 new tests for originals/corrections, safe conflict copies, reference remapping, repeat imports, ownership/legacy files, invalid/missing records, limits, unsafe keys, atomic failure, file-read/preflight account changes and retries.

The dedicated CI workflow repeats the full suite and runs actual file inputs/downloads, JPEG decoding and IndexedDB in Android Chromium and iPhone WebKit emulation. New cases cover additive restoration, originals and metadata, saved inspiration/outfits, repeat imports, close/reopen, five malformed/wrong-owner files, an abort after garment and state writes have been queued, successful retry, account switching during file reading, legacy target confirmation, outfit-only export and widths 320/390/430. Existing cloud session/conflict retry, #133 video, #131 original source and styling/save/reopen suites run unchanged. Exact final head and browser outcomes are recorded in the draft PR; configured checks alone do not count as passing evidence.

## Remaining real-world requirements

Physical Android/iPhone file download/share-picker/reimport, app termination during restore, low-storage/quota/memory pressure and large real wardrobes remain unverified. Browser tests use synthetic photos/accounts and a local/mocked backend, not real customer wardrobes. Hosted cross-device Supabase upload/restore, offline conflict handling on real devices and live account switching still require disposable live accounts and separate approval where necessary. Existing account-deletion/privacy, auth email and figure/recognition evidence blockers are outside this assignment. No merge/deploy or paid calls.
