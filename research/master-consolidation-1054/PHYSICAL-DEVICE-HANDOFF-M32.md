# Closet Current M32 — physical-device research handoff

**Family Alpha #255 stays OPEN/HOLD. No merge or deployment. Never use private owner photographs or authenticated wardrobes in this test.**

## Purpose and limits

The M32 test host serves the original M4 owner Photo Results Adjust UI and a pinned CPU-only ONNX worker over operator-controlled HTTPS. Only four legally usable, SHA-verified public development photographs are available. A real authorized phone may use this package; **CI cannot simulate the phone's true memory, thermal performance, crashes or hardware identity**.

Earlier M26/WebKit16 and M29/Android-emulated Chromium16 established desktop genuine-model endurance. M31 established the same 47-label scores/rankings and owner choices across four original JSEP-versus-CPU-WASM photos. The iPhone and Android release gates remain unverified.

## Operator setup

Use a dedicated development computer, a trusted LAN, and a **trusted local HTTPS certificate for that host**. Do not bypass TLS warnings or publish the certificate private key. Checkout this exact research branch, install the pinned dependencies and source assets:

~~~sh
npm install --no-save --no-package-lock --no-audit --no-fund @huggingface/transformers@3.8.1 onnxruntime-web@1.22.0-dev.20250409-89f8206ba4 playwright@1.56.1 sharp@0.34.3
node scripts/download-reviewed-photos.mjs benchmark/locked-photo-sources.json benchmark/photos commons-0035,commons-0062,commons-0078,commons-0059
node scripts/p82-prepare-models.mjs --check
~~~

Set these environment variables privately: M32_TLS_CERT (certificate path), M32_TLS_KEY (private-key path), M32_ACCESS_TOKEN (a securely generated 32–128-character secret using letters, digits, underscore or hyphen), M32_BIND (the development computer's explicit LAN IPv4), M32_ALLOW_LAN=1, optionally M32_PORT (default 8443). Then:

~~~sh
node scripts/serve-physical-device-m32.mjs
~~~

On the authorized phone, enter the HTTPS LAN URL with a private access query parameter. For example, substitute your IP and token into:

~~~text
https://YOUR_LAN_IPV4:8443/?access=YOUR_PRIVATE_TOKEN
~~~

The server redirects immediately to remove the query from the browser URL, issues a Secure HttpOnly SameSite=Strict cookie, checks source and CPU binary digests before startup, rejects all HTTP methods except GET, restricts every asset to the original public development files and pinned model runtime, and implements **no photo-upload, wardrobe-save or hosted Supabase endpoint**.

## Actual-device operator sequence

1. On each independently authorized physical device, open a new browser session on trusted HTTPS. Run 16 photos in the original synthetic-owner native review panel: 4 different public licensed originals repeated 4 times. Never treat 16 iterations as 16 independently labeled garments.
2. Run the ONNX-invoked cancel test and session-lock test, independently observing the worker stage and the absence of auto-save, draft changes, or late suggestions. Cancellation after the ONNX call does not prove CPU kernel residency at the exact button press.
3. Export the **local research receipt**. It contains public JPEG source IDs and SHA hashes, model times, coarse browser descriptors, owner safeguards and no-save status. It excludes raw photos, model vectors, owner identities and credentials. Keep separate device recordings, instrumentation, and any private evidence off GitHub.
4. Use the existing optional physical-device recorder in public/device-acceptance-78.js by adding the query deviceLab78=1 on the authorized local page. Its private report is self-attested and requires independent verification; never post it publicly. It records device, case and SHA evidence without retaining photo bytes.

## Validation and release boundary

An authorized independent reviewer may check a locally exported receipt:

~~~sh
node research/master-consolidation-1054/physical-device-evidence-gate-m32.mjs /secure/local-receipt.json EXACT_TESTED_40_CHARACTER_COMMIT
~~~

The gate rejects mismatched originals, missing consent, altered owner drafts, false completed inference after cancel, duplicate tests, secret fields, false hardware-process RSS, and fake release claims. A complete 16-photo + cancel + lock receipt can only be classified as **LOCAL_16_PLUS_CANCEL_LOCK_RECEIPT_REQUIRES_EXTERNAL_HARDWARE_REVIEW**. No automated validator can prove that a submitted mobile user-agent came from an actual phone.

Outside verification must confirm physical phone/OS/browser, actual on-device memory and thermal behavior, crash/cancellation outcomes, exact running SHA, real user actions, and independent human-labeled clothing correctness. The separately unfinished realistic photographed garment-to-3D and hosted four-account privacy/recovery releases are not affected.

## No-deploy CI

The dedicated workflow tests a temporary self-signed HTTPS origin with desktop Playwright Chromium and WebKit and real pinned FashionCLIP/FashionSigLIP CPU-WASM models. It checks local authentication/write denial, source digest, owner review, and cancellation, but **cannot establish a real device result**. Do not merge, deploy, or lift Family Alpha #255 based solely on this package.
