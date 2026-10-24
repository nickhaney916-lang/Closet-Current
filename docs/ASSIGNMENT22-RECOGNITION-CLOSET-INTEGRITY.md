# Assignment 22 — recognition-to-closet data integrity

Isolated branch `qa/assignment22-recognition-closet-integrity-20261023`, stacked on #282 exact `0586d08d9d40ce5da479f5ff656e03adf2c837e0`. Reviewed #234, #267, #279, #282 and open #281. Does not repeat Assignment #20 inference or Assignment #21 worker/retry work. #267's explicit-review original-JPEG provider is on a different research stack and is not wired or rewritten here.

## Reproduced defects and narrow remedies

1. The real Adjust submit handler computed the remaining draft array before entering the asynchronous write queue. A later capture could be missing from the atomic draft snapshot; a removed draft could be resurrected. Pass a supplier from that actual handler and evaluate it inside the queued transaction. Still removes only the saved item and retains owner/source guard and atomic item+draft write. Existing array callers remain supported.
2. Automatic `saveIndexed` created a shallow normalized value. IndexedDB copied nested originalPhoto/recognitionPhoto/segmentHint data at put, but the later in-memory saved record shared those objects with the original draft. A nested draft change could make displayed/styled metadata differ from durable data. Deep-copy the garment only after all source/admission/duplicate gates, immediately before put. Original image strings remain byte-identical; no image processing.
3. File backup validation rejected incompatible categories but silently normalized incompatible explicit itemType to Unknown. A user-confirmed subtype could change during recovery. Reject the whole restore with a clear detail-loss error instead. Valid known/Unknown and legacy absent types remain supported. This conservatively refuses old unsupported type strings rather than guessing a migration; no existing backup or record is modified.

## Independent offline verification

`tests/assignment22-closet-integrity.test.cjs` executes actual app source functions and actual Adjust save call expression. Seven tests cover nested original/crop/hint mutation after put, queued addition/removal, transaction abort, incompatible backup subtype, legacy absent subtype and corrected original+crop metadata across save/reopen/backup/conflict-copy remap/outfit anchor selection.

Baseline #282: **4 FAIL / 3 PASS**; candidate: **7 PASS**. Failures were observed before fixes; no expected behavior or ground-truth labels weakened. Full local app build and app/avatar regression: **1,921 PASS / 0 FAIL / 0 SKIP**, including inherited source-bound quick-color and review-clearance tests. These tests use synthetic values and mock transactions; no neural inference or real customer photographs.

The separate browser script uses a Canvas-generated JPEG and actual browser IndexedDB commit, close/reopen, file validation and outfit reference cleaning in Chromium/WebKit at 320/390/430 pixels. Network routes are blocked except the local synthetic document. Browser workflow evidence must be verified in PR before claiming browser success. This is data/byte identity testing, not photo recognition/color or segmentation accuracy, physical phones or live server ownership proof.

No public model, classifier/worker, cloud/Auth runtime, backend configuration or fixture/label changes. No merge/deploy, production, real customer photos, Supabase/Cloudflare/Resend changes, paid services, spending or Drive Duel. Family Alpha release stays under main conversation control.
