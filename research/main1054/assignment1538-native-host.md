# M1538 exact-source native observation host (research only, HOLD)

## What this package does

This is the **missing offline preflight** for an independently authorized, operator-owned native WebKit/JSC tracing host. `assignment1538-native-host.mjs` checks actual source, downstream patch, Playwright package, WPE renderer and original WPE/JSC ELF identities, exact original ONNX/JSEP bytes, and original P94 Worker Git blob **before** a native observer is permitted to examine a new run. The preflight does not start the browser, attach a debugger, change permissions, create receipts, or report a trap. Its sole success state is `PINNED_HOST_FILES_VERIFIED_ONLY` with all capture/repair fields explicitly false/null.

**Known access boundary:** M284 original pinned WebKit WPE process was correctly found, but GDB attach returned `ATTACH_UNVERIFIED` with `ptraceRestrictionMentioned:true`. Do not retry that denied route on the same hosted runner or modify ptrace/seccomp/capabilities/sandbox/container privileges. Explicit permission to edit this research tooling is *not* permission for a native debugging operation. An operator must supply a separately approved native trace facility on a host they control.

## Exact provenance, not a modern WebKit substitute

| Asset | Frozen identity |
| --- | --- |
| Playwright / WebKit runtime | Playwright 1.56.1, WebKit 26.0 / r2215 |
| WebKit upstream source | `db897909f7c31d9b38793374c66427b6a4cb3dd3` |
| Original Playwright downstream `bootstrap.diff` Git blob | `f713c6fa093a1f45956c84844d50635376923b75` |
| Original P94 Worker Git blob | `ab7d3837139c5b7d693383f9d6617e199ec8de4f` |
| WPE renderer SHA-256 | `b46f88603e43eca28083389188944f7f47fd26311c8697a14f910e4f8bfa0d66` |
| `libWPEWebKit-2.0` SHA-256 / Build ID | `daa10258a2161710c7c1d6a3e3f7abe0a100a6f269c00f5843dcd0f7df46ec29` / `8faf9134c0557d2d09f3d680f9c8b780498cf59b` |
| `libjavascriptcoregtk-6.0` SHA-256 / Build ID | `73f32b17f002381abadb8cec18cdec85fb17ace1077f993f448e3024b3014f8b` / `e04d2e784f16edeb1612cc24cd180e328c4b3e56` |
| Original fp32 ONNX SHA-256 / size | `02e6f1545475bc549184b6710487555b4b73eb08354cc3a480fb4fab1473a9d3` / 15,199,746 bytes |
| Original JSEP WASM SHA-256 / size | `c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39` / 21,596,019 bytes |

A newly rebuilt, symbol-enabled or instrumented JSC is **not byte-identical to shipped WebKit**. Record its new build and symbol/debug artifact provenance separately and compare it with untouched pinned-engine controls. An upstream-only source checkout without the pinned Playwright patch does not establish binary-equivalent provenance.

## Operator provisioning and preflight

On an **already-approved Linux native debugging host**, provision original Playwright 1.56.1 browser files, Git checkouts for the frozen WebKit and this research branch, and a separately reviewed copy of the exact downstream Playwright patch. Use the repository's existing pinned/original M287 test assets. Do not download arbitrary 'latest' engine/model binaries. Verify browser executable from Playwright's actual installation and map the native files from the live WPE process before observing it. `git`, `node` 22+, and `readelf` are required; the script itself neither installs packages nor grants privileges.

Prepare a **local-only, untracked** `native-host-paths.json` with all nine absolute paths (no wildcards, symlinked files or secret data):

```json
{
  "webkitSourceDir": "/absolute/path/to/frozen/WebKit/source",
  "playwrightPatchFile": "/absolute/path/to/approved/bootstrap.diff",
  "appRepoDir": "/absolute/path/to/Closet-Current",
  "playwrightPackageJson": "/absolute/path/to/node_modules/playwright/package.json",
  "rendererElf": "/absolute/path/to/installed/WPEWebProcess",
  "webkitElf": "/absolute/path/to/installed/libWPEWebKit-2.0.so.1.7.0",
  "jscElf": "/absolute/path/to/installed/libjavascriptcoregtk-6.0.so.1.7.0",
  "originalModelOnnx": "/absolute/path/to/verified/original/onnx/model.onnx",
  "originalJsepWasm": "/absolute/path/to/verified/ort-wasm-simd-threaded.jsep.wasm"
}
```

Run from the repo root: `node research/main1054/assignment1538-native-host.mjs --preflight /absolute/path/to/native-host-paths.json`.

If the pin checks pass, the script prints `PINNED_HOST_FILES_VERIFIED_ONLY` and **never** prints native-capture success. A mismatch, missing file, missing Build ID or unavailable original assets prints only `BLOCKED: <category>` and exits nonzero. No raw binary, original weight bytes, paths, operator keys or native stack dumps go into CI. Do not commit the local path manifest.

## Authorized actual-capture boundary (not executed by this package)

1. Independent operator formally approves native observation **before execution**. If attached debug was denied, use a separately approved host or source-instrumented engine with its own verified build; do not alter or circumvent the denied runner's security. Require same-run `WPEWebProcess` executable inode/host map, process birth ticks, actual original model and JSEP identity, and a new naturally failing **first attempt**. A healthy original-model run does not count.
2. Use only the untouched original M287 P94 original-model workload and public licensed fixtures. Trigger new fresh browser sessions, preserve every original first-attempt RED or GREEN, never retry away a failure. For an instrumented engine, label the rebuilt binary explicitly and record control-vs-observer perturbation. No private family photos/accounts.
3. At the **same naturally failing** `_OrtCreateSession` event, approved observer must attest `functionIndex`, actual JIT code-origin → WASM module instruction/file offset, instruction opcode/type, measured post-offset `effectiveAddress`, `accessBytes`, and `liveMemoryBytes` at the trap. The failing memory range satisfies `effectiveAddress + accessBytes > liveMemoryBytes`; record the precise failing source/destination for bulk operations. On a truly in-bounds access the bounds error needs a different causal explanation; do not fabricate an invalid range. The ONNX model input pointer is *not* the failing internal memory access.
4. Correlate the actual instruction with the independently pinned original JSEP binary; if JIT-generated native code is observed, a JIT address is **not** an ELF offset. Source mapping to original ORT C++ requires exact build metadata/debug source mapping, not merely JSC's generic bounds check site. Preserve ambiguous observations as `UNKNOWN`.
5. Sign receipt with an independently approved operator key, supply the trusted SPKI fingerprint out-of-band, and use the existing `assignment1538-correlate.mjs --operator-approved-offline` with original binary, debug mapping and source. The verifier is necessary but self-attestation is never sufficient. Keep raw debugger logs/addresses in authorized operator storage. Publish only separately approved sanitized scalar evidence.
6. Only once a verified genuine original RED and causal C++ operation are established, propose a narrow source correction. Prove a new same-condition original WebKit RED-before/GREEN-after differential and independent Chromium regressions. Rebuilt instrumented-engine green is not proof of shipped-engine repair.

**Truth gate:** `nativeTrapPc:null`, `wasmFileOffset:null`, `invalidEffectiveMemoryAccess:null`, `causalFixProven:false`, `releaseAllowed:false` until authorized independently verified source-attested original RED exists. **Family Alpha #255 stays HOLD; no merge, deploy or security change.**

## Reproducible pinned base image (operator convenience, not native authorization)

`assignment1538-operator-container.Dockerfile` pins the **exact original M287 Playwright image digest** and adds read-only provenance utilities. The operator may build this on their **approved** infrastructure; it is not an approved native trace by itself. Do not add capabilities, weaken seccomp or copy original private data into the image. A packaged Playwright browser does not contain the frozen WebKit C++ Git checkout, downstream patch evidence, full original ONNX weights, or JSC debug symbols by default. Those must be supplied from original independently verified sources.
