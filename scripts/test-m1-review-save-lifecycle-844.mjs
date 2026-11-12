/**
 * P844 exact real-app Adjust source, executed in Chromium/WebKit with
 * synthetic in-memory owner/storage fixtures and deliberate asynchronous IO.
 * Parent P843: two repeat-submit writes; candidate P844: one, plus safe
 * Cancel/Remove/Escape, edit-lock, failed-write retry. Not real model/photo QA.
 */
import {chromium,webkit} from 'playwright';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';

const parent='cc5c0640e8c2814a053807e7159a591ab3e96a3f';
const mode=process.argv[2]||'candidate';
if(!['parent','candidate'].includes(mode))throw Error('mode must be parent or candidate');
const app=mode==='parent'?execFileSync('git',['show',parent+':public/app.js'],{encoding:'utf8'}):
 await readFile('public/app.js','utf8');
const taxonomy=await readFile('public/taxonomy.js','utf8');
const details=await readFile('public/clothing-details.js','utf8');
const part=(a,b)=>{
 const i=app.indexOf(a),j=app.indexOf(b,i+a.length);
 assert.ok(i>=0&&j>i,'P844 missing actual app source '+a);
 return app.slice(i,j);
};
const source=part('function node(', 'function cropClothingPhoto(')+
 part('function adjustPhoto(', 'function renderRecognitionNotice(');
const harness=[
 "const categories=['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'];",
 "let items=[],batch=[],stream=null,cameraOpening=false;",
 "const localPending=new Set(),sessionCapturedIds=new Set();",
 "const checkPhoto=async()=>({colorEstimate:null});",
 "const savePiece=(value,nextBatch)=>{window.saveAttempts++;return new Promise((resolve,reject)=>{window.completions.push({resolve:()=>{window.saveSuccesses++;resolve();},reject});});};",
 "const removeItem=async()=>{window.removeAttempts++;};",
 "const persistDraft=async()=>{};",
 "const render=()=>{};",
 "const scheduleMemoryReview=()=>{};",
 "const stopCamera=()=>{};",
 "const queueAutomatic=()=>{};",
 "const message=text=>{window.messageText=text;};",
 "function fixture844(){",
 " for(const old of document.querySelectorAll('dialog'))old.remove();",
 " const value={id:'synthetic-844',image:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLttAAAAABJRU5ErkJggg==',",
 " name:'Blue T-shirt',category:'Tops',itemType:'T-shirt',color:'Blue',",
 " colorSource:'photo-estimate',pattern:'Unknown',sleeveLength:'Unknown',fit:'Unknown',",
 " seasons:[],userAdjusted:false,requiresOwnershipConfirmation:true};",
 " batch=[value];items=[];window.saveAttempts=0;window.saveSuccesses=0;",
 " window.removeAttempts=0;window.completions=[];window.messageText='';",
 " adjustPhoto(value);",
 "}"
].join('\n');
for(const [browserName,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true,...(browserName==='chromium'?{args:['--no-sandbox']}:{})});
 try{
  for(const width of [320,390,430]){
   const page=await browser.newPage({viewport:{width,height:850},isMobile:true,hasTouch:true});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.setContent('<!doctype html><html><body><main>Photo review</main></body></html>');
   for(const s of [taxonomy,details,harness,source])await page.addScriptTag({content:s});
   const init=async()=>{
    await page.evaluate(()=>fixture844());
    const checkbox=page.getByRole('checkbox',{name:/I checked the clothing photo/});
    await checkbox.check();
    assert.equal(await page.getByRole('button',{name:'Save changes'}).isEnabled(),true);
   };
   const twice=async()=>page.locator('dialog form').evaluate(form=>{
    form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
    form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
   });
   await init();await twice();
   const attempts=await page.evaluate(()=>window.saveAttempts);
   assert.equal(attempts,mode==='parent'?2:1,
    browserName+' '+width+' parent duplicate vs candidate protected');
   if(mode==='candidate'){
    // Prevent accidental loss/review mismatch while an IndexedDB/cloud write runs.
    assert.equal(await page.getByRole('button',{name:'Saving…'}).isDisabled(),true);
    assert.equal(await page.getByRole('button',{name:'Cancel'}).isDisabled(),true);
    assert.equal(await page.getByRole('button',{name:'Remove photo'}).isDisabled(),true);
    assert.equal(await page.getByLabel('Color',{exact:true}).isDisabled(),true);
    const blocked=await page.evaluate(()=>{
     const dialog=document.querySelector('dialog');
     const event=new Event('cancel',{bubbles:false,cancelable:true});
     dialog.dispatchEvent(event);
     const cancel=[...dialog.querySelectorAll('button')].find(x=>x.textContent==='Cancel');
     cancel?.onclick?.();
     const removal=[...dialog.querySelectorAll('button')].find(x=>x.textContent==='Remove photo');
     removal?.onclick?.();
     dialog.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
     return {escapePrevented:event.defaultPrevented,open:dialog.open,
      removeAttempts:window.removeAttempts,saveAttempts:window.saveAttempts};
    });
    assert.deepEqual(blocked,{escapePrevented:true,open:true,removeAttempts:0,saveAttempts:1});
    await page.evaluate(()=>window.completions.splice(0).forEach(x=>x.resolve()));
    await page.waitForFunction(()=>window.saveSuccesses===1&&batch.length===0&&items.length===1);
    assert.equal(await page.locator('dialog[open]').count(),0);
    // Failed storage: original photo stays pending, controls restored, user may retry.
    await init();
    await page.locator('dialog form').evaluate(form=>
     form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
    assert.equal(await page.evaluate(()=>window.saveAttempts),1);
    await page.evaluate(()=>window.completions.shift().reject(Error('storage quota rejection')));
    await page.waitForFunction(()=>window.messageText.includes('Try again.'));
    assert.equal(await page.locator('dialog[open]').count(),1);
    assert.equal(await page.getByRole('button',{name:'Save changes'}).isEnabled(),true);
    assert.equal(await page.getByRole('button',{name:'Cancel'}).isEnabled(),true);
    assert.equal(await page.getByRole('button',{name:'Remove photo'}).isEnabled(),true);
    assert.equal(await page.getByLabel('Color',{exact:true}).isEnabled(),true);
    assert.equal(await page.evaluate(()=>batch.length),1);
    await page.locator('dialog form').evaluate(form=>
     form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
    assert.equal(await page.evaluate(()=>window.saveAttempts),2);
    await page.evaluate(()=>window.completions.shift().resolve());
    await page.waitForFunction(()=>window.saveSuccesses===1&&items.length===1&&batch.length===0);
   }else{
    await page.evaluate(()=>window.completions.splice(0).forEach(x=>x.resolve()));
    await page.waitForFunction(()=>window.saveSuccesses===2);
   }
   assert.deepEqual(errors,[],browserName+' '+width+' page errors');
   console.log('M1_P844_REVIEW_SAVE_LIFECYCLE',JSON.stringify({
    mode,browser:browserName,width,firstSubmissionAttempts:attempts,
    repeatedSubmitBlocked:mode==='candidate',cancelRemoveEscapeBlocked:mode==='candidate',
    fieldsLocked:mode==='candidate',failedWriteRetryWorks:mode==='candidate',pageErrors:0}));
   await page.close();
  }
 }finally{await browser.close();}
}
