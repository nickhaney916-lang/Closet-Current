# Closet Current Mission 4 — original WebKit native-fault observation (HOLD)

**Outcome in current session:** collector and adversarial tests prepared. No live original-model native fault trace collected. Historical original M279 RED remains the only genuine documented bounds-failure process; its machine PC, WASM opcode offset, internal WASM effective access, access width and source C++ line are unknown.

## Scope

The `native-webkit-fault-trace.py` tool is an opt-in **native SIGSEGV observation** instrument for a separately approved Linux WebKit/JSC debugging VM. Its first phase verifies the exact host assets with the existing `assignment1538-native-host.mjs` checker, then reads a live same-owner `WPEWebProcess` executable, executable mappings, and renderer-to-browser process start ticks. It does not fabricate a trap from a static candidate, JS Inspector line/column, or a successful model session.

The second phase requires a separately approved operator, human terminal confirmation, private output directory and legitimate ptrace access. It performs a **single** bounded GDB attach to the already identified, same-owner renderer. It captures native `SIGSEGV` PC and kernel `siginfo.si_addr` into a private log, *if* one occurs. It does not modify kernel ptrace settings, sandbox policy, capabilities or container privileges and does not retry failed native attaches.

**Crucial limit:** The historical original WebKit ONNX `_OrtCreateSession` WASM-bounds `RuntimeError` might be a JavaScriptCore-generated WASM exception with **no POSIX SIGSEGV**. A GDB signal observation alone does **not** establish the original model failed, identify its WASM bytecode instruction, or provide the internal WASM effective address. The kernel signal address must not be mislabeled the WASM linear-memory access. For software traps, a *separately authorized, build-matched JSC exception-site instrumentation* that reports its genuine code origin and effective access is still required. This tool never generates a signed original-model trace receipt or a repair claim.

## Software-generated WASM exception observation (not a SIGSEGV)

An opt-in **`--mode exception`** is also provided because the pinned source
`db897909f7c31d9b38793374c66427b6a4cb3dd3` routes the JSC
`OutOfBoundsMemoryAccess` software check through
`WasmThunks.cpp::throwExceptionFromWasmThunkGenerator` (around line 47)
to `WasmOperations.cpp::operationWasmToJSException` (around line 1719).
This helper is a **shared exception dispatch point**, NOT an original WASM
trapping instruction and not a specific native memory fault.

After separately approved source-and-binary preflight and live renderer
identity checks, execute the same private operator-only trace procedure but
set `--mode exception` instead of `--mode capture`. The tool requests a
single GDB breakpoint at `JSC::operationWasmToJSException`, logs the helper
machine PC and a numeric exception type *only if actual symbol resolution*
succeeds, and detaches. It never assumes a `SIGSEGV` must occur. If debug
symbols are missing, type optimized out, GDB denied, or no helper event is
observed, the result is `NO_VERIFIED_JSC_SOFTWARE_EXCEPTION_HELPER`.

**Limitations:** This helper can run for unrelated WASM exceptions in the
same renderer. The helper PC is not the generated WASM code site, the numeric
exception type is not an observed effective memory address, and this mode
cannot recover the original opcode/width/live-memory receipt by itself.
The original first-attempt WebKit `_OrtCreateSession` RED, live module SHA,
original JIT call origin and live internal failing access must still be
observed and signed separately by an approved source/build-matched operator.
Do not submit helper-only output as an original trap receipt.

## Operator steps (authorized VM only)

1. Confirm independent written native-debug authorization and that the verified VM has source, patch, binary, and model/JSEP assets from the original pinned Playwright 1.56.1 WebKit 26.0 r2215 build. Verify local read-only assets through `node research/main1054/assignment1538-native-host.mjs --preflight /private/host-paths.json` (expect `PINNED_HOST_FILES_VERIFIED_ONLY`). No private wardrobe or family data.
2. Start the **genuine original** `scripts/test-parallel94-native-p88-browser.mjs` workload with `M58_ENGINE=webkit` and `P94_WIDTH=430` on the operator-owned VM, using an independently reviewed exact git source. Use existing M279/M283/M285/M287 original-model observers and maintain first-attempt logs. If renderer not yet live, do not attach and do not infer fault.
3. Identify the **new live** `WPEWebProcess` PID and parent browser PID from the approved test session. Record each `/proc/PID/stat` start-tick (field 22) to prevent PID reuse. Keep these operator-local. Start as the same non-root user who owns renderer. Do not use sudo/root or modify ptrace_scope.
4. Run the tool in **read-only inspect** mode first:

```sh
python3 research/main1054/assignment1538-ec2-host/native-webkit-fault-trace.py \
  --mode inspect --host-paths /private/host-paths.json \
  --renderer PID --browser BROWSER_PID \
  --renderer-ticks LIVE_RENDERER_START_TICKS \
  --browser-ticks LIVE_BROWSER_START_TICKS
```

5. Only if independent authorization covers native attach to this specific renderer, create a private directory (`mkdir -m 700 /private/cc1538-trace`) under the operator account, register the separate approval reference locally, and run the optional capture:

```sh
export CC1538_OPERATOR_NATIVE_TRACE_APPROVAL_ID=CC-M4-EXTERNALLY-APPROVED-TICKET
python3 research/main1054/assignment1538-ec2-host/native-webkit-fault-trace.py \
  --mode capture --host-paths /private/host-paths.json \
  --renderer PID --browser BROWSER_PID \
  --renderer-ticks LIVE_RENDERER_START_TICKS \
  --browser-ticks LIVE_BROWSER_START_TICKS \
  --output-dir /private/cc1538-trace
```

The operator must type the requested `TRACE PID` confirmation in a TTY. The approval ID is an **operator claim**, not independently verified by the tool. If GDB reports `Operation not permitted`, ptrace security restrictions, missing symbols, or the process exits, **stop**; do not change privileges/security settings. The raw GDB log stays in private operator custody (`0600` file inside a `0700` dir). Do not upload transcripts, addresses, model bytes, private data, secrets or memory dumps to GitHub.

6. On genuine first-attempt original-model RED, independently correlate its browser test log and exact renderer/JSEP/model receipts to any native event. A signal trace with native PC and `siginfo` is only one piece. When actual JSC/WASM opcode position and internal effective access/width/live memory are observed at the **same failing event**, use the existing `research/main1054/assignment1538-correlate.mjs` with separately approved signed operator receipt, original binary, build-matched debug symbols and original C++ source. Record an instruction/source claim only if that verifier succeeds. Never mark the original repair complete without controlled, repeated RED-before/GREEN-after WebKit plus Chromium tests.

## Immutable verification pins

- Playwright `1.56.1`, WebKit `26.0` revision `2215`, source git `db897909f7c31d9b38793374c66427b6a4cb3dd3`, Playwright `bootstrap.diff` Git blob `f713c6fa093a1f45956c84844d50635376923b75`.
- Original SegFormer fp32 ONNX: 15,199,746 bytes, SHA256 `02e6f1545475bc549184b6710487555b4b73eb08354cc3a480fb4fab1473a9d3`.
- Original JSEP WASM: 21,596,019 bytes, SHA256 `c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39`.
- Original Worker Git blob: `ab7d3837139c5b7d693383f9d6617e199ec8de4f`.
- Historical genuine original model WebKit RED GitHub Actions run `44640727828`, job `135971719127`, wasm function stack `[4846,1384,11276,7427]`, **all instruction offsets NULL**. Static original JSEP function #4846 byte range `[7022489,7165245)` is not an observed instruction.

**Result status:** `HOST_NATIVE_FAULT_COLLECTOR_READY_ONLY`; `newGenuineOriginalModelRedObserved=false`; `originalTrapPc=null`; `originalInternalWasmEffectiveAccess=null`; `causalFixProven=false`; `familyAlpha=HOLD-255`.
