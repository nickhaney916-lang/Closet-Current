import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
const [engine='chromium',appPath='public/app.js',mode='candidate']=process.argv.slice(2);
const app=await readFile(appPath,'utf8');
function span(a,b){const i=app.indexOf(a),j=app.indexOf(b,i+1);assert.ok(i>=0&&j>i);return app.slice(i,j);}
const source=[
 span("window.addEventListener('closet:session-locked',()=>{","function message(t){"),
 span('function ownerWardrobeMutationLease(){','function writeAll(values){'),
 span("$('import').onchange=async","window.addEventListener('beforeunload'")
].join('\n');
const browser=await ({chromium,webkit}[engine]).launch();
try{
 for(const width of [320,390,430]){
  const page=await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true});
  await page.route('http://fixture.invalid/**',route=>route.fulfill({contentType:'text/html',body:'<div id="authGate" hidden></div><main id="appShell"><input id="import" type="file"><video id="fixtureVideo"></video></main>'}));
  await page.goto('http://fixture.invalid/index.html?restoreAtomic01=research&nativeLossless04=research');
  await page.evaluate(()=>{
   const auth=id=>({user:{id},assertCurrent(){}});
   const database=id=>({name:'closet-current-user-'+id,close(){}});
   Object.assign(window,{captureOperationEpoch:0,writes:Promise.resolve(),videoImportSerial:0,videoImportActive:false,photoImportSerial:0,photoImportActive:false,busy:false,saving:false,cameraOpening:false,captureProofTaking:false,stream:null,localWorker:null,automaticRunning:false,localBatch:false,localLoadPromise:null,localReady:false,recognitionUnavailable:false,memoryReviewTimer:null,memoryReviewRunning:false,db:database('A'),closetAuth:auth('A'),items:[],batch:[],startupWardrobeRecoveryCount:0,localJobs:new Map(),automaticQueue:[],localPending:new Map(),recognitionState:{},sessionCapturedIds:new Set(),failedDraftCaptures:new Set(),video:document.getElementById('fixtureVideo'),reads:[],restores:[],notices:[],finished:[]});
   window.$=id=>document.getElementById(id);
   window.stopCamera=()=>{};window.controls=()=>{};
   window.message=t=>notices.push(t);
   window.restoreAtomic01Bridge={importBackup:async data=>{restores.push(data.label);return {cancelled:true};}};
   window.loginFixture=id=>{window.closetAuth=auth(id);window.db=database(id);};
   window.startImport=label=>{const file={size:10,text:()=>new Promise((resolve,reject)=>reads.push({label,resolve:()=>resolve(JSON.stringify({label})),reject}))};const p=$('import').onchange({target:{files:[file],value:''}});p.then(()=>finished.push(label));};
  });
  await page.addScriptTag({content:source});
  await page.evaluate(()=>{startImport('first');startImport('duplicate');});
  if(mode==='baseline'){
   assert.equal(await page.evaluate(()=>reads.length),2);
   await page.evaluate(()=>reads.forEach(r=>r.resolve()));
   await page.waitForFunction(()=>finished.length===2);
   assert.deepEqual(await page.evaluate(()=>restores),['first','duplicate']);
   console.log('PRIVATE_IMPORT_PENDING_RED',engine,width);
   await page.close();continue;
  }
  assert.equal(await page.locator('#import').isDisabled(),true);
  assert.equal(await page.evaluate(()=>reads.length),1);
  await page.evaluate(()=>reads[0].reject(Error('fixture file read failure')));
  await page.waitForFunction(()=>!$('import').disabled);
  assert.equal(await page.evaluate(()=>restores.length),0);
  await page.evaluate(()=>startImport('old-owner'));
  await page.evaluate(()=>{window.dispatchEvent(new Event('closet:session-locked'));loginFixture('B');});
  assert.equal(await page.locator('#import').isEnabled(),true);
  await page.evaluate(()=>startImport('current-owner'));
  await page.evaluate(()=>reads[1].resolve());
  await page.waitForFunction(()=>finished.includes('old-owner'));
  assert.equal(await page.locator('#import').isDisabled(),true);
  assert.equal(await page.evaluate(()=>restores.length),0);
  await page.evaluate(()=>reads[2].resolve());
  await page.waitForFunction(()=>!$('import').disabled);
  assert.deepEqual(await page.evaluate(()=>restores),['current-owner']);
  assert.ok(await page.evaluate(()=>notices.some(n=>n.includes('Restore canceled'))));
  await page.evaluate(()=>startImport('retry'));
  await page.evaluate(()=>reads[3].resolve());
  await page.waitForFunction(()=>!$('import').disabled);
  assert.deepEqual(await page.evaluate(()=>restores),['current-owner','retry']);
  console.log('PRIVATE_IMPORT_PENDING_GREEN',engine,width);
  await page.close();
 }
}finally{await browser.close();}
