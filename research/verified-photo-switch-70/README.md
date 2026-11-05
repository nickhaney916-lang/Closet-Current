# Closet Current — VERIFIED-PHOTO-SWITCH-70

**Research only. Family Alpha #255 HOLD. Never merge/deploy/modify production or existing staging.** Exact verified starting parent: SWITCH68 `143ff1294cabd531b8eb6ad23b5a2c9f62b3dc9a`, [no-deploy GitHub Actions #42080960490 SUCCESS](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/42080960490), 724/724 Node, 12/12 native browser, 72 verified screenshots. Parallel Work #39 independently owns mobile hardware camera lifecycle, EXIF, and iPhone/Android permission/format compatibility; SOURCE70 only protects the **source replacement commit boundary** inside the existing app.

## Verified real source-level defect

SWITCH68 correctly prompts before destroying human-reviewed unsaved garment crops when the user deliberately selects a second photograph. However `startFile(file)` still called `revoke()` **after approval but BEFORE even checking file size, genuine original JPEG SHA, or image decodability**. Therefore selecting a bad/oversized/mislabeled/undecodable replacement and approving the switch immediately erased the prior source JPEG, all crop images, category/subtype/color selections and explicit human review checkmarks, despite no usable replacement photograph existing. A second pending import/proof could also race with a newer selection, requiring independent source-attempt identity beyond the earlier render-version epoch.

## Exact minimal fix

- Apply bounded input-size/shape validation **before** any review replacement, without prompting or touching the old owner/source.
- Stage the genuine original bytes and source SHA via the pre-existing `makeProof(file,owner)` function, independently **decode the canonical JPEG**, and prebuild any bounded inference preview, all **before** `revoke()`. The original and manual work stay on screen during staged verification; no camera-gallery write, automatic saving, cloud request or model result is involved.
- Protect the asynchronous source proof/decode using **both** a new monotonically increasing `selectionEpoch70` and existing `renderVersion`, exact authenticated owner and private database identity. Selecting another file, logging out, locking the session, canceling or navigating away invalidates older pending work; stale file errors or good results may not overwrite a newer selection. The existing mandatory auth lock/pagehide `revoke()` still instantly scrubs private source previews.
- Once the new source is fully validated, preserve SWITCH68's same-owner confirmation only when actual human review exists. Cancel retains every previous uncommitted crop/category/type/color/confirmation. Accept revokes the old review **only at this final verified stage**, then uses the new proof/JPEG to create a blank review. Already committed private closet records remain unchanged.
- A source decoder, MIME/bytes mismatch, damaged JPEG or premature input validation failure displays a clear message and retains the prior JPEG and review state. Nothing is accidentally saved. It is safe for signed-in users to retry with a valid photo.
- Preserve all prior 12-auto/24-total detector bounds, human crop review/category/subtype/color acceptance gates, source-aware near-duplicate rejection, two-account privacy, owner atomic save, correct garment names, Style My New Clothes and V4 backup/restore.

## Genuine browser acceptance

Chromium and WebKit at 320, 390, 430 px. For six actual mobile-width browser cases, use:

1. Real original verified licensed 800×750 CC BY-SA 2.0 shirt/pants/shoes JPEG SHA `e3df4503a89c244b28fa344ec170d6554fc06ad1d7cd331014fcb277df19d5ff`.
2. A separately licensed genuine original JPEG `benchmark/fixtures/commons-0046.jpg` SHA `7f94b8bc8edc340200f0353968f54868dc72e3180bc191530e19f2a82ce91ead`, for valid replacement.
3. One **synthetically corrupt** 300-byte data blob falsely labeled JPEG and one **synthetically undecodable** JPEG-envelope blob with SOI/EOI but invalid image contents. These are deliberately invalid source-input QA fixtures, **not** sources for clothing detection or recognition.

Steps: privately authenticate fixture owner A; import genuine original and physically adjust/confirm three separate JPEG crop editor regions; try each bad source; verify **zero discard prompts**, old original bytes/SHA, all three crop photos/category/type/color/confirmed checkmarks and empty DB are identical, and Save remains enabled. Then try valid alternate original, decline explicit switch and verify unchanged review; save three originals owner-private, Style and Outfit; reject reimported exact duplicate; accept valid switch and verify new source SHA, no old unsaved crop carried forward, and all committed owner A rows intact. Complete V4 export/restore and owner B isolation. Capture 84 actual mobile screenshots (60 inherited + 12 valid switch + 12 bad-source states), SHA/dimension/nonblank audit them, rerun six old native photo/private workflows and full inherited Node tests plus 16 new adversarial preflight/epoch/session tests.

**Acceptance boundary:** invalid source fixtures and scripted UI interactions demonstrate engineering safety, not true camera permission/device acceptance, learned detection accuracy, independently judged category/color labels or 3D clothing fidelity. Those remain Parallel #36/#37/#38/#39 responsibilities. Physical iPhone/Android tests are not claimed. Family Alpha Issue #255 remains HOLD; production/staging remain untouched.
