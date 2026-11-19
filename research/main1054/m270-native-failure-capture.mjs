import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { deriveM269 } from './m269-webkit-graph-optimization-runtime-ab.mjs';

const diagnosticPrefix = 'M270_NATIVE_FAILURE ';
const workerPath = '/public/outfit-worker-p94.mjs';

// Serialized into the disposable Worker. Output is limited to fixed enums and
// numeric WASM frame identities. Never forward error messages or raw stacks.
export function nativeFailure(stage, error) {
  const message = String(error?.message ?? '');
  const stack = String(error?.stack ?? '');
  let kind = 'other';
  if (/out of bounds memory access|memory access out of bounds|out.of.bounds memory/i.test(message)) {
    kind = 'wasm-memory-access';
  } else if (error instanceof WebAssembly.RuntimeError) {
    kind = 'wasm-runtime-error';
  } else if (/failed to create session|OrtCreateSession/i.test(message)) {
    kind = 'ort-session-error';
  }
  const wasmFrames = Array.from(
    stack.matchAll(/wasm-function\[([0-9]{1,9})\](?::0x([0-9a-f]{1,12}))?/gi),
    match => ({ index: Number(match[1]), offset: match[2] ?? null }),
  ).slice(0, 8);
  return { stage, kind, wasmFrames };
}

function replaceOne(source, anchor, replacement) {
  if (source.indexOf(anchor) < 0 || source.indexOf(anchor) !== source.lastIndexOf(anchor)) {
    throw new Error('Missing or ambiguous diagnostic source anchor');
  }
  return source.replace(anchor, () => replacement);
}

export function deriveNativeCapture(originalRunner, originalWorker) {
  // Reuse the exact pinned source validation and network witnesses from M269.
  let runner = deriveM269(originalRunner, originalWorker, 'baseline');
  let worker = replaceOne(originalWorker, 'let loader;', `
const nativeFailure = ${nativeFailure.toString()};
let nativeStage = 'startup';
let loader;`);
  const anchors = [
    ['  const {AutoModelForSemanticSegmentation', 'runtime-import'],
    ['  const processor=await AutoProcessor.from_pretrained', 'processor-load'],
    ['  const model=await AutoModelForSemanticSegmentation.from_pretrained', 'model-session-load'],
    ['  const image=await RawImage.read', 'image-decode'],
    ['  const output=await model(await processor(image))', 'preprocess-and-inference'],
  ];
  for (const [anchor, stage] of anchors) {
    worker = replaceOne(worker, anchor, `  nativeStage='${stage}';\n${anchor}`);
  }
  const catchAnchor = "}catch{self.postMessage({type:'error',id:request.id,text:'This outfit";
  worker = replaceOne(worker, catchAnchor,
    `}catch(error){console.info(${JSON.stringify(diagnosticPrefix)}+JSON.stringify(nativeFailure(nativeStage,error)));` +
    catchAnchor.slice('}catch{'.length));
  const readAnchor = '  const body=await readFile(absolute);';
  runner = replaceOne(runner, readAnchor,
    `  const body=path===${JSON.stringify(workerPath)}?Buffer.from(${JSON.stringify(worker)},'utf8'):await readFile(absolute);`);
  runner = replaceOne(runner, ' const page=await context.newPage();', ` const page=await context.newPage();
 context.on('console',message=>{
  const line=message.text();
  if(line.startsWith(${JSON.stringify(diagnosticPrefix)}) && line.length<1000) console.log(line);
 });`);
  // Drop the M269 baseline marker because the served Worker includes diagnostics.
  runner = runner.slice(runner.indexOf('\n') + 1);
  const hash = createHash('sha256').update(worker).digest('hex');
  const claim = "actualWorkerSourceBlob:'ab7d3837139c5b7d693383f9d6617e199ec8de4f'";
  return replaceOne(runner, claim, `actualWorkerSourceBlob:'m270-disposable-diagnostic-${hash}'`);
}

const stages = new Set([
  'startup', 'runtime-import', 'processor-load', 'model-session-load',
  'image-decode', 'preprocess-and-inference',
]);
const kinds = new Set(['other', 'wasm-memory-access', 'wasm-runtime-error', 'ort-session-error']);

export function captureReceipt(log, ordinal, exitCode) {
  const lines = log.split(/\r?\n/);
  const diagnostics = [];
  for (const line of lines.filter(line => line.startsWith(diagnosticPrefix))) {
    const { stage, kind, wasmFrames } = JSON.parse(line.slice(diagnosticPrefix.length));
    if (!stages.has(stage) || !kinds.has(kind) || !Array.isArray(wasmFrames) ||
        wasmFrames.length > 8 || !wasmFrames.every(({ index, offset }) =>
          Number.isInteger(index) && index >= 0 && index <= 999999999 &&
          (offset === null || (typeof offset === 'string' && /^[0-9a-f]{1,12}$/i.test(offset))))) {
      throw new Error('Unexpected native diagnostic receipt');
    }
    diagnostics.push({ stage, kind, wasmFrames: wasmFrames.map(({ index, offset }) => ({ index, offset })) });
  }
  return {
    ordinal,
    exitCode,
    originalJourneyPassed: exitCode === 0 && lines.some(line => line.startsWith('P91_FULL_JOURNEY_PASS ')),
    originalJourneyFailed: lines.some(line => line.startsWith('M58_REAL_P88_WORKER_FAIL ')),
    diagnostics,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [command, logPath, ordinal, exitCode] = process.argv.slice(2);
  if (command === 'receipt') {
    console.log(JSON.stringify(captureReceipt(readFileSync(logPath, 'utf8'), Number(ordinal), Number(exitCode))));
  } else {
    const runner = readFileSync('scripts/test-parallel94-native-p88-browser.mjs', 'utf8');
    const worker = readFileSync('public/outfit-worker-p94.mjs', 'utf8');
    writeFileSync('scripts/.m270-native-failure-capture.mjs', deriveNativeCapture(runner, worker));
  }
}
