# M1538: Source-internal WebKit/JSC fault-PC capture (research-only)

**Not yet executed on a live failing model.** The WebKit binary produced by this patch is a different diagnostic build, NOT the shipped WebKit. Nothing in this package authorizes changing AWS, ptrace, sandbox, CI privileges, or Family Alpha HOLD #255.

## Exact pinned source and operation

- Original WebKit Git revision: db897909f7c31d9b38793374c66427b6a4cb3dd3; Playwright downstream patch blob: f713c6fa093a1f45956c84844d50635376923b75.
- Original immutable P94 Worker Git blob: ab7d3837139c5b7d693383f9d6617e199ec8de4f.
- SegFormer fp32 ONNX: 15,199,746 bytes, SHA256 02e6f1545475bc549184b6710487555b4b73eb08354cc3a480fb4fab1473a9d3.
- Original JSEP WASM: 21,596,019 bytes, SHA256 c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39.

The pinned WasmFaultSignalHandler.cpp already reads MachineContext::instructionPointer(context) and sigInfo.faultingAddress. It calls instance->setFaultPC(faultingInstruction) on a genuine signaling-memory access fault. The pinned WasmSlowPaths.cpp::slow_path_wasm_throw_exception reads instance->faultPC() in normal C++ execution, then clears it, before exception dispatch. Callee::range() provides the compiled machine-code range; Callee::index() provides the function-space index. None of this exposes a WASM opcode offset through the public JavaScript exception.

The included source-pinned-jsc-signal-faultpc.patch (three WebKit source files only) stores the faulting *virtual memory address* next to the existing captured PC during the access-fault handler; then, outside the handler, logs ONLY a function index, callee-relative machine-code offset, memory-base-relative address, live linear memory size and mapped capacity. No raw process PC, address, memory dump or original photo is logged. The unique marker is CC1538_SOURCE_PINNED_WASM_SIGNAL_V1. The added parser rejects duplicate/malformed records and always reports an unsigned diagnostic candidate rather than original trap proof.

## Same-BBQ-callee code-origin map lookup, conditional on genuine signal

The exact pinned WebKit source contains the **native JIT PC -> original Wasm function-relative instruction offset** pathway for BBQ: WasmFunctionParser.h::currentOpcodeStartingOffset(), WasmBBQJIT.cpp::willParseOpcode() appends that origin to m_pcToCodeOriginMapBuilder, and WasmBBQPlan.cpp registers the map with NativeCalleeRegistry. BBQ map creation requires JSC useSamplingProfiler=true, which is disabled by default and changes the diagnostic configuration. The separate second patch, **source-pinned-jsc-bbq-pc-origin.patch**, is applied ONLY AFTER the first source-pinned-jsc-signal-faultpc.patch. In the original slow-path after a genuinely signaled WASM fault, it acquires the registry lock and looks up the origin for the **same compiled BBQ callee and same saved native PC**. It emits optional CC1538_BBQ_SAME_CALLEE_WASM_OPCODE_ORIGIN_V1 containing the function-space index, callee-relative machine-code offset and function-relative WASM opcode origin. If no map, not a BBQ callee, not a genuine signal or no origin match, emit no second record.

The offline receipt parser requires exact function-index/machine-PC-offset equality across markers. Even matching markers are an **unverified diagnostic-build candidate only**: they are NOT original shipped engine evidence, an attested first-attempt original-model RED, a WASM file byte offset or a C++ source line. Require a separate approved host/build, fixed original P94 Worker/model/JSEP SHA, a real naturally failing first attempt, and independent code-origin / WASM instruction-boundary verification. Explicit BBQ software-thrown bounds branches can bypass the signal path; OMG JIT is not covered by this lookup. Do not change any native runner security or claim permanent repair.

## Authorized operator sequence

1. On a separately approved research host, run the existing read-only AWS/IAM/subnet and pinned source/model/binary preflights first. The host has NOT been provisioned through this conversation.
2. Preserve a NEW natural first-attempt original-model WebKit failure (original P94 Worker, original JSEP, original model, original unmodified WebKit) with complete SHA, renderer identity and failure logs. Do not retry until green or invent failed attempts.
3. In a SEPARATE operator-controlled checkout of exactly the pinned WebKit revision plus independently checked Playwright downstream patch, apply the first patch and then the second patch, with git apply --check on each, before building and compile a distinct symbol-enabled diagnostic WPE/JSC build. Verify its new source diff, executable/library SHA256 and build IDs and record its compiler options. The patch CI only verifies source applicability; it does not compile WebKit.
4. Run the SAME unchanged original P94 Worker/model/JSEP in the distinct diagnostic engine. Require an authentic first-attempt WebKit OrtCreateSession RED. If that diagnostic run never fails, write NOT REPRODUCED rather than claiming the historical crash was observed again.
5. Only if a matched original-model failure and exactly one fault marker occur, run: node research/main1054/assignment1538-ec2-host/jsc-signal-receipt.mjs parse PRIVATE_OPERATOR_LOG. This validates format only, never certifies a signature or exact WASM instruction.
6. Correlate the emitted callee-relative JIT code offset against exact same-code-build disassembly and compiler origin metadata. The pinned WasmFunctionParser.h::currentOpcodeStartingOffset, BBQJIT.cpp::willParseOpcode and m_pcToCodeOriginMapBuilder, and OMG WasmOpcodeOrigin.h supply the source basis. Separately reviewed JSC_dumpBBQDisassembly, JSC_dumpOMGDisassembly or JSC_useSamplingProfiler options may help provide metadata, but alter the configuration; record them and keep separate experimental cohorts.
7. Recover the matched original JSEP WASM function instruction offset using exact opcode boundaries (M293/M294); establish actual memory-access width. The native JIT offset, JSC call-site index, function-relative WASM bytecode offset, WASM file byte offset and ORT C++ source line are different coordinates. Compare effectiveLinearAddress + accessWidth to liveMemoryBytes, NOT mappedCapacityBytes. If in bounds, investigate stale cached bounds/JIT checks and preserve the contradiction.
8. Only then use existing independently approved source/binary/operator-attested assignment1538-correlate.mjs to evaluate a causally justified C++ correction and paired original-model RED-before/WEBKIT+CHROMIUM GREEN-after. No merger, deployment, private photos or release.

## Failure branches that must remain BLOCKED

- Explicit software-branch OOB (BBQ throwExceptionIf or OMG emitExceptionCheck) can throw RuntimeError without entering the POSIX fault signal handler. Then faultPC is absent, and this diagnostic emits NO marker. An additional separately approved per-branch code-origin recorder is needed. Do not substitute an exception helper PC for an opcode.
- A true signal may provide a native JIT instruction offset but not a trustworthy WASM opcode position until the matching compiled-code-origin map is independently verified.
- The actual memory fault address may differ from the WASM operation's logical address for multi-memory/relocation or access width; verify same instance, memory index and machine opcode rather than guessing.
- A diagnostic engine is not bit-identical to the original shipped engine. Baseline and diagnostic failure characteristics must be compared for perturbation.
- GitHub Actions only performs read-only pinned-source patch applicability and synthetic parser-negative tests. It cannot provide an actual original failure or a permanent repair.

Original intermittent M279 RED remains genuine with actual instruction unknown. Family Alpha #255 remains OPEN/HOLD.
