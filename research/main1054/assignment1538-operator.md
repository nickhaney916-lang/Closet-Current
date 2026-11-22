# Assignment #1538 operator handoff

Capture status is **BLOCKED** until an operator confirms access to a source-matched,
already-permitted WPE/JSC trap observation facility on a host running the original
Playwright 1.56.1 / WebKit 26.0 revision 2215 build. An approved engine trace that
records the WASM module offset on the original build is sufficient for the WASM
path. A debugger-confirmed file-backed machine PC can localize WebKit native
code. Anonymous or JIT-generated code requires independently validated engine
metadata that yields a module byte offset. Hosted attach was denied and the M289
Inspector attempt asserted. Stop on denial and record its exact text in the
restricted run log. Leave host, runner and sandbox security settings intact.

## Before running

1. Select a local-only authorized test host and the M287 original-model workload
   at a reviewed exact source commit. Record the test SHA and independently
   verify the original 15,199,746-byte fp32 ONNX model SHA-256
   `02e6f1545475bc549184b6710487555b4b73eb08354cc3a480fb4fab1473a9d3`
   (Xenova/segformer_b0_clothes revision `a2489ea8e7ec1ee912190546bad31a4906ccca76`).
   The independently prepared manifest AND signed actual-trap receipt must
   match this exact byte count and digest. A plausible different SHA is rejected. Record the original JSEP SHA
   and verify the executable WebKit release, upstream source revision and
   Playwright patch against the pins in the verifier and M286/M290/M291.
2. Confirm that the approved observation facility can report an actual
   exception location and identify the exact worker/renderer that executed
   the original module. Prepare a unique run identifier with 32 random bytes
   encoded as hex and a run-specific hashed boot identifier. Record the root
   browser PID, kernel process start ticks and start time. Inspect only the
   browser process tree created for this run. Include PID, parent PID and
   start ticks for each process in the renderer-to-browser chain.
3. Confirm access to the build-matched binary and associated debug line table.
   Verify source and debug artifact provenance from the exact build recipe.
   For native ELF, confirm the mapped backing file and executable load segment
   from the live process map and original ELF headers. The verifier admits
   exact pinned `libWPEWebKit-2.0.so.1.7.0` (SHA-256
   `daa10258a2161710c7c1d6a3e3f7abe0a100a6f269c00f5843dcd0f7df46ec29`,
   Build ID `8faf9134c0557d2d09f3d680f9c8b780498cf59b`) **or**
   exact pinned `libjavascriptcoregtk-6.0.so.1.7.0` (SHA-256
   `73f32b17f002381abadb8cec18cdec85fb17ace1077f993f448e3024b3014f8b`,
   Build ID `e04d2e784f16edeb1612cc24cd180e328c4b3e56`),
   only for an actual file-backed PC in that precise mapped ELF.
   A generated WASM/JSC JIT address is **not file-backed in either library**;
   independently validated engine native-code origin mapping is mandatory. Match the mapping to
   the expected device/inode before hashing and reading the Build ID. Use
   M290/M291 for reference identities. A healthy run supplies reference
   identity only.

## Mandatory at-trap effective-access witness

The original M279 model pointer and full input buffer were **in bounds**.
This does not prove the internal WASM memory access was in bounds. For the
native receipt to pass `validateReceipt`, the independently authorized
observer must now supply `trapMemoryAccess` measured at the **same natural
first-attempt fault event**:

- `origin: "authorized-trap-event"`, `kind: "original-wasm-linear-memory"`,
  `memoryIndex: 0`; `operation` is one of `load`, `store`, `atomic`,
  `simd`, `bulk-source`, or `bulk-destination`.
- `effectiveAddress`, `accessBytes`, and `liveMemoryBytes` are canonical
  unsigned base-10 integer **strings**. The effective address must be the
  actual native/JIT-observed post-offset address, not the original ONNX input
  pointer or a speculative instruction address. `liveMemoryBytes` must
  equal `receipt.heapBytes` measured at the trap.
- The observer must demonstrate `accessBytes > 0`, no 64-bit addition overflow,
  and `effectiveAddress + accessBytes > liveMemoryBytes`. For multi-range
  bulk operations, report the **specific failing source or destination**
  range. Unknown access type, absent effective address, a JS Inspector
  line/column, memory measured only after the exception, or a healthy run is
  **BLOCKED**, not synthetic evidence.

The signed receipt proves only that an approved operator signed these fields.
Actual instruction/address observation and same-renderer JSEP attestation
must be independently corroborated. Keep addresses and raw native transcripts
in operator-controlled storage, publishing only approved sanitized metadata.
This requirement is an evidence-integrity gate, not a debugger or a fix.

## On the original failure

Preserve the first-attempt log and run/job identifier. On a genuine original
`_OrtCreateSession` WASM bounds exception, re-observe the process chain at
the trap and bind both observations and the original model/JSEP identity to
the same renderer. Use the actual exception event to obtain the instruction
location. Record only the numeric fields in the receipt, approved identities
and exact test SHA. Keep raw maps, debugger transcripts, addresses and the
receipt itself in operator-controlled storage. Share only approved sanitized
findings. Avoid memory dumps, raw model bytes, credentials and family data.

Follow the field names in `validateReceipt` and `instructionCoordinate` in
`assignment1538-correlate.mjs`. Both JSON documents use schema 1. The manifest
is prepared from independently verified run/build inputs and trusted separately
from the receipt. Include `operatorKeySha256` (SHA-256 of the approved SPKI PEM
file), `mappingSha256` of the reviewed JSON mapping bytes, `debugSha256` of the
build-matched debug artifact and `sourceRevision` of the owning build source.
Sign the exact receipt JSON bytes with the approved Ed25519 key using a detached
64-byte binary signature. Never store the signing key in the repository.

**Independent trust anchor is mandatory:** An Ed25519 signature alone proves only
possession of *some* private key. A forged receipt, manifest and self-created key
can otherwise all agree with each other. Before running the offline verifier,
the authorized operator must independently confirm the approved operator's
SPKI PEM public-key SHA-256 from a trusted custody or approval channel **outside
the manifest, receipt and signing key**, then supply it as
`CC1538_APPROVED_OPERATOR_SPKI_SHA256` (64 lowercase hexadecimal characters).
Both that external trust anchor and `manifest.operatorKeySha256` must match
the actual approved PEM bytes. The verifier will block without the independent
fingerprint; do not derive it from the untrusted receipt/manifest.
No trusted fingerprint or native debugging authorization is supplied by GitHub CI.

## Offline mapping

Use an independently reviewed exact instruction decoding and its build-matched
DWARF line table to produce the single-instruction mapping. Set `kind`,
`coordinate`, `functionIndex`, `evidence` equal to `instruction-boundary`,
`instructionHex`, `sourceEvidence` equal to `build-matched-dwarf`,
`debugSha256`, `sourceRevision`, `sourcePath`, `sourceSha256`, and `line`.
For a WASM module-relative byte offset include `moduleSha256`. For a native
ELF machine PC include the WebKit library SHA/Build ID and executable segment
offset, virtual address, file-backed size and run page size in the mapping.
The native receipt includes the executable map's start/end, file offset and
load bias. The verifier computes the linked PC and checks the actual instruction
bytes against the original binary. Protocol line/column and static candidate
offsets cannot supply a trap location. An absent or ambiguous debug mapping
blocks source attribution.

Run from the repository root:

```sh
CC1538_APPROVED_OPERATOR_SPKI_SHA256=YOUR_SEPARATELY_APPROVED_64_HEX_DIGEST \
  node research/main1054/assignment1538-correlate.mjs --operator-approved-offline \
  run-manifest.json trap-receipt.json trap-receipt.sig approved-operator.pem \
  reviewed-mapping.json original-binary original-source.cpp
```

This verifier authenticates an approved observer and checks the reviewed input
against file bytes. The operator is responsible for the underlying observation,
build provenance and debug-line extraction. A verified source line is a
localization result with debug line-table precision. Claim a permanent repair
only after the same original-model failure is causally reproduced before a
source-justified change and reliably passes afterward on pinned WebKit and
Chromium. Preserve first attempts and Family Alpha HOLD #255.

## Exact pinned JSC source and authorized observer boundary

A hosted-runner native observation is not currently authorized: M284 found
the WPEWebProcess, but a GDB attach produced a ptrace-restriction hint.
Do not retry the denied operation or change ptrace, seccomp, capabilities,
sandbox configuration or security policy.

The pinned upstream WebKit revision is
`db897909f7c31d9b38793374c66427b6a4cb3dd3`, WebKit r2215 / Playwright
`1.56.1`. The downstream Playwright WebKit `bootstrap.diff` is required
(Git blob `f713c6fa093a1f45956c84844d50635376923b75`). A
WebKit upstream-only checkout is not a binary-equivalent original build.

Review two distinct source-backed WASM bounds-check generators in this
**exact revision** before designing an explicitly authorized trace:
- `Source/JavaScriptCore/wasm/WasmBBQJIT.h` includes
  `throwExceptionIf(ExceptionType::OutOfBoundsMemoryAccess, ...)`
  for bounds-checking and signaling paths.
- `Source/JavaScriptCore/wasm/WasmOMGIRGenerator.cpp` includes
  `emitExceptionCheck(..., ExceptionType::OutOfBoundsMemoryAccess)`
  from the compiled WASM bounds-check path.

These are **possible trap generation paths**, not proof which instruction
trapped in the historical original f4846 session. A source-and-patch-
matched, **separately operator-authorized** symbol-enabled WebKit engine
could instrument an actual original first-attempt failure to record the
compiled JSC code origin, exact WASM function+bytecode instruction position
(only when a verified mapping exists), fault kind and live memory bounds.
A JIT generated machine address is NOT necessarily file-backed ELF and
must be resolved through validated JSC code-origin metadata; Inspector
JavaScript line/column is not a WASM or native machine PC.

A rebuilt instrumented WebKit executable is **different** from the pinned
shipped engine. Record build hash, source+patch identity, and timing
perturbation against untouched-engine original-model controls. The
operator must supply an independently witnessed genuine same-renderer
original model/JSEP RED and exact source/binary proof. No native fault,
C++ line, or RED-before/GREEN-after fix is implied by this design. No
additional debugging permission is granted by this document.
