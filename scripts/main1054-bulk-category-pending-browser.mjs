import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
const [engine='chromium',appPath='public/app.js',mode='candidate']=process.argv.slice(2);
const app=await readFile(appPath,'utf8');
function span(a,b){const i=app.indexOf(a),j=app.indexOf(b,i+1);assert.ok(i>=0&&j>i);return app.slice(i,j);}
const source=[
 span("window.addEventListener('closet:session-locked',()=>{","function message(t){"),
 span('function ownerWardrobeMutationLease(){','function writeAll(values){'),
 span("$('applyCategory').onclick=async()=>{","for(const season of clothingSchema.seasons.slice(0,4))")
].join('\n');
const browser=await ({chromium,webkit}[engine]).launch();
try{
 for(const width of [320,390,430]){
  const page=await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true});
  await page.setContent('<button id="applyCategory">Apply category</button><select id="batchCategory"><option>Tops</option><option>Bottoms</option></select><video id="fixtureVideo"></video>');
  await page.evaluate(()=>{
   const auth=id=>({user:{id},assertCurrent(){}});
   const database=id=>({name:'closet-current-user-'+id,close(){}});
   const original=id=>({id:id+'-photo',name:'Original',category:'Uncategorized',image:'fixture-jpeg'});
   Object.assign(window,{captureOperationEpoch:0,writes:Promise.resolve(),videoImportSerial:0,videoImportActive:false,photoImportSerial:0,photoImportActive:false,busy:false,captureProofTaking:false,localWorker:null,automaticRunning:false,localBatch:false,localLoadPromise:null,localReady:false,recognitionUnavailable:false,memoryReviewTimer:null,memoryReviewRunning:false,db:database('A'),closetAuth:auth('A'),items:[],batch:[original('A')],startupWardrobeRecoveryCount:0,localJobs:new Map(),automaticQueue:[],localPending:new Map(),recognitionState:{},sessionCapturedIds:new Set(),failedDraftCaptures:new Set(),video:document.getElementById('fixtureVideo'),calls:[],notices:[]});
   window.$=id=>document.getElementById(id);
   window.stopCamera=()=>{};window.controls=()=>{};window.render=()=>{};
   window.message=t=>notices.push(t);window.normalizeClothing=x=>x;
   window.commitReviewedDraftCAS=(changes,check)=>{check();return new Promise((resolve,reject)=>calls.push({changes,resolve,reject}));};
   window.loginFixture=id=>{window.closetAuth=auth(id);window.db=database(id);window.batch=[original(id)];};
  });
  await page.addScriptTag({content:source});
  const button=page.locator('#applyCategory');
  await button.click();
  await page.locator('#batchCategory').selectOption('Bottoms');
  await page.evaluate(()=>{void $('applyCategory').onclick();});
  if(mode==='baseline'){
   assert.equal(await button.isEnabled(),true);
   assert.deepEqual(await page.evaluate(()=>calls.map(c=>c.changes[0].after.category)),['Tops','Bottoms']);
   await page.evaluate(()=>calls.forEach(c=>c.reject(Error('fixture rejection'))));
   console.log('BULK_CATEGORY_PENDING_RED',engine,width);
   await page.close();continue;
  }
  assert.equal(await button.isDisabled(),true);
  assert.equal(await page.evaluate(()=>calls.length),1);
  await page.evaluate(()=>calls[0].reject(Error('fixture rejection')));
  await page.waitForFunction(()=>!$('applyCategory').disabled);
  assert.equal(await page.evaluate(()=>batch[0].category),'Uncategorized');
  await button.click();
  assert.equal(await page.evaluate(()=>calls[1].changes[0].after.category),'Bottoms');
  await page.evaluate(()=>{window.dispatchEvent(new Event('closet:session-locked'));loginFixture('B');});
  assert.equal(await button.isEnabled(),true);
  await button.click();
  assert.equal(await page.evaluate(()=>calls.length),3);
  await page.evaluate(()=>calls[1].resolve());
  await page.evaluate(()=>true);
  assert.equal(await button.isDisabled(),true);
  assert.equal(await page.evaluate(()=>batch[0].category),'Uncategorized');
  await page.evaluate(()=>calls[2].resolve());
  await page.waitForFunction(()=>!$('applyCategory').disabled);
  assert.deepEqual(await page.evaluate(()=>[batch[0].id,batch[0].category,batch[0].image]),['B-photo','Bottoms','fixture-jpeg']);
  console.log('BULK_CATEGORY_PENDING_GREEN',engine,width);
  await page.close();
 }
}finally{await browser.close();}
