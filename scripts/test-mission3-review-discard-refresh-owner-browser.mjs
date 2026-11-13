// Source-execute the unmodified Photo results Discard and Refresh callbacks
// in actual Chromium and WebKit (mobile CSS widths, synthetic owners/JPEGs).
// Family Alpha HOLD #255. No production, network or personal photographs.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {chromium,webkit} from 'playwright';

const out=resolve(process.argv[2]||'benchmark/mission3-review-discard-refresh-exact-session');
await mkdir(out,{recursive:true});
const app=await readFile(resolve('public/app.js'),'utf8');
function extract(a,b){
 const i=app.indexOf(a),j=app.indexOf(b,i);
 assert.ok(i>=0&&j>i,'missing real source '+a);
 return app.slice(i,j);
}
const ownerLease=extract('function ownerWardrobeMutationLease(){','function writeAll(values){');
const actions=extract("$('refreshReview').onclick=async()=>{","$('export').onclick=async()=>{");
assert.match(actions,/await commitReviewedDraftCAS/);
assert.match(actions,/if\(!stillReviewing\(\)\)/);
const js=`
'use strict';
let db,batch,localPending,automaticRunning,session,sessionCapturedIds,
 failedDraftCaptures,captureOperationEpoch=0,commitReviewedDraftCAS,
 refreshOwnerDraftFromDevice,events=[];
const $=id=>document.getElementById(id);
function message(text){events.push('message:'+window.closetAuth?.user?.id+':'+text);}
function render(){events.push('render:'+window.closetAuth?.user?.id);}
function confirm(){events.push('confirm');return true;}
function normalizeClothing(row){return row;}
${ownerLease}
${actions}
window.__runDiscardRefresh=async(mode)=>{
 document.body.innerHTML='<section id="authGate" hidden></section><section id="appShell"></section><button id="discard"></button><button id="refreshReview"></button>';
 captureOperationEpoch++;events=[];
 const row=(owner,id)=>({
  id,ownerId:owner,category:'Uncategorized',notes:'reviewed original',
  image:'data:image/jpeg;base64,/9j/'+owner+id,
  originalPhoto:{image:'data:image/jpeg;base64,/9j/'+owner+id,sha256:'a'.repeat(64)},
  sourceSHA256:'a'.repeat(64)
 });
 batch=[row('A','photo-1'),row('A','photo-2')];
 localPending=new Set();automaticRunning=false;session=2;
 sessionCapturedIds=new Set(batch.map(x=>x.id));
 failedDraftCaptures=new Set(batch.map(x=>x.id));
 db={name:'closet-current-user-A'};
 window.closetAuth={user:{id:'A'},assertCurrent(){}};
 const gate=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});promise.catch(()=>{});return {resolve,reject,promise};};
 const dg=gate(),rg=gate();
 let calls=0;
 commitReviewedDraftCAS=(changes,check)=>{calls++;check();return dg.promise;};
 refreshOwnerDraftFromDevice=()=>{events.push('refresh-start');return rg.promise;};
 const switchOwner=()=>{
  captureOperationEpoch++;
  db={name:'closet-current-user-B'};
  window.closetAuth={user:{id:'B'},assertCurrent(){}};
  batch=[row('B','owner-b-secret-original')];session=44;
  sessionCapturedIds=new Set(['owner-b-secret-original']);
  failedDraftCaptures=new Set(['owner-b-secret-original']);
 };
 const relogin=()=>{
  captureOperationEpoch++;
  db={name:'closet-current-user-A'};
  window.closetAuth={user:{id:'A'},assertCurrent(){}};
  batch=[row('A','new-login-original')];session=66;
  sessionCapturedIds=new Set(['new-login-original']);
  failedDraftCaptures=new Set(['new-login-original']);
 };
 let task;
 if(mode==='refresh-current'||mode==='refresh-other'||mode==='refresh-same-id'){
  task=$('refreshReview').onclick();
  if(mode==='refresh-other')switchOwner();
  if(mode==='refresh-same-id')relogin();
  rg.resolve({changed:false});
 }else{
  task=$('discard').onclick();
  if(mode==='discard-other'||mode==='discard-reject-other')switchOwner();
  if(mode==='discard-same-id')relogin();
  if(mode==='discard-new-local')batch.push(row('A','brand-new-capture'));
  if(mode==='discard-reject'||mode==='discard-reject-other')dg.reject(Error('PRIVATE JPEG DO NOT DISPLAY'));
  else dg.resolve(2);
 }
 await task;
 return {owner:window.closetAuth?.user?.id,events:[...events],
  ids:batch.map(x=>x.id),session,
  original:batch[0]?.originalPhoto?.image,
  storedIDs:[...sessionCapturedIds],failedIDs:[...failedDraftCaptures],
  buttonDisabled:$('refreshReview').disabled,calls};
};
`;
const modes=['discard-current','discard-other','discard-same-id','discard-new-local',
 'discard-reject','discard-reject-other','refresh-current','refresh-other','refresh-same-id'];
const cases=[];
for(const [browserName,engine] of [['Chromium',chromium],['WebKit',webkit]]){
 const browser=await engine.launch({headless:true});
 try{
  for(const width of [320,390,430]){
   const context=await browser.newContext({viewport:{width,height:780}});
   await context.route('**/*',route=>route.abort());
   const page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(String(error)));
   try{
    await page.setContent('<body></body>');
    await page.addScriptTag({content:js});
    for(const mode of modes){
     const got=await page.evaluate(m=>window.__runDiscardRefresh(m),mode);
     assert.equal(got.events.some(x=>/PRIVATE JPEG|DO NOT DISPLAY/.test(x)),false,browserName+' '+mode+' private exception leaked');
     if(mode==='discard-current'){
      assert.deepEqual(got.ids,[]);
      assert.equal(got.session,0);
      assert.equal(got.calls,1);
      assert.deepEqual(got.events,['confirm','render:A']);
     }else if(mode==='discard-other'||mode==='discard-reject-other'){
      assert.equal(got.owner,'B');
      assert.deepEqual(got.ids,['owner-b-secret-original']);
      assert.equal(got.session,44);
      assert.deepEqual(got.events,['confirm']);
      assert.deepEqual(got.storedIDs,['owner-b-secret-original']);
     }else if(mode==='discard-same-id'){
      assert.deepEqual(got.ids,['new-login-original']);
      assert.equal(got.session,66);
      assert.deepEqual(got.events,['confirm']);
     }else if(mode==='discard-new-local'){
      assert.deepEqual(got.ids,['photo-1','photo-2','brand-new-capture']);
      assert.equal(got.session,2);
      assert.match(got.events.at(-1),/Refresh Photo results/);
     }else if(mode==='discard-reject'){
      assert.deepEqual(got.ids,['photo-1','photo-2']);
      assert.match(got.events.at(-1),/Could not confirm whether/);
      assert.equal(got.session,2);
     }else if(mode==='refresh-current'){
      assert.equal(got.buttonDisabled,false);
      assert.deepEqual(got.events,['refresh-start']);
     }else if(mode==='refresh-other'||mode==='refresh-same-id'){
      assert.equal(got.buttonDisabled,true);
      assert.deepEqual(got.events,['refresh-start']);
     }
     cases.push({browser:browserName,width,mode,pass:true});
    }
    assert.deepEqual(errors,[],browserName+' '+width+' source errors');
   }finally{await context.close();}
  }
 }finally{await browser.close();}
}
assert.equal(cases.length,54);
const report={status:'PASS',familyAlpha:'HOLD #255',source:'exact public/app.js signed-owner Discard and Refresh callbacks',
 syntheticOwnersOnly:true,hostedSupabase:false,realDevices:false,total:cases.length,cases};
const data=JSON.stringify(report,null,2)+'\n';
await writeFile(resolve(out,'results.json'),data);
await writeFile(resolve(out,'sha256.txt'),createHash('sha256').update(data).digest('hex')+'  results.json\n');
console.log('PASS: 54 actual Chromium/WebKit CSS mobile-width pending Discard and Refresh source-owner-session cases; NO DEPLOY');
