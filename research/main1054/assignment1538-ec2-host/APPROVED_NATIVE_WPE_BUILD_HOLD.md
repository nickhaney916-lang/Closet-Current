# M1538 — separately approved native WPE WebKit research build (HOLD)

**Prepared; not approved or built.** This package enables an authorized operator to create a SEPARATE diagnostic WebKit build on an ALREADY APPROVED, privately managed WPE-capable Linux research host. It neither provisions billable AWS resources nor changes debugger/sandbox permissions. Family Alpha #255 stays HOLD.

## Frozen inputs

- Original WebKit source commit: db897909f7c31d9b38793374c66427b6a4cb3dd3
- Microsoft Playwright 1.56.1 downstream patch Git blob: f713c6fa093a1f45956c84844d50635376923b75 (obtain from the GitHub Git blob API)
- Three research patches, applied in sequence AFTER the Playwright patch:
  1. source-pinned-jsc-signal-faultpc.patch
  2. source-pinned-jsc-bbq-pc-origin.patch
  3. source-pinned-jsc-bbq-explicit-bounds-site.patch
- Exact patch blob pins, build command and approval scope are hard-coded into operator-build-research-webkit.py.
- Build: Tools/Scripts/build-webkit --wpe --debug, following the official WebKit WPE development-build instructions (https://docs.webkit.org/Build%20&%20Debug/BuildOptions.html). WebKit recommends webkit-container-sdk for WPE dependencies. The SDK/build-image digest and the compiler are NOT yet pinned; the independent operator must review and freeze them before running the build.

The earlier prepared research VM has a 100-GB disk and m7i.xlarge memory allocation; a full WebKit Debug build may need significantly more storage and memory. The operator must approve actual available capacity, billing and dependencies separately. This package does NOT modify the existing infrastructure template or launch that VM.

## Stage A: approved workstation, source and read-only preparation

Use a source checkout of the existing DRAFT PR #1540 at a frozen commit. In a different directory, independently obtain the WebKit source checkout:

    git clone --filter=blob:none https://github.com/WebKit/WebKit.git /approved/source/WebKit
    git -C /approved/source/WebKit fetch --no-tags origin db897909f7c31d9b38793374c66427b6a4cb3dd3
    git -C /approved/source/WebKit checkout --detach db897909f7c31d9b38793374c66427b6a4cb3dd3

Use the research script to fetch and verify the 980-KB Playwright patch (no ONNX model or wardrobe photos):

    python3 research/main1054/assignment1538-ec2-host/operator-build-research-webkit.py \
      fetch-playwright-patch --destination /approved/inputs/playwright-1.56.1-webkit.patch

Perform READ-ONLY source/build preflight:

    python3 research/main1054/assignment1538-ec2-host/operator-build-research-webkit.py preflight \
      --repo /approved/source/Closet-Current \
      --webkit-source /approved/source/WebKit \
      --playwright-patch /approved/inputs/playwright-1.56.1-webkit.patch \
      --workspace /approved/output/WebKit-M1538-Debug

Expected: PINNED_NATIVE_RESEARCH_BUILD_PREFLIGHT_ONLY. It creates no worktree, no cloud resource, no native build, and no debugger.

## Stage B: separate human approval and signed scope (REQUIRED)

An independently authorized administrator must review the actual source identity, exact current PR #1540 Git commit, all three patch blobs, SDK/toolchain, destination, host permissions, expected expenses and build-command scope. They must approve an existing research-only, already authorized host. The administrator supplies an independently trusted Ed25519 public key and fingerprint OUTSIDE this GitHub repo. Do not create your own new key and call that external approval.

The separately reviewed private JSON approval document must contain these exact fields and values (replace indicated placeholders):

    {
      "schema": "CC1538_WEBKIT_BUILD_APPROVAL_V1",
      "purpose": "separate-diagnostic-webkit-build-only-no-debugger-or-deployment",
      "ticket": "CC-M4-REPLACE-WITH-VALID-APPROVAL-TICKET",
      "webkitRevision": "db897909f7c31d9b38793374c66427b6a4cb3dd3",
      "playwrightGitBlob": "f713c6fa093a1f45956c84844d50635376923b75",
      "researchGitHead": "REPLACE_WITH_FROZEN_40_HEX_PR_COMMIT",
      "patchGitBlobs": [
        "631bff7691d05fe0eeaca76a948236b9e6aa56b2",
        "47e34bb943d9745c6b29c5323dbad9f355fcf45f",
        "50744793ab309587e6f67cdfff4cc5d37327f44b"
      ],
      "workspace": "/approved/output/WebKit-M1538-Debug",
      "command": ["Tools/Scripts/build-webkit", "--wpe", "--debug"],
      "billingScope": "previously-approved-existing-host-only",
      "expiresUtc": "REPLACE_WITH_FUTURE_UTC_TIMESTAMP"
    }

The trusted approver signs the exact JSON bytes using their existing separately authorized Ed25519 key on their own machine, for example:

    openssl pkeyutl -sign -rawin -inkey /private/approved-approver.key \
      -in /private/approved-build.json -out /private/approved-build.sig

The operator independently verifies the trusted public-key fingerprint:

    openssl pkey -pubin -in /approved/approver-public.pem -outform DER | sha256sum

A technically correct signature does NOT by itself establish that the signer is organizationally authorized. The trust anchor and billing consent must be reviewed outside this program.

## Stage C: explicit operator-controlled build

Under an authorized NON-ROOT account with the approved WPE build dependencies and SDK installed, run:

    python3 research/main1054/assignment1538-ec2-host/operator-build-research-webkit.py build \
      --repo /approved/source/Closet-Current \
      --webkit-source /approved/source/WebKit \
      --playwright-patch /approved/inputs/playwright-1.56.1-webkit.patch \
      --workspace /approved/output/WebKit-M1538-Debug \
      --approval /private/approved-build.json \
      --signature /private/approved-build.sig \
      --public-key /approved/approver-public.pem \
      --trusted-spki-sha256 YOUR_EXTERNALLY_REVIEWED_64_HEX_FINGERPRINT

The operator must type the exact ticket-specific confirmation in an interactive terminal. The script checks the trusted key, signature, expiry, pinned source, patch Git blobs, clean Git trees, approved research commit, output path, purpose, billing scope and exact command.

Only after passing these gates does it create a detached source worktree, apply the original Playwright patch plus three research patches, and run WebKit's WPE debug build. It logs privately to cc1538-build.private.log; build errors fail closed. Successful builds produce a private cc1538-research-build-manifest.private.json with actual output ELF SHA-256 and Build IDs. Success is labelled DIAGNOSTIC_ENGINE_BUILT_ONLY_ORIGINAL_FAILURE_NOT_OBSERVED.

No IAM, AWS, ptrace, seccomp, kernel, runner security, model, original photo, production, merge or release action is performed.

## Stage D: distinct original-model test requires separate authorization

Building diagnostic WebKit is NOT a genuine first-attempt original-model ONNX RED. The unchanged original WebKit binary, original fp32 ONNX model, original P94 Worker and original JSEP WASM still need a separately approved, comparable test and genuine first-attempt reproduction. If the separate instrumented build fails to reproduce the crash, report NOT OBSERVED. A diagnostic opcode candidate is not automatically an original binary machine PC or verified effective memory access/width. Native root cause #1570 and Family Alpha HOLD #255 remain unchanged.

**As created:** package and gate only; no signed external approval, no native WebKit build, no native debugger, no cloud charges, no trap capture and no permanent ONNX fix.
