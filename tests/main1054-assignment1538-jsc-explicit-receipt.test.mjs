import test from 'node:test';
import assert from 'node:assert/strict';
import {parseExplicitBoundsSiteLog} from '../research/main1054/assignment1538-ec2-host/jsc-explicit-receipt.mjs';

const marker = 'CC1538_BBQ_EXPLICIT_BOUNDS_SITE_V1 functionSpaceIndex=4846 functionRelativeWasmOpcodeOffset=1712 liveMemoryBytes=24182784 cachedBoundsCheckingBytes=50266112 dynamicEffectiveAddressKnown=false accessWidthKnown=false';

test('source-pinned branch marker is only an unsigned diagnostic opcode candidate', () => {
 const r = parseExplicitBoundsSiteLog('private log header\n'+marker+'\n');
 assert.equal(r.candidateFunctionIndex,4846);
 assert.equal(r.candidateFunctionRelativeWasmOpcodeOffset,'1712');
 assert.equal(r.engineSoftwareBoundsBranchTaken,true);
 assert.equal(r.status,'UNSIGNED_DIAGNOSTIC_BUILD_BBQ_TAKEN_BOUNDS_BRANCH_ONLY');
 for(const key of ['originalFirstAttemptFailureMatched','originalWasmInstructionBoundaryVerified','originalModelAndWorkerProven','exactShippedWebKitBinaryUsed','independentOperatorSignatureValid','causalRepairProven'])
  assert.equal(r[key],false);
 for(const key of ['wasmFileByteOffset','nativeFaultPC','effectiveLinearAddress','accessWidthBytes','sourceCxxLine'])
  assert.equal(r[key],null);
 assert.equal(r.familyAlpha,'HOLD');
});

test('reject duplicated partial or forged claims', () => {
 for(const s of ['',marker+'\n'+marker,marker.replace('accessWidthKnown=false','accessWidthKnown=true'),
   marker.replace('cachedBoundsCheckingBytes=50266112 ',''),marker+' nativeFaultPC=123',
   marker+' originalFirstAttemptFailureMatched=true',
   marker.replace('functionRelativeWasmOpcodeOffset=1712','functionRelativeWasmOpcodeOffset=-1')])
   assert.throws(()=>parseExplicitBoundsSiteLog(s));
});

test('reject impossible indices, canonical number violations and memory snapshots', () => {
 for(const s of [
  marker.replace('functionSpaceIndex=4846','functionSpaceIndex=4294967296'),
  marker.replace('functionRelativeWasmOpcodeOffset=1712','functionRelativeWasmOpcodeOffset=4294967295'),
  marker.replace('functionSpaceIndex=4846','functionSpaceIndex=04846'),
  marker.replace('liveMemoryBytes=24182784','liveMemoryBytes=0'),
  marker.replace('cachedBoundsCheckingBytes=50266112','cachedBoundsCheckingBytes=18446744073709551616')
 ]) assert.throws(()=>parseExplicitBoundsSiteLog(s));
});

test('flag cached bounds smaller than live memory without hiding the contradiction', () => {
  const r = parseExplicitBoundsSiteLog(marker.replace('cachedBoundsCheckingBytes=50266112','cachedBoundsCheckingBytes=42'));
  assert.equal(r.cachedBoundsBelowLiveMemory,true);
  assert.equal(r.causalRepairProven,false);
  assert.equal(r.effectiveLinearAddress,null);
});

test('reject bogus log values and prohibit automatic native-fault attribution', () => {
 assert.throws(()=>parseExplicitBoundsSiteLog(null));
 assert.throws(()=>parseExplicitBoundsSiteLog('x'.repeat(2_000_001)));
 const r = parseExplicitBoundsSiteLog(marker);
 assert.equal(r.nativeFaultPC,null);
 assert.equal(r.wasmFileByteOffset,null);
 assert.equal(r.causalRepairProven,false);
});
