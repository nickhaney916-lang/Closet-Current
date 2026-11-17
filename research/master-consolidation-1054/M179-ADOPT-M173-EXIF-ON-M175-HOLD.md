# M179 — Source-byte EXIF high-resolution safety on already-adopted M175 (HOLD / no deployment)

## Why this exists
The protected held Mission 4 integration PR #1210 moved by an expected-head non-force fast-forward from M172 `5b8e149a3eaa61aabeb3696bb9642209eaa765ce` to M175 `b82dd03d257c0eb6cf8cba784c1e8b2a86c4c25a` after M175 [source-exact 7/7 protected CI](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/44024398771) and 3/3 normal PWA. The adopted M175 code already preserves default P99 verified-original 2D and entire M172 persisted owner `items` + `state` invariance, but it still holds the earlier `research/parallel96-highres/source-derivative-intake96.mjs` SHA `4f8fe91ec1974ff936fa90d33874db7df0782e48`. This separate optional 24MP research adapter accepts claimed upright photo orientation without verifying embedded JPEG EXIF orientation. A stale/forged `orientation:1` receipt is not evidence that orientation-aware crop coordinates map to the actual original JPEG.

## Immutable donor and intentionally tiny delta
Independent M173 opt-in source-byte orientation correction [draft PR #1239](https://github.com/nickhaney916-lang/Closet-Current/pull/1239) exact `f9ed4da602b0245c7c365bfdb279c39d07786a96` passed [3/3 CI #44022358422](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/44022358422) with real Chromium/WebKit P88 WASM 24MP and inherited **2,888/2,888 Node**. M179 copies only:
- `research/parallel96-highres/source-derivative-intake96.mjs`: source-exact donor blob `1840c4496aefc28941f4c3de24a29bac1cb5e792`.
- `tests/parallel96-highres-source-derivative.test.mjs`: source-exact donor blob `2d913221968d4c09d9be33068efa80ef45b9de9b`, including real byte-level JPEG APP1/TIFF rotated/mirrored/falsely-upright metadata and allowable orientation 1.
- Existing `.github/workflows/main1054-m58-real-p88-worker-no-deploy.yml`: change only the two prior accepted source/test SHA pins and human-readable M179 EXIF comments; **all seven original jobs, P88 donor pin, P99 normal consumer 320/390/430, M172 24MP entire persisted state, existing non-silent-save and owner revocation assertions retained**.
- This handoff memo.

**NOT changed:** `public/` app/worker/native P99, real photo bytes, outfits, account/auth/JWT, private canonical source receipt, Supabase, physical phone, cloud staging, 3D, workers, M3 backup/restore, and any other assignment branch.

## Acceptance
Require fresh EXACT-HEAD [M58 seven-job no-deploy workflow](https://github.com/nickhaney916-lang/Closet-Current/actions/workflows/main1054-m58-real-p88-worker-no-deploy.yml) on this isolated branch PR against held M4 research, plus full inherited Node and targeted EXIF hostile-byte tests. A previous M175 protected green run does not prove M179. The real external WebKit P88 model has shown intermittent no-proposal on separate M177 source; a red genuine-model job is a real gate failure, not an excuse to relax or skip assertions.

## Decision
Research-only branch, draft unmerged PR; no direct modification of protected M4 research branch, no merge to main/default, no deploy or release. If source-exact checks pass, the M4 owner may separately review for a later controlled research-only adoption. Never lift Family Alpha HOLD #255 until physical Android/iPhone original-capture acceptance, hosted JWT/RLS for four separate accounts, independently labeled recognition, and real garment-source-fitted 3D/2D wardrobe proof.
