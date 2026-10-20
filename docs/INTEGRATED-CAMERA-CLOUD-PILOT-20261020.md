# Closet Current — integrated native camera + private cloud pilot candidate

**October 20, 2026 — development-only. Do not merge or deploy.**

## Source and ownership

This branch integrates verified PR #89 (native high-resolution camera) and PR #90 (account-scoped cloud restore) atop PR #88 (storage-bounded high-resolution imported photo handling). Its two-parent historical merge is `31c9931536f2b79f7586abac1ea14d0a303cfa86`, with parents `e61a7c9f6ee0fe1f7d11d18c83483aa5c675c872` (cloud) and `7fe867fdd392759e0b5106d529e60a37c6438ef7` (native camera), common verified base `ccf308b3807bc5f2b321699a306d7157daf4a845`.

These changes were integrated **without editing either source PR or cherry-picking over a conflicting garment classifier**. All seven camera files are exactly from #89; all five cloud files are exactly from #90; there are no overlapping edited paths. The original recognition input, garment color rules, source photographs and independent reviewer / mask evidence are not substituted.

## User-visible behavior

1. Camera still photos can retain a maximum 3072px long side at JPEG quality .94, falling back in a bounded 2.85M-character data URL budget. Automatic/video captures stay 2048px maximum, with storage-safe fallback and no forced upscaling.
2. Browser decoding respects image orientation and its normal color conversion. Corrupt/huge stills and stalled native capture recover without writing a late photo to a new camera session.
3. Imported photos also try 3072px within the same safe budget. Category/type/color recognition remains **whole-scene original-derived RGB before segmentation, masking and garment clipping**.
4. Cloud sync binds every response, photo storage operation, local restore and queued retry to the current authenticated account, local IndexedDB handle and page generation. Duplicate overlapping sync requests run another pass rather than disappearing.
5. Owned-clothing outfit recommendations and Style My New Clothes are unchanged apart from the greater source photo quality.

## Exact branch QA

GitHub Actions workflow `.github/workflows/integrated-camera-cloud-release-qa.yml` runs:
- Immutable two-parent source merger proof; branch exact blob checks and unchanged human-review history.
- Complete app build and all available Node tests.
- Release denial / paid provider denial / human review provenance gates.
- Android Chromium and iPhone WebKit browser emulation of native photo capture/EXIF/color, real JPEG/PNG imported sources, source and duplicate boundaries.
- Both engines' actual IndexedDB against a fully mocked private backend, with an old user's response released only after the new user's closet restores.
- Full offline/multidevice local cloud simulation (migration, conflict resolution, photo hash integrity, drafts, saved style, original crop recovery) with a licensed review fixture.
- Both mobile engines' synthetic auth and style-new-owned-garment flow.
- Repeated release denial and source provenance check.

**CI is software evidence, not a physical customer pilot.** Only state exact-head success after it completes.

## Release blockers / physical sign-off

No customer launch until independently obtained evidence confirms: real Android/iPhone camera focus and low-light/high-resolution behavior, EXIF and wide-gamut color, device performance/battery/storage, same-account two-phone restoration, and cross-account isolation after real auth expiry. Supabase production RLS/bucket policies and account deletion must be externally verified. Independently approved real garment masks and licensed production human figures remain separate prerequisites. Cloud/email signup, paid AI rendering and production deployments remain unapproved; the current draft branch is not a production release.

No real customer photographs or secrets may be uploaded to public CI. Do not merge into main or start billable AI services. Do not alter Drive Duel.
