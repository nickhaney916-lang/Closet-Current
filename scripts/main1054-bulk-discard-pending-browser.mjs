import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
const [engine='chromium',appPath='public/app.js',mode='candidate']=process.argv.slice(2);
const app=await readFile(appPath,'utf8'),start=app.indexOf("$('discard').onclick=async()=>{"),end=app.indexOf("$('export').onclick=async()=>{",start);
assert.ok(start>=0&&end>start);
const browser=await ({chromium,webkit}[engine]).launch();
try{
 for(const width of [320,390,430]){
  const page=await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true});
  await page.setContent('<button id="discard">Discard unfinished photographs</button>');
  await page.evaluate(()=>{
   Object.assign(window,{batch:[{id:'original',name:'Original'}],localPending:new Set(),automaticRunning:false,sessionCapturedIds:new Set(['original']),failedDraftCaptures:new Set(['original']),session:1,epoch:0,calls:[],notices:[],prompts:0,allowDiscard:true,renderCount:0});
   window.$=id=>document.getElementById(id);
   window.normalizeClothing=x=>x;
   window.ownerWardrobeMutationLease=()=>{const current=epoch;return {assertLease(){if(current!==epoch)throw Error('Owner changed');}};};
   window.confirm=()=>{prompts++;return allowDiscard;};
   window.message=t=>notices.push(t);
   window.render=()=>renderCount++;
   window.commitReviewedDraftCAS=(changes,check)=>{check();return new Promise((resolve,reject)=>calls.push({changes,resolve,reject,check}));};
  });
  await page.addScriptTag({content:app.slice(start,end)});
  const control=page.locator('#discard');
  await page.evaluate(()=>allowDiscard=false);
  await control.click();
  assert.deepEqual(await page.evaluate(()=>[prompts,calls.length]),[1,0]);
  await page.evaluate(()=>allowDiscard=true);
  await control.click();
  if(mode==='baseline'){
   assert.equal(await control.isEnabled(),true);
   await control.click();
   assert.equal(await page.evaluate(()=>calls.length),2);
   await page.evaluate(()=>calls.forEach(c=>c.reject(Error('fixture failure'))));
   console.log('BULK_DISCARD_PENDING_RED',engine,width);
   await page.close();continue;
  }
  assert.equal(await control.isDisabled(),true);
  await page.evaluate(()=>{void $('discard').onclick();});
  assert.deepEqual(await page.evaluate(()=>[prompts,calls.length,batch.length]),[2,1,1]);
  await page.evaluate(()=>calls[0].reject(Error('fixture rejection')));
  await page.waitForFunction(()=>!$('discard').disabled&&notices.length===1);
  assert.equal(await page.evaluate(()=>batch[0].name),'Original');
  await control.click();
  assert.equal(await control.isDisabled(),true);
  await page.evaluate(()=>calls[1].resolve());
  await page.waitForFunction(()=>!$('discard').disabled&&batch.length===0);
  assert.deepEqual(await page.evaluate(()=>[session,sessionCapturedIds.size,failedDraftCaptures.size,renderCount]),[0,0,0,1]);
  await page.evaluate(()=>batch=[{id:'A',name:'Old owner'}]);
  await control.click();
  // Model the existing logout teardown and a new signed-owner session.
  await page.evaluate(()=>{epoch++;$('discard').disabled=false;batch=[{id:'B',name:'New owner'}];});
  await control.click();
  await page.evaluate(()=>calls[2].reject(Error('old owner failure')));
  await page.evaluate(()=>new Promise(resolve=>setTimeout(resolve,0)));
  assert.equal(await control.isDisabled(),true);
  assert.deepEqual(await page.evaluate(()=>[batch[0].id,notices.length]),['B',1]);
  await page.evaluate(()=>calls[3].reject(Error('new owner failure')));
  await page.waitForFunction(()=>!$('discard').disabled&&notices.length===2);
  console.log('BULK_DISCARD_PENDING_GREEN',engine,width);
  await page.close();
 }
 for(const width of [320,390,430]) for(const first of ['retry','discard']){
  const page=await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true});
  await page.setContent('<button id="discard">Discard</button><button id="retry">Retry</button>');
  await page.evaluate(()=>{
   Object.assign(window,{batch:[{id:'original',ownerId:'A',name:'Original'}],localPending:new Set(),automaticRunning:false,sessionCapturedIds:new Set(['original']),failedDraftCaptures:new Set(['original']),session:1,calls:[],notices:[]});
   window.$=id=>document.getElementById(id);
   window.normalizeClothing=x=>x;
   window.ownerWardrobeMutationLease=()=>({assertLease(){}});
   window.ownerFailedPhotoRetryLease=()=>({current:()=>true,assert(){}});
   window.confirm=()=>true;
   window.message=t=>notices.push(t);
   window.render=()=>{};
   const defer=kind=>new Promise((resolve,reject)=>calls.push({kind,resolve,reject}));
   window.retryUncommittedCapture=()=>defer('retry');
   window.commitReviewedDraftCAS=()=>defer('discard');
  });
  const rStart=app.indexOf('async function retryFailedPhotoFromCard('),rEnd=app.indexOf('// Only a verified original',rStart);
  assert.ok(rStart>=0&&rEnd>rStart);
  await page.addScriptTag({content:app.slice(rStart,rEnd)+'\n'+app.slice(start,end)+"\n$('retry').onclick=()=>retryFailedPhotoFromCard(batch[0],$('retry'));"});
  const second=first==='retry'?'discard':'retry';
  await page.locator('#'+first).click();
  await page.locator('#'+second).click();
  if(mode==='baseline'){
   assert.deepEqual(await page.evaluate(()=>calls.map(c=>c.kind)),[first,second]);
   await page.evaluate(()=>calls.forEach(c=>c.reject(Error('fixture rejection'))));
   console.log('PHOTO_OPERATION_CONFLICT_RED',engine,width,first);
  }else{
   assert.deepEqual(await page.evaluate(()=>calls.map(c=>c.kind)),[first]);
   assert.equal(await page.evaluate(()=>notices.length),1);
   assert.equal(await page.evaluate(()=>batch[0].name),'Original');
   await page.evaluate(()=>calls[0].reject(Error('fixture rejection')));
   await page.waitForFunction(first=>!$(first).disabled,first);
   await page.locator('#'+second).click();
   assert.deepEqual(await page.evaluate(()=>calls.map(c=>c.kind)),[first,second]);
   await page.evaluate(()=>calls[1].reject(Error('fixture rejection')));
   await page.waitForFunction(second=>!$(second).disabled,second);
   assert.equal(await page.evaluate(()=>batch[0].name),'Original');
   console.log('PHOTO_OPERATION_CONFLICT_GREEN',engine,width,first);
  }
  await page.close();
 }
}finally{await browser.close();}
