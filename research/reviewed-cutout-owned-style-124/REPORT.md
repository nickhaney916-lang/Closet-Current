# Closet Current — Priority #124 / VERIFIED-INSTANCE-CUTOUT-TO-OWNED-STYLE-124

**RESEARCH ONLY · Family Alpha Issue #255 HOLD · Never merge, modify production or existing staging, or deploy.**

## Independently verified baseline and separation

Pinned main-controller P123 [draft PR #678](https://github.com/nickhaney916-lang/Closet-Current/pull/678), exact verified SHA `88c62fef955fc6b7c84d5b8a60094cc7261c2cc1`, green [dedicated no-deploy CI #42325786356](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42325786356): **1,110/1,110 full Node tests PASS**, **6/6 real Chromium+WebKit 320/390/430 browser cases PASS**, 63 screenshot evidence captures; source-backed P119 human-reviewed JPEG → My Closet → 3 outfits after full reload verified. Main thread keeps separate #48 real learned recognition, #49 dual-humanoid realism, #50 signed cloud account security, and #47 3D integration. None modified.

## Actual missing capability

P119 can save a photographed garment that was manually separated from a larger photo only when *both* original JPEG and individual JPEG bytes independently match their SHA-256 metadata and the user confirms that particular instance. But P123 My Closet shortcut only authorized records with `singleGarmentVerified:true`, and the native Style03 roster did **not** accept P119's modern `segmentHint.cutoutSHA256` format. It would be inappropriate to treat a whole outfit photograph as an individual item or label a self-declared `verified:true` cutout as fact without hashing its real bytes.

## Research-only implementation

**1. `research/style-owned-live-03/native-style-panel.mjs`** now exposes `reviewedSourceBoundCutout124` metadata gate, off by default. Only with the additional `reviewedCutout124=research` flag and the entire prior P123/P122/P120 source, owner and native-private index chain can a P119 multi-garment cutout be considered.

Admitted candidate must have:
- Exact owner-reviewed P119 source/correction provenance, confirmed category/subtype/color, human-reviewed cutout instance, unmodified original photo and matching original SHA.
- A separate distinct 64-hex cutout SHA copied consistently into saved record and segment hint; real JPEG cutout data, not the full image; no clipped/ambiguous multi-instance flag.
- Both **real original JPEG SHA-256** through existing `verifyOriginalPhoto01` **and a second independent WebCrypto cutout JPEG SHA-256 digest** from `strictJPEGBytes01`. Compare actual cutout digest to BOTH saved cutout-hash fields.
- Live native owner/epoch checks after each asynchronous digest, followed by a fresh verified snapshot check that original source and cutout JPEG bytes/hash, category and subtype have not changed.
- A genuine 2D cutout `genuinePhoto` display for My Closet and Style; `cutoutSHA256Verified:true`, `visibleCropPhotoOnly:true`, `sourcePhotoFallbackRequired:true`, **`threeDReady:false`**. This must never claim a learned instance segmentation mask, unseen garment surfaces, real garment geometry or approved humanoid fitting.

**2. `public/app.js` research branch only** additionally gates P124 behind all P123 source/index/Style flags. The saved human-reviewed visible cutout can show **Get 3 outfits with this piece** in My Closet. It visually uses its source-bound cutout JPEG in a labeled **“Owner-reviewed visible cutout · 2D photo only”** card, instead of presenting a full outfit photo as the isolated individual garment. Clicking repeats owner/current local DB/original-photo/source/cutout review checks, asks the native Style roster to rehash both JPEGs, ensures the exact cutout appears on the pinned Style image, and generates only real owned outfits from the existing native generator. It **never** silently saves an outfit or mutates an unreviewed garment. The existing P123 one-garment original-photo path and all non-research behavior remain unchanged.

## Independent acceptance

- New tests use **real licensed original JPEG fixture bytes** and a separate actual image crop derived from that public fixture with Sharp. The original and cutout data are **genuine JPEGs**, not metadata-only fabricated proof. P119 independently verifies both and commits the human-reviewed item in one owner-private IndexedDB transaction; P124's native Style roster separately rehashes both. One source-verified cutout can pin three genuinely existing owner-owned combinations; the raw original photo remains untouched, and **3D ready always remains false**.
- Negative tests deliberately alter an otherwise correctly marked JPEG cutout while retaining the old SHA; verify strict rejection, no unsafe fallback to whole photo, and no false “one original garment” re-review. Also test missing/forged review metadata, wrong source SHA, owner session revocation during the *second* digest and cross-owner row rejection.
- Browser test adapts P123's actual app licensed-JPEG camera → P120 Adjust → native Style/Board04 CAS/swap/reopen → **real full reload → P123 My Closet** pathway, then adds a **distinct P119 human-reviewed synthetic cutout from a second independently licensed genuine photo** and tests real My Closet cutout preview and real native Style 2D pinned photo, three existing owner looks, zero automatic save, then owner A/B isolation. This proves source byte identity and app integration, **NOT** that any real detector found a garment in that cropped region. All six mobile-style scenarios Chromium 320/390/430 and WebKit 320/390/430 use real browser WebCrypto/IndexedDB and collect **75 actual webpage screenshots**.
- Exact green parent + **six-file** isolated research scope no-deploy CI must pass new and complete inherited Node suites and genuine browser tests on the **final exact HEAD**, without weakening other workflow guardrails.
- For reliable registration on the research branch, PHOTO124's dedicated exact-parent workflow is installed **only on this unmerged child branch** at the already GitHub-registered STYLE03 research workflow path `.github/workflows/style-owned-live-03-fast-no-deploy.yml`. The P123 workflow and all production/default workflows remain unchanged; the original STYLE03 fast workflow remains untouched in its parent/default branch. On this child branch, only the registered STYLE03 fast workflow's action name, branch trigger, exact pinned P123 SHA, strict six-path allowlist and full tests are independently rewritten for PHOTO124. This is an in-branch workflow implementation, not a production deployment or a weakening of the parent's guards.

## Scientific and deployment limitations

Image hashing demonstrates **byte identity**, not that a cutout contains one garment, its class/color are factually accurate, or that any mask is learned and correctly formed. The original source fixture may or may not itself contain multiple garments; our crop is explicitly synthesized from real publicly licensed pixels **only to test integrity**, never cited as detector/segmentation ground truth. Existing user confirmation is a test assertion, not independently observed human acceptance. The 2D crop must never claim photorealistic 3D fit, unseen side/back geometry or acceptance on male/female 163-bone humanoids. Real signed JWT/cloud RLS, private storage policies, physical Android/iPhone sensors, arbitrary production users, learned segmentation/classification and real-device performance remain separate release blockers. Browser auth/recognition in the test uses synthetic fixtures.

**FAMILY ALPHA #255 HOLD. Research branch draft unmerged. Production/existing staging never modified or deployed.**
