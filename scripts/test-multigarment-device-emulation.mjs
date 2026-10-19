// Device-EMULATED (NOT PHYSICAL HARDWARE) two-step provider-pipeline test.
// Every provider request is intercepted, so no credits or personal data flow.
import {chromium,webkit,devices} from 'playwright';
import assert from 'node:assert/strict';
import {resolve,extname} from 'node:path';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createServer} from 'node:http';

// Serve the actual built application, including its board and stylesheet.
// All external traffic is intercepted; synthetic accounts exist only in RAM.
const root=resolve('dist'),types={'.html':'text/html','.js':'text/javascript',
 '.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml',
 '.webp':'image/webp','.png':'image/png'};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  const path=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!path.startsWith(root+'/'))throw Error('Invalid asset path');
  const data=await readFile(path);
  res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream'});res.end(data);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const appUrl='http://127.0.0.1:'+server.address().port+'/';

async function check(engine,device,label){
 const browser=await engine.launch({headless:true});
 try{
  const page=await browser.newPage({...device,serviceWorkers:'block'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>route.request().url().startsWith(appUrl)?route.continue():route.abort('internetdisconnected'));
  await page.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',body:
   "window.closetAuth={user:{id:'synthetic-tryon-device-test'},ready:Promise.resolve(),getAccessToken:async()=>'fake-local-jwt'};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
  const images=await page.evaluate(()=>{
   const make=color=>{const canvas=document.createElement('canvas');
    canvas.width=72;canvas.height=108;canvas.getContext('2d').fillStyle=color;
    canvas.getContext('2d').fillRect(0,0,72,108);return canvas.toDataURL('image/jpeg',.85);};
   return {top:make('#378ae2'),bottom:make('#553077'),shoe:make('#161616'),
    first:make('#cb5e40'),final:make('#8ce44b')};
  });
  const calls=[];
  let delaySecond=false,mode='success',releaseSecondStatus;
  const polls=new Map();
  await page.route('https://hlkgymugtfbirlpunsra.supabase.co/functions/v1/ai-try-on',async route=>{
   const request=route.request();
   const headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,content-type',
     'Access-Control-Allow-Methods':'POST,OPTIONS'};
   if(request.method()==='OPTIONS')return route.fulfill({status:204,headers});
   const body=request.postDataJSON();calls.push(body);
   let answer;
   if(body.action==='availability')answer=mode==='account-switch-denied'?{status:'unavailable',multiGarmentReady:false}:{status:'ready',multiGarmentReady:true};
   else if(body.action==='start'){
    polls.clear();
    if(mode==='lost-start-response')return route.abort('failed');
    answer={status:'processing',token:'signed-stage-one'};
   }
   else if(body.action==='continue'){
    assert.equal(body.previousToken,'signed-stage-one');
    answer={status:'processing',token:'signed-stage-two'};
   }
   else if(body.action==='status'){
    assert.ok(['signed-stage-one','signed-stage-two'].includes(body.token),'all polls must carry the original signed job token');
    const count=(polls.get(body.token)||0)+1;polls.set(body.token,count);
    if(count===1||mode==='status-exhausted')return route.fulfill({status:503,headers,contentType:'application/json',
     body:JSON.stringify({error:'Temporary status outage'})});
    if(count===2)answer={status:'processing'};
    else if(body.token==='signed-stage-one')answer={status:'completed',image:
     mode==='corrupt-first'?'data:image/jpeg;base64,'+'Ab9/'.repeat(40):images.first};
    else{
     if(delaySecond)await new Promise(done=>{releaseSecondStatus=done});
     answer=mode==='failed-second'?{status:'failed'}:{status:'completed',image:
      mode==='corrupt-second'?'data:image/jpeg;base64,'+'Ab9/'.repeat(40):images.final};
    }
   } else throw Error('Unexpected request action');
   return route.fulfill({status:200,headers,contentType:'application/json',body:JSON.stringify(answer)});
  });
  await page.goto(appUrl);
  await page.evaluate(()=>Promise.all([closetReady,outfitBoardReady]));
  await page.evaluate(x=>{
   items.splice(0,items.length,...[
    {id:'own-top',category:'Tops',itemType:'T-shirt',image:x.top,color:'Blue'},
    {id:'own-bottom',category:'Bottoms',itemType:'Jeans',image:x.bottom,color:'Purple'},
    {id:'own-shoes',category:'Shoes',itemType:'Sneakers',image:x.shoe,color:'Black'}
   ].map(item=>normalizeClothing({...item,name:item.id,localAnalyzed:true})));
   currentBoard=cleanOutfitBoard({slots:{top:'own-top',bottom:'own-bottom',shoes:'own-shoes'}},items);
   switchView('builder');renderOutfitBoard();
  },images);
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
  assert.equal(start.plannedPasses,2,'reserve both passes before the first submission');
  assert.match(start.nextGarmentDigest,/^[a-f0-9]{64}$/);
  assert.match(start.requestId,/^[a-f0-9-]{36}$/);
  assert.match(second.requestId,/^[a-f0-9-]{36}$/);
  assert.notEqual(start.requestId,second.requestId);
  const retryIdentity=await page.evaluate(async()=>{
   const a=await tryOnAttemptFor(tryOnInputs());tryOnAttempt=null;
   const b=await tryOnAttemptFor(tryOnInputs());
   return {a,b,stored:JSON.parse(sessionStorage.getItem('closet-tryon-attempt-v1'))};
  });
  assert.deepEqual(retryIdentity.a,retryIdentity.b,'request IDs survive in-memory recovery');
  assert.deepEqual(Object.keys(retryIdentity.stored).sort(),['digest','ids'],'session storage contains no photos');
  assert.equal(second.garmentImage,images.bottom);
  assert.equal(second.category,'bottoms');
  assert.equal(second.previousToken,'signed-stage-one');
  assert.equal(second.figure,start.figure);
  assert.equal(Object.hasOwn(second,'modelImage'),false);
  assert.equal(await page.locator('#tryOnImage').getAttribute('src'),images.final);
  assert.match(await page.locator('#tryOnStatus').innerText(),/top \+ bottom/i);
  assert.match(await page.locator('#tryOnStatus').innerText(),/Not rendered: shoes/);
  assert.match(await page.locator('#tryOnStatus').innerText(),/earlier garments may change/);
  assert.equal(calls.filter(x=>x.action==='status'&&x.token==='signed-stage-one').length,3);
  assert.equal(calls.filter(x=>x.action==='status'&&x.token==='signed-stage-two').length,3);
  const originals=await page.evaluate(()=>JSON.stringify(items));
  const outputDir=process.env.TRYON_QA_OUTPUT;
  if(outputDir){
   await mkdir(outputDir,{recursive:true});
   await page.screenshot({path:resolve(outputDir,label.startsWith('iPhone')?'iphone-emulated-synthetic.png':'android-emulated-synthetic.png'),fullPage:true});
  }

  // Re-generating the same selection hides the old success immediately.
  // A failed second pass must not relabel a first-pass or previous image.
  mode='failed-second';
  let beforeStart=calls.filter(x=>x.action==='start').length;
  await page.locator('#tryOnGenerate').click();
  assert.equal(await page.locator('#tryOnImage').isHidden(),true);
  await page.waitForFunction(()=>!tryOnBusy,null,{timeout:14000});
  assert.equal(await page.locator('#tryOnImage').isHidden(),true);
  assert.match(await page.locator('#tryOnStatus').innerText(),/could not render/);
  assert.equal(await page.locator('#tryOnGenerate').isDisabled(),false);
  assert.equal(calls.filter(x=>x.action==='start').length,beforeStart+1);

  mode='status-exhausted';
  const beforeContinueFailure=calls.filter(x=>x.action==='continue').length,
   beforeFailedPoll=calls.filter(x=>x.action==='status').length;
  beforeStart=calls.filter(x=>x.action==='start').length;
  await page.locator('#tryOnGenerate').click();
  await page.waitForFunction(()=>!tryOnBusy,null,{timeout:8000});
  assert.equal(calls.filter(x=>x.action==='status').length,beforeFailedPoll+3,'only two read-only retries are permitted');
  assert.equal(calls.filter(x=>x.action==='start').length,beforeStart+1);
  assert.equal(calls.filter(x=>x.action==='continue').length,beforeContinueFailure);
  assert.equal(await page.locator('#tryOnImage').isHidden(),true);
  assert.equal(await page.locator('#tryOnGenerate').isDisabled(),false);

  for(const corrupt of ['corrupt-first','corrupt-second']){
   mode=corrupt;
   const beforeContinue=calls.filter(x=>x.action==='continue').length;
   await page.locator('#tryOnGenerate').click();
   await page.waitForFunction(()=>!tryOnBusy,null,{timeout:14000});
   assert.equal(await page.locator('#tryOnImage').isHidden(),true);
   assert.match(await page.locator('#tryOnStatus').innerText(),/could not be decoded/);
   assert.equal(calls.filter(x=>x.action==='continue').length,beforeContinue+(corrupt==='corrupt-first'?0:1),
    'a corrupt first image must never initiate another generation');
  }
  mode='lost-start-response';
  beforeStart=calls.filter(x=>x.action==='start').length;
  await page.locator('#tryOnGenerate').click();
  await page.waitForFunction(()=>!tryOnBusy,null,{timeout:5000});
  assert.equal(calls.filter(x=>x.action==='start').length,beforeStart+1,'an uncertain POST must never retry itself');
  assert.equal(await page.locator('#tryOnImage').isHidden(),true);
  mode='success';
  const uncertainStart=calls.filter(x=>x.action==='start').at(-1);
  await page.locator('#tryOnGenerate').click();
  await page.waitForFunction(()=>!tryOnBusy,null,{timeout:14000});
  assert.equal(await page.locator('#tryOnImage').getAttribute('src'),images.final,'an explicit retry recovers');
  assert.equal(calls.filter(x=>x.action==='start').at(-1).requestId,uncertainStart.requestId,
   'explicit recovery after uncertain submission must preserve the ledger request ID');
  assert.equal(calls.filter(x=>x.action==='start').at(-1).nextGarmentDigest,start.nextGarmentDigest);
  assert.equal(await page.evaluate(()=>JSON.stringify(items)),originals,'rendering never mutates the closet or source photos');
  // Neither corrupt source may reserve quota or submit the first garment.
  for(const sourceIndex of [0,1]){
   const beforePreflight=calls.filter(x=>x.action==='start'||x.action==='continue').length;
   await page.evaluate(index=>{items[index].image='data:image/jpeg;base64,'+'A'.repeat(160);onTryOnBoardChanged();},sourceIndex);
   await page.locator('#tryOnGenerate').click();
   await page.waitForFunction(()=>!tryOnBusy,null,{timeout:5000});
   assert.match(await page.locator('#tryOnStatus').innerText(),/Selected garment image could not be decoded/);
   assert.equal(calls.filter(x=>x.action==='start'||x.action==='continue').length,beforePreflight);
   await page.evaluate(({index,images})=>{items[index].image=index?images.bottom:images.top;onTryOnBoardChanged();},{index:sourceIndex,images});
  }
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
  await page.waitForFunction(()=>document.getElementById('tryOnStatus').textContent.includes('2 of 2'),null,{timeout:9000});
  // Wait for an actual second-stage response in flight, not only its label.
  await assert.doesNotReject(async()=>{
   const until=Date.now()+10000;
   while(!releaseSecondStatus&&Date.now()<until)await new Promise(done=>setTimeout(done,50));
   assert.ok(releaseSecondStatus,'second-stage provider response is held');
  });
  await page.evaluate(()=>{items[0].itemType='Blouse';onTryOnBoardChanged()});
  await page.waitForFunction(()=>!tryOnBusy,null,{timeout:3000});
  const afterCancel=calls.length;releaseSecondStatus();
  await page.waitForTimeout(100);
  assert.equal(calls.length,afterCancel,'a cancelled render cannot keep polling or continue');
  assert.equal(await page.locator('#tryOnImage').isHidden(),true);
  // Re-authentication to an account lacking pilot access cannot inherit the
  // old user's positive capability or make an otherwise billable POST.
  mode='account-switch-denied';
  const paidBeforeAccountSwitch=calls.filter(x=>['start','continue'].includes(x.action)).length;
  await page.evaluate(()=>{
   window.closetAuth.user={id:'synthetic-tryon-other-owner'};
   onTryOnBoardChanged();
  });
  await page.waitForFunction(()=>document.getElementById('tryOnStatus').textContent.includes('not available yet'),null,{timeout:8000});
  assert.equal(await page.locator('#tryOnGenerate').isDisabled(),true,
   'old-account availability cannot unlock the new signed-in owner');
  assert.equal(await page.evaluate(()=>tryOnReadinessOwner),'synthetic-tryon-other-owner');
  await page.evaluate(()=>generateTryOn());
  assert.equal(calls.filter(x=>['start','continue'].includes(x.action)).length,paidBeforeAccountSwitch,
   'switching accounts cannot issue a new provider generation request');
  assert.equal(await page.locator('#tryOnImage').isHidden(),true);
  assert.equal(errors.length,0,'no runtime exceptions on emulated device');
  return {device:label,engine:engine===webkit?'WebKit':'Chromium',
   viewport:device.viewport,actualDevice:false,providerCalls:0,actualBuiltApp:true,
   syntheticStarts:calls.filter(x=>x.action==='start').length,
   syntheticContinues:calls.filter(x=>x.action==='continue').length,
   bothSourcesPreflighted:true,stableLedgerRequestIds:true,prepaidPairRequested:true,repeatedProcessingPolls:true,transientStatusRecoveredWithoutNewJob:true,statusRetryLimitEnforced:true,corruptFirstAndSecondBlocked:true,
   failedSecondPassHidden:true,uncertainStartNotRetried:true,explicitRetryRecovered:true,
   staleResultBlocked:true,pendingFetchCancelled:true,accountSwitchDeniedWithoutPaidCall:true,sourcePhotosUnchanged:true,pageErrors:errors.length};
 }finally{await browser.close();}
}
const results=[];
try{
results.push(await check(chromium,devices['Pixel 7'],'Pixel 7 emulation'));
results.push(await check(webkit,devices['iPhone 13'],'iPhone 13 emulation'));
console.log('TWO_GARMENT_DEVICE_EMULATION '+JSON.stringify(results));
if(process.env.TRYON_QA_OUTPUT)await writeFile(resolve(process.env.TRYON_QA_OUTPUT,'device-emulation-results.json'),JSON.stringify({
 actualProviderCalls:0,physicalDeviceRuns:0,actualImageFidelity:null,results},null,2)+'\n');
}finally{await new Promise(done=>server.close(done));}
