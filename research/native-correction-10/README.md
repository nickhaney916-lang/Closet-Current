# INDEX-CORRECTION-CAS-10 — Human-approved original garment category correction without wardrobe corruption (DRAFT HOLD)

**Parent:** Main controller verified PR #563, exact immutable SHA `d913e4f0b65c6b92cfbd1de4083e84692740707e`. Parallel #22 owns actual new photographed shirt fitting, Parallel #23 owns three-owned-looks styling. This code does not modify either, product defaults, garment meshes, original camera photographs, existing saved outfits, backup or cloud RLS. Production never merge/deploy. Family Alpha issue #255 remains HOLD.

## Specific recovered defect
The actual My Closet **Adjust details** button wrote a user-reclassified saved garment with `writeAll([updated])` (unconditional IndexedDB put), even if another browser tab changed the saved record after the dialog opened. The source photograph, garment identity, SHA lock and ID must not be overwritten by stale editorial data. The scan Review/Adjust path also set `userAdjusted=true` before the user pressed Save, so a canceled edit could misleadingly look user-reviewed in live memory.

With `?nativeLossless04=research&nativeIndex07=research&nativeCorrection10=research` plus inherited `native3D05=research&sourceReadiness08=research&nativeMobile09=research`, the research-only saved garment correction now:
- Snapshots the **complete exact original saved garment** when the real user opens Adjust; does not mark an unchanged saved garment as manually confirmed on mere editor open or cancel.
- Checks current signed-in native owner and owner-scoped IndexedDB, prohibits changed original owner/ID/JPEG/SHA-256/recognition source identity, validates actual canonical JPEG bytes against SHA-256 on every confirmed correction.
- Compares complete old stored row with snapshot **inside the same IndexedDB readwrite transaction**. An external second tab write rejects with `CORRECTION10_STALE_SAVED_GARMENT_REOPEN_EDITOR`; no silent stale overwrite. For review-with-draft, also writes scan draft in the same atomic transaction. For actual My Closet metadata-only corrections, preserves pre-existing scan drafts untouched.
- On successful human Save, uses existing indexed native wardrobe refresh (#561) so a previously selected saved outfit immediately shows a **Review category** flag if its clothing was reclassified to an incompatible slot; restores normal view when category is returned to an eligible category. Original saved outfit IDs, missing denim reference, extra metadata and source hashes stay byte exact.
- Keeps user-friendly refusal message, and leaves the dialog open for user correction if the CAS fails. The original photo and previously saved outfit are still recoverable.
- Source honesty: neither editorial correction nor category reversal grants 3D Ready; unverified clothing remains original-photo/needs-review.

## Automated acceptance

`tests/native-correction-cas-10.test.mjs`: byte-exact  original sha through real JPEG, immutable originalPhoto/recognitionPhoto/identity, owner isolation, human-confirmation required, tampering rejected, legacy source labeled unverified.

`scripts/test-native-correction-10-browser.mjs`: native authenticated **synthetic Supabase HTTP**, original actual IndexedDB, manually reviewed red T-shirt capture, source SHA-256, native outfit saved (without reload), v4 recovery, **My Closet Adjust details** cancel, category Tops -> Outerwear/Jacket -> Tops/T-shirt, live incompatible review then recovery without rewriting outfit, injected concurrent same-item tab update stale CAS refused, actual verified 163-bone 3D photo fallback and account B privacy/logout. Three real browser widths 320/390/430, **42 new screenshot artifacts** and audit galleries. No physical device or live signed Supabase test. Current source-specific arbitrary fitting remains outside this assignment.

Dedicated workflow: all full original #563 source proofs/CI plus new browser and audit, strict protected-file diff, no deployment, **183 expected screenshots** (141 inherited + 42 new). Final completion requires successful dedicated Actions **on exact final commit**, artifact SHA verification and screenshot gallery inspection. The existing narrow inherited CI workflows may block combined changed-file scope by design; never weaken those guards. Remain DRAFT HOLD until main controller reviews.
