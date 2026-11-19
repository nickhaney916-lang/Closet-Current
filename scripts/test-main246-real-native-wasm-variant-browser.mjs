/**
 * M246 disposably adds ONLY public local ONNX WASM byte/network observation to
 * exact original M243 SegFormer graph session. Original export/model/session,
 * error behaviour and root cause remain untouched; never retry a native RED.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

const originalPath='scripts/test-main243-original-segformer-native-session-browser.mjs';
const original=await readFile(originalPath);
const blob=x=>createHash('sha1').update('blob '+x.length+'\0').update(x).digest('hex');
assert.equal(blob(original),'fdfb979ca3783cb362cb5eb909612902af0c3b70','Original M243 native session source drifted');
assert.equal(blob(await readFile('public/outfit-worker-p94.mjs')),
 'd66651b616de54c51eb7ef986324b30f1580888f','Original P94 installed Worker changed');
const one=(s,a)=>assert.equal(s.split(a).length,2,'M246 source anchor missing/ambiguous: '+a.slice(0,75));
let transformed=original.toString('utf8');
const insertion="import assert from 'node:assert/strict';";
one(transformed,insertion);
transformed=transformed.replace(insertion,insertion+
 "\nimport {summarizeLocalPublicWasm,classifyLocalRuntimeResponse,attestM246NativeVariant} from './main246-local-ort-wasm-identity.mjs';"+
 "\nimport {installedOrtWasmFingerprints} from './main245-original-worker-cdn-wasm-identity.mjs';");
const server='async function serveLocal(){';
one(transformed,server);
transformed=transformed.replace(server,'const m246Served=[];\n'+server);
const serve='res.end(await readFile(path));';
one(transformed,serve);
transformed=transformed.replace(serve,[
 "const body=await readFile(path);",
 "if(path.endsWith('.wasm'))m246Served.push(summarizeLocalPublicWasm(path.split(sep).at(-1),body));",
 "res.end(body);"
].join('\n'));
const browser='const page=await context.newPage();';
one(transformed,browser);
transformed=transformed.replace(browser,[
 "const m246Network=[],m246Pending=[];",
 "context.on('response',response=>{",
 " const name=classifyLocalRuntimeResponse(response.url(),served.url);",
 " if(!name)return;",
 " const pending=(async()=>{",
 "  const status=response.status();let body=null;",
 "  if(status===200){try{await response.finished();body=await response.body();}catch{}}",
 "  const summary=body?.length>=100000?summarizeLocalPublicWasm(name,body):null;",
 "  m246Network.push({name,status,bodyAvailable:!!summary,",
 "   sha256:summary?.sha256??null,bytes:summary?.bytes??null});",
 " })();m246Pending.push(pending);",
 "});",
 browser
].join('\n'));
const receipt="console.log('M243_REAL_ORIGINAL_SEGFORMER_NATIVE_SESSION',JSON.stringify(receipt));";
one(transformed,receipt);
transformed=transformed.replace(receipt,receipt+'\n'+[
 "await Promise.allSettled(m246Pending);",
 "const m246Installed=await installedOrtWasmFingerprints(ROOT);",
 "const m246Attested=attestM246NativeVariant({server:m246Served,network:m246Network,",
 " installed:m246Installed,engine,arm});",
 "console.log('M246_REAL_NATIVE_ORIGINAL_WASM_VARIANT',JSON.stringify({",
 " ...m246Attested,originalGraphSha256:model.source.sha256,",
 " originalSegFormerSessionSucceeded:data.success,",
 " originalNativeExportCalled:data.nativeCalls?.length===1&&data.nativeCalls[0].actualNativeExportCalled,",
 " originalSessionErrorCategory:data.success?null:data.errorClass",
 "}));"
].join('\n'));
assert.ok(transformed.includes("assert.equal(data.success,true,'Original pinned SegFormer WASM model session failed"));
assert.ok(transformed.includes("M243_REAL_ORIGINAL_SEGFORMER_NATIVE_SESSION"));
assert.ok(transformed.includes("m246Served.push(summarizeLocalPublicWasm"));
const temp=resolve('scripts/.main246-disposable-original-native-wasm.mjs');
const engine=process.env.M246_ENGINE||'webkit';
const arm=process.env.M246_ARM||'baseline';
assert.ok(['webkit','chromium'].includes(engine));
assert.ok(['baseline','pattern_off'].includes(arm));
try{
 await writeFile(temp,transformed,{flag:'wx'});
 const syntax=spawnSync(process.execPath,['--check',temp],{encoding:'utf8',timeout:30000});
 if(syntax.error)throw syntax.error;
 assert.equal(syntax.status,0,'Derived M243 session syntax failure: '+String(syntax.stderr||'').slice(0,320));
 if(process.env.M246_SOURCE_ONLY==='1'){
  console.log('M246_DISPOSABLE_NATIVE_SOURCE_READY',JSON.stringify({
   originalSourceGitBlobPinned:true,installedP94WorkerUnchanged:true,
   actualNativeBinaryIdentityPending:true,originalSessionAssertionIntact:true,
   hold:true,releaseAuthorized:false
  }));
 }else{
  const run=spawnSync(process.execPath,[temp],{
   env:{...process.env,M243_ENGINE:engine,M243_PATTERN_ARM:arm},
   stdio:'inherit',timeout:21*60*1000
  });
  if(run.error)throw run.error;
  assert.equal(run.status,0,'Original native SegFormer or runtime variant acceptance genuinely RED');
 }
}finally{await rm(temp,{force:true});}
