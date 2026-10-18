import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';

// Browser smoke tests use a synthetic image and intercept ALL requests to the
// provider proxy. No credit, human photo or third-party model is used.
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent(`<!DOCTYPE html><select id="tryOnFigure"><option value="female">Female</option><option value="male">Male</option></select>
 <button id="tryOnGenerate" disabled>Generate</button><p id="tryOnStatus"></p><div id="outfitFigure"><img id="tryOnImage" hidden></div>`);
 const fakeImage=await page.evaluate(()=>{
  const c=document.createElement('canvas');c.width=48;c.height=64;
  const ctx=c.getContext('2d');ctx.fillStyle='#1358ca';ctx.fillRect(0,0,48,64);
  return c.toDataURL('image/jpeg',.92);
 });
 await page.evaluate(img=>{
  window.$=id=>document.getElementById(id);
  window.items=[{id:'owned',category:'Tops',itemType:'T-shirt',image:img}];
  window.currentBoard={slots:{top:'owned'}};
  window.closetAuth={getAccessToken:async()=>'test-jwt'};
 },fakeImage);
 let calls=[],reject=false;
 await page.route('https://hlkgymugtfbirlpunsra.supabase.co/functions/v1/ai-try-on',async route=>{
  const request=route.request();
  if(request.method()==='OPTIONS')return route.fulfill({status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'}});
  const b=request.postDataJSON();calls.push(b);
  if(b.action==='availability')return route.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({status:'ready'})});
  if(reject)return route.fulfill({status:503,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({error:'Pilot not configured'})});
  return route.fulfill({status:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},
   body:JSON.stringify(b.action==='start'?{status:'processing',token:'signed-provider-job'}:{status:'completed',image:fakeImage})});
 });
 await page.addScriptTag({path:resolve('public/ai-tryon-plan.js')});
 await page.addScriptTag({path:resolve('public/ai-tryon.js')});
 await page.waitForFunction(()=>!document.querySelector('#tryOnGenerate').disabled);
 assert.equal(calls.filter(x=>x.action==='availability').length,1,'Only a cost-free availability check may run on load');
 assert.equal(calls.filter(x=>x.action==='start').length,0,'Selecting clothing must not trigger paid inference');
 await page.locator('#tryOnFigure').selectOption('male');
 assert.equal(calls.filter(x=>x.action==='start').length,0,'Selecting figure must never submit image');
 await page.locator('#tryOnGenerate').click();
 await page.waitForFunction(()=>!document.querySelector('#tryOnImage').hidden,null,{timeout:7000});
 assert.equal(calls.filter(x=>x.action==='start').length,1);
 assert.equal(calls.filter(x=>x.action==='status').length,1);
 const start=calls.find(x=>x.action==='start');
 assert.equal(start.figure,'male');assert.equal(start.category,'tops');
 assert.equal(start.garmentImage,fakeImage);
 assert.equal(await page.locator('#tryOnImage').getAttribute('src'),fakeImage);
 assert.equal(await page.locator('#outfitFigure').evaluate(el=>el.classList.contains('ai-tryon-active')),true,'true render replaces the silhouette viewport');
 await page.locator('#tryOnFigure').selectOption('female');
 assert.equal(await page.locator('#tryOnImage').isHidden(),true,'changing model invalidates existing preview');
 assert.equal(await page.locator('#outfitFigure').evaluate(el=>el.classList.contains('ai-tryon-active')),false);
 assert.equal(calls.filter(x=>x.action==='start').length,1,'switching figure must not trigger paid inference');

 reject=true;
 await page.locator('#tryOnGenerate').click();
 await page.waitForFunction(()=>document.querySelector('#tryOnStatus').textContent.includes('Pilot not configured'));
 assert.equal(await page.locator('#tryOnImage').isHidden(),true,'provider failure cannot display a pretend result');
 assert.equal(await page.locator('#tryOnGenerate').isDisabled(),false,'pilot failure is retryable');
 const charges=calls.filter(x=>x.action==='start').length;
 await page.evaluate(()=>{tryOnReady=false;onTryOnBoardChanged();document.querySelector('#tryOnGenerate').click();});
 assert.equal(await page.locator('#tryOnGenerate').isDisabled(),true,'disabled pilot blocks generation');
 assert.equal(calls.filter(x=>x.action==='start').length,charges,'disabled pilot must never launch paid inference');
 assert.equal(errors.length,0,'client JS should not crash');

 console.log('REAL_AI_TRYON_PILOT_SMOKE '+JSON.stringify({
  result:'passed',figures:['female','male'],paidCallsSimulated:2,
  actualProviderCalls:0,savedOrUploadedSelfies:0,pageErrors:errors.length}));
}finally{await browser.close();}
