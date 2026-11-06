# Closet Current — Priority #114 / ASYNC-CAMERA-INDEX-SOURCE-SNAPSHOT-114

**Research only · Family Alpha Issue #255 HOLD · no merge, deployment, production or existing staging changes.**

## Source and independently green parent

P113 [draft PR #667](https://github.com/nickhaney916-lang/Closet-Current/pull/667), pinned exact commit `48331ef36e0b799e6b0980fdeb6e90ae8e72eb1b` with independent [no-deploy CI #42308140721](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42308140721) SUCCESS: 1,040 Node regressions. The existing P112 original-source real WebGL benchmark remains the unmodified 3D baseline ([CI #42306390744](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42306390744)).

## Actual capture/recognition-to-saved-closet issue

The existing opt-in original-photo recognition admission module (`research/index-04/verified-saved-recognition.mjs`) validates a SHA-256 hash asynchronously. Before the hash finishes, the saved wardrobe index is built and the original candidate source and recognition evidence are read. The pending SHA verification yields to the event loop, where human review, original photo selection, account access or saved closet contents can change. The old flow checked current owner after the digest but could still choose an old index or a *different* recognition/color/category/source after the await. That can produce a stale `autoSaveSafe` decision. This module itself never writes photos or persists to the closet; it is an opt-in decision boundary in the existing app, not evidence of real model accuracy.

## Engineering implementation

- Capture an in-memory, non-logged **decision fingerprint** of the original JPEG source references, source hash, crop/segment evidence, human-confirmed color/category/item type, corrected metadata, model's proposed first category/subtype/color, confidence flags and genuinely independent subtype evidence **before** the async SHA proof.
- Capture only the **normalized metadata index** for the signed-in owner's saved items (not the stored JPEG bytes, original image URLs or entire wardrobe records).
- After awaiting SHA-256, revalidate that the owner is still signed in, original source/recognition fingerprint is unchanged, and rebuilding the owner-scoped saved metadata index gives the exact same state. Reject races with a generic error, never return stale `autoSaveSafe=true`.
- Repeat the same source and saved-index validation after the next live-owner callback and again after the final live-owner callback, including changes induced by those checks. The return decision has a coherent synchronous input state.
- Preserve existing special protections for manual color/category corrections, duplicate detection and multi-garment segmentation. Unknown actual model or unverified garment cutouts still require user review. Explicitly do NOT copy a model-suggested color into human-confirmed color.

## Tests and verified scope

New `tests/async-camera-index-source-114.test.mjs` uses a controllable pending real SHA digest to mutate inputs **after** proof begins but **before** it finishes: photo bytes, expected source SHA, crop/segment metadata, confirmed color, confirmed category, manual correction, model category/subtype, independent subtype confirmation and owner-scoped saved items. It also tests the final session-check callback changing the photo candidate after proof; unchanged positive source and irrelevant transient UI metadata remain admissible. The complete inherited Node suite and exact-source audit run in the isolated P114 CI.

This is an in-memory TOCTOU prevention for a **research decision**. It is not a real cloud transactional/atomic wardrobe write, nor a signed-account RLS test; it cannot detect an ABA mutation that is fully reverted between snapshots. Source image strings are compared transiently in memory but never included in the returned decision, logs, network requests or saved artifacts.

**Not proven:** actual color/category/instance accuracy on held-out genuine images, private-account JWT/RLS, physical iPhone or Android, arbitrary user's photo-to-3D fit, accurate photographed back, real continuous fabric drape, independent human 10/10 realism. Family Alpha remains HOLD.

**No production, existing staging, default bundle, source photos, WebGL renderer, deployed resources or other projects are modified.**
