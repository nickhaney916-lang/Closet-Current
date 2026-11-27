import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
const [engine='chromium',appPath='public/app.js',mode='candidate']=process.argv.slice(2);
const app=await readFile(appPath,'utf8');
function part(start,end){const a=app.indexOf(start),b=app.indexOf(end,a);assert.ok(a>=0&&b>a);return app.slice(a,b);}
const source=part('function ownerFailedPhotoRetryLease(','// Only a verified original')+'\n'+part('function renderPhotoResults(','// Weekly memory review');
const browser=await ({chromium,webkit}[engine]).launch();
try{
 for(const width of [320,390,430]){
  const page=await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true});
  await page.setContent('<div id="authGate" hidden></div><main id="appShell"><div id="review"></div><div id="scan"></div></main>');
  await page.evaluate(()=>{
   window.$=id=>document.getElementById(id);
   const item={id:'original',ownerId:'A',name:'Original',image:'fixture',sourceSHA256:'a'.repeat(64),sourceHashVerified:true,category:'Tops',originalPhoto:{image:'fixture',sha256:'a'.repeat(64)}};
   Object.assign(window,{batch:[item],items:[],localPending:new Map(),failedDraftCaptures:new Set([item.id]),captureOperationEpoch:0,db:{name:'closet-current-user-A'},closetAuth:{user:{id:'A'}},calls:[],notices:[],reviewedStyle122Active:false});
   window.captureProofOwner=()=>closetAuth.user.id;
   window.node=(tag,text,className)=>{const el=document.createElement(tag);if(text!=null)el.textContent=text;if(className)el.className=className;return el;};
   window.cropButton=()=>node('button','Crop photo');
   window.message=text=>notices.push(text);
   window.render=()=>{renderPhotoResults($('review'),batch);renderPhotoResults($('scan'),batch);};
   window.retryUncommittedCapture=photo=>new Promise((resolve,reject)=>calls.push({photo,resolve,reject}));
  });
  await page.addScriptTag({content:source});
  await page.evaluate(()=>render());
  const controls=page.locator('.retry-private-draft');
  await controls.first().click();
  await page.evaluate(()=>render());
  if(mode==='baseline'){
   assert.equal(await controls.first().isEnabled(),true);
   await controls.first().click();
   assert.equal(await page.evaluate(()=>calls.length),2);
   await page.evaluate(()=>{for(const call of calls)call.resolve(true);});
   console.log('PRIVATE_PHOTO_RETRY_RED',engine,width);
   await page.close();continue;
  }
  assert.equal(await controls.count(),2);
  for(const control of await controls.all())assert.equal(await control.isDisabled(),true);
  await page.evaluate(()=>retryFailedPhotoFromCard(batch[0],document.querySelector('.retry-private-draft')));
  assert.equal(await page.evaluate(()=>calls.length),1);
  await page.evaluate(()=>calls[0].reject(Error('fixture storage failure')));
  await page.waitForFunction(()=>[...document.querySelectorAll('.retry-private-draft')].every(x=>!x.disabled)&&notices.length===1);
  assert.equal(await page.evaluate(()=>batch[0].name),'Original');
  await controls.last().click();
  assert.equal(await page.evaluate(()=>calls.length),2);
  await page.evaluate(()=>{failedDraftCaptures.clear();render();calls[1].resolve(true);});
  await controls.first().waitFor({state:'detached'});
  assert.equal(await page.evaluate(()=>batch.length),1);
  // Same ID after a different login must not be unlocked by an old flight.
  await page.evaluate(()=>{failedDraftCaptures.add(batch[0].id);render();});
  await controls.first().click();
  await page.evaluate(()=>{captureOperationEpoch++;closetAuth={user:{id:'B'}};db={name:'closet-current-user-B'};batch=[{...batch[0],ownerId:'B'}];render();});
  await controls.first().click();
  assert.equal(await page.evaluate(()=>calls.length),4);
  await page.evaluate(()=>calls[2].reject(Error('old owner failure')));
  await page.evaluate(()=>new Promise(resolve=>setTimeout(resolve,0)));
  assert.equal(await controls.first().isDisabled(),true);
  assert.equal(await page.evaluate(()=>notices.length),1);
  await page.evaluate(()=>calls[3].reject(Error('new owner failure')));
  await page.waitForFunction(()=>notices.length===2&&[...document.querySelectorAll('.retry-private-draft')].every(x=>!x.disabled));
  console.log('PRIVATE_PHOTO_RETRY_GREEN',engine,width);
  await page.close();
 }
}finally{await browser.close();}
