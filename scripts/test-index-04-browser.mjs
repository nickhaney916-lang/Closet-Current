/**
 * INDEX-04 real mobile Chromium research smoke.
 * Exercises actual public/index.html, account-bound IndexedDB, real JPEG
 * canvas images and actual recognizeItem() save boundary. Worker model output
 * is mocked: this is NOT a fresh FashionCLIP recognition or phone test.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';

const root=resolve('.');
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(!/^\/(?:public|research)\/[-a-zA-Z0-9_/\.]+$/.test(path)||path.includes('..'))throw Error('blocked');
  const file=resolve(root,'.'+path);
  if(!file.startsWith(root+'/'))throw Error('outside root');
  const body=await readFile(file);
  res.writeHead(200,{'content-type':extname(file)==='.html'?'text/html':
   ['.js','.mjs'].includes(extname(file))?'text/javascript':
   extname(file)==='.css'?'text/css':'application/octet-stream'});
  res.end(body);
 }catch{res.writeHead(404);res.end('missing');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const host='http://127.0.0.1:'+server.address().port;
const output='benchmark/index-04';
await mkdir(output,{recursive:true});
const auth='window.closetAuth={ready:Promise.resolve(),user:{id:"index04-private-A",email:"fixture@example.invalid"}};document.getElementById("authGate").hidden=true;document.getElementById("appShell").hidden=false;';
const cloud='window.closetCloud={beforeWrite:async()=>{},changed:()=>{},start:async()=>{},stop:async()=>{}};';
let browser;const evidence=[],errors=[],outbound=[];
try{
 browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
 for(const width of [320,390,430]){
  const ctx=await browser.newContext({viewport:{width,height:920},
   deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});
  try{
   const page=await ctx.newPage();
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*',route=>{
    const url=route.request().url();
    if(url===host+'/public/auth.js')return route.fulfill({status:200,contentType:'text/javascript',body:auth});
    if(url===host+'/public/cloud-backup.js')return route.fulfill({status:200,contentType:'text/javascript',body:cloud});
    if(url===host+'/public/cloud-backup-bridge.js')return route.fulfill({status:200,contentType:'text/javascript',body:''});
    if(url.startsWith(host+'/')||url.startsWith('data:')||url.startsWith('blob:'))return route.continue();
    if(url.startsWith('https://fonts.googleapis.com/')||
       url.startsWith('https://raw.githubusercontent.com/nickhaney916-lang/Closet-Current/main/public/trend-data.json?'))
      return route.abort();
    outbound.push(url);return route.abort();
   });
   await page.goto(host+'/public/index.html?index02=after&index04=after',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>window.closetIndex02?.state()?.ready===true,null,{timeout:30000});
   const facts=await page.evaluate(async()=>{
    const canvas=document.createElement('canvas');canvas.width=110;canvas.height=160;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#2453b1';ctx.fillRect(0,0,110,160);
    ctx.fillStyle='#c0d4f6';ctx.fillRect(10,10,36,135);
    ctx.fillStyle='#152859';ctx.fillRect(65,18,22,120);
    const image=canvas.toDataURL('image/jpeg',.95);
    const binary=atob(image.split(',')[1]);
    const bytes=Uint8Array.from(binary,x=>x.charCodeAt(0));
    const digest=await crypto.subtle.digest('SHA-256',bytes);
    const sha=Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('');
    const model={strong:true,categoryConfirmed:true,choices:[{
     category:'Bottoms',itemType:'Jeans',label:'a pair of jeans',score:.97,
     sleeveLength:'Not applicable'}],details:{color:'Blue'}};
    localReady=true;
    // Only this controlled browser QA replaces the inference response.
    localRequest=async(type)=>type==='classify'?model:{type:'loaded'};
    const create=(id,extra={})=>normalizeClothing({id,image,name:'',
     category:'Uncategorized',itemType:'Unknown',color:'Blue',confirmedColor:true,
     notes:'',...extra});
    const unsafe=create('unverified-'+innerWidth);
    batch=[unsafe];await persistDraft();
    await recognizeItem(unsafe);
    const unsafeStatus=unsafe.localStatus;
    const unsafeSaved=(await readAll()).some(x=>x.id===unsafe.id);
    const unsafeDraft=batch.some(x=>x.id===unsafe.id&&x.image===image);
    // Exactly the same actual JPEG is now accompanied by a verified separate
    // full-resolution identity assertion; this is a synthetic positive fixture.
    const safe=create('verified-'+innerWidth,{sourceSHA256:sha,
     sourceHashVerified:true,singleGarmentVerified:true});
    // Never lose an unverified review draft when a separate piece saves.
    batch=[unsafe,safe];await persistDraft();
    await recognizeItem(safe);
    const saved=(await readAll()).filter(x=>x.id===safe.id);
    // The scanner schedules an additional queued draft write and INDEX-02
    // refresh after the save transaction. Allow the committed write queue to
    // settle before measuring the final owner-index generation.
    await writes;
    const reviewDraft=await readDraft();
    await window.closetIndex02.refresh();
    return {unsafeStatus,unsafeSaved,unsafeDraft,
      unsafeSurvivesOtherItemSave:reviewDraft.some(x=>x.id===unsafe.id&&x.image===image),
      verifiedSaved:saved.length===1,verifiedCategory:saved[0]?.category,
      verifiedType:saved[0]?.itemType,
      verifiedPhotoUnchanged:saved[0]?.image===image,
      indexedSavedCount:window.closetIndex02.state().total,
      shaMatches:saved[0]?.sourceSHA256===sha};
   });
   assert.equal(facts.unsafeSaved,false,'uncertain original must not auto-save');
   assert.equal(facts.unsafeDraft,true,'unsaved review still preserves JPEG');
   assert.equal(facts.unsafeSurvivesOtherItemSave,true,'unverified photo survives another saved item');
   assert.match(facts.unsafeStatus,/confirm.*Adjust/i,'review must be understandable');
   assert.equal(facts.verifiedSaved,true,'proof-backed recognition must save in real IDB');
   assert.equal(facts.verifiedPhotoUnchanged,true);
   assert.equal(facts.verifiedCategory,'Bottoms');
   assert.equal(facts.verifiedType,'Jeans');
   assert.equal(facts.shaMatches,true);
   assert.equal(facts.indexedSavedCount,1);
   // Exercise the same My Closet saved-snapshot reload/browse-all path as INDEX-02.
   await page.evaluate(async()=>{
    items=(await readAll()).map(normalizeClothing);
    window.closetBrowseAll=true;
    render();switchView('closet');
    await window.closetIndex02.refresh();
   });
   await page.locator('#index02Category').selectOption('Bottoms');
   await page.waitForFunction(()=>window.closetIndex02?.state()?.matched===1);
   assert.equal(await page.locator('#closetGrid article.card').count(),1);
   await page.screenshot({path:output+'/'+width+'-actual-app-owner-index.png',fullPage:true});
   await page.evaluate(()=>switchView('review'));
   assert.equal(await page.locator('#reviewGrid article.photo-result').count(),1,
    'real review page must display retained original unverified photo');
   assert.match(await page.locator('#reviewGrid article.photo-result').innerText(),
    /confirm garment|Needs review/i,'review card must direct person to confirmation');
   await page.screenshot({path:output+'/'+width+'-real-review-page.png',fullPage:true});
   await page.evaluate(async()=>{
    window.closetAuth.user=null;
    await window.closetIndex02.refresh();
   });
   assert.equal(await page.evaluate(()=>window.closetIndex02.state().ready),false);
   evidence.push({width,actualPublicApp:true,actualIndexedDB:true,
    realJPEGCanvasSource:true,mockedModelOutput:true,unverifiedIsReview:true,
    provenSingleJpegAutosaved:true,savedOwnerIndexRefreshed:true,
    originalJpegRetained:true,logoutClearsPrivateIndex:true,
    physicalPhoneTested:false});
  }finally{await ctx.close();}
 }
 assert.equal(errors.length,0,'Browser errors: '+errors.join(' / '));
 assert.equal(outbound.length,0,'New unauthorized offsite requests');
 await writeFile(output+'/results.json',JSON.stringify({
  verdict:'PASS',evidence,errors,outbound,productionDeployed:false,
  realModelInference:false,physicalPhoneApproved:false,familyAlpha:'HOLD'
 },null,2));
 console.log('INDEX-04 actual app browser review+safe save PASS',JSON.stringify(evidence));
}catch(err){
 await writeFile(output+'/failure.json',JSON.stringify({error:String(err),errors,outbound,evidence},null,2));
 throw err;
}finally{await browser?.close();await new Promise(done=>server.close(done));}
