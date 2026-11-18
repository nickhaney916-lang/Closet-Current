/**
 * Assignment #102: source-pinned native A/B of original P94 ORT/WASM
 * versus the documented fixed-SIMD environment option.
 * RESEARCH-ONLY: not a production fix or a claim these modes differ.
 * Preserve all genuine positive assertions, model, JPEG and owner journey.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';

const mode=process.env.P102_MODE||'baseline';
assert.ok(['baseline','fixed-simd'].includes(mode),'P102 limited to pinned modes');
assert.ok(['chromium','webkit'].includes(process.env.M58_ENGINE||'webkit'));
assert.ok(['320','390','430'].includes(process.env.P94_WIDTH||'430'));
const originalPath='scripts/test-parallel101-real-p94-model-init-stage-browser.mjs';
const original=await readFile(originalPath,'utf8');
const gitBlobSHA=bytes=>createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
assert.equal(gitBlobSHA(Buffer.from(original,'utf8')),
 '142d496e0fa54452a16dbb68120622ca6885ed90',
 'P101 pinned diagnostic changed: a re-audit is required');
let candidate=original;
function replaceOnce(needle,replacement){
 assert.equal(candidate.split(needle).length,2,'P102 pinned insertion point moved: '+needle.slice(0,50));
 candidate=candidate.replace(needle,replacement);
}
replaceOnce("const workerSource=workerBytes.toString('utf8');",[
 "let workerSource=workerBytes.toString('utf8');",
 "if(process.env.P102_MODE==='fixed-simd'){",
 " const p102Setup=\"env.allowLocalModels=false;env.useBrowserCache=true;env.backends.onnx.wasm.numThreads=1;env.backends.onnx.wasm.proxy=false;\";",
 " assert.equal(workerSource.split(p102Setup).length,2,'P94 pinned ORT setup changed');",
 " workerSource=workerSource.replace(p102Setup,p102Setup+\"env.backends.onnx.wasm.simd='fixed';\");",
 "}",
 "// Explicitly set fixed SIMD ONLY in this disposable Worker. Never change",
 "// ONNX/Transformers package, WASM binary, model, masks or owner data."
].join('\n'));
const requestAssetProbe="  context.on('request',request=>{try{const u=new URL(request.url());const file=u.pathname.split('/').at(-1)||'';if(/^(?:ort-wasm[^/]*\\.(?:wasm|mjs)|transformers\\.min\\.js)$/i.test(file)&&p102RuntimeAssets.length<32)p102RuntimeAssets.push(file);}catch{}});";
replaceOnce('const init=[','const init=[\n'+[
 '  // P102: collect only library/WASM filenames; never collect URLs or image data.',
 '  const p102RuntimeAssets=[];',
 requestAssetProbe
].map(s=>' '+JSON.stringify(s)+',').join('\n'));
replaceOnce(' "   status:m214.status,cards:m214.cards,workerEvents:m214.messages,",',[
 '   p102Mode:process.env.P102_MODE||"baseline",',
 '   p102RuntimeAssets:[...new Set(p102RuntimeAssets)],',
 '   status:m214.status,cards:m214.cards,workerEvents:m214.messages,'
].map(s=>' '+JSON.stringify(s)+',').join('\n'));
const temp=resolve('scripts/.parallel102-runtime-compat-probe.mjs');
try{
 await writeFile(temp,candidate,{flag:'wx'});
 const check=spawnSync(process.execPath,['--check',temp],{encoding:'utf8',timeout:30000});
 if(check.error)throw check.error;
 assert.equal(check.status,0,'P102 adapter syntax error: '+String(check.stderr));
 console.log('P102_RUNTIME_MODE',JSON.stringify({
  mode,engine:process.env.M58_ENGINE||'webkit',
  width:process.env.P94_WIDTH||'430',
  sourcePinned:true,installedWorkerUnmodified:true,modelUnmodified:true,
  wasmBinaryUnmodified:true,positiveCardAssertionUnmodified:true,
  productFixClaim:false
 }));
 const run=spawnSync(process.execPath,[temp],{
  env:{...process.env,P102_MODE:mode},stdio:'inherit',timeout:19*60*1000
 });
 if(run.error)throw run.error;
 assert.equal(run.status,0,'P102 true original model/owner journey RED');
}finally{await rm(temp,{force:true});}
