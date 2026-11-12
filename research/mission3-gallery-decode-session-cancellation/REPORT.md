# Closet Current — Mission 3 gallery batch cancellation after account switch

**Immutable accepted parent:** Mission 3 draft PR #899 HEAD `2831455f104e651a037dea283f8447ed20550832`, exact-head successful no-deploy Actions #43152440897, attempt 2, full 1,551/1,551 Node and Chromium/WebKit at widths 320/390/430, local signed-JWT PostgreSQL 17.

**Actual defect:** `importClothingPhotos()` already checks the account epoch and owner/DB before accepting results, but `readPhotoBatch()` did not receive the lease. After owner switch it would still decode every remaining image (up to 20), invoke the callback on old photo bytes, label rejected/cancelled work as "exact duplicate", and waste mobile memory/CPU. The old finalizer did not change the next owner's controls, but the reader still performed needless work after revocation.

**Narrow correction:** optional `shouldContinue` callback in `public/photo-import.js`, called before each file, after await decode, after await candidate, and when handling an error. On revocation, exit the loop without further decoding, accepting photos or showing misleading duplicate/error receipts. A result only gains `cancelled:true` when actually cancelled; normal callback behavior, valid/invalid filters and result structure are unchanged. `importClothingPhotos()` passes existing `sameImportLease` (epoch + exact signed owner + DB handle), including logout/login under the same user ID.

**Actual-source tests:** seven source-extracted regression scenarios in `tests/mission3-gallery-decode-session-cancellation.test.cjs`: canceled batch stops after first photo; cancel during decode; cancel during candidate; normal success/duplicate/error; actual app account switch; same account re-login epoch; normal entire batch. Dedicated workflow executes exact unchanged parent source against known-bad expectations and fixed source against safe expectations, strict five-file diff allowlist, serial Node, local disposable signed two-owner PostgreSQL/JWT/RLS plus native Chromium/WebKit synthetic browser suites. All no-deploy.

**Verification:** Pending exact-head CI run until all jobs complete.

**Safety/release:** DRAFT / UNMERGED / UNDEPLOYED / Family Alpha HOLD #255. No changes to Supabase schema, real user photos, hosted private assets, production, staging, or protected default branch. Physical Android Chrome and iPhone Safari and owner-approved hosted signed two-account acceptance remain outstanding; independently labeled real garment recognition and photographed 3D remain separate workstreams.
