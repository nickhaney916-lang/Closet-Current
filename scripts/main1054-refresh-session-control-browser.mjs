import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
const [engine='chromium',appPath='public/app.js',mode='candidate']=process.argv.slice(2);
const app=await readFile(appPath,'utf8');
function span(a,b){const i=app.indexOf(a),j=app.indexOf(b,i+1);assert.ok(i>=0&&j>i);return app.slice(i,j);}
const source=[
 span("window.addEventListener('closet:session-locked',()=>{","function message(t){"),
 span('function ownerWardrobeMutationLease(){','function writeAll(values){'),
 span("$('refreshReview').onclick=async()=>{","$('discard').onclick=async()=>{")
].join('\n');
const browser=await ({chromium,webkit}[engine]).launch();
try{
 for(const width of [320,390,430]) for(const sameOwner of [false,true]){
  const page=await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true});
  await page.setContent('<button id="refreshReview">Refresh Photo results</button><button id="discard">Discard unfinished photographs</button><video id="fixtureVideo"></video>');
  await page.evaluate(()=>{
   const makeAuth=id=>({user:{id},assertCurrent(){}});
   const makeDB=id=>({name:'closet-current-user-'+id,close(){}});
   Object.assign(window,{captureOperationEpoch:0,writes:Promise.resolve(),videoImportSerial:0,videoImportActive:false,photoImportSerial:0,photoImportActive:false,busy:false,captureProofTaking:false,localWorker:null,automaticRunning:false,localBatch:false,localLoadPromise:null,localReady:false,recognitionUnavailable:false,memoryReviewTimer:null,memoryReviewRunning:false,db:makeDB('A'),closetAuth:makeAuth('A'),items:[],batch:[{id:'A-photo'}],startupWardrobeRecoveryCount:0,localJobs:new Map(),automaticQueue:[],localPending:new Map(),recognitionState:{},sessionCapturedIds:new Set(),failedDraftCaptures:new Set(),video:document.getElementById('fixtureVideo'),calls:[]});
   window.$=id=>document.getElementById(id);
   window.stopCamera=()=>{};
   window.controls=()=>{};
   window.refreshOwnerDraftFromDevice=()=>new Promise((resolve,reject)=>calls.push({resolve,reject}));
   window.loginFixture=id=>{window.closetAuth=makeAuth(id);window.db=makeDB(id);window.batch=[{id:id+'-photo'}];};
  });
  await page.addScriptTag({content:source});
  const refresh=page.locator('#refreshReview');
  await refresh.click();
  assert.equal(await refresh.isDisabled(),true);
  assert.equal(await page.evaluate(()=>calls.length),1);
  await page.evaluate(same=>{window.dispatchEvent(new Event('closet:session-locked'));loginFixture(same?'A':'B');},sameOwner);
  if(mode==='baseline'){
   assert.equal(await refresh.isDisabled(),true);
   await page.evaluate(()=>calls[0].resolve());
   await page.evaluate(()=>true);
   assert.equal(await refresh.isDisabled(),true);
   console.log('REFRESH_SESSION_RED',engine,width,sameOwner?'same':'different');
   await page.close();continue;
  }
  assert.equal(await refresh.isEnabled(),true);
  await refresh.click();
  await page.evaluate(()=>{void $('refreshReview').onclick();});
  assert.equal(await page.evaluate(()=>calls.length),2);
  await page.evaluate(()=>calls[0].resolve());
  await page.evaluate(()=>true);
  assert.equal(await refresh.isDisabled(),true);
  assert.equal(await page.evaluate(()=>batch[0].id),(sameOwner?'A':'B')+'-photo');
  await page.evaluate(()=>calls[1].reject(Error('fixture read failure')));
  await page.waitForFunction(()=>!$('refreshReview').disabled);
  await refresh.click();
  assert.equal(await page.evaluate(()=>calls.length),3);
  await page.evaluate(()=>calls[2].resolve());
  await page.waitForFunction(()=>!$('refreshReview').disabled);
  console.log('REFRESH_SESSION_GREEN',engine,width,sameOwner?'same':'different');
  await page.close();
 }
}finally{await browser.close();}
