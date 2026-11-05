# CAMERA-MIXED82 — verified-parent integration research / HOLD

Priority #82 combines two independently tested, unmerged research streams at their exact verified heads:

- CAMERA79: `5c9e88eb311886d0ad59eb9c1a3a5dd6599b24fe` — draft PR #635, native rear camera photo input and source-proof preservation.
- MIXED80: `1f69ff8d713da3ad6b58f6d11a5a027f5b5d718d` — draft PR #636, human-consented skip of already saved garments with atomic save of genuinely new ones.

The merged research commit has MIXED80 as first parent, CAMERA79 as second parent. Their changes compared with the shared exact Priority #78 base did not overlap. Preserve both sets of functionality; never replace updated source with older source.

## Tests and limitations
The dedicated locked, read-only no-deploy workflow builds and runs the entire inherited Node suite, six camera-to-private-review native Chromium/WebKit cases, six mixed-duplicate confirmed-garment browser cases, six inherited owner-private original-JPEG styling/outfit/backup/restore cases, six safe-snapshot cases, and independent screenshot auditing at 320/390/430 px.

**Acceptance verdict is PENDING the exact integrated head GitHub Actions result.** Separate parent suites passed independently, but that is not the same as validating the combined tree. Do not report this integrated priority complete unless the new exact-head check passes.

These are browser file-input/device-emulated flows, **not physical Android or iPhone camera acceptance**. Authentication and recognition workers use fixture mocks. Genuine learned instance segmentation, automatic category/subtype/color accuracy and 3D fabric realism remain unproven. Production and existing staging may not be modified or deployed. Family Alpha Issue #255 remains HOLD; no customer data; no Delta Ebb or Drive Duel changes. 
