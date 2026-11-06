/**
 * PHOTO120 actual Closet Current app page camera-photo file input -> Adjust ->
 * original public-license JPEG -> confirmed category/type/color -> atomic
 * IndexedDB -> My Closet. Auth and model scores are test fixtures, not a
 * signed cloud account, independent AI inference, or physical camera.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {chromium,webkit} from 'playwright';

const original=readFileSync('benchmark/fixtures/commons-0053.jpg');
const base=resolve('.');
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.json':'application/json'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/(?:public|research)\/[-a-zA-Z0-9_/\.]+$/.test(path)||path.includes('..'))
   throw Error('forbidden');
  const file=resolve(base,'.'+path);
  if(!file.startsWith(base+'/'))throw Error('outside checkout');
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream',
   'cache-control':'no-store'});
  res.end(await readFile(file));
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const host='http://127.0.0.1:'+server.address().port;
const out='benchmark/reviewed-app-capture-closet-120';
await mkdir(out,{recursive:true});
const auth=id=>'window.closetAuth={ready:Promise.resolve(),user:{id:'+JSON.stringify(id)+
 ',email:"fixture@example.invalid"},assertCurrent(){if(!this.user?.id)throw Error("Signed out");}};'+
 'document.getElementById("authGate").hidden=true;document.getElementById("appShell").hidden=false;';
const cloud='window.closetCloud={beforeWrite:async()=>{},changed:()=>{},start:async()=>{},stop:async()=>{}};';
function weakWorker(){
 class WeakRecognitionWorker{
  constructor(url){this.url=String(url);this.onmessage=null;this.terminated=false;}
  postMessage(d){
   const msg={id:d.id,type:d.type==='classify'?'result':'ready',
    strong:false,categoryConfirmed:false,
    choices:[{category:'Bottoms',itemType:'Jeans',label:'a pair of jeans',score:.23}],
    details:{color:'Blue'}};
   setTimeout(()=>{if(!this.terminated)this.onmessage?.({data:msg});},0);
  }
  terminate(){this.terminated=true;}
 }
 Object.defineProperty(window,'Worker',{configurable:true,value:WeakRecognitionWorker});
}
const results=[],errors=[],outbound=[];
let browser;
try{
 for(const [name,engine,widths] of [
  ['chromium',chromium,[320,390,430]],['webkit',webkit,[390]]
 ]){
  browser=await engine.launch({headless:true,
   args:name==='chromium'?['--disable-dev-shm-usage']:[]});
  for(const width of widths){
   const context=await browser.newContext({viewport:{width,height:920},
    deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});
   try{
    const page=await context.newPage();
    page.on('pageerror',e=>errors.push(name+'/'+width+': '+e.message));
    await page.addInitScript(weakWorker);
    const ownerId='p120-'+name+'-'+width+'-fixture';
    await page.route('**/*',route=>{
     const url=route.request().url();
     if(url===host+'/public/auth.js')return route.fulfill({
      status:200,contentType:'text/javascript',body:auth(ownerId)});
     if(url===host+'/public/cloud-backup.js')return route.fulfill({
      status:200,contentType:'text/javascript',body:cloud});
     if(url===host+'/public/cloud-backup-bridge.js')return route.fulfill({
      status:200,contentType:'text/javascript',body:''});
     if(url.startsWith(host+'/')||url.startsWith('data:')||url.startsWith('blob:'))
      return route.continue();
     if(url.startsWith('https://fonts.googleapis.com/')||
        url.startsWith('https://raw.githubusercontent.com/nickhaney916-lang/Closet-Current/main/public/trend-data.json?'))
      return route.abort();
     outbound.push(name+'/'+width+': '+url);return route.abort();
    });
    await page.goto(host+'/public/index.html?captureProof01=after&index04=after&reviewedSave120=research&index02=after',
     {waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.closetIndex02?.state()?.ready===true,
     null,{timeout:30000});
    assert.equal(await page.evaluate(()=>reviewedSave120Active),true);
    // Controlled weak model output. Real JPEG conversion/crypto/storage is
    // executed by actual shipped app code on a localhost research checkout.
    await page.evaluate(()=>{
     localReady=true;localRequest=async()=>({strong:false,categoryConfirmed:false,
      choices:[{category:'Bottoms',itemType:'Jeans',label:'a pair of jeans',score:.23}],
      details:{color:'Blue'}});
    });
    await page.locator('#clothingPhotos').setInputFiles({
     name:'source-licensed-original.jpg',mimeType:'image/jpeg',buffer:original
    });
    await page.waitForFunction(()=>batch.length===1&&
     batch[0].sourceHashVerified===true&&!!batch[0].originalPhoto?.sha256,
      null,{timeout:30000});
    await page.waitForFunction(()=>!localPending.has(batch[0].id),null,{timeout:20000});
    const before=await page.evaluate(async()=>{
     await writes;
     const it=batch[0],saved=await readAll(),draft=await readDraft();
     return {savedCount:saved.length,ownerBound:it.ownerId===window.closetAuth.user.id,
      originalPhotoPreserved:it.originalPhoto?.image===it.image,
      originalSourceHashClaim:it.originalPhoto?.sha256===it.sourceSHA256,
      singleGarmentStillUnproven:it.singleGarmentVerified!==true,
      originalIsJPEG:it.image.startsWith('data:image/jpeg;base64,'),
      draftPersisted:draft.some(x=>x.id===it.id),batchCount:batch.length};
    });
    for(const [key,expected] of Object.entries({
     savedCount:0,ownerBound:true,originalPhotoPreserved:true,
     originalSourceHashClaim:true,singleGarmentStillUnproven:true,
     originalIsJPEG:true,draftPersisted:true,batchCount:1
    }))assert.equal(before[key],expected,name+'/'+width+' initial '+key);
    await page.screenshot({path:out+'/'+name+'-'+width+'-01-actual-photo-review.png',fullPage:true});
    await page.locator('#reviewGrid .photo-result').first()
     .getByRole('button',{name:'Adjust',exact:true}).click();
    const dialog=page.locator('dialog.photo-adjust[open]');
    await dialog.waitFor({state:'visible'});
    await dialog.locator('select[aria-label="Main category"]').selectOption('Bottoms');
    await dialog.locator('select[aria-label="Item type"]').selectOption('Skirt');
    await dialog.locator('input[aria-label="Color"]').fill('Cream');
    assert.equal(await dialog.locator('input[aria-label="I verified the category, clothing type and color"]').isChecked(),false);
    assert.equal(await dialog.locator('input[aria-label="I confirmed this photo shows one garment"]').isChecked(),false);
    // Native required checkboxes block Save until deliberately confirmed.
    await dialog.getByRole('button',{name:'Save changes'}).click();
    assert.equal(await page.evaluate(async()=>(await readAll()).length),0);
    assert.equal(await dialog.isVisible(),true);
    await dialog.locator('input[aria-label="I verified the category, clothing type and color"]').check();
    await dialog.locator('input[aria-label="I confirmed this photo shows one garment"]').check();
    await page.screenshot({path:out+'/'+name+'-'+width+'-02-real-adjust-confirm.png',fullPage:true});
    await dialog.getByRole('button',{name:'Save changes'}).click();
    await page.waitForFunction(()=>items.length===1&&batch.length===0,
     null,{timeout:30000});
    const after=await page.evaluate(async()=>{
     await writes;
     const saved=await readAll(),draft=await readDraft(),item=saved[0];
     await window.closetIndex02.refresh();
     return {
      actualSavedRows:saved.length,category:item?.category,itemType:item?.itemType,
      color:item?.color,sourceSHAUnchanged:item?.originalPhoto?.sha256===item?.sourceSHA256,
      originalJPEGUnchanged:item?.originalPhoto?.image===item?.image,
      ownerBinding:item?.ownerId===window.closetAuth.user.id,
      humanReviewed:item?.userAdjusted===true&&item?.ownerReviewed===true,
      manualColorProvenance:item?.colorSource==='user',
      sourceVerified:item?.sourceHashVerified===true,
      remainingDraftItems:draft.length,ownerIndexTotal:window.closetIndex02.state().total,
      dialogClosed:!document.querySelector('dialog.photo-adjust[open]'),
      status:document.getElementById('message').textContent
     };
    });
    for(const [key,value] of Object.entries({
     actualSavedRows:1,category:'Bottoms',itemType:'Skirt',color:'Cream',
     sourceSHAUnchanged:true,originalJPEGUnchanged:true,ownerBinding:true,
     humanReviewed:true,manualColorProvenance:true,sourceVerified:true,
     remainingDraftItems:0,ownerIndexTotal:1,dialogClosed:true
    }))assert.equal(after[key],value,name+'/'+width+' saved '+key);
    assert.match(after.status,/saved to your private closet/);
    await page.evaluate(()=>{window.closetBrowseAll=true;switchView('closet');});
    await page.locator('#index02Category').selectOption('Bottoms');
    await page.waitForFunction(()=>window.closetIndex02.state().matched===1);
    assert.equal(await page.locator('#closetGrid article.card').count(),1);
    assert.match(await page.locator('#closetGrid article.card').innerText(),/Cream/);
    await page.screenshot({path:out+'/'+name+'-'+width+'-03-real-my-closet-skirt.png',fullPage:true});
    await page.evaluate(()=>switchView('scan'));
    await page.locator('#clothingPhotos').setInputFiles({
     name:'exact-original-repeat.jpg',mimeType:'image/jpeg',buffer:original
    });
    await page.waitForFunction(()=>!busy,null,{timeout:30000});
    assert.equal(await page.evaluate(async()=>(await readAll()).length),1);
    assert.equal(await page.evaluate(()=>batch.length),0);
    const noOverflow=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1);
    assert.equal(noOverflow,true);
    results.push({browser:name,width,realAppPage:true,actualPhotoUploadInput:true,
     originalSourceIndependentHash:true,actualUserCorrectionForm:true,
     actualOwnerBoundIndexedDB:true,actualMyClosetSaved:true,
     duplicateSourceRejected:true,manualConfirmationRequired:true,
     noHorizontalOverflow:true,physicalCameraTested:false,
     actualAIModelExecution:false,actualSignedCloudRLS:false,
     physicalPhoneTested:false,productionDeployed:false,
     familyAlpha:'HOLD',releaseAuthorized:false});
   }finally{await context.close();}
  }
  await browser.close();browser=null;
 }
 assert.equal(errors.length,0,'App errors: '+errors.join('; '));
 assert.equal(outbound.length,0,'Unexpected external network: '+outbound.join('; '));
 assert.equal(results.length,4);
 await writeFile(out+'/browser-results.json',JSON.stringify({
  researchOnly:true,realLicensedOriginalJPEG:true,
  onlySyntheticModelScores:true,realAuthenticatedCloudUsers:false,
  physicalPhoneCameraVerified:false,productionDeployed:false,
  familyAlpha:'HOLD',releaseAuthorized:false,scenarios:results
 },null,2));
 console.log('PHOTO120 real app camera-photo import / Adjust / private closet chromium+webkit 4/4 PASS');
}catch(e){
 await writeFile(out+'/failure.json',JSON.stringify({
  error:String(e),stack:String(e?.stack||''),errors,outbound,results
 },null,2));
 throw e;
}finally{
 await browser?.close();
 await new Promise(done=>server.close(done));
}
