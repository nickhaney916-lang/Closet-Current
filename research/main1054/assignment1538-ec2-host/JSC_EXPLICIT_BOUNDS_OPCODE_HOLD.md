# M1538: Explicit BBQ JIT bounds-branch opcode site (research-only; HOLD)

**Scope:** a third, opt-in WebKit source patch for a **separately authorized,
source-matched diagnostic engine**. This does not run a native debugger, change
the original model or P94 worker, provision AWS, or repair the original crash.
No WebKit diagnostic build has yet been compiled or run with this patch.

## Why another branch observer is necessary

The exact WebKit commit `db897909f7c31d9b38793374c66427b6a4cb3dd3`
contains both `MemoryMode::Signaling` and explicit
`MemoryMode::BoundsChecking` behavior in `WasmBBQJIT.h`.
In the explicit case, `throwExceptionIf(OutOfBoundsMemoryAccess, Jump)`
appends many call sites to the **same exception JumpList**. Later
`WasmBBQJIT.cpp::endTopLevel()` links that JumpList to one
`emitThrowException`, which calls the shared exception thunk and ultimately
`WasmOperations.cpp::operationWasmToJSException`. That path may throw with
**no SIGSEGV**, and the shared C++ helper PC is not the originating WASM
instruction.

The pinned `WasmFunctionParser.h` already tracks
`currentOpcodeStartingOffset()` while compiling each instruction.
This optional third patch stores the **function-relative opcode offset of
each explicit bounds check** in a branch-specific cold stub. The marker is
written to the JSC instance **only after that JIT branch is actually taken**,
immediately before normal exception dispatch. The C++ operation then clears
and prints the recorded opcode offset, the compiled callee's function-space
index, the JSC live memory size and the instance's cached bounds value.
No raw memory addresses, process PC, photo bytes or model bytes are logged.

The separate `jsc-explicit-receipt.mjs` parser validates a unique
`CC1538_BBQ_EXPLICIT_BOUNDS_SITE_V1` line, including canonical integer
encoding; intentionally flags `cachedBoundsBelowLiveMemory` without
silently rejecting this potentially important inconsistency. Every receipt
retains `exactShippedWebKitBinaryUsed:false`,
`originalFirstAttemptFailureMatched:false` and
`causalRepairProven:false`, even if the marker looks plausible.

## Only on separately approved native research host

1. Freeze and hash original unmodified WebKit/JSC, Playwright downstream
   patch, original unchanged P94 Worker, JSEP WASM and original ONNX
   model. Preserve genuine first-attempt unmodified-engine RED as evidence.
2. In a **distinct** approved diagnostic WebKit tree, apply the existing
   `source-pinned-jsc-signal-faultpc.patch`, then
   `source-pinned-jsc-bbq-pc-origin.patch`, then this
   `source-pinned-jsc-bbq-explicit-bounds-site.patch`; run
   `git apply --check` before each. The GitHub Action verifies exact
   source patch applicability; it does not build or launch WebKit.
3. Build the diagnostic engine with the approved build toolchain,
   independently record source commit/patch SHA, compiler flags, binaries
   and Build IDs, and execute the **unchanged** original model, worker,
   source JPEG and genuine first-attempt inference journey.
4. Collect private operator-only diagnostic logs and parse with
   `node jsc-explicit-receipt.mjs parse PRIVATE_LOG`. A valid marker
   indicates a *taken explicit JIT bounds branch* in that diagnostic
   engine, not an original shipped-engine crash.
5. Require a separately verified exact source bytecode boundary and the
   matching original JSEP module SHA before mapping a candidate
   function-relative opcode offset to the WASM file byte offset.
   Recover the actual effective address **and access width** separately;
   neither is available through this patch. Compare
   `address + width` with **live** linear memory, not mapped capacity.
6. Only after an observed genuine original-model RED and independently
   attested matching cause, test one specific correction with
   original RED-before and controlled WebKit+Chromium GREEN-after.
   Nothing in these offline patches is a proof of a fix.

## Boundaries and fail-closed limitations

- Only **BBQ JIT explicit `throwExceptionIf`** runtime bounds branches
  with a current parser are tagged. Unconditional compile-time atomic
  throws, OMG, signaling-memory faults and Wasm interpreter paths are
  outside this patch; they need separate authorized evidence.
- The patch changes the JIT cold-branch layout, JSC instance memory
  layout and diagnostic executable. A successful diagnostic run does
  **not** prove the identical failure instruction in the unmodified
  Playwright WebKit binary; evaluate behavior perturbation separately.
- An observed opcode marker has no dynamic pointer, access width, native
  machine PC, original worker SHA, independent signature or C++ cause
  by itself. An instrumentation branch that never executes must report
  **NOT OBSERVED**, not a guessed opcode.
- If compilation fails or the source patch cannot apply, leave the
  genuine existing failure unchanged; do not weaken CI, debugger, kernel,
  runner, AWS or security restrictions to make it work.
- Preserve original M279 RED, root owner #1570 and #1538 research ownership,
  draft PR only, no production deployment/merge, and Family Alpha HOLD #255.
