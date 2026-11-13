/** Main Mission 1 P846. Actual app.js Adjust source in real desktop
 * Chromium/WebKit, synthetic photos and mocked private IO only. Not physical
 * phone, hosted owner/cloud or real classifier acceptance.
 */
import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const app=await readFile('public/app.js','utf8'),
 taxonomy=await readFile('public/taxonomy.js','utf8'),
 details=await readFile('public/clothing-details.js','utf8');
function extract(a,b){const i=app.indexOf(a),j=app.indexOf(b,i+a.length);
 assert.ok(i>=0&&j>i,'P846 source segment missing '+a);return app.slice(i,j);}
const source=extract('function node(', 'function cropClothingPhoto(')+
 extract('function unit70Receipts(', 'function renderRecognitionNotice(');
const harness=[
 "const categories=['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'];",
 "let items=[],batch=[],stream=null,cameraOpening=false;",
 "const localPending=new Set(),sessionCapturedIds=new Set();",
 "const checkPhoto=async()=>({colorEstimate:null});",
 "window.closetAuth={user:{id:'owner-A'}};",
 "window.writeCount=0;window.stored=[];window.completions=[];window.messageText='';",
 "const savePiece=(v,b)=>{window.writeCount++;return new Promise((resolve,reject)=>window.completions.push({resolve:()=>{window.stored.push(structuredClone(v));resolve();},reject}));};",
 "const removeItem=async()=>{};",
 "const persistDraft=async()=>{};",
 "const render=()=>{};",
 "const scheduleMemoryReview=()=>{};",
 "const stopCamera=()=>{};",
 "const queueAutomatic=()=>{};",
 "const message=x=>window.messageText=x;",
 "const sh=n=>Number(n).toString(16).padStart(64,'0');",
 "const receipt=(owner,m)=>({ownerId:owner,sourceSha256:sh(10),maskSha256:sh(m)});",
 "window.setup846=(status='paired_confirmed',account='owner-A',dup=false)=>{",
 "  for(const old of document.querySelectorAll('dialog'))old.remove();",
 "  window.closetAuth.user.id=account;window.writeCount=0;window.stored=[];window.completions=[];window.messageText='';",
 "  const item={id:'pair',image:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLttAAAAABJRU5ErkJggg==',",
 "    name:'Black shoes',category:'Shoes',itemType:'Sneakers',color:'Black',",
 "    colorSource:'photo-estimate',seasons:[],userAdjusted:false,outfitSourceId:'outfit-source',",
 "    requiresOwnershipConfirmation:true,reconciliation70Status:status,reconciliation70:receipt('owner-A',11),",
 "    shoePair:{confirmedByOwner:true,companion:{image:'data:image/jpeg;base64,QUJDRA==',reconciliation70:receipt('owner-A',12)}}};",
 "  batch=[item];items=dup?[{id:'old',image:'data:image/jpeg;base64,QUJD',category:'Shoes',itemType:'Sneakers',color:'Black',reconciliation70:receipt('owner-A',12)}]:[];",
 "  adjustPhoto(item);return item;",
 "};"
].join('\n');
for(const [browserName,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true,...(browserName==='chromium'?{args:['--no-sandbox']}:{})});
 try{
  for(const width of [320,390,430]){
   const page=await browser.newPage({viewport:{width,height:850},hasTouch:true,isMobile:true});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.setContent('<!doctype html><html><body><main>Source verified paired shoe review</main></body></html>');
   for(const s of [taxonomy,details,harness,source])await page.addScriptTag({content:s});
   const approve=async()=>page.getByRole('checkbox',{name:/I checked the clothing photo/}).check();
   const submit=async(times=1)=>page.locator('dialog form').evaluate((form,n)=>{
    for(let i=0;i<n;i++)form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
   },times);
   // Unsafe unresolved unit: reviewed category/color alone cannot admit one of two shoe regions.
   await page.evaluate(()=>window.setup846('unresolved'));await approve();await submit();
   assert.equal(await page.evaluate(()=>window.writeCount),0);
   assert.equal(await page.evaluate(()=>batch.length),1);
   // Cross-owner replay, even if checked, must fail closed.
   await page.evaluate(()=>window.setup846('paired_confirmed','owner-B'));await approve();await submit();
   assert.equal(await page.evaluate(()=>window.writeCount),0);
   // Already saved companion mask: cannot insert a duplicate item via another card.
   await page.evaluate(()=>window.setup846('paired_confirmed','owner-A',true));await approve();await submit();
   assert.equal(await page.evaluate(()=>window.writeCount),0);
   // Genuine user acknowledgement with consistent owner/receipts creates exactly one unit.
   await page.evaluate(()=>window.setup846('paired_confirmed','owner-A',false));
   assert.equal(await page.getByAltText(/Second original garment region confirmed/).count(),1);
   await approve();await submit(2);
   assert.equal(await page.evaluate(()=>window.writeCount),1);
   assert.equal(await page.getByRole('button',{name:'Saving…'}).isDisabled(),true);
   await page.evaluate(()=>window.completions.shift().resolve());
   await page.waitForFunction(()=>window.stored.length===1&&items.length===1&&batch.length===0);
   const result=await page.evaluate(()=>({
     saved:window.stored.length,finalClosetItems:items.length,
     pairedOwner:items[0]?.shoePair?.confirmedByOwner,
     keptCompanion:Boolean(items[0]?.shoePair?.companion?.image),
     status:items[0]?.reconciliation70Status,
     secondMask:items[0]?.shoePair?.companion?.reconciliation70?.maskSha256
   }));
   assert.equal(result.saved,1);
   assert.equal(result.finalClosetItems,1);
   assert.equal(result.pairedOwner,true);
   assert.equal(result.keptCompanion,true);
   assert.equal(result.status,'paired_confirmed');
   assert.match(result.secondMask,/^[a-f0-9]{64}$/);
   assert.deepEqual(errors,[]);
   console.log('M1_P846_BROWSER_OWNER_UNIT_REVIEW',JSON.stringify({
    browser:browserName,width,unresolvedBlocked:true,crossOwnerBlocked:true,
    companionDuplicateBlocked:true,pairedOneClosetUnit:true,sourceMasksRetained:true,
    repeatedSubmitBlocked:true,pageErrors:0}));
   await page.close();
  }
 }finally{await browser.close();}
}
