# Closet Current 3D-21 — recover exact approved CC0 bodies, never silently repin

## Why this is the next dependency (2026-10-29)

The latest source-bound anatomical wrist-contact work [draft PR #422](https://github.com/nickhaney916-lang/Closet-Current/pull/422) passed **5/5 pure triangle geometry tests** but could not start its actual posed male/female CC0 skin-body measurement. [CI #40917890216](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/40917890216) rebuilt all **15 licensed original garment images and nine source-provisional cutouts** successfully, then the upstream Innerscene male GLB downloader returned a file with a **different SHA256 from the approved original** on three retries. This must remain a hard refusal. We cannot honestly claim actual cuff/skin triangle clearance, a source-fitted garment, or visual PASS without the exact approved model bytes.

I inspected earlier working CI artifacts [3D-06 #40784885429](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/40784885429), [3D-11 #40811767057](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/40811767057), and [3D-15 #40884449268](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/40884449268). They include useful original browser screenshots and source hash metadata **but not the original GLB bytes**. A provider page describing the same 163-bone model is not proof that its current download equals the old SHA-locked model. Source/model metadata alone cannot restore a binary.

## Concrete implementation

`verified-model-import.mjs` provides an entirely **offline, explicit, original-pair recovery gate**, so we can import the approved binaries from a trusted owned backup, authorized immutable artifact or archived local development source once a copy is found. It:

1. Accepts **exactly two independent local GLB input paths**, not a URL, arbitrary substitute model or untrusted redirect.
2. Checks each file size and complete SHA-256 against the unchanged immutable male/female pins already in `research/three-d-06/fetch-licensed-avatars.mjs`; rejects a changed download even if the GLB still has 163 bones. `validateGLB` independently checks glTF 2.0, real skeleton and nontrivial mesh.
3. **Checks both originals before any write**. Stages the two files into a new pending directory, re-verifies the staged bytes and publishes a new immutable research-only directory and manifest only after both pass. A failed import removes the pending directory and does not overwrite the current `models/` folder, alter original photo/alpha, or change any prior locked source definition.
4. Reports `releaseAuthorized=false` and `productionTouched=false`, even for successful custody. Exact source acquisition is not a visual, collision or Family Alpha approval.

Example after obtaining two **previously verified original bytes** from a separately trusted archive, from repo root:

```bash
node research/three-d-21/verified-model-import.mjs \
  /trusted-originals/male-cc0-rigged.glb \
  /trusted-originals/female-cc0-rigged.glb \
  /tmp/closet-original-cc0-recovered
```

The importer will fail on today's changed publisher download, even if both sources have plausible male/female anatomy. Do **not** use it to repin, substitute new assets, or disable the existing model SHA guard. Once recovered, existing original 3D-20 full tests can be pointed at exact validated bytes by controlled local file preparation; no blind live release. The directory contains an explicit verified manifest, not real-user data.

## Tests and limits

A new **independent no-deploy** GitHub workflow runs deterministic pure-Node GLB binary, source-identity, false-approval, drift and no-partial-write tests **without internet/model downloads**. A successful 3D-21 test verifies the recovery gate, **not** restoration of the exact model. The existing 3D-20 actual body contact and screenshot checks remain HOLD until real approved bytes are recovered and reverified.

Only four new research/test/CI/README files on a separate draft branch stacked on PR422. **Zero** changes to PR422's actual triangulation, garment meshes, source JPEG/PNG, model GLB, project authentication, user closet data, staging, production, paid services or Drive Duel. Four-person Family Alpha stays HOLD; 3D visual quality still needs independent human review. No model files are published in this PR.
