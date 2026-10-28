# Work54: review-only natural starting fit — HOLD

Independent branch on PR382 `d8d95bf7297b91bdde2a5cfa274203ca12cbc1f1`. No Work53 isolation files or algorithms are changed. The existing humanoid, rigid fitting, pixel-coverage/face guards, anatomy foreground, manual sleeve traces, cutout/source-bound fit recipes and private app remain intact.

## Functioning improvement

**Suggest starting fit** is added to the protected reviewed-garment editor. After the existing owner/source/cutout-review gate, one trusted click proposes source shoulder/waist anchors from a stable five-row alpha band and applies the existing rigid fitter. Bottoms align to the existing anatomical waist, rather than the center of a generic slot. Tops/dresses align to shoulders; outer layers get a bounded 6% uniform ease allowance. No nonuniform stretching, new garment pixels, recoloring, mask editing, paid inference or fabric simulation.

The planner can reuse existing verified source landmarks/panels supplied by a caller. A fresh alpha-based guess is explicitly unverified and requires review. Wide sleeve poses, unstable boundaries, clipped/opaque/empty sources and shoes are refused; manual landmarks and source-photo fallback stay available. The blouse's poor generic sleeve suggestion was rejected, rather than replacing its better calibrated panels. Automatic pose/rotation inference from uncertain source photos is not claimed; existing manual tilt/sleeve controls remain.

Existing manual or restored fits are never overwritten by this action. Reset explicitly permits a fresh suggestion. The result uses the existing normalized profile/adjustment fields, so the unchanged PNG-bound fit recipe exports/imports it exactly. Untrusted clicks, revoked sessions, stale PNGs and forged approval remain refused. No automatic quality/owner approval is created.

## Actual licensed visual comparison

`index.html` displays each original, the same existing Work52 provisional cutout, previous **automatic containment**, new starting suggestion and previous **manually calibrated fit** separately. The manual reference is not hidden or presented as an algorithmic improvement. The benchmark masks are not owner-approved; all suggestions remain REVIEW. No claim that the new guess beats verified manual landmarks.

Visible default-placement gains are strongest on:

- `commons-0043` skirt: waistband rises from the low generic slot to the actual waist; retained pleats/hem stay proportional.
- `commons-0053` dress: shoulder placement clears the face and reduces the oversized/floating default. Support residue remains an isolation defect.
- `commons-0003` shirt: shoulders and sleeves connect better to the humanoid; clipped cuffs remain Work53's independent problem.

The printed shirt changes only modestly. The blouse needs its existing manual sleeve panels. Jackets, pants/shorts and difficult sources without dependable masks stay fallback; single shoes are not fabricated into pairs. `outfit.html` compares an actual licensed shirt + skirt with the existing correct layer order. No generic colored clothing replaces photos.

Pre-existing source/body reference landmarks give geometric errors, not realism scores. Local Chromium measurements (390px) are approximately: shirt 20.26 → 6.75, dress 34.50 → 13.38, skirt 42.47 → 3.93 avatar pixels. The original source landmarks and target references are inherited annotations; no independent full fitting ground truth or physical fit is established. Source RGB/JPEG/canonical masks and fitting proportions remain unchanged. Worn-avatar grades stay **0 PASS / 5 REVIEW / 10 FAIL**; owner approval remains absent.

## Build and validation

The overlay copies the exact PR382 protected distribution, changes only its compiled Work47 editor and adds the new planner. Every other compiled asset is byte-compared, including recognition, original JPEG handling, isolation, storage/Auth, recipe validation and fitting engine. The original source editor and independent branches are not overwritten.

Use `.github/workflows/work54-natural-fit-no-deploy.yml`: inherited source pins, original benchmark and PR382 build, then:

```
node scripts/build-work54-fit-hold.mjs
node scripts/build-work54-benchmark.mjs
node --test tests/work54*.test.mjs
node scripts/test-work54-browser.mjs
node scripts/test-work54-editor-browser.mjs
node scripts/test-work54-integration-browser.mjs
```

Serve localhost and open `research/work54/index.html` or `outfit.html`. Full tests cover Chromium/WebKit 320/390/430, all fifteen originals, exact fit download/import, manual preservation, untrusted-click/forged-approval/session refusal, layering/fallbacks, plus inherited three looks/swaps/favorites/save/reload and storage-fault regressions. Auth/cloud/classifier are mocked; no live JWT/RLS, cloud restore or physical-phone proof. Exact-head CI and screenshot archive are reported in the PR and issue255.

No merge/deploy, production/staging/Supabase/Cloudflare/Resend settings, private photos/accounts, paid services, spending or Drive Duel. Family Alpha HOLD.
