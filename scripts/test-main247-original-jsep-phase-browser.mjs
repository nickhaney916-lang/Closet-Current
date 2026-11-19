/**
 * M247: disposable source-pinned P101 original Worker/browser extension.
 * Connect real JSEP public WASM identity to same-run genuine Worker
 * model-session phase; original owner/photo 2D/v4 assertions intact.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';

const parent='scripts/test-parallel101-real-p94-model-init-stage-browser.mjs';
const original=await readFile(parent);
const gitBlob=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
assert.equal(gitBlob(original),'ad8ab0eb33322a34f8cc3f45a1fe26feff87b2ab','Original P101 source drifted');
assert.equal(gitBlob(await readFile('public/outfit-worker-p94.mjs')),
 'd66651b616de54c51eb7ef986324b30f1580888f','Shipping P94 Worker drift');
const one=(source,anchor,label)=>assert.equal(source.split(anchor).length,2,'Source anchor drift '+label);
let derived=original.toString('utf8');
const adaptStart='const adapted=originalWithNegative.replace(originalRead,overrideRead)';
one(derived,adaptStart,'P101 original browser adapter');
derived=derived.replace(adaptStart,'let adapted=originalWithNegative.replace(originalRead,overrideRead)');
const TEMP="const temp=resolve('scripts/.parallel101-real-model-stage-probe.mjs');";
one(derived,TEMP,'P101 generated temporary original browser source');
const extra="\n// M247: operate on the exact immutable P101-generated original browser journey.\nconst m247Unique=(needle,label)=>assert.equal(adapted.split(needle).length,2,'M247 '+label+' moved');\nconst m247Import=\"import assert from 'node:assert/strict';\";\nm247Unique(m247Import,'original browser import');\nadapted=adapted.replace(m247Import,m247Import+\n \"\\nimport {originalJsepReceipt} from './main247-original-jsep-phase-evidence.mjs';\"+\n \"\\nimport {classifyPinnedPublicRuntime,digestPublicRuntimeResponse} from './main245-original-worker-cdn-wasm-identity.mjs';\");\nconst m247Counters='const external=[],rejected=[],issues=[],modelResponses=[];';\nm247Unique(m247Counters,'native browser counters');\nadapted=adapted.replace(m247Counters,m247Counters+'\\nconst m247Assets=[],m247Pending=[];');\nconst m247Route=\" await context.route('**/*',route=>{\";\nm247Unique(m247Route,'native original request route');\nconst m247Listener=[\n \" // Strict public CDN only; never inspect owner auth, photo, model weights or URL queries.\",\n \" context.on('response',response=>{\",\n \"  const asset=classifyPinnedPublicRuntime(response.url());\",\n \"  if(!asset)return;\",\n \"  const task=(async()=>{\",\n \"   const status=response.status();let body=null;\",\n \"   if(status===200){try{await response.finished();body=await response.body();}catch{}}\",\n \"   m247Assets.push(digestPublicRuntimeResponse(asset,status,body));\",\n \"  })();\",\n \"  m247Pending.push(task);\",\n \" });\"\n].join('\\n');\nadapted=adapted.replace(m247Route,m247Listener+'\\n'+m247Route);\nconst m247Emit=\"  assert.ok(evidence.workerEvents.some(e=>e.type==='diagnostic')\";\nm247Unique(m247Emit,'real model stage acceptance');\nconst m247Output=[\n \"  await Promise.allSettled(m247Pending);\",\n \"  const m247Summary=originalJsepReceipt({\",\n \"   engine,width,network:m247Assets.map(x=>({\",\n \"    kind:x.kind,name:x.name,status:x.status,bodyAvailable:x.available,\",\n \"    sha256:x.sha256,bytes:x.bytes\",\n \"   })),events:evidence.workerEvents,\",\n \"   originalWorkerSeen:evidence.actualWorkerSeen,\",\n \"   originalModelAttempted:evidence.realModelAttempted,cards:evidence.cards,\",\n \"   intentionalNegative:process.env.P101_TEST_FAULT==='model_weights_abort'\",\n \"  });\",\n \"  console.log('M247_REAL_ORIGINAL_JSEP_PHASE',JSON.stringify(m247Summary));\"\n].join('\\n');\nadapted=adapted.replace(m247Emit,m247Output+'\\n'+m247Emit);\nassert.ok(adapted.includes('state.cards>0&&state.cards<=12'),'Real original card assertion removed');\nassert.ok(adapted.includes('P101_CONTROLLED_PUBLIC_ONNX_ABORT_FALLBACK_PASS'),'Genuine manual fallback removed');\nassert.ok(adapted.includes('M247_REAL_ORIGINAL_JSEP_PHASE'),'Native same-run JSEP trace removed');";
derived=derived.replace(TEMP,extra+'\n'+TEMP);
const start=" const run=spawnSync(process.execPath,[temp],{";
one(derived,start,'P101 real browser subprocess');
derived=derived.replace(start,[
 " const syntax=spawnSync(process.execPath,['--check',temp],{encoding:'utf8',timeout:30000});",
 " if(syntax.error)throw syntax.error;",
 " assert.equal(syntax.status,0,'M247 generated native source syntax RED: '+String(syntax.stderr||'').slice(0,350));",
 " if(process.env.M247_SOURCE_ONLY==='1'){",
 "  console.log('M247_ORIGINAL_P101_JSEP_SOURCE_READY',JSON.stringify({",
 "   sourceLocked:true,realModelProposalsRequired:true,privateOwnerRequired:true,",
 "   originalWebkitRedPreserved:true,originalJsepProofPending:true,",
 "   releaseAuthorized:false,familyAlphaHold:true",
 "  }));",
 " }else{",
 start
].join('\n'));
const end="  'P101 true P94 model/owner failure; preserve RED and bounded stage metadata');";
one(derived,end,'original P101 native result gate');
derived=derived.replace(end,end+"\n }");
assert.ok(derived.includes('if(process.env.M247_SOURCE_ONLY'));
assert.ok(derived.includes('originalJsepReceipt'));
const temp=resolve('scripts/.main247-disposable-original-jsep-p101.mjs');
const engine=process.env.M247_ENGINE||'webkit',width=String(process.env.M247_WIDTH||390);
assert.ok(['webkit','chromium'].includes(engine));
assert.ok(['320','390','430'].includes(width));
try{
 await writeFile(temp,derived,{flag:'wx'});
 const check=spawnSync(process.execPath,['--check',temp],{encoding:'utf8',timeout:30000});
 if(check.error)throw check.error;
 assert.equal(check.status,0,'M247 derived P101 syntax invalid: '+String(check.stderr||'').slice(0,350));
 const run=spawnSync(process.execPath,[temp],{
  env:{...process.env,M58_ENGINE:engine,P94_WIDTH:width,
   P101_CACHE_MODE:'baseline',P101_SESSION_MODE:'baseline',
   M214_ATTEMPT:'M247-'+engine+'-'+width},
  stdio:'inherit',timeout:22*60*1000
 });
 if(run.error)throw run.error;
 assert.equal(run.status,0,'M247 genuine original JSEP/source/owner acceptance RED; no retry-to-green');
}finally{await rm(temp,{force:true});}
