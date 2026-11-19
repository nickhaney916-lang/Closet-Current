/**
 * M245 original P94 native browser acceptance with passive, SHA256-only
 * public runtime fetch fingerprints. This executes the UNMODIFIED original
 * product Worker, public source, true model, owner review/2D/v4/privacy.
 * It instruments a temporary copy of the pinned original browser harness,
 * never the Worker, source, remote CDN, auth, model graph or WASM allocation.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

const path='scripts/test-parallel94-native-p88-browser.mjs';
const original=await readFile(path);
const gitBlob=bytes=>createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
assert.equal(gitBlob(original),'4f75a40cf153fa4b4d139d782b202dbe7bc55e41',
 'Original P94 genuine photo/owner browser harness drifted');
assert.equal(gitBlob(await readFile('public/outfit-worker-p94.mjs')),
 'd66651b616de54c51eb7ef986324b30f1580888f','Actual installed P94 Worker changed');
const assertOne=(source,needle,label)=>assert.equal(source.split(needle).length,2,label+' exact-source anchor changed');
let derived=original.toString('utf8');
const imports="import assert from 'node:assert/strict';";
assertOne(derived,imports,'original P94 import');
derived=derived.replace(imports,imports+
 "\nimport {classifyPinnedPublicRuntime,digestPublicRuntimeResponse,installedOrtWasmFingerprints,attestP94LoadedRuntime} from './main245-original-worker-cdn-wasm-identity.mjs';");
const start='const external=[],rejected=[],issues=[],modelResponses=[];';
assertOne(derived,start,'original outbound request recorder');
derived=derived.replace(start,start+'\nconst m245Assets=[],m245Pending=[];');
const route=" await context.route('**/*',route=>{";
assertOne(derived,route,'real browser network route');
const listener=[
 " // M245: native ORIGINAL browser worker public-CDN JS/WASM response hashes.",
 " // Never inspect HTTPS auth, models, source originals, CDN query params or owner requests.",
 " context.on('response',response=>{",
 "  const asset=classifyPinnedPublicRuntime(response.url());",
 "  if(!asset)return;",
 "  const task=(async()=>{",
 "   try{",
 "    const status=response.status();",
 "    const bytes=status===200?await response.body():null;",
 "    m245Assets.push(digestPublicRuntimeResponse(asset,status,bytes));",
 "   }catch{m245Assets.push(digestPublicRuntimeResponse(asset,0,null));}",
 "  })();",
 "  m245Pending.push(task);",
 " });"
].join('\n');
derived=derived.replace(route,listener+'\n'+route);
const afterReal=' assert.ok(/unverified region/.test(state.status),\'Never call the proposals confirmed\');';
assertOne(derived,afterReal,'original genuine model positive assertion');
const evidence=[
 " await Promise.allSettled(m245Pending);",
 " const localM245=await installedOrtWasmFingerprints(root);",
 " const actualM245=attestP94LoadedRuntime(m245Assets,localM245);",
 " console.log('M245_REAL_P94_WASM_ASSET_IDENTITY',JSON.stringify({",
 "  engine,width,...actualM245,originalOwnerSuccessLaterRequired:true",
 " }));"
].join('\n');
derived=derived.replace(afterReal,afterReal+'\n'+evidence);
// A genuine RED is not converted to a pass. This diagnostic is emitted only
// for network-fingerprint progress; the ORIGINAL browser catch remains nonzero.
const catchAnchor="}catch(e){\n console.error('M58_REAL_P88_WORKER_FAIL'";
assertOne(derived,catchAnchor,'original fail-closed browser catch');
derived=derived.replace(catchAnchor,
 "}catch(e){\n console.log('M245_ORIGINAL_FAILURE_ASSET_BOUNDARY',JSON.stringify({"+
 "engine,publicRuntimeResources:m245Assets.length,pendingCount:m245Pending.length,"+
 "hashedWasm:m245Assets.filter(x=>x.kind==='onnx-wasm'&&x.available).length,"+
 "originalBrowserFailure:true,causalFixProven:false,releaseAuthorized:false}));"+
 "\n console.error('M58_REAL_P88_WORKER_FAIL'");
assert.ok(derived.includes('state.cards>0&&state.cards<=12'));
assert.ok(derived.includes('M58_GENUINE_WORKER_SAVED_2D_OWNER_SWITCH_PRIVACY'));
assert.ok(derived.includes('M61_GENUINE_P88_TO_PRIVATE_OWNER_V4_RESTORE_SAME_SESSION_PASS'));
assert.ok(derived.includes("M245_REAL_P94_WASM_ASSET_IDENTITY"));
const temp=resolve('scripts/.main245-original-p94-CDN-identity.mjs');
const engine=process.env.M245_ENGINE||'webkit';
assert.ok(['chromium','webkit'].includes(engine));
try{
 await writeFile(temp,derived,{flag:'wx'});
 const syntax=spawnSync(process.execPath,['--check',temp],{encoding:'utf8',timeout:30000});
 if(syntax.error)throw syntax.error;
 assert.equal(syntax.status,0,'M245 disposable original browser test syntax RED: '+String(syntax.stderr||'').slice(0,350));
 if(process.env.M245_SOURCE_ONLY==='1'){
  console.log('M245_ORIGINAL_SOURCE_ASSET_PROBE_READY',JSON.stringify({
   originalWorkerSourcePinned:true,originalP94BrowserPinned:true,
   onlyPublicCDNHashing:true,actualNetworkIdentityPending:true,
   originalOwnerPhotoAndPrivacyGatesIntact:true,releaseAuthorized:false,hold:true}));
 }else{
  const run=spawnSync(process.execPath,[temp],{
   env:{...process.env,M58_ENGINE:engine,P94_WIDTH:'390'},
   stdio:'inherit',timeout:21*60*1000
  });
  if(run.error)throw run.error;
  assert.equal(run.status,0,'M245 unchanged real P94 model/owner/2D/v4 or public runtime asset RED');
 }
}finally{await rm(temp,{force:true});}
