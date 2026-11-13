/**
 * P72 actual public/app.js editor + real clothing-memory.js running in genuine
 * Chromium/WebKit at mobile widths. The photos are locally generated JPEGs;
 * fake local saves and feature vectors are SYNTHETIC. This is an owner-consent
 * safety/integration test, NOT real model accuracy, hosted auth or phone QA.
 */
import {chromium,webkit} from 'playwright';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const app=await readFile('public/app.js','utf8');
const taxonomy=await readFile('public/taxonomy.js','utf8');
const details=await readFile('public/clothing-details.js','utf8');
const learning=await readFile('public/clothing-memory.js','utf8');
function between(start,end){
 const i=app.indexOf(start),j=app.indexOf(end,i+1);
 if(i<0||j<=i)throw Error('P72_ACTUAL_APP_SOURCE_MISSING '+start);
 return app.slice(i,j);
}
const src=between('function node(', 'function cropClothingPhoto(')+
 between('function adjustPhoto(', 'function renderRecognitionNotice(');
// P847 source-executes the actual already-owned-item editor closure from render,
// with no substituted save/consent handler.
const savedStart=app.indexOf('edit.onclick=()=>{const dialog=');
const savedEnd=app.indexOf('del.onclick=async()=>',savedStart);
if(savedStart<0||savedEnd<=savedStart)throw Error('P847_SAVED_EDITOR_SOURCE_MISSING');
const savedEditor=app.slice(savedStart,savedEnd);

const harness=[
"const categories=['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'];",
"let items=[],batch=[],stream=null,cameraOpening=false,busy=false,localReady=false;",
"const localPending=new Set(),sessionCapturedIds=new Set();",
"window.privateWrites=[];window.lastMessage='';",
"const checkPhoto=async()=>({colorEstimate:null});",
"const savePiece=async(value,next)=>{window.privateWrites.push(structuredClone(value));window.lastDraft=structuredClone(next);};",
"const removeItem=async()=>{};const persistDraft=async()=>{};",
"const render=()=>{};const scheduleMemoryReview=()=>{};",
"const stopCamera=()=>{};const queueAutomatic=()=>{};",
"const message=text=>{window.lastMessage=text;};",
"function jpeg72(rgb){const c=document.createElement('canvas');c.width=12;c.height=12;const ctx=c.getContext('2d');ctx.fillStyle=rgb;ctx.fillRect(0,0,12,12);return c.toDataURL('image/jpeg',.93);}",
"function fixture72(id,hex,kind='Polo'){",
" for(const old of document.querySelectorAll('dialog'))old.remove();",
" const original=jpeg72(hex);const value={id,image:original,recognitionPhoto:{image:original},",
" name:'Synthetic garment',category:'Tops',itemType:kind,color:'Blue',pattern:'Striped',",
" sleeveLength:'Short sleeve',fit:'Regular',seasons:[],userAdjusted:false,",
" recognitionMemory:{version:1,modelKey:'synthetic-model-72',features:Array.from({length:512},(_,i)=>{const tilt=id==='a1'?-0.08:id==='a2'?0.08:0;return i===0?Math.sqrt(1-tilt*tilt):i===1?tilt:0;})}};",
" batch=[value];adjustPhoto(value);",
"}",
"window.owner72=(id,session)=>{window.closetAuth={user:{id}};window.__closetCurrentOwnerScope72=ClothingMemory.open72({ownerId:id,sessionId:session});};",
"window.closeOwner72=()=>{ClothingMemory.close72(window.__closetCurrentOwnerScope72);};",
"window.clear72=()=>{items=[];batch=[];window.privateWrites=[];};",
"window.privateState72=()=>({writes:window.privateWrites.length,",
" items:items.length,receipts:items.filter(x=>!!x.correctionReceipt72).length,",
" learningExamples:items.map(x=>({id:x.id,confirmed:!!x.correctionReceipt72}))});",
"window.canSuggest72=async()=>{const x={...items[0],id:'fresh-72',image:jpeg72('#336633'),",
" recognitionPhoto:{image:jpeg72('#336633')},itemType:'Unknown',pattern:'Unknown'};",
" return await ClothingMemory.suggest72(x,items,window.__closetCurrentOwnerScope72);};"
].join('\n');
for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true,...(name==='chromium'?{args:['--no-sandbox']}:{})});
 try{
  for(const width of [320,390,430]){
   const page=await browser.newPage({viewport:{width,height:860},isMobile:true,hasTouch:true});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('http://127.0.0.1:27272/**',route=>route.fulfill({
    status:200,contentType:'text/html',body:'<!doctype html><html><body><main id="root"></main></body></html>'
   }));
   await page.goto('http://127.0.0.1:27272/?confirmedLearning72=1');
   for(const input of [taxonomy,details,learning,harness,src])await page.addScriptTag({content:input});
   await page.addScriptTag({content:
     'window.writeAll=async function(values){window.privateWrites.push(structuredClone(values[0]));};'+
     'window.openSaved847=function(item){const edit=document.createElement("button");'+savedEditor+'edit.onclick();};'
   });
   await page.evaluate(()=>owner72('owner-A','owner-A-session-0001'));
   const review=()=>page.getByRole('checkbox',{name:/I checked the clothing photo/});
   const learn=()=>page.getByRole('checkbox',{name:/I explicitly authorize learning/});
   const save=()=>page.getByRole('button',{name:'Save changes'});
   // Saving manually reviewed but not opting in MUST NOT become training truth.
   await page.evaluate(()=>fixture72('unchecked','#111111','Polo'));
   await review().check();assert.equal(await learn().count(),1);
   await save().click();
   await page.waitForFunction(()=>window.privateWrites.length===1);
   assert.deepEqual(await page.evaluate(()=>privateState72()),{
    writes:1,items:1,receipts:0,
    learningExamples:[{id:'unchecked',confirmed:false}]
   });
   // Two synthetic original JPEGs with explicit corrections and separate consent.
   for(const [id,hex] of [['a1','#aa3344'],['a2','#7744bb']]){
    await page.evaluate(({id,hex})=>fixture72(id,hex,'Unknown'),{id,hex});
    await page.getByLabel('Item type').selectOption('Polo');
    assert.equal(await learn().isChecked(),false);
    await review().check();await learn().check();
    await save().click();
    await page.waitForFunction(n=>window.privateWrites.length===n,id==='a1'?2:3);
   }
   assert.equal(await page.evaluate(()=>privateState72().receipts),2);
   // Real editor proposal, only from those two owner-bound consented sources.
   await page.evaluate(()=>fixture72('query','#2a6b9b','Unknown'));
   const diagnostic=await page.evaluate(async()=>({
    consentedCount:items.filter(x=>Boolean(x.correctionReceipt72)).length,
    verifiedCount:(await Promise.all(items.map(x=>ClothingMemory.verified72(x,window.__closetCurrentOwnerScope72)))).filter(Boolean).length,
    directProposal:Boolean(await ClothingMemory.suggest72(batch[0],items,window.__closetCurrentOwnerScope72)),
    enabled:learningMode72(),secureContext:window.isSecureContext
   }));
   console.log('P72_BROWSER_DIAGNOSTIC_SAFE_COUNTS',JSON.stringify({name,width,...diagnostic}));
   const use=page.getByRole('button',{name:'Use owner-confirmed suggestion'});
   await use.waitFor({state:'visible',timeout:10000});
   assert.equal(await page.getByLabel('Item type').inputValue(),'Unknown');
   await use.click();await page.waitForFunction(()=>document.querySelector('select[aria-label="Item type"]')?.value==='Polo');
   assert.equal(await page.getByLabel('Item type').inputValue(),'Polo');
   assert.equal(await learn().isChecked(),false,'suggestion is never new owner learning');
   assert.equal(await review().isChecked(),false,'proposal invalidates prior photo review');
   await page.getByRole('button',{name:'Cancel'}).click();
   assert.equal(await page.evaluate(()=>privateState72().writes),3,'proposal alone cannot save');
   // Cross owner / stale lease cannot reuse confirmation or suggestions.
   await page.evaluate(()=>{closeOwner72();owner72('owner-B','owner-B-session-0002');});
   assert.equal(await page.evaluate(()=>canSuggest72()),null,'private A receipts invisible to B');
   await page.evaluate(()=>fixture72('cross-owner','#102030','Unknown'));
   assert.equal(await page.getByRole('button',{name:'Use owner-confirmed suggestion'}).count(),0);
   await page.getByRole('button',{name:'Cancel'}).click();
   // P847 also integrates saved-item corrections: two separate acknowledgements,
   // no write from a checked learning box alone, and one write on double submit.
   await page.evaluate(()=>{
    closeOwner72();owner72('owner-A','owner-A-saved-editor-847');
    clear72();fixture72('saved-847','#335577','Polo');
    const original=batch[0];document.querySelector('dialog[open]').close();
    items=[original];batch=[];openSaved847(original);
   });
   const savedLearn=page.getByRole('checkbox',{name:/I explicitly authorize learning/});
   const savedPhotoReview=page.getByRole('checkbox',{name:/I reviewed this saved garment photograph for learning/});
   await savedLearn.check();
   await page.getByRole('button',{name:'Save changes'}).click();
   assert.equal(await page.evaluate(()=>window.privateWrites.length),0,'saved editor cannot learn from unchecked photo');
   assert.match(await page.evaluate(()=>window.lastMessage),/Review the garment photo/);
   await savedPhotoReview.check();
   await page.locator('dialog[open] form').evaluate(form=>{
    form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
    form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
   });
   await page.waitForFunction(()=>window.privateWrites.length===1);
   const savedReceipt=await page.evaluate(async()=>({
    stored:window.privateWrites.length,
    ownerConfirmed:await ClothingMemory.verified72(items[0],window.__closetCurrentOwnerScope72),
    source:items[0].correctionReceipt72?.sourceSha256,
    category:items[0].confirmedDetails?.category
   }));
   assert.equal(savedReceipt.stored,1);
   assert.equal(savedReceipt.ownerConfirmed,true);
   assert.equal(savedReceipt.category,'Tops');
   assert.match(savedReceipt.source,/^[a-f0-9]{64}$/);
   assert.deepEqual(errors,[]);
   console.log('M1_P847_SAVED_EDITOR_CONSENT',JSON.stringify({
    engine:name,width,photoConsentRequired:true,separateLearningConsent:true,
    repeatedSaveSingleWrite:true,sourceVerified:true,errors:errors.length
   }));
   console.log('P72_ACTUAL_EDITOR_BROWSER_SYNTHETIC',JSON.stringify({
    engine:name,width,unconsentedWrites:1,approvedOwnerExamples:2,
    subsequentProposalReviewOnly:true,crossOwnerProposalBlocked:true,
    privateInMemoryWrites:3,errors:errors.length,
    genuineRecognitionInference:false,realAuthentication:false,physicalDevice:false
   }));
   await page.close();
  }
 }finally{await browser.close();}
}
