import { createHash, createPublicKey, verify } from 'node:crypto';
import { openSync, closeSync, fstatSync, readSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const pinned = Object.freeze({
  playwright: '1.56.1',
  webkit: '26.0',
  revision: '2215',
  webkitSource: 'db897909f7c31d9b38793374c66427b6a4cb3dd3',
  playwrightPatch: 'f713c6fa093a1f45956c84844d50635376923b75',
  jsepSha256: 'c46655e8a94afc45338d4cb2b840475f88e5012d524509916e505079c00bfa39',
  // Immutable original fp32 Xenova/segformer_b0_clothes ONNX graph, revision
  // a2489ea8e7ec1ee912190546bad31a4906ccca76 / onnx/model.onnx.
  modelSha256: '02e6f1545475bc549184b6710487555b4b73eb08354cc3a480fb4fab1473a9d3',
  modelBytes: 15199746,
});

const renderer = {
  sha256: 'b46f88603e43eca28083389188944f7f47fd26311c8697a14f910e4f8bfa0d66',
  buildId: '23a6254355e0ab6aa4f3672cc51bd9eb487522a7',
};
const webkit = {
  sha256: 'daa10258a2161710c7c1d6a3e3f7abe0a100a6f269c00f5843dcd0f7df46ec29',
  buildId: '8faf9134c0557d2d09f3d680f9c8b780498cf59b',
};
// Independently inventoried in M286 from the exact pinned WebKit container.
// A JSC generated WASM JIT address is not file-backed ELF: these pins
// admit only an actual file-mapped library instruction coordinate.
const javaScriptCore = {
  sha256: '73f32b17f002381abadb8cec18cdec85fb17ace1077f993f448e3024b3014f8b',
  buildId: 'e04d2e784f16edeb1612cc24cd180e328c4b3e56',
};
/**
 * M280 independently parsed these entire function body file spans from the
 * exact pinned original JSEP 21,596,019-byte module. These are range gates,
 * NOT identified native trap instructions; the historical M279 PC is null.
 */
export const pinnedOriginalWasmBodies = Object.freeze({
  4846: Object.freeze([7022489, 7165245]),
  1384: Object.freeze([1466483, 1614237]),
  11276: Object.freeze([16046141, 16046580]),
  7427: Object.freeze([11415071, 11415529]),
});
const pinnedFileBackedNativeModule = (location, mapping) =>
  [webkit, javaScriptCore].find(m => same(location,m) && same(mapping,m)) ?? null;
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const sha = value => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
const uint = value => Number.isSafeInteger(value) && value >= 0;
const hex = value => typeof value === 'string' && /^0x[0-9a-f]{1,16}$/.test(value);
const same = (actual, expected) => Object.entries(expected).every(([key, value]) => actual?.[key] === value);

function requireEvidence(condition, reason) {
  if (!condition) throw new Error(reason);
}

function processIdentity(chain) {
  requireEvidence(Array.isArray(chain) && chain.length >= 2 && chain.length <= 16, 'renderer ancestry missing');
  const pids = new Set();
  return chain.map((process, index) => {
    requireEvidence(uint(process.pid) && process.pid > 0 && uint(process.parentPid) &&
      typeof process.startTicks === 'string' && /^[1-9][0-9]{0,19}$/.test(process.startTicks) &&
      !pids.has(process.pid), 'invalid process identity');
    pids.add(process.pid);
    if (index > 0) {
      requireEvidence(chain[index - 1].parentPid === process.pid &&
        BigInt(chain[index - 1].startTicks) >= BigInt(process.startTicks), 'unrelated renderer');
    }
    return [process.pid, process.parentPid, process.startTicks];
  });
}

// Verifies the operator's observations against a separately approved manifest.
// The signature authenticates the observer. It does not replace live observation.
export function validateReceipt(receipt, manifest) {
  requireEvidence(manifest.schema === 1 && same(manifest.engine, pinned) &&
    same(receipt.engine, pinned), 'pinned engine or original JSEP mismatch');
  requireEvidence(manifest.modelSha256 === pinned.modelSha256 &&
    receipt.modelSha256 === pinned.modelSha256 &&
    manifest.modelLength === pinned.modelBytes && receipt.modelLength === pinned.modelBytes &&
    typeof manifest.testSha === 'string' && /^[0-9a-f]{40}$/.test(manifest.testSha) &&
    receipt.testSha === manifest.testSha, 'model or exact test source mismatch');
  requireEvidence(receipt.schema === 1 && receipt.runMode === 'original-model' &&
    receipt.captureMethod === manifest.captureMethod &&
    ['authorized-native-debugger', 'authorized-engine-trace'].includes(receipt.captureMethod) &&
    receipt.attempt === 1 && receipt.outcome === 'RED' &&
    receipt.operation === '_OrtCreateSession' && receipt.exception === 'wasm-memory-bounds',
  'requires an authorized first-attempt original-model RED');
  requireEvidence(sha(receipt.runIdentity) && receipt.runIdentity === manifest.runIdentity &&
    sha(receipt.bootIdentity) && receipt.bootIdentity === manifest.bootIdentity,
  'run or boot identity mismatch');
  const before = processIdentity(receipt.before);
  const atTrap = processIdentity(receipt.atTrap);
  requireEvidence(JSON.stringify(before) === JSON.stringify(atTrap), 'stale or replaced renderer');
  requireEvidence(before[0][0] === receipt.trapPid && before.at(-1)[0] === manifest.browserPid &&
    before.at(-1)[2] === manifest.browserStartTicks, 'wrong browser renderer');
  requireEvidence(same(receipt.renderer, renderer) && same(receipt.webkitElf, webkit),
    'mapped ELF SHA or Build ID mismatch');
  requireEvidence(uint(receipt.startMs) && uint(receipt.trapMs) &&
    receipt.startMs === manifest.startMs && receipt.trapMs >= receipt.startMs &&
    receipt.trapMs - receipt.startMs <= 600_000, 'invalid capture time window');
  requireEvidence(uint(receipt.heapBytes) && receipt.heapBytes > 0 &&
    uint(receipt.modelPointer) && uint(receipt.modelLength) && receipt.modelLength > 0 &&
    receipt.modelLength === manifest.modelLength && receipt.modelLength <= receipt.heapBytes &&
    receipt.modelPointer <= receipt.heapBytes - receipt.modelLength, 'invalid model pointer bounds');
  requireEvidence(Array.isArray(receipt.frames) && receipt.frames.length >= 1 &&
    receipt.frames.length <= 32 && receipt.frames.every(uint) &&
    receipt.frames[0] === receipt.location?.functionIndex, 'invalid trap stack');
  return receipt.location;
}

export function instructionCoordinate(location, mapping) {
  if (location.kind === 'wasm-module-offset') {
    requireEvidence(location.origin === 'trap-event' && uint(location.offset) &&
      location.offset < 21_596_019 && mapping.moduleSha256 === pinned.jsepSha256,
    'requires the original module trap offset');
    // Bind a claimed actual module offset to the independently parsed body
    // of the exact reported original stack function, not merely the module.
    // Static valid opcodes alone never prove where a live trap occurred.
    const body = pinnedOriginalWasmBodies[location.functionIndex];
    requireEvidence(Array.isArray(body) && body[0] <= location.offset &&
      location.offset < body[1], 'original WASM function body/offset mismatch');
    return location.offset;
  }

  requireEvidence(location.kind === 'native-elf-pc' && location.origin === 'trap-event' &&
    hex(location.pc) && hex(location.mapStart) && hex(location.mapEnd) &&
    hex(location.mapFileOffset) && hex(location.loadBias) &&
    pinnedFileBackedNativeModule(location, mapping) !== null, 'requires a verified file-backed native PC');
  const [pc, start, end, fileOffset, bias] = [
    location.pc, location.mapStart, location.mapEnd, location.mapFileOffset, location.loadBias,
  ].map(BigInt);
  requireEvidence(start <= pc && pc < end && bias <= start &&
    uint(mapping.pageSize) && [4096, 16384, 65536].includes(mapping.pageSize),
  'invalid native executable map range');
  const page = BigInt(mapping.pageSize);
  requireEvidence(start % page === 0n && fileOffset % page === 0n &&
    hex(mapping.segmentOffset) && hex(mapping.segmentVaddr) && hex(mapping.segmentFileSize),
  'invalid executable segment metadata');
  const [offset, vaddr, fileSize] = [mapping.segmentOffset, mapping.segmentVaddr, mapping.segmentFileSize].map(BigInt);
  const filePc = fileOffset + pc - start;
  const linkedPc = vaddr + filePc - offset;
  requireEvidence(filePc >= offset && filePc < offset + fileSize && vaddr % page === offset % page &&
    pc - bias === linkedPc && linkedPc <= BigInt(Number.MAX_SAFE_INTEGER),
  'invalid ELF load bias or file-backed instruction');
  return Number(linkedPc);
}

export function validateSourceMapping(mapping, manifest, source, kind) {
  requireEvidence(mapping.sourceEvidence === 'build-matched-dwarf' && sha(mapping.debugSha256) &&
    mapping.debugSha256 === manifest.debugSha256 &&
    typeof mapping.sourceRevision === 'string' && /^[0-9a-f]{40}$/.test(mapping.sourceRevision) &&
    mapping.sourceRevision === manifest.sourceRevision &&
    (kind !== 'native-elf-pc' || mapping.sourceRevision === pinned.webkitSource) &&
    typeof mapping.sourcePath === 'string' &&
    /^(?:[a-zA-Z0-9_+-]+\/)*[a-zA-Z0-9_+.-]+\.(?:c|cc|cpp|cxx|h|hpp)$/.test(mapping.sourcePath) &&
    sha(mapping.sourceSha256) && digest(source) === mapping.sourceSha256 &&
    uint(mapping.line) && mapping.line > 0 &&
    mapping.line <= source.toString('utf8').split('\n').length,
  'build-matched DWARF or original source missing');
}

export function correlate(receipt, manifest, mapping, binary, source) {
  const location = validateReceipt(receipt, manifest);
  const coordinate = instructionCoordinate(location, mapping);
  const expectedBinary = location.kind === 'wasm-module-offset' ? pinned.jsepSha256 :
    pinnedFileBackedNativeModule(location, mapping)?.sha256;
  requireEvidence(digest(binary) === expectedBinary, 'pinned binary bytes mismatch');
  requireEvidence(mapping.kind === location.kind && mapping.coordinate === coordinate &&
    mapping.functionIndex === location.functionIndex &&
    mapping.evidence === 'instruction-boundary' && /^[0-9a-f]{2,32}$/.test(mapping.instructionHex) &&
    mapping.instructionHex.length % 2 === 0, 'exact instruction mapping missing');
  const offset = location.kind === 'wasm-module-offset' ? coordinate :
    Number(BigInt(mapping.segmentOffset) + BigInt(coordinate) - BigInt(mapping.segmentVaddr));
  const instruction = Buffer.from(mapping.instructionHex, 'hex');
  requireEvidence(uint(offset) && binary.subarray(offset, offset + instruction.length).equals(instruction),
    'instruction bytes mismatch');
  validateSourceMapping(mapping, manifest, source, location.kind);
  return {
    status: 'CORRELATED',
    kind: location.kind,
    coordinate,
    functionIndex: location.functionIndex,
    instructionHex: mapping.instructionHex,
    source: { path: mapping.sourcePath, line: mapping.line, precision: 'debug-line-table' },
    causalRepairProven: false,
  };
}

function boundedRead(path, limit) {
  const fd = openSync(path, 'r');
  try {
    const stat = fstatSync(fd);
    requireEvidence(stat.isFile() && stat.size > 0 && stat.size <= limit, 'input size or type rejected');
    const buffer = Buffer.alloc(stat.size);
    let offset = 0;
    while (offset < buffer.length) {
      const count = readSync(fd, buffer, offset, buffer.length - offset, null);
      requireEvidence(count > 0, 'input changed during read');
      offset += count;
    }
    requireEvidence(readSync(fd, Buffer.alloc(1), 0, 1, null) === 0, 'input changed during read');
    return buffer;
  } finally {
    closeSync(fd);
  }
}

export function authenticate(bytes, signature, keyBytes, independentlyApprovedKeySha256) {
  // The manifest and signature may be created together by an untrusted
  // signer. The trusted key fingerprint MUST be supplied out-of-band by the
  // authorized operator, never inferred from the signed receipt/manifest.
  requireEvidence(sha(independentlyApprovedKeySha256) &&
    digest(keyBytes) === independentlyApprovedKeySha256,
    'independently approved operator key fingerprint required');
  const key = createPublicKey(keyBytes);
  requireEvidence(key.asymmetricKeyType === 'ed25519' && signature.length === 64 &&
    verify(null, bytes, key, signature), 'operator receipt signature rejected');
}

function main(args) {
  requireEvidence(args.length === 8 && args[0] === '--operator-approved-offline',
    'usage: --operator-approved-offline MANIFEST RECEIPT SIGNATURE OPERATOR_PUBKEY MAPPING BINARY SOURCE');
  const [, manifestPath, receiptPath, signaturePath, keyPath, mappingPath, binaryPath, sourcePath] = args;
  const manifest = JSON.parse(boundedRead(manifestPath, 16_384));
  const receiptBytes = boundedRead(receiptPath, 16_384);
  const mappingBytes = boundedRead(mappingPath, 16_384);
  const key = boundedRead(keyPath, 4096);
  requireEvidence(digest(key) === manifest.operatorKeySha256, 'operator key mismatch');
  requireEvidence(digest(mappingBytes) === manifest.mappingSha256, 'independently reviewed mapping digest mismatch');
  // The caller's trusted fingerprint is a separate prerequisite. A manifest
  // cannot authorize its own newly generated signing key.
  const trustedKey = process.env.CC1538_APPROVED_OPERATOR_SPKI_SHA256;
  authenticate(receiptBytes, boundedRead(signaturePath, 64), key, trustedKey);
  return correlate(JSON.parse(receiptBytes), manifest, JSON.parse(mappingBytes),
    boundedRead(binaryPath, 512 * 1024 * 1024), boundedRead(sourcePath, 8 * 1024 * 1024));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    console.log(JSON.stringify(main(process.argv.slice(2))));
  } catch {
    console.error('BLOCKED: input, attestation, or build-matched correlation unavailable or invalid');
    process.exitCode = 1;
  }
}
