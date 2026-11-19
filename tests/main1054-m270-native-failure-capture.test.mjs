import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { Script } from 'node:vm';
import {
  deriveNativeCapture,
  nativeFailure,
} from '../research/main1054/m270-native-failure-capture.mjs';

test('native trap receipt keeps numerical WASM locations and discards raw error data', () => {
  const error = new WebAssembly.RuntimeError('Out of bounds memory access private-data');
  error.stack = 'private-data@https://example.test/secret\nwasm-function[45]:0x12fe\nwasm-function[7]';
  assert.deepEqual(nativeFailure('model-session-load', error), {
    stage: 'model-session-load',
    kind: 'wasm-memory-access',
    wasmFrames: [{ index: 45, offset: '12fe' }, { index: 7, offset: null }],
  });
  assert.equal(nativeFailure('runtime-import', new TypeError('Failed to fetch')).kind, 'other');
});

test('disposable runner serves a valid instrumented Worker without changing model or error handling', () => {
  const runner = readFileSync('scripts/test-parallel94-native-p88-browser.mjs', 'utf8');
  const worker = readFileSync('public/outfit-worker-p94.mjs', 'utf8');
  const capture = deriveNativeCapture(runner, worker);
  const encoded = capture.match(/\?Buffer\.from\(("(?:[^"\\]|\\.)*"),'utf8'\)/)[1];
  const diagnosticWorker = JSON.parse(encoded);
  const scriptCompatible = diagnosticWorker.replaceAll('import.meta.url', '"http://localhost/"');
  new Script(scriptCompatible);
  const modelLine = worker.split('\n').find(line => line.includes('AutoModelForSemanticSegmentation.from_pretrained'));
  assert.ok(diagnosticWorker.includes(modelLine));
  assert.ok(diagnosticWorker.includes("self.postMessage({type:'error',id:request.id,text:'This outfit"));
  assert.ok(capture.includes('m270-disposable-diagnostic-'));
  assert.ok(capture.includes('Genuine P88 browser worker did not produce a bounded actual model proposal'));
  assert.throws(() => deriveNativeCapture(runner, worker + '\n'), /Worker Git blob drift/);
});
