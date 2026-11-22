import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import {
  authenticate, correlate, instructionCoordinate, pinned, pinnedOriginalWasmBodies, validateReceipt, validateSourceMapping,
} from '../research/main1054/assignment1538-correlate.mjs';

// Deliberately synthetic controls. No fixture is a signed production receipt.
const webkitElf = {
  sha256: 'daa10258a2161710c7c1d6a3e3f7abe0a100a6f269c00f5843dcd0f7df46ec29',
  buildId: '8faf9134c0557d2d09f3d680f9c8b780498cf59b',
};
const manifest = {
  schema: 1, engine: pinned, modelSha256: pinned.modelSha256, testSha: 'b'.repeat(40),
  captureMethod: 'authorized-engine-trace', bootIdentity: 'c'.repeat(64),
  runIdentity: 'd'.repeat(64), browserPid: 9, browserStartTicks: '100',
  startMs: 20, modelLength: 15199746,
};
const before = [
  { pid: 12, parentPid: 9, startTicks: '102' },
  { pid: 9, parentPid: 1, startTicks: '100' },
];
const receipt = {
  ...manifest, runMode: 'original-model', attempt: 1, outcome: 'RED',
  operation: '_OrtCreateSession', exception: 'wasm-memory-bounds',
  before, atTrap: structuredClone(before), trapPid: 12,
  renderer: {
    sha256: 'b46f88603e43eca28083389188944f7f47fd26311c8697a14f910e4f8bfa0d66',
    buildId: '23a6254355e0ab6aa4f3672cc51bd9eb487522a7',
  },
  webkitElf, trapMs: 30, heapBytes: 33554432, modelPointer: 8933688,
  frames: [4846, 1384, 11276, 7427],
  location: { kind: 'wasm-module-offset', origin: 'trap-event', offset: 7022500, functionIndex: 4846 },
};
const wasmMapping = { moduleSha256: pinned.jsepSha256 };

test('fixture reaches coordinate validation, but arbitrary bytes cannot correlate', () => {
  const location = validateReceipt(receipt, manifest);
  assert.equal(instructionCoordinate(location, wasmMapping), 7022500);
  assert.throws(() => correlate(receipt, manifest, wasmMapping, Buffer.from('test'), Buffer.alloc(0)),
    /binary bytes mismatch/);
});

for (const [name, changes, reason] of [
  ['wrong module', { engine: { ...pinned, jsepSha256: '0'.repeat(64) } }, /JSEP mismatch/],
  ['wrong original model', { modelSha256: 'f'.repeat(64) }, /model or exact test/],
  ['passing run', { outcome: 'GREEN' }, /original-model RED/],
  ['retry', { attempt: 2 }, /original-model RED/],
  ['bad bounds', { modelPointer: Number.MAX_SAFE_INTEGER }, /pointer bounds/],
  ['wrong renderer', { trapPid: 99 }, /wrong browser renderer/],
  ['recycled PID', { atTrap: [{ ...before[0], startTicks: '300' }, before[1]] }, /stale/],
  ['broken parent link', { atTrap: [{ ...before[0], parentPid: 90 }, before[1]] }, /unrelated/],
  ['wrong Build ID', { webkitElf: { ...webkitElf, buildId: 'deadbeef' } }, /ELF SHA or Build ID/],
]) {
  test('rejects ' + name, () => assert.throws(() => validateReceipt({ ...receipt, ...changes }, manifest), reason));
}

test('rejects static candidates and inspector line/column', () => {
  assert.throws(() => instructionCoordinate({ ...receipt.location, origin: 'static-candidate' }, wasmMapping),
    /original module trap offset/);
  assert.throws(() => instructionCoordinate({ kind: 'protocol-line-column', line: 0, column: 44 }, wasmMapping),
    /file-backed native PC/);
  assert.throws(() => instructionCoordinate(receipt.location, { moduleSha256: 'f'.repeat(64) }),
    /original module trap offset/);
});

test('derives ELF virtual coordinate and rejects wrong load bias and non-file-backed PC', () => {
  const location = {
    ...webkitElf, kind: 'native-elf-pc', origin: 'trap-event', pc: '0x11132',
    mapStart: '0x11000', mapEnd: '0x12000', mapFileOffset: '0x1000', loadBias: '0xe000',
  };
  const mapping = {
    ...webkitElf, pageSize: 4096, segmentOffset: '0x1020', segmentVaddr: '0x3020',
    segmentFileSize: '0x500',
  };
  assert.equal(instructionCoordinate(location, mapping), 0x3132);
  assert.throws(() => instructionCoordinate({ ...location, loadBias: '0xf000' }, mapping), /load bias/);
  assert.throws(() => instructionCoordinate({ ...location, pc: '0x11a00' }, mapping), /file-backed/);
  assert.throws(() => instructionCoordinate(location, { ...mapping, buildId: 'deadbeef' }), /verified file-backed/);
});

test('verifies real Ed25519 signatures and rejects tampering', () => {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const input = Buffer.from(JSON.stringify(receipt));
  const key = publicKey.export({ type: 'spki', format: 'pem' });
  const signature = sign(null, input, privateKey);
  const independentlyApprovedKeySha256 = createHash('sha256').update(key).digest('hex');
  assert.doesNotThrow(() => authenticate(input, signature, key, independentlyApprovedKeySha256));
  assert.throws(() => authenticate(Buffer.concat([input, Buffer.from(' ')]),
    signature, key, independentlyApprovedKeySha256), /signature rejected/);
  assert.throws(() => authenticate(input, signature, key), /independently approved operator key/);
  assert.throws(() => authenticate(input, signature, key, 'f'.repeat(64)),
    /independently approved operator key/);
});

test('CLI without operator input reports BLOCKED and emits no attestation', () => {
  const run = spawnSync(process.execPath, ['research/main1054/assignment1538-correlate.mjs'], { encoding: 'utf8' });
  assert.equal(run.status, 1);
  assert.equal(run.stdout, '');
  assert.match(run.stderr, /^BLOCKED:/);
});

test('rejects a map without build-matched debug files and original source', () => {
  assert.throws(() => validateSourceMapping({ sourceEvidence: 'symbol-only' }, manifest,
    Buffer.from('int x;'), 'wasm-module-offset'), /DWARF or original source missing/);
});


test('signed original ONNX identity uses canonical 15,199,746-byte model digest, not any 64-hex claim', () => {
  assert.equal(pinned.modelSha256,
    '02e6f1545475bc549184b6710487555b4b73eb08354cc3a480fb4fab1473a9d3');
  assert.equal(pinned.modelBytes, 15199746);
  assert.doesNotThrow(() => validateReceipt(receipt, manifest));
  const wellFormedWrong = 'a'.repeat(64);
  for (const changedManifest of [
    {...manifest, modelSha256: wellFormedWrong},
    {...manifest, modelLength: 15199745},
    {...manifest, modelLength: 15199747},
  ]) assert.throws(
    () => validateReceipt({...receipt, modelSha256: changedManifest.modelSha256,
      modelLength: changedManifest.modelLength}, changedManifest),
    /model or exact test source mismatch/
  );
  assert.throws(() => validateReceipt({...receipt, modelSha256: wellFormedWrong}, manifest),
    /model or exact test source mismatch/);
  assert.throws(() => validateReceipt({...receipt, modelLength: 15199745}, manifest),
    /model or exact test source mismatch/);
  // A matching but wrong operator-signed manifest is insufficient.
  assert.throws(() => validateReceipt({
    ...receipt, modelSha256: wellFormedWrong, modelLength: 15199745,
  }, {...manifest, modelSha256: wellFormedWrong, modelLength: 15199745}),
  /model or exact test source mismatch/);
});


test('self-issued valid signature cannot prove authorization against a separately trusted operator', () => {
  const actualOperator = generateKeyPairSync('ed25519');
  const approvedKey = actualOperator.publicKey.export({type:'spki',format:'pem'});
  const approvedFingerprint = createHash('sha256').update(approvedKey).digest('hex');
  const attacker = generateKeyPairSync('ed25519');
  const attackerKey = attacker.publicKey.export({type:'spki',format:'pem'});
  const fabricated = Buffer.from(JSON.stringify({...receipt, operatorAuthorized:true}));
  const fabricatedSignature = sign(null, fabricated, attacker.privateKey);
  // Both the fabricated receipt and attacker-created signature are valid
  // cryptographically; the root of trust must remain external to both.
  assert.throws(() => authenticate(fabricated, fabricatedSignature, attackerKey,
    approvedFingerprint), /independently approved operator key/);
  assert.doesNotThrow(() => authenticate(fabricated,
    sign(null, fabricated, actualOperator.privateKey), approvedKey, approvedFingerprint));
});


test('file-backed native JavaScriptCore PC uses exact installed pinned JSC ELF/build ID', () => {
  const jsc = {
    sha256:'73f32b17f002381abadb8cec18cdec85fb17ace1077f993f448e3024b3014f8b',
    buildId:'e04d2e784f16edeb1612cc24cd180e328c4b3e56',
  };
  const location={
    ...jsc,kind:'native-elf-pc',origin:'trap-event',pc:'0x11132',
    mapStart:'0x11000',mapEnd:'0x12000',mapFileOffset:'0x1000',loadBias:'0xe000',
  };
  const mapping={
    ...jsc,pageSize:4096,segmentOffset:'0x1020',segmentVaddr:'0x3020',
    segmentFileSize:'0x500',
  };
  assert.equal(instructionCoordinate(location,mapping),0x3132);
  assert.throws(()=>instructionCoordinate({...location,buildId:'deadbeef'},mapping),
    /verified file-backed native PC/);
  assert.throws(()=>instructionCoordinate(location,{...mapping,sha256:webkitElf.sha256}),
    /verified file-backed native PC/);
  assert.throws(()=>instructionCoordinate({
    ...location,kind:'wasm-jit-native-pc'},mapping),
    /verified file-backed native PC/);
  assert.throws(()=>instructionCoordinate({...location,pc:'0x12fff'},mapping),
    /invalid native executable map range/);
});

test('original M279 stack functions restrict purported native WASM offsets to exact code bodies', () => {
  const expected = new Map([
    [4846, [7022489, 7165245]],
    [1384, [1466483, 1614237]],
    [11276, [16046141, 16046580]],
    [7427, [11415071, 11415529]],
  ]);
  for (const [functionIndex, span] of expected) {
    assert.deepEqual(pinnedOriginalWasmBodies[functionIndex], span);
    const [begin, end] = span;
    const location = {...receipt.location, functionIndex};
    assert.equal(instructionCoordinate({...location, offset: begin}, wasmMapping), begin);
    assert.equal(instructionCoordinate({...location, offset: end - 1}, wasmMapping), end - 1);
    assert.throws(() => instructionCoordinate({...location, offset: begin - 1}, wasmMapping),
      /function body\/offset mismatch/);
    assert.throws(() => instructionCoordinate({...location, offset: end}, wasmMapping),
      /function body\/offset mismatch/);
  }
  assert.throws(() => instructionCoordinate({
    ...receipt.location, offset: pinnedOriginalWasmBodies[1384][0],
  }, wasmMapping), /function body\/offset mismatch/);
  assert.throws(() => instructionCoordinate({
    ...receipt.location, functionIndex: 999, offset: pinnedOriginalWasmBodies[4846][0],
  }, wasmMapping), /function body\/offset mismatch/);
});

test('independent static body starts cannot be promoted into a real original trap', () => {
  const location = {...receipt.location, origin: 'static-candidate', offset: 7022509};
  assert.throws(() => instructionCoordinate(location, wasmMapping), /original module trap offset/);
  assert.equal(instructionCoordinate({...location, origin: 'trap-event'}, wasmMapping), 7022509);
  // This test only exercises an asserted event classification; the signed,
  // independently witnessed native fault remains a separate requirement.
});
