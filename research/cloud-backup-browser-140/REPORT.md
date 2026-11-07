# Closet Current — MAIN Priority #140 / CLOUD-BACKUP-BROWSER-CONSENT-140

**RESEARCH-ONLY · DRAFT/UNMERGED · FAMILY ALPHA ISSUE #255 HOLD · NO PRODUCTION, MAIN OR EXISTING STAGING MODIFICATIONS/DEPLOYMENTS.**

## Exact base and scope

P140 is stacked on verified main P138 [draft PR #692](https://github.com/nickhaney916-lang/Closet-Current/pull/692), source exact head `5a589dfe2f6fb744cade4150c3058f2d6a19ea3b`, [strict green no-deploy CI #42395692649](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42395692649): 1,209 Node, 8 real ephemeral PostgreSQL 17 owner-policy checks, six actual P137 research restore dialogs with 36 Chromium/WebKit screenshots, and six inherited original-app browser flows with 93 screenshots. P138 did **not** exercise the inverse cloud BACKUP user decision. P134 [draft PR #690](https://github.com/nickhaney916-lang/Closet-Current/pull/690) tests owner-safe **local-to-cloud backup** on synthetic transport/IndexedDB; it did **not mount the P134 decision in a real browser**.

New P140 work is intentionally a parallel-free, main-controller owned narrow acceptance exercise **not** an integration with the shipping app. Parallel #51 owns real signed-cloud A/B, #52 mobile UX, #53 real-photo recognition, #54 mobile-storage performance, #55 cross-stream shipping-app integration. None of these branches or other projects are modified.

## Engineering delivery

1. `research/cloud-backup-browser-140/backup-review.html` runs **the actual unchanged** `createLocalRemoteFence134` browser ESM composed from P133/P132/P129/P128/P126, with synthetic owner auth + local actual IndexedDB and exact original+separately reviewed-cutout SHA-256 JPEG photo fixture.
2. A true, accessible `<dialog role="alertdialog">` warns the owner that replacing existing cloud backup **discards cloud-only changes** and is NOT a merge. Only owner private COUNT metadata and revision appear. No clothing type/color, notes, photo bytes, garment ID or private Storage object path is displayed.
3. Actual buttons allow read-only preview, create-only remote revision 0 backup without destructive prompt, cancel destructive overwrite, explicitly approve protected replacement, and recover with a distinct error for local changes, remote changes and revoked accounts. During operations buttons are disabled; Escape triggers literal false cancellation.
4. `scripts/test-cloud-backup-browser-140.mjs` runs genuine Chromium + WebKit at 320/390/430 CSS pixels. Each case: verify zero photo fetches for preview; genuine P129 private original+cutout JPEG Storage upload via strict synthetic owner-local HTTP service; confirm revision 1, immutable 2 SHA objects; mutate color and saved outfits; show count-only modal; cancel and verify remote unchanged; confirm literal true and verify revision 2 with new color and saved outfit; mutate local after opening modal and reject; mutate remote **revision** (320) or the **same-revision private document** (390/430) and reject; revoke owner during modal and deny late write; verify a separate synthetic owner cannot access A's private Storage originals.
5. Actual research screenshots (target **8 stages × 6 genuine browser/viewport cases = 48 PNGs**) plus machine-readable results and real original fixture licensing/locked SHA checks. No external requests permitted; local private HTTP and browser execution only. Research-only server never contacts live Supabase.
6. Inherited Node regression (target previous 1,209/1,209), strict scope, original existing SQL/real disposable PostgreSQL 17 RLS/CAS, P138 research restore browser (6 cases, 36 screenshots) and original-app native mobile Chromium/WebKit (6 cases, 93 screenshots) rerun without changes. P140 own browser test and inherited browser tests are explicitly distinct claims.

## Research limitations

- P140 DOES mount real P134/133/132/129 research modules in real browser engines; it is NOT a native production/staging Closet Current screen. All accounts and bearer strings are synthetic, private HTTP server imitates owner scoping but does not prove live cryptographic JWT verification or live Supabase policies.
- No signed test-user hosted cloud integration, real phone hardware, or distributed atomic transaction between IndexedDB and PostgreSQL.
- A detected conflict protects the owner from an unapproved write in testable pre-approval windows; it cannot roll back already-committed remote transactions or guarantee no race after the final read.
- No automatic unsafe source/review merge. Only SHA-authored original JPEG and independent cutout; no actual user photo or personal cloud accessed.
- Family Alpha #255 remains HOLD. Do not merge, deploy, or change production/existing staging or other user projects.

**Exact final HEAD CI status: PENDING until independently green.**