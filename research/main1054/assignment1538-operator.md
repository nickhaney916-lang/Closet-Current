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
   at a reviewed exact source commit. Record the test SHA and the independently
   verified original model digest and byte length. Record the original JSEP SHA
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
   from the live process map and original ELF headers. Match the mapping to
   the expected device/inode before hashing and reading the Build ID. Use
   M290/M291 for reference identities. A healthy run supplies reference
   identity only.

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
