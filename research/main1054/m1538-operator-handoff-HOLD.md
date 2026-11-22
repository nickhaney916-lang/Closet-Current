# M1538 native trap-PC acceptance handoff — research only (Family Alpha HOLD)

The historical original WebKit OrtCreateSession WASM-bounds first-attempt failure is
[Actions #44640727828 / job #135971719127](https://github.com/nickhaney916-lang/Closet-Current/actions/runs/44640727828/job/135971719127),
M279 shard 2 ordinal 3. Its model input range was in bounds; top WASM stack function #4846 is known.
The *actual* native PC, exact WASM instruction offset and matching C++ statement are **not known**.

This package does **not** start, connect to, attach to, or debug a native process.
Its validator reviews only a *sanitized proposed receipt* and makes no network requests.
Run offline:

    node research/main1054/m1538-authorized-native-trap-receipt-gate.mjs sanitized-receipt.json
    node --test tests/main1054-m1538-authorized-native-trap-receipt-gate.test.mjs

An engineer with separately granted, legitimate permission on an operator-controlled
machine must obtain the actual genuine fault. Do NOT change ptrace_scope, sandbox,
capabilities, security policies, runner privileges, or attach to blocked targets.
Stop any denied operation.

## Acceptance requirements

Before collection confirm the exact Playwright 1.56.1 / WebKit 26.0 renderer
and source/build IDs, the original P94 Worker Git blob SHA, original
Xenova/segformer_b0_clothes fp32 ONNX SHA, exact original JSEP WASM and
generated glue hashes. Use one genuine first-attempt original-model WebKit
process, not a synthetic trap or healthy run.

The bounded sanitized receipt must include: GitHub CI run/job, exact
checkout commit and first attempt; browser and renderer PIDs *plus process
start times* (PID reuse defense); Worker ID digest *within this job only*
(not a global identifier); chronological Worker create/fault/error events;
original OrtCreateSession WASM-bounds failure; independently attested
JSEP/ONNX/Worker bytes. Do not submit private photos, memory dumps, raw
Worker IDs, auth tokens, binary/model payloads, user data or environment values.

### Mutually exclusive location kinds

1. wasm-bytecode-offset: independently observed original WASM module file
   offset within static original f4846 [7022489,7165245). This range
   is a bound, NOT itself a genuine trap location.
2. native-elf-pc: observed machine PC and verified mapped ELF SHA/build ID,
   mapping start/end, load file offset and file length. Can derive only
   an ELF file offset, NOT a WASM instruction or C++ statement.

The metadata validator requires the same exact run/job/commit/Worker
process birth identity and rejects invalid load bias, stale/reused PID,
cross-job Worker ID hash coincidence, wrong-but-well-formed ONNX SHA,
fake native offsets, synthetic faults and premature C++/repair claims.
**Even a well-formed receipt is only
CANDIDATE_REQUIRES_INDEPENDENT_NATIVE_VERIFICATION.** JSON metadata cannot
authenticate itself, operator authorization, the actual machine PC, or
a compiler's build-to-source map.

An authorized reviewer separately validates original GitHub job logs,
actual native exception trace, byte-identical WASM/ELF, build IDs and
independent available debug symbols/source map. The original stripped
JSEP WASM has no independently confirmed C++ DWARF mapping. Source
statements without a verified exact build map remain NULL.

Only after a genuine original first-attempt RED, verified instruction,
verified C++ operation and same-condition before/after can a narrowly
justified correction be accepted. Require original WebKit RED-before /
GREEN-after and Chromium regressions. No production changes, merges,
deployments, permissions changes or release.

Ownership: M287 #1533 owns original-model reproduction; M288 #1534 owns
static WASM disassembly; M290 #1536 owns ELF provenance; M1585 #1586
owns Worker Inspector; native causal correction #1570 is separate.
Report exact PASS/FAIL/BLOCKED to Mission Control #1054.
Family Alpha #255 remains OPEN/HOLD.