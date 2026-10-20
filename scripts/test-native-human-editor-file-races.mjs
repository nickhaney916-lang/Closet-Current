// Actual Chromium emulation of concurrent ORIGINAL-photo and human-draft loads.
// Artificially delay individual browser promises; never create real labels or approvals.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {resolve} from 'node:path';

const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:840},deviceScaleFactor:2});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  const oldDecode=Image.prototype.decode;
  Image.prototype.decode=function(...args){
   const promise=oldDecode.apply(this,args);
   if(!window.__holdFirstDecode)return promise;
   window.__holdFirstDecode=false;
   return promise.then(()=>new Promise(ready=>{window.__releaseFirstDecode=ready;}));
  };
  const oldText=File.prototype.text;
  File.prototype.text=function(...args){
   const promise=oldText.apply(this,args);
   if(!window.__holdFirstDraft||!this.name.endsWith('.draft.json'))return promise;
   window.__holdFirstDraft=false;
   return promise.then(text=>new Promise(ready=>{window.__releaseFirstDraft=()=>ready(text);}));
  };
 });
 await page.goto('file://'+resolve('benchmark/annotate-garment-native.html'));
 const images=await page.evaluate(()=>{
  const make=(r,g,b)=>{
   const el=document.createElement('canvas');el.width=160;el.height=120;
   const ctx=el.getContext('2d');ctx.fillStyle='rgb('+r+','+g+','+b+')';
   ctx.fillRect(0,0,160,120);
   return el.toDataURL('image/png').split(',')[1];
  };
  return [make(210,60,60),make(60,100,190),make(60,180,90)];
 });
 const files=images.map((b,i)=>({name:'validation-000'+(i+1)+'.jpg',mimeType:'image/png',buffer:Buffer.from(b,'base64')}));
 // Browser-level image.decode promise for source A stays pending. B must win.
 await page.evaluate(()=>{window.__holdFirstDecode=true;});
 await page.locator('#photo').setInputFiles(files[0]);
 await page.waitForFunction(()=>typeof window.__releaseFirstDecode==='function');
 await page.locator('#photo').setInputFiles(files[1]);
 await page.waitForFunction(()=>source?.fileName==='validation-0002.jpg'&&mask?.length===19200);
 await page.evaluate(()=>window.__releaseFirstDecode());
 await page.waitForFunction(()=>!window.__holdFirstDecode);
 const photoWinner=await page.evaluate(()=>({
  name:source?.fileName,width:canvas.width,height:canvas.height,
  blank:mask?.every(x=>x===0),downloadDisabled:download.disabled
 }));
 assert.deepEqual(photoWinner,{name:'validation-0002.jpg',width:160,height:120,blank:true,downloadDisabled:true});
 // Start a real-human-style restored DRAFT, but pause its file text() promise.
 // Switching to C must invalidate the old draft before it is applied.
 const meta=await page.evaluate(()=>({sha:source.sourceSha256,width:canvas.width,height:canvas.height}));
 const draft={schemaVersion:1,nativeSourceGrid:true,annotationGrid:'exact-original-pixels',
  image:'validation-0002.jpg',sourceSha256:meta.sha,width:meta.width,height:meta.height,
  runs:[0,3,meta.width*meta.height-3],reviewStatus:'draft',reviewer:'Synthetic Test Reviewer',
  seedModel:null,physicalTargetId:'validation-0002-item-01',humanCategory:'Tops',humanForm:'top',
  humanTargetLabel:'synthetic item',targetIndependentlyIdentifiedBy:'Synthetic Test Reviewer'};
 await page.evaluate(()=>{window.__holdFirstDraft=true;});
 await page.locator('#resume').setInputFiles({name:'validation-0002-item-01.mask.draft.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(draft))});
 await page.waitForFunction(()=>typeof window.__releaseFirstDraft==='function');
 await page.locator('#photo').setInputFiles(files[2]);
 await page.waitForFunction(()=>source?.fileName==='validation-0003.jpg');
 await page.evaluate(()=>window.__releaseFirstDraft());
 const afterSwitch=await page.evaluate(()=>({source:source?.fileName,blank:mask?.every(x=>x===0),
  reviewer:reviewer.value,disabled:download.disabled,inventory:inventoryMode.checked}));
 assert.equal(afterSwitch.source,'validation-0003.jpg');
 assert.equal(afterSwitch.blank,true);
 assert.equal(afterSwitch.disabled,true);
 assert.equal(afterSwitch.inventory,false);
 // Editing while resume is pending must likewise invalidate the stale draft.
 const meta3=await page.evaluate(()=>({sha:source.sourceSha256,width:canvas.width,height:canvas.height}));
 const cDraft={...draft,image:'validation-0003.jpg',sourceSha256:meta3.sha,
  physicalTargetId:'validation-0003-item-01'};
 await page.evaluate(()=>{window.__holdFirstDraft=true;window.__releaseFirstDraft=null;});
 await page.locator('#resume').setInputFiles({name:'validation-0003-item-01.mask.draft.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(cDraft))});
 await page.waitForFunction(()=>typeof window.__releaseFirstDraft==='function');
 await page.locator('#canvas').scrollIntoViewIfNeeded();
 const box=await page.locator('#canvas').boundingBox();assert.ok(box);
 await page.mouse.click(box.x+box.width*.65,box.y+box.height*.6);
 const modified=await page.evaluate(()=>mask.reduce((a,b)=>a+b,0));
 assert.ok(modified>3);
 await page.evaluate(()=>window.__releaseFirstDraft());
 const afterEdit=await page.evaluate(()=>({photo:source?.fileName,
  changedPixels:mask.reduce((a,b)=>a+b,0),reviewer:reviewer.value}));
 assert.equal(afterEdit.photo,'validation-0003.jpg');
 assert.equal(afterEdit.changedPixels,modified);
 assert.equal(afterEdit.reviewer,'');
 // Choosing invalid archival source immediately revokes export and active mask.
 await page.locator('#photo').setInputFiles({...files[2],name:'commons-0001.original.jpg'});
 const invalid=await page.evaluate(()=>({photo:source,mask,downloadDisabled:download.disabled,
  message:status.textContent}));
 assert.equal(invalid.photo,null);
 assert.equal(invalid.mask,null);
 assert.equal(invalid.downloadDisabled,true);
 assert.match(invalid.message,/archival|Choose commons-0001.jpg/);
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({passed:true,browser:'Chromium mobile 390x840 emulation',
  sourceRacePrevented:true,draftAfterSourceSwitchPrevented:true,
  draftAfterUserBrushEditPrevented:true,archivalImageRevokesMask:true,
  actualHumanApprovals:0,realPhotoAccuracyMeasured:0,physicalPhones:0}));
}finally{await browser.close();}
