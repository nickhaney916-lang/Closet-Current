/**
 * M237 - Passive JS-visible WebAssembly.Memory.grow probe on the real,
 * source-locked P101/P94 SegFormer model initialization path.
 *
 * This is not a WASM-internal memory.grow tracer. The WASM instruction can
 * grow linear memory without invoking the JavaScript Memory.prototype.grow
 * method; zero observed JS calls is NOT proof of no native memory growth.
 * Never collect photos, weights, tensors, URLs, exception strings or users.
 * A genuine model-load failure is still RED, never retry-to-green.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';

const basePath='scripts/test-parallel101-real-p94-model-init-stage-browser.mjs';
const bytes=await readFile(basePath);
const blob=bytes=>createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
assert.equal(blob(bytes),'ad8ab0eb33322a34f8cc3f45a1fe26feff87b2ab',
 'P101 pinned diagnostic parent changed; re-audit original');
const original=bytes.toString('utf8');
const unique=(text,anchor,label)=>assert.equal(text.split(anchor).length,2,label+' source moved');
const collectorAnchor=' "       stageOnly:true,",';
unique(original,collectorAnchor,'P101 sanitized diagnostic collector');
const fields=[
 ' "       growCalls:Number.isInteger(safe.growCalls)&&safe.growCalls>=0&&safe.growCalls<=100000?safe.growCalls:null,",',
 ' "       growFailures:Number.isInteger(safe.growFailures)&&safe.growFailures>=0&&safe.growFailures<=100000?safe.growFailures:null,",',
 ' "       maxBeforePages:Number.isInteger(safe.maxBeforePages)&&safe.maxBeforePages>=0&&safe.maxBeforePages<=65536?safe.maxBeforePages:null,",',
 ' "       maxAfterPages:Number.isInteger(safe.maxAfterPages)&&safe.maxAfterPages>=0&&safe.maxAfterPages<=65536?safe.maxAfterPages:null,",',
 ' "       memoryHookInstalled:safe.memoryHookInstalled===true,",',
 ' "       memoryErrorClass:[\'none\',\'Error\',\'TypeError\',\'RangeError\',\'RuntimeError\',\'other\'].includes(safe.memoryErrorClass)?safe.memoryErrorClass:\'other\',",'
].join('\n');
let derived=original.replace(collectorAnchor,fields+'\n'+collectorAnchor);
const origHook="diagWorker=diagWorker.replace(p101ModelAnchor, '  p101WasmProbe(requestId);\\n'+p101ModelAnchor);";
unique(derived,origHook,'P101 native WebAssembly probe installation');

const workerProbe=String.raw