// Browser QA for independent second reviewer: prevents accepting stale photo/draft.
// All masks and reviewer identities are synthetic; NO human approval or model quality.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {chromium} from 'playwright';

const sha=x=>createHash('sha256').update(x).digest('hex');
const browser=await chromium.launch({headless:true});
const pageErrors=[];
try{
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,acceptDownloads:true});
 page.on('pageerror',error=>pageErrors.push(error.message));
 await page.addInitScript(()=>{
  const text=File.prototype.text;
  File.prototype.text=function(...args){
   const promise=text.apply(this,args);
   if(this.name==='wait-for-first-review.json'&&window.__holdReviewText){
    window.__holdReviewText=false;
    return promise.then(s=>new Promise(resolve=>{window.__releaseOldReviewText=()=>resolve(s);}));
   }
   return promise;
  };
  const decode=Image.prototype.decode;
  Image.prototype.decode=function(...args){
   const promise=decode.apply(this,args);
   if(window.__holdReviewDecode){
    window.__holdReviewDecode=false;
    return promise.then(()=>new Promise(resolve=>{window.__releaseOldReviewDecode=resolve;}));
   }
   return promise;
  };
 });
 await page.goto('file://'+resolve('benchmark/approve-garment-mask-native.html'));
 const pics=await page.evaluate(()=>{
  function make(color){
   const c=document.createElement('canvas');c.width=160;c.height=120;
   const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,160,120);
   return c.toDataURL('image/png').split(',')[1];
  }
  return [make('#bc242f'),make('#1645a8'),make('#21ab45')];
 });
 const photos=pics.map((b,i)=>{
  const buffer=Buffer.from(b,'base64');
  return {name:'validation-000'+(i+1)+'.jpg',mimeType:'image/png',buffer};
 });
 const drafts=photos.map((f,i)=>({
  schemaVersion:1,reviewStatus:'draft',nativeSourceGrid:true,annotationGrid:'exact-original-pixels',
  image:f.name,sourceSha256:sha(f.buffer),width:160,height:120,
  physicalTargetId:'validation-000'+(i+1)+'-item-01',
  humanCategory:'Tops',humanForm:'top',humanTargetLabel:'Synthetic review shape '+(i+1),
  reviewer:'Synthetic First Person '+(i+1),targetIndependentlyIdentifiedBy:'Synthetic First Person '+(i+1),
  seedModel:null,runs:[0,10,19190]
 }));
 const asFile=(draft,name='draft.json')=>({
  name,mimeType:'application/json',buffer:Buffer.from(JSON.stringify(draft))
 });
 // Old draft text from A is delayed. A new photo and draft B must win.
 await page.locator('#photo').setInputFiles(photos[0]);
 await page.evaluate(()=>{window.__holdReviewText=true;});
 await page.locator('#draft').setInputFiles(asFile(drafts[0],'wait-for-first-review.json'));
 await page.waitForFunction(()=>typeof window.__releaseOldReviewText==='function');
 await page.locator('#approver').fill('Synthetic Second Person');
 await page.locator('#verified').check(); // Premature consent may not survive image change.
 await page.locator('#photo').setInputFiles(photos[1]);
 await page.locator('#draft').setInputFiles(asFile(drafts[1],'second-review.json'));
 await page.waitForFunction(()=>source?.name==='validation-0002.jpg'&&draft?.physicalTargetId==='validation-0002-item-01');
 const firstWinner=await page.evaluate(()=>({
  name:source?.name,id:draft?.physicalTargetId,accepted,maskBytes:mask?.length,
  verified:verified.checked,approvalDisabled:approve.disabled
 }));
 assert.deepEqual(firstWinner,{
  name:'validation-0002.jpg',id:'validation-0002-item-01',accepted:true,maskBytes:19200,
  verified:false,approvalDisabled:true
 });
 await page.evaluate(()=>window.__releaseOldReviewText());
 await page.waitForFunction(()=>!window.__holdReviewText);
 const afterRelease=await page.evaluate(()=>({
  name:source?.name,id:draft?.physicalTargetId,verified:verified.checked,approvalDisabled:approve.disabled
 }));
 assert.deepEqual(afterRelease,{name:'validation-0002.jpg',id:'validation-0002-item-01',
  verified:false,approvalDisabled:true});
 // Reviewer must actively re-check consent for this exact pair.
 await page.locator('#verified').check();
 assert.equal(await page.locator('#approve').isDisabled(),false);
 // Selecting a new source revokes the old checked consent and approval immediately.
 await page.locator('#photo').setInputFiles(photos[2]);
 const wrong=await page.evaluate(()=>({accepted,verified:verified.checked,disabled:approve.disabled,
  source,draft}));
 assert.equal(wrong.accepted,false);assert.equal(wrong.verified,false);
 assert.equal(wrong.disabled,true);assert.equal(wrong.source,null);assert.equal(wrong.draft,null);
 // Delayed image.decode from B is released AFTER C has been accepted.
 const second=await browser.newPage({viewport:{width:430,height:932},deviceScaleFactor:2});
 second.on('pageerror',error=>pageErrors.push(error.message));
 await second.goto('file://'+resolve('benchmark/approve-garment-mask-native.html'));
 await second.locator('#photo').setInputFiles(photos[1]);
 await second.evaluate(()=>{window.__holdReviewDecode=true;});
 await second.locator('#draft').setInputFiles(asFile(drafts[1],'blue-draft.json'));
 await second.waitForFunction(()=>typeof window.__releaseOldReviewDecode==='function');
 await second.locator('#photo').setInputFiles(photos[2]);
 await second.locator('#draft').setInputFiles(asFile(drafts[2],'green-draft.json'));
 await second.waitForFunction(()=>source?.name==='validation-0003.jpg'&&accepted===true);
 await second.evaluate(()=>window.__releaseOldReviewDecode());
 const afterDecode=await second.evaluate(()=>({
  name:source?.name,id:draft?.physicalTargetId,accepted,verified:verified.checked,disabled:approve.disabled
 }));
 assert.deepEqual(afterDecode,{name:'validation-0003.jpg',id:'validation-0003-item-01',
  accepted:true,verified:false,disabled:true});
 await second.locator('#approver').fill('Synthetic Reviewer 2');
 await second.locator('#verified').check();
 assert.equal(await second.locator('#approve').isDisabled(),false);
 // Output is intentionally test-only. Its untouched RLE grid must still match C.
 const download=second.waitForEvent('download');
 await second.locator('#approve').click();
 const downloaded=await download;
 assert.equal(downloaded.suggestedFilename(),'validation-0003-item-01.mask.approved.json');
 assert.deepEqual(pageErrors,[]);
 console.log(JSON.stringify({
  browser:'Chromium mobile 390 / 430px emulation',staleFirstDraftIgnored:true,
  staleOldImageDecodeIgnored:true,approvalCheckboxResetOnNewPair:true,
  immediateWrongSourceRevokesApproval:true,approvedPreviewNativeGrid:true,
  humanReviewersAuthenticated:0,verifiedFullMasks:0,realPhotoErrorMeasured:0,physicalPhoneRuns:0
 }));
}finally{await browser.close();}
