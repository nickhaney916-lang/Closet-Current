import {readFileSync} from 'node:fs';

// Diagnostic-only output from a *different*, source-pinned research WebKit
// binary. This is not a signed original-model failure or a file opcode offset.
const PREFIX = 'CC1538_BBQ_EXPLICIT_BOUNDS_SITE_V1 ';
const RE = /^CC1538_BBQ_EXPLICIT_BOUNDS_SITE_V1 functionSpaceIndex=(\d+) functionRelativeWasmOpcodeOffset=(\d+) liveMemoryBytes=(\d+) cachedBoundsCheckingBytes=(\d+) dynamicEffectiveAddressKnown=false accessWidthKnown=false$/;
const MAX32 = 0xffffffffn;
const MAX64 = (1n << 64n) - 1n;

export function parseExplicitBoundsSiteLog(log) {
  if (typeof log !== 'string' || log.length > 2_000_000)
    throw Error('CC1538_EXPLICIT_LOG_INVALID');
  const markers = log.split(/\r?\n/).filter(line => line.includes(PREFIX));
  if (markers.length !== 1)
    throw Error('CC1538_EXPLICIT_SITE_NOT_UNIQUE');
  const payload = markers[0].slice(markers[0].indexOf(PREFIX));
  const values = payload.match(RE);
  if (!values)
    throw Error('CC1538_EXPLICIT_SITE_INVALID');
  const numbers = values.slice(1).map(raw => {
    if (raw.length > 1 && raw[0] === '0') throw Error('CC1538_EXPLICIT_NONCANONICAL');
    const v = BigInt(raw);
    if (v > MAX64) throw Error('CC1538_EXPLICIT_NUMBER_OVERFLOW');
    return v;
  });
  const [functionIndex, offset, live, cached] = numbers;
  if (functionIndex > MAX32 || offset >= MAX32 || !live)
    throw Error('CC1538_EXPLICIT_SITE_UNSAFE_METADATA');
  return {
    schema: 'CC1538_SANITIZED_BBQ_EXPLICIT_BOUNDS_SITE_V1',
    status: 'UNSIGNED_DIAGNOSTIC_BUILD_BBQ_TAKEN_BOUNDS_BRANCH_ONLY',
    candidateFunctionIndex: Number(functionIndex),
    candidateFunctionRelativeWasmOpcodeOffset: offset.toString(),
    liveMemoryBytes: live.toString(),
    cachedBoundsCheckingBytes: cached.toString(),
    cachedBoundsBelowLiveMemory: cached < live,
    engineSoftwareBoundsBranchTaken: true,
    exactShippedWebKitBinaryUsed: false,
    originalModelAndWorkerProven: false,
    originalFirstAttemptFailureMatched: false,
    originalWasmInstructionBoundaryVerified: false,
    wasmFileByteOffset: null,
    nativeFaultPC: null,
    effectiveLinearAddress: null,
    accessWidthBytes: null,
    sourceCxxLine: null,
    independentOperatorSignatureValid: false,
    causalRepairProven: false,
    familyAlpha: 'HOLD'
  };
}
if (process.argv[1]?.endsWith('jsc-explicit-receipt.mjs') && process.argv[2] === 'parse') {
  if (process.argv.length !== 4)
    throw Error('usage: node jsc-explicit-receipt.mjs parse PRIVATE_RESEARCH_LOG');
  console.log(JSON.stringify(parseExplicitBoundsSiteLog(readFileSync(process.argv[3], 'utf8')), null, 2));
}
