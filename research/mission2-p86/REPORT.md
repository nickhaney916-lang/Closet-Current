# Assignment #86 — measured radial fit and reversible source A/B (HOLD)

**Mission 2 remains INCOMPLETE.** This increment resolves the local avatar verification blocker and demonstrates a numerically acceptable **static research candidate** for one genuine dress. It does not deliver arbitrary owner-photo reconstruction, cloth physics, complete layered outfits, independent visual acceptance or physical-phone acceptance. No consumer app, original JPEG, hosted service, independent branch, merge or deployment was changed.

## Source truth and compatibility

- Tracking #1124, draft PR #1130. Original branch base C62 `60d63ab86263f12c03e8746f9409ba52244acd3d`; previous #86 delivery `3eedee3c187d73621c2b7974eb62b26decd82752`.
- Latest #85 inspected `c64b935f394a66bdbbb2ec57fa6e39f5bc6a048c`: its report documents real-source alternatives, best 6mm welded-edge result still 151–153 faces above 5% edge strain. Those are donor results, not reproduced #86 outcomes. No #85 code imported. C63/C64 local relief source was reviewed to avoid duplicating its local-field hypothesis.
- #84 inspected at `8385c308` via `research/parallel84-real-photo-layer-audit-20261113-HOLD`: bounded shirt/denim changes and posed-contact rollback, not general garment reconstruction. No incompatible patches copied or branch modified.
- Immutable detached donors P541 `df6885d6011cb33fb22dceb81a08f35a0ac4dd61`, P60 `6fe5e46b91533a96f3c0d86950ea077cb355c459`, P172 `88d2fdb412f84b0498c86bfa17f4b391425e1958`.
- Male CC0 GLB SHA-256 `d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8`; female `a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1`. Both actual 163-bone sources loaded and exercised in the static A/B browser harness.
- Dress: Commons-0053, original SHA-256 `e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019`, 3,836 source triangles. *Dress, match (AM 2017.66.33-1)*, https://commons.wikimedia.org/wiki/File:Dress,_match_(AM_2017.66.33-1).jpg ; CC BY 4.0; catalogue credit “API data Catalogue record Photo”; author field empty in locked manifest. License and other photograph attributions remain in `benchmark/locked-photo-sources.json` and P86 measurements. Genuine masks are provisional, not independently approved.

## Engineering implemented

### 1. Correct source installation and actual avatar verification

The earlier native readiness failure was a missing transitive import: C52 imported C62, but its installer copied only C60/C61. The new explicit module closure verifies all relative dependencies before writing and byte-compares installed files, including the current P86 helpers. Tests cover missing dependencies, byte identity, same-tree refusal and module symlink refusal. This also avoids stale copies of earlier helper versions in disposable donors.

With corrected copies, the inherited native Chromium harness passed at **320/390/430 CSS px**, 24 screenshots, real original source dressing and three authentic sampled poses per width. Signed authentication HTTP remains mocked; no hosted RLS or physical-phone result is claimed. The previous failed native receipt is retained as historical evidence, now resolved for this local research run.

### 2. Principal strain and a different fit hypothesis

`surface-metric.mjs` computes principal in-plane stretch and anisotropy from generalized triangle metric eigenvalues. It detects deformation between edge directions. The real original dress uses `dressRest` shader projection, not UV attributes; that absence is explicit. This metric **does not certify photographic projection**. C60's temporary 6mm candidate has **192/193/194 triangles above 5% principal strain** in the three sampled source poses and maximum principal stretch ~1.130605. It remains rejected.

`radial-fit.mjs` screens whole-source X/Z scales **1.015/1.025/1.035/1.045** about the actual spine axis. Constant radial scale avoids C60's height-feather gradient. World-space buffers are disposable; unchanged C52/C53/C58 and C61 checks run, plus principal strain. This is **estimated garment sizing**, not photographic size recovery. In the inherited female source pose, 1.5% retained 14 strict body witnesses; 2.5/3.5/4.5% had zero sampled strict body/self witnesses and passed source shape checks. The smallest measured passing tested factor, **1.025**, was selected for static A/B. No threshold was relaxed.

### 3. Reversible static source A/B on both real avatars

A separate, localhost-only disposable preview reaudits the **current actual dress pose** and two real arm samples before making a clone. It requires all three 2.5% trials to pass the numerical guard. The clone uses posed original garment positions, unchanged `dressRest`, original source shader/photo and neutral opening rims. It never edits original position/rest/skin/index/normal buffers; byte snapshots are checked on toggles and disposal. Original visibility is restored; changes to outfit, pose or controller lifetime dispose the clone. The clone is a **static non-skinned snapshot**, not continuous animated fitted clothing.

Actual Chromium and WebKit results, both at **390 CSS px desktop emulation**:

| Figure / sampled poses | Original strict body witnesses | 2.5% candidate body/self strict witnesses | Worst source edge strain | Worst area drift |
| --- | --- | --- | --- | --- |
| Female, neutral + 2 arm samples | 196 / 196 / 196 | 0 / 0 in each sample | 2.50111% | 4.97847% |
| Male, neutral + 2 arm samples | 0 / 0 / 0 | 0 / 0 in each sample | 2.50021% | 5.06217% |

Male original already had zero sampled strict crossings; this result preserves that count, rather than improving it. The guard includes C61 normal/area/edge/degeneracy checks and zero faces above 5% principal strain. Zero strict witnesses are **not signed separation, near-contact clearance, self-contact certainty or continuous collision proof**. Opening rim collision is not separately certified. Source texture projection/shear and independently reviewed UV seams remain unverified.

**36 real A/B screenshots**: 2 engines × 2 figures × 3 views × original/candidate/restored-original. All source/screenshot hashes are retained in each engine's `results.json`. Every restored-original view had **zero RGB pixels changed above 8** versus its original. Candidate RGB changes are difference witnesses, not aesthetic scores. Assistant visual inspection: original photographed dress recognizable; front body breakthroughs reduced; shoulders remain angular, skirt stiff, rear unphotographed/neutral. No independent human or owner acceptance collected.

Reaudit plus static clone construction takes several seconds in these isolated local samples; exact per-engine/per-figure values are in `static-AB-summary.json`. These are not p50/p95 or mobile speed measurements. They are too slow to imply interactive acceptance. No peak CPU/GPU memory benchmark.

### 4. Preserved earlier #86 components

- Category-independent source-alpha **front panels**, preserving image aspect, UV correspondence and holes. Three authentic shirt/blouse/dress examples; no depth/back/size/rig inferred. Both engines now render them successfully. These remain reconstruction inputs, not fitted clothing.
- Owner-confirmed complete-slot research job broker: hashes copied original bytes, binds owner/session/wardrobe/board/exact slot IDs, rejects stale results, aborts and disposes late resources. Covered bottoms and layers/shoes retain identity. It returns original-photo fallback requirements, not private rendered photos or consumer 3D approval. Native integration must retain existing signed-photo display leases.

## Remaining mandatory gates

| Requirement | Status / exact blocker |
| --- | --- |
| General garment reconstruction from multiple authentic categories | INCOMPLETE: front panels and one licensed fitted dress research source; depth, seams, metric size and hidden views not reconstructed |
| Anatomical male/female fitting | Real rigs exercised; reversible **static** one-dress candidate only; no continuously skinned candidate |
| Collision / fabric quality | Selected source samples pass provisional strict witness + strain tests; signed clearance, near contacts, full seams/rims and continuous dynamics unverified |
| Photograph/material fidelity | Original bytes/rest preserved and real A/B rendered; source projection distortion and independent visual fidelity acceptance unverified |
| Believable gravity drape / motion | Not delivered by this increment; existing analytic geometry is not validated cloth physics |
| Complete layers, jackets, shoes and saved swaps | Identity broker implemented; genuine source geometries, garment-pair physics and native 3D integration missing |
| Signed owner workflow / fallback | Existing fallback retained; this research clone must never be wired to owner admission without independent gates |
| Chromium / WebKit / physical devices | Both engines pass static A/B at 390 CSS px; Chromium inherited source path passes 320/390/430; no physical Android/iPhone |
| Performance / memory | Single local construction samples only; repeated sequence p50/p95 and peak CPU/GPU memory not established |
| Independent human acceptance | Not collected; no fictional reviewer/owner approvals |

## Reproduction and integration

The no-deploy workflow now contains the full pinned donor recipe and separate Chromium/WebKit A/B jobs. Install its pinned dependencies; run build then full Node suite. Create the three detached worktrees exactly as specified, build original photos/cutouts/rigs in P541, install P164/P171/P173/P174/P175/C36/C52, then:

```
node scripts/install-mission2-p86-preview.mjs .native05-donor-541
node scripts/test-mission2-p86-native-browser.mjs
P86_ENGINE=webkit node scripts/test-mission2-p86-native-browser.mjs
```

The local host lacked WebKit libraries. Debian packages were downloaded/extracted to scratch without modifying system libraries, and a local launcher retained their LD_LIBRARY_PATH (the stock bundle wrapper replaces it). Playwright's host cache check cannot see extracted GLES despite successful dynamic loading; only that host preflight was skipped locally, not browser/render/source tests. The pinned CI container uses its installed browser libraries and needs no local launcher. Optional `P86_BROWSER_EXECUTABLE` supplies an existing configured launcher; it is not a fit/admission override.

Original source photos, raw meshes, pixel arrays and derivative panel JSON remain reproducible intermediates rather than new duplicated source assets. Committed screenshot evidence is genuine renderer output. Consult VERIFICATION.md and the draft PR for exact-head results. **Family Alpha #255 stays OPEN/HOLD. No merge, deployment, hosted Supabase or private wardrobe access.**
