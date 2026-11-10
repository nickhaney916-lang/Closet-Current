# Closet Current Mission 1 P798 — genuine original owner garment point in native Adjust (research-only)

**Family Alpha HOLD #255. DRAFT, UNMERGED, UNDEPLOYED.** This implementation is stacked on the exact verified P797 memory-bounded source/garment-model HEAD `a0a9c42d17099a48fdd35827b2e39bf45a057a5a`. There is no production or staging change, no newly trained model or default-URL recognition behavior change, no change to cloud backup/Supabase/authorization or atomic private-save code, and no merge.

## Actual product workflow, not an isolated prototype

In the **real native Closet Current Adjust dialog** for an UNSAVED owner-bound camera/import photo, an additional control appears only with deliberate URL flag `mission1OwnerPoint798=research`, while existing P167 original JPEG proof and P120 reviewed draft are active.

- The control displays the **original immutable JPEG source** (`item.originalPhoto.image`), **not a cropped item result**, synthetic polygon or a model-generated image, alongside existing clothing detail inputs. A mouse, touch, or accessible keyboard activation selects a point; a visible marker and pixel-coordinate explanation remain **in the dialog only**, and a clear button removes the selection without changing the photo.
- `public/owner-original-photo-point-798.mjs` rejects missing signed owner/draft, owner switching during async digest, absent verified original, mismatched displayed dimensions, an external URL instead of local JPEG, missing/invalid JPEG bytes or SHA tampering, and off-photo taps. The source SHA-256 is recomputed over the actual JPEG bytes using Web Crypto **before accepting** a point. All coordinates are clamped to original source pixels. The owner lease/draft source and dialog state are checked before and after hashing.
- The point receipt is **transient JavaScript memory**. It does not modify `item`, the local wardrobe or draft, IndexedDB, owner cloud, garment instance masks, review confirmation checkboxes, category, item subtype, color, original source JPEG, or any model predictions. Opening/closing Adjust and account lock dispose it. No external network or third-party source-photo upload.
- **There is no SAM2 model inference or generated mask from a click yet.** P796's 15/23 passing original-polygon oracle clicks are a research signal, not a released mobile inference service. P798 is the verifiable owner-guided **point-input foundation** for future private-on-device segmentation and human mask correction.
- The tap is observed through a genuine app UI event. In CI it is triggered by **Playwright automation**, not an independently verified real human tester on a physical phone. The receipt explicitly says human identity unverified, source mask absent, no approval and no save rights. Existing manual category/type/color confirmation remains mandatory and separately tested.

## CI verification

A dedicated `.github/workflows/mission1-native-original-owner-point-798-no-deploy.yml` enforces the exact verified P797 parent, only **six** allowlisted app/research-test/CI files, untouched private owner auth/cloud/model/atomic-save code, a complete build and all Node regression tests including genuine original-JPEG SHA and session race adversarial cases, and actual SHA-pinned CC BY dress through genuine original frozen B0 in Chromium + WebKit to the real Adjust dialog and simulated manual owner-local IndexedDB save.

The real-browser test verifies that the screenshot shows the original source point and that clearing, selecting, and saving NEVER persist the point, create a model mask, confirm the garment, or change its details. Every source-model / owner / external human limitation is included in the artifact. Tests preserve existing real model and native privacy assertions.

No shipping model, network camera handler, signed auth, cloud data, customer gallery, unrelated Mission 2 files or staging/production code is modified. The original test photos are known development-exposed CC BY sources, **not** new independent double-blinded human truth; legal commercially reusable rights on a new evaluation cohort and photo source separation still need genuine verification.

## Remaining Mission 1 blockers

Entire Mission 1 is **NOT 100%**. Need a safe, resource-bounded true on-device or similarly private owner-click-to-SAM2 inference implementation with real human mask correction, independent mobile device performance on iPhone Safari and Android Chrome, truly new rights-cleared/training-disjoint real garment images and two genuinely blind independent human annotation teams, acceptable actual automatic garment instance/category/subtype/color results, hosted real signed two-owner cloud/RLS acceptance and explicit release signoff. Family Alpha HOLD #255 remains absolute. Successful code/tests here do not substitute human or physical-phone evidence.

## Exact-head results

To be recorded in draft PR only after all CI jobs finish. Never cite pending CI as a pass.
