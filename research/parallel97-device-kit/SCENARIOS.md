# P97 on-device acceptance scenarios (HOLD #255)

Operator instructions only: **no actual phone is certified by this document**. Test each scenario independently on a physical Android Chrome and physical iPhone Safari, with authorized synthetic test accounts and personally created non-sensitive disposable photos. No production/staging/cloud mutations, family data, private screenshots or credentials. If an isolated HTTPS app and phones are unavailable, mark BLOCKED/NOT_TESTED.

| Case ID | Physical step | PASS criterion |
| --- | --- | --- |
| `camera-capture` | Use actual camera on disposable garment | Record source SHA-256/bytes/dimensions; no save before review |
| `gallery-jpeg` | Import prehashed disposable JPEG | Source hash, size and decode dimensions match |
| `heic-conversion-or-refusal` | Choose disposable HEIC where available | Source is preserved with distinct derivative, or unsupported type is refused without save |
| `exif-orientation` | Import portrait JPEG with orientation metadata | Visual orientation correct, source bytes unchanged |
| `permission-denied` | Deny real camera permission in mobile settings | Visible fallback, no saved draft from refused camera |
| `worker-start-inference` | Allow public model startup and import | Actual worker proposal seen, not mistaken for independent correctness |
| `worker-unavailable-manual-review` | Block model download/reconnect | Manual review or Unknown without auto-save |
| `no-silent-save` | Import ambiguous source without owner approval | No wardrobe record appears until explicit owner save |
| `multi-garment-separate-review` | Import two visible pieces | Independent source-proven regions or visible no-save block, no invented pairs |
| `source-original-2d` | Save and outfit-select verified item, open 2D | Original/saved/displayed SHA/bytes/dimensions identical, thumbnail not used |
| `background-foreground` | Leave app mid-import and return | Stale worker/preview pixels absent and owner lease retained or securely reset |
| `cold-restart` | Terminate and reopen actual browser | Only signed owner data returns with original verified |
| `offline-online` | Turn Wi-Fi/cellular off then back on | No destructive sync, stale session or wrong pixels |
| `storage-pressure` | Use isolated synthetic test storage pressure | No partial import/restore, safe error and retry |
| `owner-logout-switch-revoke` | A logout, B login, B logout, A login | No A pixels or DB handle accessible to B |
| `tampered-original-rejected` | Change copy of test source in isolated local DB | Different tampered digest; source is rejected and old image revoked |
| `thumbnail-source-mismatch-rejected` | Swap disposable thumbnail in isolated test | Different thumbnail digest; no unverified original admitted |
| `duplicate-import-rejected` | Reimport identical legal test photo | No duplicate saved item without separate physical instance proof |
| `v3-atomic-restore` | Export, alter isolated local data, restore v3 | Original/export/restored SHA, bytes, dimensions equal; atomic transaction |
| `v4-lossless-restore` | Export opt-in v4, alter isolated data, restore | Source, export and restored originals identical and outfit retained |
| `unverified-3d-veto` | Select garment without source-fitted geometry | Native 3D denied, exact-original 2D used where eligible |

## Required private witness receipts

For `camera-capture` and `gallery-jpeg`, a PASS additionally requires `sourceSha256`, `originalByteCount`, `decodedWidth`, `decodedHeight`. For `source-original-2d`, additionally supply `savedSha256`, `displayedSha256`, `savedByteCount`, `displayedByteCount`, `displayedWidth` and `displayedHeight`: all corresponding source/save/display values must match. For `v3-atomic-restore` and `v4-lossless-restore`, supply `savedSha256`, `restoredSha256`, `savedByteCount`, `restoredByteCount`, `restoredWidth`, `restoredHeight`: all original/export/restore receipts must match. For tamper rejection, source and `tamperedSha256` must be distinct; for thumbnail mismatch, source and `thumbnailSha256` distinct; for duplicate import, supply source SHA and byte count.

A standalone probe hash **does not** establish what the actual Closet Current app saved or restored; inspect authorized isolated local source/exports separately. If app bytes are not independently inspectable without risky changes, mark BLOCKED. Never treat synthetic Playwright auth, model inference, browser-width emulation or a text-only self-attestation as proof of physical phone acceptance. The verifier tests consistency, not cryptographic possession of hardware.

Use `node scripts/device-acceptance97.mjs --init EXACT_HEAD /private/location/device97.json` then `--verify /private/location/device97.json --allow-physical` only after genuine phone tests. Keep the receipt file private and report anonymous aggregate PASS/FAIL/BLOCKED/NOT_TESTED counts. Browser probe `jsHeapUsedMiB` is JavaScript heap only, **not total phone memory**. Any unavailable measurement stays unmeasured. Family Alpha #255 stays HOLD.
