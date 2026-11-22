import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseDiagnosticSignalLog} from '../research/main1054/assignment1538-ec2-host/jsc-signal-receipt.mjs';

const sample = 'CC1538_SOURCE_PINNED_WASM_SIGNAL_V1 functionSpaceIndex=4846 jitMachineCodeOffset=3498 effectiveLinearAddress=24182784 liveMemoryBytes=24182784 mappedCapacityBytes=50266112 accessWidthKnown=false wasmBytecodeOffsetKnown=false';

test('simulated signal line reports only an unattested native JIT offset, not a wasm instruction', () => {
  const r = parseDiagnosticSignalLog('private header\n'+sample+'\n');
  assert.equal(r.status, 'UNSIGNED_INSTRUMENTED_ENGINE_NATIVE_SIGNAL_CANDIDATE_ONLY');
  assert.equal(r.functionSpaceIndex, 4846);
  assert.equal(r.jitMachineCodeOffset, '3498');
  assert.equal(r.effectiveLinearAddress, '24182784');
  assert.equal(r.faultAddressBeyondLiveMemory, true);
  for(const field of ['accessWidthBytes','originalWasmBytecodeOffset','originalWasmFileOffset','originalCxxLine'])
    assert.equal(r[field], null);
  for(const field of ['originalWorkerAndModelShaAttested','exactShippedWebKitBinaryUsed','independentOperatorSignatureValid','originalFirstAttemptFailureMatched','permanentFixProven'])
    assert.equal(r[field], false);
  assert.equal(r.familyAlpha, 'HOLD');
});

test('healthy-range synthetic signal still must not be promoted to original trap evidence', () => {
  const r = parseDiagnosticSignalLog(sample.replace('effectiveLinearAddress=24182784','effectiveLinearAddress=150'));
  assert.equal(r.faultAddressBeyondLiveMemory, false);
  assert.equal(r.originalWasmBytecodeOffset, null);
  assert.equal(r.permanentFixProven, false);
});

test('missing, duplicated or incomplete records fail closed', () => {
 for(const raw of ['',sample+'\n'+sample,sample.replace('accessWidthKnown=false ',''),sample.replace('jitMachineCodeOffset=3498 ',''),sample.replace('wasmBytecodeOffsetKnown=false','wasmBytecodeOffsetKnown=true')])
  assert.throws(()=>parseDiagnosticSignalLog(raw));
});

test('reject noncanonical or overflowed values and impossible memory bounds', () => {
 for(const raw of [
 sample.replace('functionSpaceIndex=4846','functionSpaceIndex=4294967296'),
 sample.replace('functionSpaceIndex=4846','functionSpaceIndex=04846'),
 sample.replace('liveMemoryBytes=24182784','liveMemoryBytes=0'),
 sample.replace('mappedCapacityBytes=50266112','mappedCapacityBytes=1000'),
 sample.replace('jitMachineCodeOffset=3498','jitMachineCodeOffset=18446744073709551616'),
 sample.replace('effectiveLinearAddress=24182784','effectiveLinearAddress=-1')
 ]) assert.throws(()=>parseDiagnosticSignalLog(raw));
});

test('reject raw process address injection and fields that could falsely claim attribution', () => {
 assert.throws(()=>parseDiagnosticSignalLog(sample+' nativeAbsolutePC=0x1234'));
 assert.throws(()=>parseDiagnosticSignalLog(sample+' originalWasmBytecodeOffset=123'));
 assert.throws(()=>parseDiagnosticSignalLog(sample+' originalFirstAttemptFailureMatched=true'));
});
