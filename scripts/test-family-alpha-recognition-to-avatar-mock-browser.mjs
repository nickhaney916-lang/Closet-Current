/**
 * Browser-generated JPEG -> ACTUAL modern recognizeItem -> ACTUAL quick-color
 * IndexedDB transaction -> ACTUAL staged reviewed-JPEG 2D avatar controller.
 * Mock classifier, private Auth response and no network beyond local server.
 * This is functional MOCK QA, not provider recognition or live RLS testing.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,join,sep,extname} from 'node:path';
import {chromium,webkit} from 'playwright';
import {assertDisabledIntegratedCandidate,OUTPUT} from './build-family-alpha-recognition-integrated-hold.mjs';
const root=resolve(OUTPUT),repoRoot=resolve('.');
const app=await readFile(join(root,'app.js'),'utf8');
const segment=(a,b)=>{
 const i=app.indexOf(a),j=app.indexOf(b,i);
 if(i<0||j<i)throw Error('Recognition source contract moved: '+a);
 return app.slice(i,j);
};
const sourcePhoto=segment('function recognitionSourcePhoto(item){','function clothingFields(');
const weak=segment('const verifiedColorAdmission=new WeakMap();','// Saving is transactional');
const confirm=segment('function canConfirmReviewedColor(item){','function renderPhotoResults(');
const recognizer=segment('async function recognizeItem(item){','async function recognizeBatch()');
const queue=segment('function queued(work){','let db,items=[],batch=');
const dependencies=await readFile('tests/fixtures/family-alpha-recognition-avatar-mock-harness.js','utf8');
const harness=dependencies+'\n'+sourcePhoto+'\n'+queue+'\n'+weak+'\n'+confirm+'\n'+recognizer;
const panel='<section id="familyAlphaLocalPreview" hidden><button id="familyAlphaPreviewStart" disabled>Preview</button><p id="familyAlphaPreviewStatus"></p><div id="familyAlphaPreviewReview"></div><div id="familyAlphaPreviewAvatar"></div></section>';
const html='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><button id="logout">Logout</button><p id="localStatus"></p>'+panel+'<script src="/__qa__/recognition.js"></script></body></html>';
const mime={'.js':'text/javascript','.mjs':'text/javascript','.json':'application/json',
 '.bin':'application/octet-stream','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 try{
  const path=new URL(req.url,'http://localhost').pathname;
  if(path==='/__qa__/index.html'){res.writeHead(200,{'content-type':'text/html'});res.end(html);return;}
  if(path==='/__qa__/recognition.js'){res.writeHead(200,{'content-type':'text/javascript'});res.end(harness);return;}
  let file;
  if(path==='/__synthetic__/synthetic-garments.mjs')
   file=resolve(repoRoot,'research/family-alpha-13/synthetic-garments.mjs');
  else {
   if(!/^\/(?:family-alpha-|__alpha_research\/)/.test(path)||!/\.mjs$/.test(path))
    throw Error('Not allowed');
   file=resolve(root,'.'+path);
   if(!file.startsWith(root+sep))throw Error('Outside compiled artifact');
  }
  res.writeHead(200,{'content-type':mime[extname(file)]||'text/javascript'});
  res.end(await readFile(file));
 }catch{res.writeHead(404);res.end('not found');}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const cases=[];
try {
 const hold=await assertDisabledIntegratedCandidate();
 assert.equal(hold.releaseGate,'HOLD');
 for(const [browserName,driver] of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await driver.launch({headless:true,...(browserName==='Chromium'?{args:['--no-sandbox']}:{})});
  try{
   for(const width of [320,390,430]){
    const context=await browser.newContext({viewport:{width,height:850},
     deviceScaleFactor:2,isMobile:true,hasTouch:true,serviceWorkers:'block'});
    const page=await context.newPage(),errors=[],outside=[],missing=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400)missing.push(r.url()+' '+r.status());});
    await context.route('**/*',route=>{
     if(!route.request().url().startsWith(origin+'/')){outside.push(route.request().url());return route.abort('blockedbyclient');}
     return route.continue();
    });
    try{
     await page.goto(origin+'/__qa__/index.html');
     const result=await page.evaluate(async()=>{
      const {syntheticGarment}=await import('/__synthetic__/synthetic-garments.mjs');
      const raw=syntheticGarment('Tops');
      const canvas=document.createElement('canvas');
      canvas.width=raw.frame.width;canvas.height=raw.frame.height;
      canvas.getContext('2d').putImageData(new ImageData(raw.frame.data,canvas.width,canvas.height),0,0);
      const photo=canvas.toDataURL('image/jpeg',.97);
      const decoded=await createImageBitmap(await (await fetch(photo)).blob());
      if(decoded.width!==canvas.width||decoded.height!==canvas.height)
       throw Error('Browser-generated source JPEG decode mismatch');
      await window.__syntheticFlow.openPrivate();
      const scan=await window.__syntheticFlow.scanRealPhoto(photo);
      if(!scan.classified||!scan.reviewRequired||!scan.chooseColor||!scan.noAutoSave||!scan.sourceUnchanged)
       throw Error('Original-source real recognizer did not request safe human color');
      const saved=await window.__syntheticFlow.confirmAndSelect();
      if(saved.color!=='Blue'||saved.source!=='user'||!saved.originalPreserved||!saved.reviewCleared)
       throw Error('Confirmed garment was not saved atomically with original JPEG');
      return {scan,saved,width:canvas.width,height:canvas.height};
     });
     const callbacks=await page.evaluate(async()=>{
      const {mountAlphaBuilderPreview}=await import('/family-alpha-preview-controller.mjs');
      const f=window.__syntheticFlow,owner=f.ownerA;
      const cloud={getOwnerId:db=>db===f.getDb()&&f.isOwnerA()?owner:null};
      const controller=mountAlphaBuilderPreview({
       panel:document.getElementById('familyAlphaLocalPreview'),
       launch:document.getElementById('familyAlphaPreviewStart'),
       review:document.getElementById('familyAlphaPreviewReview'),
       avatar:document.getElementById('familyAlphaPreviewAvatar'),
       status:document.getElementById('familyAlphaPreviewStatus'),
       auth:window.closetAuth,cloud,getDatabase:f.getDb,
       getLatestItem:id=>f.getItems().find(x=>x.id===id),
       fetchFn:async (url,options)=>{
        if(url!=='https://fbnplztkbsteuzrmbgib.supabase.co/auth/v1/user'||
           options.headers.Authorization!=='Bearer synthetic-jwt-not-valid')
         throw Error('Unexpected mock stage Auth route');
        return {status:200,ok:true,json:async()=>({id:owner})};
       },publicKey:'mock-publishable',cryptoProvider:crypto,localApproved:true
      });
      return {panelHidden:document.getElementById('familyAlphaLocalPreview').hidden};
     });
     assert.equal(callbacks.panelHidden,false);
     await page.locator('#familyAlphaPreviewStart').click();
     await page.getByRole('button',{name:'Use cutout'}).waitFor({timeout:15000});
     await page.getByRole('button',{name:'Use cutout'}).click();
     await page.waitForFunction(()=>document.querySelectorAll('#familyAlphaPreviewAvatar img[data-slot="top"]').length===1,null,{timeout:15000});
     const image=await page.evaluate(()=>document.querySelector('#familyAlphaPreviewAvatar img[data-slot="top"]')?.src||'');
     assert.ok(image.startsWith('data:image/png;base64,'),'Rendered layer must use verified transparent actual pixels');
     const blocked=await page.evaluate(async()=>{
      const f=window.__syntheticFlow,db=f.getDb();
      f.switchOwner();
      const {readAlphaSavedWardrobe}=await import('/family-alpha-2d-account-snapshot.mjs');
      let rejected=false;
      try{
       await readAlphaSavedWardrobe({auth:window.closetAuth,
        cloud:{getOwnerId:()=>null},database:db});
      }catch{rejected=true;}
      window.dispatchEvent(new Event('closet:alpha-session-changed'));
      return {rejected,layerCount:document.querySelectorAll('#familyAlphaPreviewAvatar img').length};
     });
     assert.equal(blocked.rejected,true,'Other account cannot read original owner IndexedDB via snapshot');
     assert.equal(blocked.layerCount,0,'Avatar must clear when Auth owner changes');
     assert.deepEqual(missing,[],'No missing combined JS modules');
     assert.deepEqual(outside,[],'No network outside the browser-local fixture');
     assert.deepEqual(errors,[],'No uncaught browser JS errors');
     cases.push({browser:browserName,width,jpegDecoded:true,classifiedByActualHandler:true,
      humanColorSavedToIndexedDB:true,originalSourcePreserved:true,
      transparentPhotoAvatarRendered:true,otherOwnerDenied:true,
      ownerSwapClearedAvatar:true,externalRequests:0,pageErrors:0});
    }finally{await context.close();}
   }
  }finally{await browser.close();}
 }
 assert.equal(cases.length,6);
 console.log('FAMILY_ALPHA_RECOGNITION_TO_AVATAR_MOCK_FLOW_PASS '+JSON.stringify(cases));
}finally{await new Promise(done=>server.close(done));}
