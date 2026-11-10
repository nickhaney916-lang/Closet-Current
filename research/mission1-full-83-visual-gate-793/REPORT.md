# Closet Current — Mission 1 P793: complete 83-original visual near-duplicate quarantine

**Family Alpha HOLD #255; DRAFT, UNMERGED, UNDEPLOYED.** Parent: P792 actual 10-photo/23-garment original-model evidence PR #789, exact verified HEAD `0f9158d2d333a17b7e989c73457cbafa3f46860d`. No production/staging, model weights, private photos, cloud/signed user data, Supabase or merge.

## Real acceptance gap: historical 83 SHA quarantine but stale 65/73-image visual preflight

P792 added ten actual original JPEG SHA hashes into the P768/P774 signed prospective review model, so **83 known source digests** are rejected by exact SHA. However, P769's visual near-duplicate checker still supported only 65/73 source-reference images. A prospective image of a previously model-exposed photograph that was recompressed, recropped or resized could change its exact SHA and escape a **stale visual scanner**. Prior 65/73 source-list fingerprints are no longer sufficient evidence that a proposed new photo was not visually exposed during research.

## Engineering correction

- The original `research/mission1-visual-source-overlap-769/original-perceptual-ledger.mjs` now supports **65/73 legacy research-only or complete 83 original source fingerprints**. Each entry has **seven actual decoded JPEG luminance-difference crop hashes**, SHA-bound source identity and verified dimensions; full 83 audit requires all pinned 59+6+8+10 original hashes *without substitution, omission or duplicate*. 83 ledgers can be created only with all eight previously exposed P772 sources plus all ten new P792 sources; the old 65/73 research APIs are deliberately preserved for older synthetic geometry regressions.
- `scripts/scan-visual-source-overlap-769.mjs build-83 ...` actually decodes and verifies **59 historic Wikimedia source originals, 6 earlier P66 Fashionpedia originals, 8 P772 originals and 10 P792 originals**. It serializes an actual SHA-bound complete source fingerprint file under user-selected local-only output, `mode 0600` and exclusive create. The legacy `build` command can still produce 65-image exploratory research but **the real `screen` CLI now always requires the strict, complete 83-image ledger** and refuses incomplete 65/73.
- `scripts/extract-publisher-originals-793.py` resolves 24 immutable public publisher image IDs through the **frozen full-source annotations archive digest**, verifies each original JPEG's full original bytes and SHA against pinned P66/P772/P792 source metadata, and writes ONLY disposable local original files for the image scanner. The original archive is publisher-licensed experimental data, not proof of per-photo owner commercial rights.
- The `screenProspectiveImages` API has an explicit `requireComplete83` mode, source fingerprint shape/length/dimension checks, strict SHA registry and exact sorted-set digest. A suspicious match is *quarantined* for separate independent human review. A nonmatch is **never auto-admitted** to the actual human ground-truth benchmark.
- Dedicated adversarial tests reject missing/replaced/duplicate P792 exposure source receipts, forged source sets, malformed crop vectors, attempting to build the newest ten without full previous eight, and legacy 65/73 screening as a real complete 83 benchmark. Their constructed thumbnails/fingerprint vectors are **synthetic mathematical oracles, not real original JPEG evidence**.
- The P793 dedicated no-deploy CI rebuilds the 83-image ledger from **all 83 true source-original bytes** and performs the actual source-identity/compression trial against a publisher image. The source photos are erased before uploading hash-only evidence; no private owner image or user metadata is ever a public artifact.

## Proof and boundaries

This is **data contamination prevention**, not a trained recognition improvement. The frozen actual B0 model's P792 **8 true positives, 20/17 false positives, 15 missed instances** on 23 original publisher masks still fails release acceptance. A seven-crop 64-bit difference-hash is a conservative heuristic, can have false matches and miss extreme edits; neither matching nor nonmatching establishes legal reuse, original photographer consent, unobserved original source usage during foundation-model pretraining or two genuine independent blind human color/category/type/mask reviewers. Genuine hosted two-user/physical Android+Safari acceptance remains unverified.

**Entire Mission 1 cannot be declared complete** without actual independent rights-cleared blind human photo annotations, acceptable model accuracy on a genuinely untouched cohort, physical signed two-owner private cloud testing and explicit owner release approval. Family Alpha HOLD #255 remains active.

## Exact-head proof

CI workflow `.github/workflows/mission1-full-83-visual-gate-793-no-deploy.yml` and draft PR release denial recorded when exact SHA jobs finish. DO NOT claim completion based on synthetic tests or unverified GitHub Actions.
