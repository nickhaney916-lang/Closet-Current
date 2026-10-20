# Closet Current — adaptive imported-photo fidelity (development only)

October 20, 2026. This change builds on draft PR #87. No release, paid API, production deployment, or Drive Duel modification is authorized.

## Customer problem

Ordinary imported clothing pictures, including high-quality camera-roll images, were automatically converted to a maximum 2048-pixel long edge before wardrobe recognition. This loses detail in garment seams, shoe uppers and small patterns, even though no masking is done before recognition. The original sensor bytes and metadata were **not** preserved. The "original photo" in the app is a rendered JPEG derivative, not a byte-for-byte native original.

## Fix scoped to saved/imported single-garment photographs

- Try a maximum **3072-pixel** edge at JPEG quality 0.94, with no upscaling.
- If its encoded data URL exceeds **2,850,000 characters**, retry at 2560, 2048, 1536, then 1024. Reject and show the existing recoverable import error if none fits. Preserve high-quality smoothing and a white neutral canvas matte.
- This protects the existing **3,000,000-character per-image backup import limit** and reduces the chance of an unexportable saved photo. The cloud image loader independently has an 8 MiB binary JPEG limit.
- Keep classification based on this unmasked source, ahead of automatic segmentation, and preserve existing duplicate, invalid MIME, decoder timeout, account, color and user-confirmation guards.
- No changes to native camera stills, automatic video-frame capture, cropped garment bounds, HEIC decoding support, model weights or storage schema.

## Verification requirements

- Whole test suite and build must pass on the exact branch HEAD.
- Node tests cover the new default resolution, no artificial enlargement, too-large-fabric fallback, safe failure and URL cleanup.
- Real Chromium and WebKit tests decode actual synthetic JPEG/PNG bytes under missing MIME, reject counterfeit MIME and unsupported HEIC, and decode a real **3600×2700** locally generated JPEG to a 3072×2304 JPEG data URL inside the storage cap.
- Additional original crop and duplicate tests and conservative production-denial gates remain mandatory.

## Explicit limitations

**This does not retain a true 12MP original**, nor its EXIF orientation, or guarantee physical-device quality. WebKit on CI is browser emulation, not a physical iPhone. Some busy photos will still fall back to 2048 or lower. Camera-native capture and import album mode still require separate testing for visual fidelity, performance and cloud restore. No hardware photo color/segmentation accuracy, mask signoff, figure asset commercial rights, production signup-email delivery or cloud full account deletion is proven.
