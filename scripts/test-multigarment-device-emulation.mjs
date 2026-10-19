// Device-EMULATED (NOT PHYSICAL HARDWARE) two-step provider-pipeline test.
// Every provider request is intercepted, so no credits or personal data flow.
import {chromium,webkit,devices} from 'playwright';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';

async function check(engine,device,label){
 const browser=await engine.launch({headless:true});
 try{
  const page=await browser.newPage({...device});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setContent('<!doctype html><html><body>'+
    '<select id="tryOnFigure"><option value="female">Female</option><option value="male">Male</option></select>'+
    '<img id="tryOnModelPreview"><p id="tryOnModelCaption"></p>'+
    '<button id="tryOnGenerate" disabled>Generate</button><p id="tryOnStatus"></p>'+
    '<div id="outfitFigure"><img id="tryOnImage" hidden></div></body></html>');
  const images=await page.evaluate(()=>{
   const make=color=>{const canvas=document.createElement('canvas');
    canvas.width=72;canvas.height=108;canvas.getContext('2d').fillStyle=color;
    canvas.getContext('2d').fillRect(0,0,72,108);return canvas.toDataURL('image/jpeg',.85);};
   return {top:make('#378ae2'),bottom:make('#553077'),shoe:make('#161616'),
    first:make('#cb5e40'),final:make('#8ce44b')};
  });
  await page.evaluate(x=>{
   window.$=id=>document.getElementById(id);
   window.items=[
    {id:'own-top',category:'Tops',itemType:'T-shirt',image:x.top},
    {id:'own-bottom',category:'Bottoms',itemType:'Jeans',image:x.bottom},
    {id:'own-shoes',category:'Shoes',itemType:'Sneakers',image:x.shoe}
   ];
   window.currentBoard={slots:{top:'own-top',bottom:'own-bottom',shoes:'own-shoes'}};
   window.closetAuth={getAccessToken:async()=>'fake-local-jwt'};
  },images);
  const calls=[];
  let delaySecond=false;
  await page.route('https://hlkgymugtfbirlpunsra.supabase.co/functions/v1/ai-try-on',async route=>{
   const request=route.request();
   const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,content-type',
     'Access-Control-Allow-Methods':'POST,OPTIONS'};
   if(request.method()==='OPTIONS')return route.fulfill({status:204,headers});
   const body=request.postDataJSON();calls.push(body);
   let answer;
   if(body.action==='availability')answer={status:'ready',multiGarmentReady:true};
   else if(body.action==='start')answer={status:'processing',token:'signed-stage-one'};
   else if(body.action==='continue')answer={status:'processing',token:'signed-stage-two'};
   else if(body.action==='status'){
    if(body.token==='signed-stage-one')answer={status:'completed',image:images.first};
    else{
     if(delaySecond)await new Promise(done=>setTimeout(done,900));
     answer={status:'completed',image:images.final};
    }
   } else throw Error('Unexpected request action');
   return route.fulfill({status:200,headers,contentType:'application/json',body:JSON.stringify(answer)});
  });
  await page.addScriptTag({path:resolve('public/ai-tryon-plan.js')});
  await page.addScriptTag({path:resolve('public/ai-tryon.js')});
  await page.waitForFunction(()=>!document.getElementById('tryOnGenerate').disabled);
  assert.equal(await page.locator('#tryOnGenerate').innerText(),'Generate two-garment AI try-on');
  assert.equal(calls.filter(x=>x.action==='start'||x.action==='continue').length,0,
   'screen load must never launch a provider job');
  await page.locator('#tryOnGenerate').click();
  await page.waitForFunction(()=>!document.getElementById('tryOnImage').hidden,
   null,{timeout:12500});
  const actions=calls.map(x=>x.action);
  assert.equal(actions.filter(x=>x==='start').length,1);
  assert.equal(actions.filter(x=>x==='continue').length,1);
  const start=calls.find(x=>x.action==='start'),second=calls.find(x=>x.action==='continue');
  assert.equal(start.garmentImage,images.top);
  assert.equal(start.category,'tops');
  assert.equal(second.garmentImage,images.bottom);
  assert.equal(second.category,'bottoms');
  assert.equal(second.previousToken,'signed-stage-one');
  assert.equal(second.figure,start.figure);
  assert.equal(Object.hasOwn(second,'modelImage'),false);
  assert.equal(await page.locator('#tryOnImage').getAttribute('src'),images.final);
  assert.match(await page.locator('#tryOnStatus').innerText(),/top \+ bottom/i);
  assert.match(await page.locator('#tryOnStatus').innerText(),/Not rendered: shoes/);
  assert.match(await page.locator('#tryOnStatus').innerText(),/earlier garments may change/);
  const before=calls.length;
  await page.evaluate(()=>{items[1].image=items[0].image;onTryOnBoardChanged()});
  assert.equal(await page.locator('#tryOnImage').isHidden(),true,
   'source photo changes invalidate AI-generated two-piece appearance');
  assert.equal(calls.length,before,'changing clothing cannot silently trigger another paid call');

  // Re-use known synthetic photos, then change selected garment while a
  // second *intercepted* provider status request is pending.
  await page.evaluate(x=>{items[1].image=x.bottom;onTryOnBoardChanged();},images);
  delaySecond=true;
  await page.locator('#tryOnGenerate').click();
  await page.waitForFunction(()=>tryOnBusy&&tryOnPendingInputs!==null,{timeout:3000});
  await page.evaluate(()=>{items[0].itemType='Blouse';onTryOnBoardChanged()});
  await page.waitForFunction(()=>!tryOnBusy,null,{timeout:12000});
  assert.equal(await page.locator('#tryOnImage').isHidden(),true);
  assert.equal(errors.length,0,'no runtime exceptions on emulated device');
  return {device:label,engine:engine===webkit?'WebKit':'Chromium',
   viewport:device.viewport,actualDevice:false,providerCalls:0,
   syntheticStarts:calls.filter(x=>x.action==='start').length,
   syntheticContinues:calls.filter(x=>x.action==='continue').length,
   staleResultBlocked:true,sourcePhotosUnmodifiedByServer:true,pageErrors:errors.length};
 }finally{await browser.close();}
}
const results=[];
results.push(await check(chromium,devices['Pixel 7'],'Pixel 7 emulation'));
results.push(await check(webkit,devices['iPhone 13'],'iPhone 13 emulation'));
console.log('TWO_GARMENT_DEVICE_EMULATION '+JSON.stringify(results));
