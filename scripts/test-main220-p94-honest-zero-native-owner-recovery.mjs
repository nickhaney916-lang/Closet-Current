/**
 * M220: genuine P94 owner/original-photo manual recovery on a deliberately
 * injected negative Worker terminal (ZERO piece / explicit error).
 * The actual installed app, photo SHA, crop, explicit owner-reviewed save,
 * 2D outfit, v4 restore, cross-owner refusal and original JPEG remain REAL.
 * No inference happens here: negative branch simulation is NOT model accuracy.
 * The original entire post-detection app security/restore assertion contract
 * is inherited from source-locked P94 with explicit negative-only labels.
 */
import assert from 'node:assert/strict';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

const originalPath='scripts/test-parallel94-native-p88-browser.mjs';
const original=await readFile(originalPath,'utf8');
const expectedOriginal='4f75a40cf153fa4b4d139d782b202dbe7bc55e41';
const engine=process.env.M58_ENGINE||'webkit';
const width=Number(process.env.P94_WIDTH||430);
const mode=process.env.M220_CASE||'done-zero';
assert.ok(['chromium','webkit'].includes(engine));
assert.ok([320,390,430].includes(width));
assert.ok(['done-zero','done-claimed-two','worker-error'].includes(mode));
const verifyAndReplace=(s,anchor,replacement,label)=>{
 assert.equal(s.split(anchor).length,2,
  'M220 immutable original P94 anchor changed: '+label);
 return s.replace(anchor,replacement);
};
let modified=original;
modified=verifyAndReplace(modified,
 " await context.route('**/*',route=>{",
 [
  " // M220: replace ONLY this exact P94 Worker for a documented NEGATIVE case.",
  " // The real built owner app and all other scripts/workers remain untouched.",
  " await context.addInitScript(negativeCase=>{",
  "  const RealWorker=window.Worker;",
  "  window.__m217NegativeWorkerCount=0;",
  "  window.__m217TerminalEvents=[];",
  "  window.Worker=function(url,options){",
  "   let path='';try{path=new URL(String(url),location.href).pathname;}catch{}",
  "   if(path!=='/public/outfit-worker-p94.mjs')return new RealWorker(url,options);",
  "   window.__m217NegativeWorkerCount++;",
  "   let stopped=false,delivered=false;",
  "   return {onmessage:null,onerror:null,onmessageerror:null,",
  "    postMessage(packet){queueMicrotask(()=>{",
  "     if(stopped||delivered)return;",
  "     delivered=true;",
  "     const type=negativeCase==='worker-error'?'error':'done';",
  "     window.__m217TerminalEvents.push(type);",
  "     this.onmessage?.({data:{type,id:packet.id,count:negativeCase==='done-claimed-two'?2:0,",
  "      text:'Synthetic negative-only segmentation unavailable.'}});",
  "     // A malicious late piece after terminal must remain ignored.",
  "     this.onmessage?.({data:{type:'piece',id:packet.id,piece:null}});",
  "    });},terminate(){stopped=true;}};",
  "  };",
  " },process.env.M220_CASE);",
  " await context.route('**/*',route=>{"
 ].join('\n'),"negative-worker-install");

const start=modified.indexOf(" assert.ok(external.some(x=>x.type==='pinned-browser-library'),");
const end=modified.indexOf(" // M58 follow-on: real model has finished.",start);
assert.ok(start>0&&end>start);
const negativeProof=[
 " assert.equal(state.debug.sourceSHA256,sha,'negative branch lost verified source SHA');",
 " assert.equal(state.debug.p88Transport57,true,'P94 original source transport disabled');",
 " assert.equal(state.debug.working,false,'synthetic worker terminal stayed active');",
 " assert.equal(state.cards,0,'zero-proposal case fabricated garment cards');",
 " assert.equal(await page.evaluate(()=>window.__m217NegativeWorkerCount),1,",
 "  'did not intercept exactly the original P94 Worker');",
 " assert.deepEqual(await page.evaluate(()=>window.__m217TerminalEvents),",
 "  [process.env.M220_CASE==='worker-error'?'error':'done']);",
 " if(process.env.M220_CASE==='worker-error')",
 "  assert.match(state.status,/Automatic extraction unavailable/,",
 "   'error terminal hid manual fallback');",
 " else assert.match(state.status,/No unverified garment regions were detected/,",
 "  'zero accepted proposals must be stated honestly, including forged count 2');",
 " if(process.env.M220_CASE!=='worker-error'){",
 "  assert.match(state.status,/verified original photo is retained/,",
 "   'zero genuine proposals must keep original source recovery visible');",
 "  assert.match(state.status,/Nothing was automatically saved/,",
 "   'zero result cannot imply an automatically saved garment');",
 "  assert.doesNotMatch(state.status,/suggestions appear first|0 unverified regions found/i,",
 "   'zero results must not describe invisible accepted cards or success');",
 " }",
 " assert.equal(await page.getByRole('button',{name:'Add missed piece'}).isEnabled(),true,",
 "  'P94 negative model terminal disabled owner manual recovery');",
 " assert.equal(await page.getByRole('button',{name:'Save confirmed pieces together'}).isDisabled(),true,",
 "  'negative model outcome enabled an unreviewed silent private save');",
 " assert.equal(await countRows(page),0,'negative model outcome wrote to owner private DB');",
 " assert.deepEqual(rejected,[],'negative model leaked photo/owner egress');",
 " assert.deepEqual(issues,[],'actual native browser error in negative branch');",
 " const negativeReceipt={schema:'M220_P94_NEGATIVE_OWNER_FALLBACK/v1',",
 "  engine,width,mode:process.env.M220_CASE,sourceSHA256:sha,",
 "  realOriginalPhotoVerified:true,modelMockedForNegativeOnly:true,",
 "  authenticModelInferred:false,initialReviewCards:state.cards,",
 "  noAutomaticSave:true,manualAddEnabled:true,",
 "  browserErrors:issues.length,forbiddenEgress:rejected.length,",
 "  hostedRLS:false,physicalDevice:false,fitted3D:false,familyAlpha:'HOLD'};",
 " await writeFile(join(out,'M220-NEGATIVE-OWNER-FALLBACK.json'),",
 "  JSON.stringify(negativeReceipt,null,2)+'\\n');",
 " console.log('M220_REAL_NATIVE_NEGATIVE_TERMINAL_PASS',JSON.stringify(negativeReceipt));",
].join('\n')+'\n';
modified=modified.slice(0,start)+negativeProof+modified.slice(end);
modified=modified.replaceAll("M58_GENUINE_","M220_NEGATIVE_")
 .replaceAll("M61_GENUINE_","M220_NEGATIVE_")
 .replaceAll("P91_FULL_JOURNEY_PASS","M220_NEGATIVE_FULL_JOURNEY_PASS")
 .replaceAll("M58_REAL_P88_WORKER_FAIL","M220_NEGATIVE_OWNER_FALLBACK_FAIL")
 .replaceAll("modelExecuted:true","modelExecuted:false")
 .replaceAll("realWorkerFirst:true","realWorkerFirst:false")
 .replaceAll("actualP88InferenceFirst:true","actualP88InferenceFirst:false")
 .replaceAll("actualSourceWorkerRanOnce:true","actualSourceWorkerRanOnce:false");

assert.ok(modified.includes("await page.getByRole('button',{name:'Add missed piece'}).click();"));
assert.ok(modified.includes("await page.locator('#savedBoards button').first().click()"));
assert.ok(modified.includes("assert.deepEqual(await ownerSnapshot(),ownerBBeforeForeignRestore"));
assert.ok(!modified.includes("modelExecuted:true"));
assert.ok(!modified.includes("realWorkerFirst:true"));
assert.ok(!modified.includes("M58_GENUINE_"));
const temp=resolve('scripts/.main217-real-p94-negative-owner-app.mjs');
try{
 await writeFile(temp,modified,{flag:'wx'});
 const result=spawnSync(process.execPath,[temp],{
  env:{...process.env,M58_ENGINE:engine,P94_WIDTH:String(width),
       M220_CASE:mode,M220_SOURCE_BLOB:expectedOriginal},
  stdio:'inherit',timeout:10*60*1000
 });
 if(result.error)throw result.error;
 assert.equal(result.status,0,'M220 negative model manual recovery failed genuine owner app');
}finally{await rm(temp,{force:true});}
