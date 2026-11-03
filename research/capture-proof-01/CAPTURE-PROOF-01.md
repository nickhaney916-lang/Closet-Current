# CAPTURE-PROOF-01 — Mobile original-photo acquisition and source proof (DRAFT HOLD)

Isolated research descendant of PR #543 exact head `f1a79f697d978dba7462fc725d05503cbbf8385c`. **Does not change or merge PR #543, PR #539, PR #541, PR #542, production, Supabase policies, Drive Duel, or Delta Ebb.** Activated only via `?captureProof01=after` on a full-repository research host. Combine with `?index02=after&index04=after` to exercise INDEX-04 source safeguards. The normal app / published `dist` does not include the research module; never deploy with these flags until explicitly approved.

## Source-byte contract for INDEX-04

Source-producer: `research/capture-proof-01/source-proof.mjs`. A captured JPEG generated from the **full available frame dimensions** by an actual browser canvas is treated as the *canonical first-available camera image* (NOT a lossless sensor raw or the phone gallery's original). The source-producer obtains the real JPEG byte sequence from the data URL and computes a WebCrypto SHA-256 digest independently of its filename or content classification. It returns:

- `image`: canonical original JPEG data URL that the classifier must receive.
- `originalPhoto.image`: identical source, retained across crop/Adjust/saved records; `originalPhoto.sha256` and `sourceSHA256` equal the digest of those exact canonical JPEG bytes; `sourceHashVerified: true` only after real byte hashing. Width and height refer to actual captured/decoded dimensions.
- `singleGarmentVerified: false` deliberately. A frame/filename alone never proves one garment or segment correctness. INDEX-04 therefore directs genuinely ambiguous captures to Review. User confirmation remains authoritative.
- For genuine JPEG file imports, no lossy re-encode occurs. The imported binary bytes (including EXIF/orientation metadata) are retained as `originalPhoto.image`. `originalPhoto.originalFileSha256` equals the same digest and `transformed:false`. EXIF orientation is inspected; `orientationConversion:'browser-exif-display-only'` means **display orientation is browser-managed**, not that file bytes were modified.
- For PNG/WebP/AVIF/HEIC when the browser can decode them, the full decoded dimensions are encoded as a new canonical JPEG for existing recognition/UI; `originalFileSha256` hashes **the actual imported raw bytes**, `originalPhoto.sha256` hashes the new JPEG bytes, and `transformed:true`, `orientationConversion:'browser-decoded-to-jpeg'`. Never claim original raw bytes equal new JPEG. Raw non-JPEG input bytes are not persisted, so the original-file SHA can be independently checked only when the user supplies that file again. **The retained canonical JPEG remains independently byte-verifiable locally.**
- `verifyStoredCanonical` recalculates SHA-256 from the actual kept `originalPhoto.image` bytes and rejects tampered, missing, unsupported, or inconsistent flags before a capture/import candidate is queued. This proves byte integrity at this boundary, not ownership or human-reviewed classification.

Cropping retains every field of `originalPhoto`, updates only the cropped `image`; INDEX-04 can identify a crop mismatch and require review. Outfit segmentation retains the verified original source while **never promoting a model-generated garment crop to verified segmentation/cutout** without independent evidence.

## Camera reliability

- Original preview resolution in research mode uses `video.videoWidth × video.videoHeight` (no 2048-pixel cap). Capture quality uses existing JPEG .94.
- Choose front/rear camera via accessible select, relaxed capability fallback on NotFound/Overconstrained/NotReadable only; permission denial is surfaced with a retry option and no bypass.
- Stream cleanup on stop/pagehide/visibility change/failed playback; ended-track disconnect cleanup. Generation guard and owner-match after async SHA prevent stale frames from crossing camera restarts/logouts. Rapid double-taps cannot enqueue duplicate in-flight frames. Unsupported cameras retain existing photo file import.
- Browser audio/video permissions are not requested beyond getUserMedia(video); app only stores approved images to its owner-scoped closet IndexedDB, does not call any gallery-save API or create any camera-photo upload endpoint. Existing backup behavior is unchanged.

## Test and evidence methodology

- Existing full Node suites, new source/hash/format/camera integration regressions, and both INDEX-02 and INDEX-04 inherited no-deploy workflows.
- Browser: actual `public/index.html`, IndexedDB, JPEG/PNG encoding/decoding, real browser WebCrypto, real file inputs, account-locked saved data, category correction, photo review, whole-outfit handoff and browser screenshots at 320, 390 and 430px on **Chromium and WebKit**. Browser media acquisition is simulated (controlled MediaStream and a real full-frame canvas), and worker classification/segmentation outputs are mocked; do not claim hardware camera or fresh model accuracy.
- Browser evidence must demonstrate permission denial/recovery, unsupported facing fallback, frame resolution, independent SHA confirmation, correct original sent into worker, low-confidence Review, import conversion honesty, manual saved correction, separately source-bound outfit photo, and logout invalidation.
- NO outbound network to third parties beyond pre-existing blocked font/trend GET attempts. No customer photographs. No production write/merge/deploy. CI artifacts contain only synthetic fixtures and test screenshots.

## Remaining HOLD

Physical Android Chrome / iPhone Safari camera permission, lens switching, HEIC/EXIF devices, hardware getUserMedia interruptions and performance remain unverified. Real worker inference, real garment segmentation quality, single-garment proof, Supabase RLS with production-like accounts, and 10/10 visual realism remain separate. Family Alpha #255 stays HOLD. Do not claim true original raw sensor bytes from a browser's MediaStream or that converted non-JPEG raw file bytes are saved.
