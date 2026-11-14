# Mission 1 P878 — Original JPEG / two-model research evidence custody

**Family Alpha HOLD #255 OPEN. Research-only draft. No merge, deploy, staging, hosted Supabase, production, private wardrobes, or other mission branches.** This is a source-verification improvement, not recognition accuracy.

## Source-verified gap
Draft [Mission 1 P877 #1081](https://github.com/nickhaney916-lang/Closet-Current/pull/1081), immutable parent `c3558227017c0e3aa337afbb29cf4827dec0ff68`, completed genuine 48-source developmental original-vs-full-frame SigLIP tests. Its audit verifies ranking provenance and input consistency but does **not** cross-verify each row against the immutable public source receipt table: a well-formed but swapped JPEG/photo ID, copied request ID, relabeled source SHA, cross-model changed owner session, altered model vector digest, or duplicate image under a different ID could mislead a future comparison.

## P878 implementation
- New separate `scripts/p878-public-photo-custody.mjs` validates exact source ID→SHA against `benchmark/locked-photo-sources.json`; approved Commons license/source; one-to-one unique SHA, photo IDs and request IDs; immutable 32+16 historical source/type manifest consistency; independently recomputed dual-model decisions; and 48/48 genuine SHA/owner/session/crop/mask/instance binding consistency across both independent model families, underlying source JPEG and optional same-model SigLIP image view.
- Enforces unchanged locked model revisions, families and full label taxonomy; exact FashionCLIP/FashionSigLIP vector hashes and worker-source digest; no third model, no unlabeled score injection, no silent owner approval, no automatic save, no outbound/non-GET traffic and one continuous Chromium development session.
- Rejects preview evidence falsely described as blinded human accuracy, a physically verified mobile run, independent third model, or a Family Alpha release. Reuses the P877 numerical comparison without changing model outputs or history labels.
- Eleven synthetic adversarial tests in `tests/mission1-photo-custody-878.test.mjs` cover forged SHA, duplicate source, swapped image/owner bindings, corrupted historical manifest/labels, forged arbitration results, locked model metadata, request collision, unlicensed image, top-rank corruption and no-release assertions.
- A dedicated two-job no-deploy workflow runs build/native/browser safety checks, then re-fetches source-hashed actual 48 public originals and pinned q8 models for the real P877 shadow-inference plus P878 custody proof. Only numeric verification outputs are retained; no original photographs in artifacts.
- Strict immutable-parent, four-file change allowlist. **No changes** to normal app recognition, owner review, actual persisted wardrobe, cloud, photograph or 3D code, or other missions.

## Acceptance criteria and honest limits
The verifier can establish **internal research provenance** only. Matching receipts and public license do not establish independent human-adjudicated labels; 48 exposed images are not an acceptable blind test. It also cannot prove no memory leaks on real iPhone Safari/WebKit, physical Android behavior, real signed account isolation or 10/10 classification. The P877 public result remains original-view 27/45 historical garment strings vs research full-frame 28/45, and the exposed sneaker/ankle boot error remains unresolved. **Do not promote the full-frame alternative to production on these data.**

CI must be checked at the exact final SHA before any pass claim. Independently human-reviewed source-disjoint labels, physical phones, signed two-owner private-cloud testing and full release authorization remain BLOCKED. Family Alpha HOLD #255 remains active.

## Verification
- `node --test tests/mission1-photo-custody-878.test.mjs`
- `node scripts/p878-public-photo-custody.mjs benchmark/p878-real-chromium/results.json benchmark/locked-photo-sources.json benchmark/p878-real-chromium/custody-audit.json`
- `node scripts/p877-siglip-full-frame-audit.mjs benchmark/p878-real-chromium/results.json benchmark/p878-real-chromium/whole-frame-audit.json`

**Run status: pending exact-head GitHub Actions.** Do not infer results from parent P877's passing CI.
