/**
 * M226: actual installed P94 SegFormer/ONNX/WASM in native Chromium/WebKit.
 * Adapt ONLY the M214 source SHA witness and passive terminal metadata probe.
 * The exact unchanged original P94 positive >0 card, owner/private JPEG,
 * no automatic saves, 2D/v4, and cross-owner refusal checks remain active.
 * A separate malformed negative request uses the ACTUAL Worker but NO model:
 * this is intentionally NOT evidence of historical WebKit zero-model cause.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const blob=raw=>createHash('sha1').update('blob '+raw.length+'\0').update(raw).digest('hex');
const original=await readFile('scripts/test-main214-p94-worker-outcome.mjs','utf8');
const previousBlob='8cc2977f1932b3012c44bdd401081cc542b94c57';
assert.equal(blob(Buffer.from(original)),previousBlob,'M214 real model browser acceptance changed');
const worker=await readFile('public/outfit-worker-p94.mjs');
const currentWorker='f3b1b5046f4abc55755c8b5d1e8b39d4aea46b2a';
assert.equal(blob(worker),currentWorker,'M226 actual installed Worker changed');
const helper=await readFile('public/p94-worker-terminal-codes.mjs');
const expectedHelper=process.env.M226_HELPER_BLOB;
if(expectedHelper)assert.equal(blob(helper),expectedHelper,'private diagnostic allowlist changed');
let script=original;
const once=(anchor,replacement,why)=>{
 assert.equal(script.split(anchor).length,2,'M226 original harness anchor changed: '+why);
 script=script.replace(anchor,replacement);
};
once("const testedWorkerSHA='d66651b616de54c51eb7ef986324b30f1580888f';",
 "const testedWorkerSHA='"+currentWorker+"';",'new diagnostic Worker SHA');
const reasonLine=" \"       reason:typeof safe.reason==='string'?safe.reason.slice(0,40):null,\",";
once(reasonLine,reasonLine+'\n'+[
 "       diagnosticCode:typeof safe.diagnosticCode==='string'?safe.diagnosticCode.slice(0,64):null,",
 "       errorCategory:typeof safe.errorCategory==='string'?safe.errorCategory.slice(0,24):null,",
 "       outcomeCode:typeof safe.outcomeCode==='string'?safe.outcomeCode.slice(0,48):null,"
].map(line=>' '+JSON.stringify(line)+',').join('\n'),'privacy-only passive worker tags');
const probe=[
 "  const terminal226=m214.messages.filter(x=>x.type==='done');",
 "  assert.equal(terminal226.length,1,'actual native original model lacked a single done terminal');",
 "  assert.equal(terminal226[0].outcomeCode,'P94_PIECES_READY',",
 "   'real model produced cards but not a truthful ready outcome');",
 "  assert.equal(m214.messages.filter(x=>x.type==='error').length,0,",
 "   'actual model raised an error but cards were still accepted');",
 "  const malformed226=await page.evaluate(()=>new Promise((resolve,reject)=>{",
 "   const requestId='M226_PRIVATE_UNTRUSTED';",
 "   const worker=new Worker('/public/outfit-worker-p94.mjs',{type:'module'});",
 "   const timer=setTimeout(()=>{worker.terminate();reject(Error('negative diagnostic worker timeout'));},30000);",
 "   worker.onmessage=event=>{if(event.data?.type!=='error')return;",
 "    clearTimeout(timer);worker.terminate();resolve(event.data);};",
 "   worker.onerror=()=>{clearTimeout(timer);worker.terminate();reject(Error('negative worker failed'));};",
 "   worker.postMessage({id:requestId,image:'ORIGINAL_OWNER_JPEG_PRIVATE_SECRET'});",
 "  }));",
 "  assert.equal(malformed226.type,'error');",
 "  assert.equal(malformed226.reason,'P94_validate');",
 "  assert.equal(malformed226.diagnosticCode,'P94_validate_invalid_input');",
 "  assert.equal(malformed226.errorCategory,'invalid_input');",
 "  assert.equal(JSON.stringify(malformed226).includes('ORIGINAL_OWNER_JPEG_PRIVATE_SECRET'),false);",
 "  assert.equal(malformed226.id,'M226_PRIVATE_UNTRUSTED');",
 "  console.log('M226_REAL_BROWSER_TERMINAL_CLASSIFICATION_PASS',JSON.stringify({",
 "   engine,width,genuineModelCards:m214.cards,",
 "   modelDoneOutcome:terminal226[0].outcomeCode,",
 "   invalidActualWorkerCategory:malformed226.errorCategory,",
 "   realWorkerModelUnchanged:false,realModelInvoked:true,",
 "   negativeInputNotInLogs:true,negativeHasNoModelInference:true,",
 "   originalOwnerPrivacyAndNoAutoSaveAssertionsStillRequired:true,releaseAuthorized:false",
 "  }));"
];
const evidenceLine=" \"  const evidence={\",";
once(evidenceLine,probe.map(x=>' '+JSON.stringify(x)+',').join('\n')+'\n'+evidenceLine,
 'check genuine model outcome then actual invalid Worker');
const temp=resolve('scripts/.main226-diagnostic-genuine-p94-browser.mjs');
try{
 await writeFile(temp,script,{flag:'wx'});
 const checked=spawnSync(process.execPath,['--check',temp],{encoding:'utf8'});
 assert.equal(checked.status,0,checked.stderr);
 const result=spawnSync(process.execPath,[temp],{
  env:{...process.env,M58_ENGINE:process.env.M58_ENGINE||'webkit',
   P94_WIDTH:process.env.P94_WIDTH||'430'},
  stdio:'inherit',timeout:19*60*1000
 });
 if(result.error)throw result.error;
 assert.equal(result.status,0,'M226 original genuine positive P94 + negative diagnostic FAILED; no retry to green');
}finally{await rm(temp,{force:true});}
