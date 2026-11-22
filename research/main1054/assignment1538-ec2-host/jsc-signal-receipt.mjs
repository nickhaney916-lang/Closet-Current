import {readFileSync} from 'node:fs';

const PREFIX = 'CC1538_SOURCE_PINNED_WASM_SIGNAL_V1 ';
const FIELDS = [
  'functionSpaceIndex', 'jitMachineCodeOffset', 'effectiveLinearAddress',
  'liveMemoryBytes', 'mappedCapacityBytes'
];
const MAX64 = (1n << 64n) - 1n;

export function parseDiagnosticSignalLog(log) {
  if (typeof log !== 'string') throw Error('CC1538_SIGNAL_LOG_INVALID');
  const lines = log.split(/\r?\n/).filter(line => line.includes(PREFIX));
  if (lines.length !== 1) throw Error('CC1538_SIGNAL_MARKER_NOT_UNIQUE');
  const payload = lines[0].slice(lines[0].indexOf(PREFIX));
  const regexp = new RegExp('^' + PREFIX +
    FIELDS.map(key => key + '=(\\d+)').join(' ') +
    ' accessWidthKnown=false wasmBytecodeOffsetKnown=false$');
  const m = payload.match(regexp);
  if (!m) throw Error('CC1538_SIGNAL_FIELDS_NOT_ATTESTED');
  const values = {};
  for (let i = 0; i < FIELDS.length; i++) {
    const raw = m[i + 1];
    const number = BigInt(raw);
    if (number > MAX64 || raw.length > 1 && raw[0] === '0')
      throw Error('CC1538_SIGNAL_NUMBER_NONCANONICAL');
    values[FIELDS[i]] = number;
  }
  if (values.mappedCapacityBytes < values.liveMemoryBytes ||
      !values.liveMemoryBytes || values.functionSpaceIndex > 0xffffffffn)
    throw Error('CC1538_SIGNAL_MEMORY_METADATA_INVALID');

  return {
    schema: 'CC1538_SANITIZED_DIAGNOSTIC_SIGNAL_V1',
    status: 'UNSIGNED_INSTRUMENTED_ENGINE_NATIVE_SIGNAL_CANDIDATE_ONLY',
    functionSpaceIndex: Number(values.functionSpaceIndex),
    jitMachineCodeOffset: values.jitMachineCodeOffset.toString(),
    effectiveLinearAddress: values.effectiveLinearAddress.toString(),
    liveMemoryBytes: values.liveMemoryBytes.toString(),
    mappedCapacityBytes: values.mappedCapacityBytes.toString(),
    faultAddressBeyondLiveMemory: values.effectiveLinearAddress >= values.liveMemoryBytes,
    accessWidthBytes: null,
    originalWasmBytecodeOffset: null,
    originalWasmFileOffset: null,
    originalCxxLine: null,
    originalWorkerAndModelShaAttested: false,
    exactShippedWebKitBinaryUsed: false,
    independentOperatorSignatureValid: false,
    originalFirstAttemptFailureMatched: false,
    permanentFixProven: false,
    familyAlpha: 'HOLD'
  };
}

if (process.argv[1]?.endsWith('jsc-signal-receipt.mjs') && process.argv[2] === 'parse') {
  if (process.argv.length !== 4) throw Error('usage: node jsc-signal-receipt.mjs parse PRIVATE_OPERATOR_LOG');
  console.log(JSON.stringify(parseDiagnosticSignalLog(readFileSync(process.argv[3], 'utf8')), null, 2));
}
