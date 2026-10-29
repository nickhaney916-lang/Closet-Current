# Closet Current 3D-22 — recover *original* CC0 archive and unblock true wrist-contact QA (HOLD)

## Discovery from the repository, not a new third-party model

[PR #422](https://github.com/nickhaney916-lang/Closet-Current/pull/422) has a real, read-only skinned body-triangle wrist-contact analyzer but its full CI was blocked: the external CC0 provider returned model bytes that **did not match the immutable original male SHA256**. [PR #424](https://github.com/nickhaney916-lang/Closet-Current/pull/424) correctly built offline fail-closed custody, and established that historical screenshot ZIP artifacts lacked model binaries. But we found another source inside the **same owned GitHub repository**: the successful [Work Assignment #63 / PR #423](https://github.com/nickhaney916-lang/Closet-Current/pull/423) includes two **losslessly gzip-compressed, source-hash-verified original CC0 GLBs**, in the isolated draft branch at exact commit `926c85ebf9d2d29c919771f3dcd6c1527208b63c`.

These are git file objects, **not downloaded screenshot artifacts**, and the source model original bytes are confirmed again against the exact 3D06 immutable approved SHA256. The 3D20 Work63 [dedicated CI #40919141197](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/40919141197) already used these exact lossless fixtures successfully in real Chromium and original-rig geometry checks. This permits recovering our exact previously approved models without accepting republished provider files.

| Source | Git blob SHA1 (lossless .gz) | SHA256 of uncompressed GLB |
| --- | --- | --- |
| Male | `d0f424cdeb0cbd441bba90d16a9030d5e7db0ce8` | `d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8` |
| Female | `eff0a2bde56b2e8da62c32684fb5cc11b3db0423` | `a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1` |

## Safety-preserving recovery implementation

`recover-original-cc0.mjs` explicitly uses `git rev-parse COMMIT:path` and `git cat-file blob SHA` against the immutable Git object hashes—**no web/network model fetcher whatsoever**. It bounds gzip size and uncompressed length, checks each file against the *unchanged* locked source SHA and the real glTF2 anatomical skin/skeleton topology, and refuses a changed or missing blob. Both original GLBs must be verified before the 3D21 importer is allowed to atomically create a new read-only-intent research custody directory with a provenance manifest. The optional CI-only phase can copy the already-verified originals into an ignored local test-runtime folder **only if neither GLB currently exists**. Real model files are not included in CI artifacts and are not deployed.

No original source pins, GLTF bytes, user photographs or wardrobe code are altered; no silent model rebind; no new model license assumption. All model source labels and CC0 provenance remain those of the original 3D06 verification.

## Concrete blocked-work continuation

The dedicated no-deploy GitHub Actions workflow checks a strict **four-new-file-only scope** against exact PR #424 head `7672436991a880d81bec0e49b858aff00b43eed1`, fetches only the *same-repository immutable archived commit*, verifies both Git object identities, runs unit tests on original binary recovery and fail-closed wrong SHA, then runs the offline 3D21 importer and existing true posed skin-triangle contact unit/integration tests from PR #422. If they pass, it produces the **previously unavailable** male/female source/relaxed wrist-body triangle distances, ray-hit fractions and original licensed garment WebGL screenshot sheet. The older 3D18/19 tests run unchanged. Any other existing regression failure must be reported independently, not hidden.

Output remains **HOLD** regardless of geometry result. These numeric measurements are **hem points → actual skinned body triangles**, not a sewn garment/skin full collision solver or proof that wrist skin wedges are gone. Do not promote a mathematical PASS into natural-looking clothing or Family Alpha release. The remaining Work #63 visual review (PR #423) judged male/female shirts REVIEW, unchanged dress FAIL, and family Alpha HOLD; this new PR is **not another Work Assignment #63** and does not edit its fitted garment mesh.

**Practical next step after verified measurements:** use the true wrist-contact values and source-pose/relaxed-pose images to choose *one* evidence-grounded garment-contact or rendering fix. The near-term visual priorities still include neckline continuity, shirt front-to-side transitions, distorted original-photo shading and dress bodice/shoulder fit. Do not spend time polishing 2D. A four-person family preview still requires visual owner signoff, real JWT/RLS privacy, cloud restore, physical phones and release gate.

No merge, deployment, production/staging, accounts, emails, costs or Drive Duel changes.
