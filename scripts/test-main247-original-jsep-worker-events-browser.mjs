/**
 * M247 original P94 product Worker, genuine real-photo/JSEP and owner test.
 * Only a disposable browser test is augmented. The installed product Worker,
 * original model, private source, stage, and actual native WASM remain intact.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const parent='scripts/test-main245-real-p94-runtime-identity-browser.mjs';
const original=await readFile(parent);
const gitBlob=bytes=>createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
assert.equal(gitBlob(original),'814fdae7a4e0ffd28c82746ec40a356b2836e463','Original M245 donor drift');
assert.equal(gitBlob(await readFile('public/outfit-worker-p94.mjs')),
 'd66651b616de54c51eb7ef986324b30f1580888f','Original P94 Worker changed');
assert.equal(gitBlob(await readFile('scripts/test-parallel94-native-p88-browser.mjs')),
 '4f75a40cf153fa4b4d139d782b202dbe7bc55e41','Original original-photo browser test drift');
let wrapper=original.toString('utf8');
const once=(needle,name)=>assert.equal(wrapper.split(needle).length,2,'M245 '+name+' changed');
const injectionAnchor="const temp=resolve('scripts/.main245-original-p94-CDN-identity.mjs');";
once(injectionAnchor,'temporary file');
const extra=[
 "// M247 augments only disposable real-original test code, NOT the original Worker.",
 "const addOnce=(needle,label)=>assert.equal(derived.split(needle).length,2,label+' source anchor changed');",
 "const m245Import=\"import {classifyPinnedPublicRuntime,digestPublicRuntimeResponse,installedOrtWasmFingerprints,attestP94LoadedRuntime,independentlyFetchPinnedWasm} from './main245-original-worker-cdn-wasm-identity.mjs';\";",
 "addOnce(m245Import,'M245 real runtime import');",
 "derived=derived.replace(m245Import,m245Import+\"\\nimport {classifyOriginalJsepTimeline,sanitizeWorkerLifecycle} from './main247-original-jsep-lifecycle.mjs';\");",
 "const eventsArray='const m245Assets=[],m245Pending=[];';",
 "addOnce(eventsArray,'M245 network event source');",
 "derived=derived.replace(eventsArray,eventsArray+'\\nconst m247Events=[];let m247Dropped=0;');",
 "const pageAnchor='const page=await context.newPage();';",
 "addOnce(pageAnchor,'original browser page');",
 "const eventProbe=[",
 " \"await context.exposeBinding('__m247WorkerLifecycle',(_source,data)=>{\",",
 " \" try{m247Events.push({elapsedMs:Math.round(performance.now()-started),...sanitizeWorkerLifecycle(data)});}\",",
 " \" catch{m247Dropped++;}\",",
 " \"});\",",
 " \"await context.addInitScript(()=>{\",",
 " \" const NativeWorker=window.Worker;\",",
 " \" function ObservedWorker(...args){\",",
 " \"  const worker=new NativeWorker(...args);\",",
 " \"  let originalP94=false;\",",
 " \"  try{originalP94=new URL(String(args[0]),location.href).pathname==='/public/outfit-worker-p94.mjs';}catch{}\",",
 " \"  if(originalP94)worker.addEventListener('message',event=>{\",",
 " \"   const data=event.data;\",",
 " \"   if(!data||!['progress','piece','done','error'].includes(data.type))return;\",",
 " \"   void window.__m247WorkerLifecycle({type:data.type,phase:data.phase,reason:data.reason});\",",
 " \"  });\",",
 " \"  return worker;\",",
 " \" }\",",
 " \" ObservedWorker.prototype=NativeWorker.prototype;\",",
 " \" Object.setPrototypeOf(ObservedWorker,NativeWorker);\",",
 " \" window.Worker=ObservedWorker;\",",
 " \"});\"",
 "].join('\\n');",
 "derived=derived.replace(pageAnchor,eventProbe+'\\n '+pageAnchor);",
 "const fullJourney=\"console.log('P91_FULL_JOURNEY_PASS'\";",
 "addOnce(fullJourney,'owner A/B private backup and original photo acceptance');",
 "derived=derived.replace(fullJourney,",
 " \"assert.equal(m247Dropped,0,'Invalid original Worker metadata rejected');\\n\"+",
 " \"const m247Original=classifyOriginalJsepTimeline(actualM245,m247Events,{outcome:'success',ownerGuardPassed:true});\\n\"+",
 " \"console.log('M247_ORIGINAL_JSEP_WORKER_MODEL_TO_PRIVATE_OWNER_PASS',JSON.stringify({\"+",
 " \"engine,width,...m247Original,workerUnmodified:true,privatePayloadsCollected:false,originalOwnerAndSource2dV4Positive:true}));\\n \"+",
 " fullJourney);",
 "const errorAnchor=\"}catch(e){\\n console.log('M245_ORIGINAL_FAILURE_ASSET_BOUNDARY'\";",
 "addOnce(errorAnchor,'original browser catch must remain real RED');",
 "derived=derived.replace(errorAnchor,",
 " \"}catch(e){\\n console.log('M247_ORIGINAL_JSEP_FAILURE_TIMELINE',JSON.stringify({\"+",
 " \"engine,width,workerEventMetadata:m247Events.slice(-24),invalidMetadata:m247Dropped,\"+",
 " \"originalWasmHttp200Observed:m245Assets.some(x=>x.kind==='onnx-wasm'&&x.name==='ort-wasm-simd-threaded.jsep.wasm'&&x.status===200),\"+",
 " \"originalBrowserFailed:true,causalRepairProven:false,releaseAuthorized:false}));\\n\"+",
 " \" console.log('M245_ORIGINAL_FAILURE_ASSET_BOUNDARY'\");",
 "assert.ok(derived.includes('state.cards>0&&state.cards<=12'));",
 "assert.ok(derived.includes('M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS'));",
 "assert.ok(derived.includes('M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY'));",
 "assert.ok(derived.includes('M247_ORIGINAL_JSEP_WORKER_MODEL_TO_PRIVATE_OWNER_PASS'));"
].join('\n');
wrapper=wrapper.replace(injectionAnchor,extra+"\nconst temp=resolve('scripts/.main247-original-jsep-events.mjs');");
wrapper=wrapper.replaceAll('M245_SOURCE_ONLY','M247_SOURCE_ONLY').replaceAll('M245_ENGINE','M247_ENGINE');
const temp=resolve('scripts/.main247-disposable-source-adapter.mjs');
const engine=process.env.M247_ENGINE||'webkit';
assert.ok(['chromium','webkit'].includes(engine));
try{
 await writeFile(temp,wrapper,{flag:'wx'});
 const syntax=spawnSync(process.execPath,['--check',temp],{encoding:'utf8',timeout:30000});
 if(syntax.error)throw syntax.error;
 assert.equal(syntax.status,0,'M247 derived adapter syntax error: '+String(syntax.stderr||'').slice(0,400));
 const child=spawnSync(process.execPath,[temp],{
  stdio:'inherit',env:{...process.env,M247_ENGINE:engine},timeout:24*60*1000
 });
 if(child.error)throw child.error;
 assert.equal(child.status,0,'M247 original Worker/JSEP model/owner or evidence gate RED');
}finally{await rm(temp,{force:true});}
