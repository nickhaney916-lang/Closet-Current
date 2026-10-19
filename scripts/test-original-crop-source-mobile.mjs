// Synthetic, phone-sized browser verification of the real plain crop editor
// and app IndexedDB save path. No real photo, model, paid API or phone tested.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('dist'),types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json'};
const server=createServer(async(req,res)=>{
 try{
  const p=new URL(req.url,'http://localhost').pathname;
  const f=resolve(root,'.'+decodeURIComponent(p==='/'?'/index.html':p));
  if(!f.startsWith(root+'/'))throw Error('Unsafe path');
  const bytes=await readFile(f);
  res.writeHead(200,{'Content-Type':types[extname(f)]||'application/octet-stream'});res.end(bytes);
 }catch{res.writeHead(404);res.end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await context.route('**/auth.js*',route=>route.fulfill({contentType:'text/javascript',body:
  "window.closetAuth={user:{id:'plain-crop-source-check'},ready:Promise.resolve()};document.getElementById('authGate').hidden=true;document.getElementById('appShell').hidden=false;"}));
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:'+server.address().port+'/');
 await page.evaluate(()=>closetReady);
 await page.evaluate(()=>{
  const canvas=document.createElement('canvas');canvas.width=240;canvas.height=240;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#164dbb';ctx.fillRect(0,0,240,240);
  window.testFullScene=canvas.toDataURL('image/jpeg',.95);
  window.testPieceId='research-original-crop-source';
  const item=normalizeClothing({
   id:window.testPieceId,outfitSourceId:'full-outfit-source',
   image:'data:image/jpeg;base64,QUJDRA==',
   originalPhoto:{image:window.testFullScene},
   recognitionPhoto:{image:window.testFullScene},
   cropBounds:{x:.2,y:.1,width:.6,height:.7},
   segmentHint:{categories:['Tops','Outerwear'],types:[],clipped:false},
   category:'Uncategorized',itemType:'Unknown',color:'',seasons:[],
   userAdjusted:false
  });
  batch.push(item);
  cropClothingPhoto(item);
 });
 const dialog=page.locator('dialog.photo-crop-editor');
 await dialog.waitFor({state:'visible'});
 await dialog.getByRole('button',{name:'Save crop'}).click();
 await dialog.waitFor({state:'detached'});
 const result=await page.evaluate(async()=>{
  const item=batch.find(x=>x.id===window.testPieceId);
  const raw=item?.recognitionPhoto?.image,display=item?.image;
  const image=new Image();image.src=raw||'';if(raw)await image.decode();
  const drafts=await readDraft(),persisted=drafts.find(x=>x.id===window.testPieceId);
  return {hasOriginal:item?.originalPhoto?.image===window.testFullScene,
   rawPresent:typeof raw==='string'&&raw.startsWith('data:image/jpeg;base64,'),
   rawMatchesDisplay:raw===display,
   classifierReadsRaw:recognitionSourcePhoto(item)===raw,
   dimensions:raw?[image.naturalWidth,image.naturalHeight]:null,
   persistedOriginal:persisted?.originalPhoto?.image===window.testFullScene,
   persistedRaw:persisted?.recognitionPhoto?.image===raw,
   automaticSaves:items.filter(x=>x.id===window.testPieceId).length};
 });
 assert.equal(result.hasOriginal,true,'Full original scene must remain byte-identical');
 assert.equal(result.rawPresent,true,'Plain crop must retain recognitionPhoto');
 assert.equal(result.rawMatchesDisplay,true,'No mask: same RGB pixels for cropped display and raw classification');
 assert.equal(result.classifierReadsRaw,true,'Scanner must choose original RGB crop');
 assert.deepEqual(result.dimensions,[144,168]);
 assert.equal(result.persistedOriginal,true,'Durable draft keeps original photo');
 assert.equal(result.persistedRaw,true,'Durable draft keeps unmasked recognition crop');
 assert.equal(result.automaticSaves,0,'Manual crop must not silently approve uncertain wardrobe item');
 // An old captured outfit without its original must fail rather than using
 // its cleaned or generated display image as allegedly original RGB.
 const missing=await page.evaluate(async()=>{
  try{
   await openPhotoCrop({outfitSourceId:'old-source-missing',
    image:'data:image/jpeg;base64,QUJDRA=='},{analyze:async()=>null,save:async()=>{}});
   return false;
  }catch{return true;}
 });
 assert.equal(missing,true,'Missing original scene must fail closed');
 assert.deepEqual(errors,[],'No uncaught app or crop editor errors');
 console.log('ORIGINAL_CROP_SOURCE_MOBILE '+JSON.stringify({
  result:'passed',viewport:'390x844 touch',syntheticOnly:true,
  sourcePreserved:true,recognitionInputPreserved:true,draftRestoreSourcePreserved:true,
  missingOriginalRejected:true,automaticSaves:0,pageErrors:0,
  realModelTested:false,physicalPhoneTested:false
 }));
 await context.close();
}finally{await browser?.close();await new Promise(done=>server.close(done));}
