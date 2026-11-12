# Closet Current — Mission 1 P832: cancellation-safe original image decode for private phone trial

**FAMILY ALPHA HOLD #255. DRAFT, UNMERGED, UNDEPLOYED.** No production/staging/hosted Supabase/real owner account or personal photo was touched. No model or recognition threshold improvement is claimed.

## Actual defect in the last verified owner-only recognition package
On exact-green [P831 PR #880](https://github.com/nickhaney916-lang/Closet-Current/pull/880), HEAD `90ae1517658be393c41c62f7b57cdad87522344e`, the recognition-only UI did `Promise.race([photoToJPEG(row.file), 15s timer])`. The old shared decoder has no abort signal: a timeout or `Start over` can **reject or hide a result without stopping the image's unresolved `decode()`**, so delayed full-resolution canvas work can still resume. This is a real correctness/memory-risk identified through source audit, NOT evidence of actual photo leakage or a physical phone crash.

## Repair
- Introduce **preview-only** `public/phone-photo-prep-832.mjs`, preserving original `photoToJPEG`'s maximum 2048px dimension, JPEG quality 0.94, white background fill, and orientation/Canvas semantics. Use an AbortSignal and bounded image decode deadline to race `Image.decode`; always sever the image's `src`, revoke the original's own object URL, clear timeout and abort listener before exiting. No private filename or error message enters diagnostics. It rejects unrecognized canvas output rather than misrepresenting a PNG as JPEG.
- The preview UI creates one fresh `AbortController` per recognition attempt. `Start over`, `pagehide`, and completion abort the remaining in-flight original image decode. No stale result can append to a newly started report due to existing generation identity checks. The shared production app's `public/photo-import.js` remains unchanged.
- Remove the preview page's old global, non-cancellable `photo-import.js` script tag. The owner-only isolated package now contains the new helper **instead of** that older global encoder, still exactly 13 SHA-verified runtime assets + README/manifest; **no full Closet Current index/login/cloud, no customer images, no deployment**.
- Add 5 adversarial Node tests: successful JPEG path, actual cancellation during pending decode, deadline before late completion, pre-aborted/invalid file safe rejection, and non-JPEG output rejection. These explicitly prove late resolved decode cannot draw or encode after abort, with URL cleanup and no photos/user filenames in results.
- Extend genuine original FashionCLIP Chromium/WebKit phone-sized 320/390/430 preview runner to invoke the actual new helper in-browser with a deliberately stalled `HTMLImageElement.decode`, abort it and release the decode afterward; verify zero late `Canvas.toDataURL` encodes. The previous no-photo-network-upload, nonclothing/garment scoring, original-source SHA validation and report privacy checks continue unchanged.

## Scope, privacy, limitations
This repair **does not** make photo classification more accurate. Original garment examples remain the same previously exposed SHA-reviewed publisher fixtures. Actual physical Android Chrome/iPhone Safari memory, battery and interruption checks plus independent new phone photos remain unverified. The browser's synchronous JPEG encoding cannot be preempted once it is already running; the new cancellation prevents **a pending decode** from beginning that work after cancellation. The isolated archive remains an owner-review artifact, **not a hosted accessible URL**; do not send an owner/family invitation based on CI.

## Required acceptance before completion
Exact green P831 parent `90ae1517658be393c41c62f7b57cdad87522344e`, only 9 limited trial/research/test/workflow paths, unchanged production model/thresholds/Supabase, native build and **270/270 Node tests** expected, 2/2 bundle tests, and actual original-worker **Chromium + WebKit** runs of isolated owner artifact with no network uploads, no stale encode, no browser page errors. Never call verified until all 3/3 dedicated CI jobs succeed on final HEAD.

**Family Alpha HOLD #255 remains OPEN.**
