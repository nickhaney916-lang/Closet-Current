/**
 * M233 genuine installed original SegFormer source-owner browser identity gate.
 * Reuses P102's strict untouched native positive assertions, without monkey-
 * patching the Worker, outputs, or model. Never conflates green with fixed.
 */
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {examineNativeOrtRuntime233} from './lib/main233-ort-runtime-identity.mjs';

const filename='scripts/test-parallel102-ort-runtime-compat-browser.mjs';
const src=await readFile(filename);
const sha1blob=bytes=>createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
assert.equal(sha1blob(src),'5bd2186372ac24428ddc957e4f3050acb3351b7c',
 'P102 genuine native browser positive test changed — independent review required');
const engine=process.env.M58_ENGINE||'webkit',width=Number(process.env.P94_WIDTH||430);
assert.ok(['webkit','chromium'].includes(engine));
assert.ok([320,390,430].includes(width));
const observations=[];
for(const mode of ['baseline','fixed-simd']){
 const run=spawnSync(process.execPath,[filename],{
  env:{...process.env,M58_ENGINE:engine,P94_WIDTH:String(width),
   P102_MODE:mode,M214_ATTEMPT:'M233-'+engine+'-'+width+'-'+mode},
  encoding:'utf8',maxBuffer:12*1024*1024,timeout:20*60*1000
 });
 if(run.error)throw Error('M233 genuine source model process failed: '+run.error.name);
 assert.equal(run.status,0,'M233 original positive model/private owner journey RED: '+engine+' '+width+' '+mode);
 const lines=run.stdout.split(/\r?\n/).filter(x=>x.includes('M214_REAL_P94_WORKER_OUTCOME '));
 assert.equal(lines.length,1,'M233 expected exactly ONE original real model positive receipt');
 const r=JSON.parse(lines[0].slice(lines[0].indexOf('M214_REAL_P94_WORKER_OUTCOME ')+
  'M214_REAL_P94_WORKER_OUTCOME '.length));
 assert.equal(r.engine,engine);
 assert.equal(r.width,width);
 assert.equal(r.p102Mode,mode);
 assert.equal(r.success,true,'original real model false positive must not be hidden');
 assert.ok(Number.isInteger(r.cards)&&r.cards>0&&r.cards<=12,
  'original real model required >0 proposals');
 const evidence=examineNativeOrtRuntime233({
  mode,assets:r.p102RuntimeAssets,realPositive:true,sourceLocked:true
 });
 assert.equal(evidence.status,'observed-not-a-fix','no CPU-only runtime was actually proven by original fixture');
 assert.equal(evidence.family,'jsep','P102 pinned baseline identity changed — re-review required');
 assert.equal(evidence.cpuOnlyProven,false);
 assert.equal(evidence.permanentWebKitRepairProven,false);
 observations.push({mode,engine,width,cards:r.cards,
  family:evidence.family,loader:evidence.loader,wasm:evidence.wasm,
  actualCpuOnlySelected:false,modelPassed:true});
 console.log('M233_ORIGINAL_TRUE_BROWSER_ASSET_IDENTITY_NOT_FIXED',
  JSON.stringify(observations[observations.length-1]));
}
assert.equal(observations[0].loader,observations[1].loader);
assert.equal(observations[0].wasm,observations[1].wasm);
console.log('M233_NATIVE_ORIGINAL_ORT_BOTH_MODES_SAME_JSEP_PASS',
 JSON.stringify({engine,width,originalTrueModels:2,actualCpuOnlySelected:false,
  permanentWebKitRepairProven:false,releaseAuthorized:false,familyAlpha:'HOLD'}));
