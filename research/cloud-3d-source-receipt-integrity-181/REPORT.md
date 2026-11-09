# Closet Current — Main Priority #181 — private recovered JPEG source receipt integrity

**Family Alpha HOLD #255. Draft-only isolated research. Do not merge, deploy, modify production/existing staging, or access real owner cloud/photos.**

## Verified parent / observed gap

Direct parent: [Main P180 draft PR #741](https://github.com/nickhaney916-lang/Closet-Current/pull/741) exact independently verified SHA `00bea4ea25baa057471336b59a50eea6707997b3`. P180 correctly reloaded the real P550 saved outfit board after P126 atomic private restore and called NATIVE92 original JPEG byte attestation before accepting fresh WebGL. But it did **not compare the returned attestation receipt to the exact NATIVE91 owner/source metadata**; a mocked or broken verifier that returned `undefined`, the wrong owner, wrong original SHA, or a wrong garment identity without throwing was counted as a successfully verified JPEG. P180 also did not pin NATIVE93 wardrobe revision throughout the asynchronous per-outfit loop. Its old test double modeled an incomplete NATIVE92 return (missing SHA), obscuring the acceptance contract.

## Implemented P181

- Require actual P550 NATIVE91 source and NATIVE93 revision APIs, alongside NATIVE92.
- After real native board reload, pin owner-private wardrobe revision, saved outfit fingerprint, and the exact NATIVE91 receipt before digesting original JPEG bytes. Recheck after each awaited SHA; reject source, session generation, wardrobe revision, saved-slot or owner transitions.
- Reject NATIVE92 `void` / wrong owner / wrong SHA / wrong garment receipt, and changed post-digest NATIVE91 receipts. A non-throwing attestation is no longer accepted just for being invoked.
- Refuse to swallow unexpected NATIVE91 errors. Missing original legacy photos alone retain honest 2D fallback; report `photoFallbackOutfits`, and **never** report complete private JPEG source integrity with an unverified fallback.
- Align the P180 test fixture with the actual P550 NATIVE91/NATIVE92 metadata receipt rather than weakening the production research owner/source verifier. Add independently hostile P181 tests for receipt mismatches, invalid source owner, missing photo, and asynchronous generation/revision/slot/receipt changes.
- Independent no-deploy GitHub Actions verifies immutable P180 ancestor, **exactly five strictly allowlisted research / test / CI paths**, full inherited Node suite, consumer build, and existing genuine 6-case Chromium/WebKit mobile 320/390/430 cloud-to-163-bone 3D single-session regression with 42 independently SHA-checked PNG screenshots.

## Verification status

**Pending exact P181 HEAD GitHub Actions.** Do not describe as complete until both jobs have passed and exact-head commit verified. Additional hosted two-owner Supabase Auth/JWT/PostgREST/Storage acceptance remains blocked without separately authorized disposable project. Physical Android/iOS and arbitrary customer-photograph → 10/10 cloth realism remain unverified. Production and staging unchanged. No merges or deployments.
