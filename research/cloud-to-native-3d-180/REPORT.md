# Closet Current — MAIN #180 — Atomic owner cloud original+cutout restore to ACTUAL 163-bone saved outfit viewer

**FAMILY ALPHA HOLD, GitHub issue #255. Research-only, no merge/deploy or public app/staging/production modifications.**

## Pin and root cause

Exact inherited, verified MAIN P179 draft PR #740 HEAD `1b362c0f9a07345cf112ed8745011a9d89695081` (4/4 CI PASS; hosted Supabase acceptance remains independently blocked). P178 connected the actual P146 account menu to private original+reviewed cutout SHA-protected cloud backup/restore, but `P146` passed a default no-op callback to P137 after P126's atomic restore. Consequently the **existing native P550 saved-outfit controller retained stale garment and source image rows after actual IndexedDB restoration**, and P541 WebGL preview could attempt a stale original photo. Previous standalone cloud and native 3D browser passes did not jointly exercise the exact single-session transition.

## Implementation

New `research/cloud-to-native-3d-180/owner-restore-3d-barrier.mjs`, explicitly enabled ONLY on HTTP loopback with all six exact research flags `ownerReview145=research&ownerReview146=research&ownerCutout178=research&nativeLossless04=research&native3D05=research&cloud3D180=research`. Actual P146 account menu integration acquires a private restore lease *before* a destructive cloud restore; P137 owner consent is rechecked under that lease. **Unsaved outfit drafts and currently active WebGL previews REFUSE destructive restore**, without silent edits/dismissal or underlying IndexedDB modification. An owner may explicitly close 3D or Save/Cancel an unsaved change, then review again.

After independently verified P177/P178 original+reviewed cutout JPEG remote SHA readback and the real P129/P126 atomic IndexedDB restore, P180 invokes the **actual native P550 saved outfit controller's `load({discard:false})`** rather than leaving a stale cached outfit snapshot. It independently calls the native NATIVE92 SHA-256 original JPEG byte attestation for every supported recovered clothing source in the saved outfits (missing legacy items stay missing, not fake meshes). The P541 163-bone viewer now refuses new WebGL opens during an in-flight restore, checks again after asynchronous donor loading, and requires an explicit new saved selection after recovery. Source SHA and clothing color/cutout metadata are unchanged. Owner change, logout, tab hide/pagehide, stale consent, changed saved outfit, unknown image all fail closed.

**Guard is opt-in only; the current shipping public app, default cloud sync, real hosted Supabase projects and existing staging remain completely unchanged.** Genuine signed hosted two-account RLS/JWT acceptance is NOT claimed, and the rear photographed cloth is inferred.

## Exact independent acceptance

1. Immutable exact parent and seven strictly allowlisted research-only file paths; P180 adversarial Node tests on active preview, unsaved draft, owner/logout/lease race, actual board reload+original byte hash, foreground photo 3D open lock, strict loopback/flags. All inherited Node suite.
2. Genuine independent single-session real mobile browser tests on `public/index.html` + actual P146 Cloud, P178 native source/cutout private object storage, P126 IndexedDB atomic restore and actual P550 native saved Outfit Builder → P541 anatomical 163-bone **WebGL original Commons photographed shirt**, 320/390/430 CSS px Chromium. Captures genuine front/side/inferred-rear and active 3D replacement refusal; WebKit on the same widths verifies owner cloud flow, honest 2D fallback, and original/crop byte SHA. 6 complete signed-mock browser cloud runs, 42 independently SHA-verified screenshots.
3. Original P178 native account menu with P180 NOT active, 6 Chromium/WebKit real owner cloud/cutout tests and 30 unmodified SHA screenshots.
4. Genuine local PostgreSQL 17 with exactly unchanged private Storage RLS/backup CAS and verified locally RSA-signed P147 owner JWT plus independent P128 cross-owner tests.

Only complete P180 when all 4 no-deploy jobs pass on the exact PR head, ideally after independent screenshot gallery inspection. Keep P179 hosted Auth and Family Alpha #255 HOLD. Do not deploy, merge, invite alpha users, claim physical phone acceptance or certify 10/10 photorealism.
