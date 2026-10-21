// Synthetic browser image and account transitions, never real customer accounts or photo files.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
const importer=fs.readFileSync('public/photo-import.js','utf8');
const app=fs.readFileSync('public/app.js','utf8');
const handler=app.slice(app.indexOf('async function importClothingPhotos('),app.indexOf("$('clothingPhotos').onchange="));
const bootstrap=[
 'window.closetAuth={user:{id:"test-owner-a"}};',
 'window.__events=[];window.__views=[];',
 'let busy=false,session=0,batch=[],items=[];',
 'function stopCamera(){}function controls(){}',
 'function message(msg){window.__events.push(msg);}',
 'function switchView(view){window.__views.push(view);}',
 'function candidate(img){batch.push({image:img});return true;}',
 importer,handler,
 'window.__photoBatchSnapshot=()=>({n:batch.length,owner:window.closetAuth?.user?.id,views:window.__views.slice(),cancelled:window.__lastPhotoImportResult?.cancelled,filenames:window.__lastPhotoImportResult?.results?.map(x=>x.name)||[],busy});'
].join('\n');
const outcomes=[];
for(const [name,engine] of [['Android Chromium',chromium],['iPhone WebKit',webkit]]){
 const browser=await engine.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:3,serviceWorkers:'block'});
  const page=await context.newPage(),errors=[],urls=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',req=>{if(!/^(blob:|data:)/.test(req.url()))urls.push(req.url());});
  await page.goto('about:blank');await page.addScriptTag({content:bootstrap});
  const result=await page.evaluate(async()=>{
   const canvas=document.createElement('canvas');canvas.width=4032;canvas.height=3024;
   const ctx=canvas.getContext('2d');ctx.fillStyle='#f6f0e8';ctx.fillRect(0,0,canvas.width,canvas.height);
   ctx.fillStyle='#2563eb';ctx.fillRect(350,280,3200,2300);
   const blob=await new Promise(r=>canvas.toBlob(r,'image/jpeg',.88));
   const f=new File([blob],'mock-shirt.jpeg',{type:'image/jpeg'});
   await importClothingPhotos([f]);
   const initial=window.__photoBatchSnapshot();
   const jpg=batch.at(-1).image;
   const decoded=await createImageBitmap(await (await fetch(jpg)).blob());
   const dims=[decoded.width,decoded.height];decoded.close();
   let finish;
   photoToJPEG=()=>new Promise(resolve=>finish=resolve);
   const oldTotal=batch.length;
   const stale=importClothingPhotos([new File([blob],'old-person-shirt.jpg',{type:'image/jpeg'})]);
   window.closetAuth.user.id='test-owner-b';
   finish('data:image/jpeg;base64,OLD_PHOTO');await stale;
   const switched=window.__photoBatchSnapshot();
   const diagnostics=window.__lastPhotoImportResult;
   const safeAfterSwitch=switched.n===oldTotal&&
    !diagnostics.results.some(row=>JSON.stringify(row).includes('old-person'));
   return {initial,switched,dims,safeAfterSwitch};
  });
  assert.equal(result.initial.n,1);
  assert.equal(result.initial.cancelled,false);
  assert.deepEqual(result.dims,[3072,2304]);
  assert.equal(result.safeAfterSwitch,true);
  assert.equal(result.switched.cancelled,true);
  assert.equal(result.switched.n,1);
  assert.deepEqual(result.switched.filenames,[]);
  assert.equal(result.switched.busy,false);
  assert.deepEqual(errors,[]);assert.deepEqual(urls,[]);
  outcomes.push({browser:name,syntheticSourceDimensions:result.dims,
   ownerSwitchBlocked:true,staleDiagnosticsRedacted:true,sourceBeforeMask:true,
   realPhoneHardwareVerified:false,realAccountsTested:0,paidAIUsed:false});
  await context.close();
 }finally{await browser.close();}
}
console.log(JSON.stringify({status:'PASS',outcomes,realGarmentAccuracy:null,productionApproval:false}));
