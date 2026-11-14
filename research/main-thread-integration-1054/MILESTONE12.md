# MAIN1054 Mission 4 — Milestone 12: exact signed-owner private outfit lease (HOLD)

## Source-verified integration gap
Verified M10 [draft PR #1099](https://github.com/nickhaney916-lang/Closet-Current/pull/1099), exact immutable HEAD `b1f4e9f598935d06fbb5bbf652d0f327f4df3ad5` ([two-job NO DEPLOY CI #43536407050](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/43536407050)) safely executes the real native `cleanOutfitBoard`, private original-JPEG digest, native owner index and P880 dual-model owner policy. Its research `preflightOwnedOutfit1054` compared only owner ID, token epoch and private DB name across asynchronous reads and SHA verification. A **same-user re-login** can reuse all three while replacing the actual authentication object or the private IDB connection.

The genuine Mission 3 `currentPhotoOwnerSession167()` source, audited at [PR #1104](https://github.com/nickhaney916-lang/Closet-Current/pull/1104) and its verified parent [PR #1100](https://github.com/nickhaney916-lang/Closet-Current/pull/1100), includes `authRef`, `privateDbRef` and `operationEpoch` for precisely this scenario. M4 must match that interface rather than accept a weak synthetic-only session.

## Engineering change on isolated M4 branch
Only the **research** `source-to-outfit.mjs`, its source-running Node tests, this report and exact-parent two-job GitHub Actions workflow change. No app-facing `public/`, model weights, wardrobe, image, DB, storage, cloud, staging or production changes; M1/M2/M3 independent research branches remain untouched.

- Require a signed owner snapshot with valid stable token epoch, authenticated owner ID, matching private DB name, actual `authRef.user.id`, `privateDbRef.name` and a capture `operationEpoch`. Call `authRef.assertCurrent?.()` fail-closed where available.
- Preserve the **exact identity** of authentication object, private DB handle and capture generation **on every asynchronous boundary**, in addition to owner ID/epoch/DB name. A newer same-ID login or same-name private DB swap invalidates the old request and cannot publish the previous outfit IDs.
- Preserve actual native `cleanOutfitBoard` losslessness, SHA-256 verified original JPEG, owner-reviewed garment/category/color, footwear/duplicate ambiguity, identity-preserving original photo and final 2D-only plan. No silently lost dress layers, no automatic save and no 3D authorization.
- These reference objects are ephemeral, local-only comparison handles. None are included in the return plan or written, logged, serialized, uploaded or exposed with photo pixels.
- Seven additional synthetic race/privacy tests on top of the original 17 source-to-outfit tests: same owner/new auth identity, same-name DB replacement after private read, capture epoch change, revoked auth assertion, bad/missing refs, fresh wrapper with stable refs, stale second read. They are NOT evidence of physical devices or live hosted cloud.
- Two pinned CI jobs verify exact four-path change allowlist, P880 source blob identity, native build, source-bound 24 expected integration tests, inherited entire Node suite and Chromium/WebKit native owner-review + original-photo 2D fallback at 320/390/430. Exact-head CI must complete successfully before declaring M12 validated.

## Source compatibility and release blockers
- Mission 1 P880 opt-in model suggestions unchanged; this patch does not measure recognition accuracy.
- Mission 2 C59 observed **196 strict body-to-photo-dress triangle pair witnesses** in each sampled neutral/arm pose (body crossing remains), so genuine-photo 3D collision acceptance is **BLOCKED**, even if garment self-intersection counts are zero. This M12 adapter only authorizes original-source 2D.
- Mission 3 P165 source-authenticated private Style original-photo preview already fences these exact session identities; M12 aligns **research interface only** and is NOT integrated into active consumer app source.
- Hosted two-owner Auth/RLS/Storage, real family wardrobe backup/restore, blind independently human-labeled recognition, arbitrary photographed 3D source-fit/collision, physical iPhone Safari/Android Chrome, 10/10 recognition and Family Alpha approval remain **BLOCKED / NOT TESTED**.

**Family Alpha issue #255 OPEN/HOLD. DRAFT, unmerged, undeployed. No release claim.**
