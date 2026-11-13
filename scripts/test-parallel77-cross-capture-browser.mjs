/**
 * #77 actual P847 Adjust editor + cross-capture module under Chromium/WebKit.
 * Generated JPEG pixels and mocked storage only: NOT field accuracy, hosted Auth,
 * cross-tab/cloud safety, real original-photo pairs or physical phones.
 */
import {chromium,webkit} from 'playwright';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const [app,taxonomy,details,cross,styles]=await Promise.all([
 'public/app.js','public/taxonomy.js','public/clothing-details.js',
 'public/cross-capture-duplicate-77.js','public/style.css'
].map(path=>readFile(path,'utf8')));
function between(a,b){const i=app.indexOf(a),j=app.indexOf(b,i+a.length);
 assert.ok(i>=0&&j>i,'P77 original Adjust code missing '+a);return app.slice(i,j);}
const editor=between('function node(', 'function cropClothingPhoto(')+
 between('function unit70Receipts(', 'function renderRecognitionNotice(');
const harness="\n const categories=['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'];\n let items=[],batch=[],db={name:'closet-current-user-owner-A'},stream=null,cameraOpening=false;\n const localPending=new Set(),sessionCapturedIds=new Set();\n const checkPhoto=async()=>({colorEstimate:null});\n window.writes=[];window.lastMessage='';\n const savePiece=async(value,next)=>{window.writes.push(structuredClone(value));batch=next;};\n const removeItem=async()=>{};const persistDraft=async()=>{};\n const render=()=>{};const scheduleMemoryReview=()=>{};\n const stopCamera=()=>{};const queueAutomatic=()=>{};\n const message=text=>window.lastMessage=text;\n const vector={version:1,modelKey:'P77-synthetic-source-version',\n  features:Array.from({length:512},(_,i)=>i===0?1:0)};\n function jpeg77(color){\n  const canvas=document.createElement('canvas');canvas.width=24;canvas.height=32;\n  const ctx=canvas.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,24,32);\n  ctx.fillStyle='#eeeeee';ctx.fillRect(4,8,3,6);\n  return canvas.toDataURL('image/jpeg',.94);\n }\n window.setup77=(older='#112277',newer='#162b7d')=>{\n  for(const old of document.querySelectorAll('dialog'))old.remove();\n  window.writes=[];window.lastMessage='';\n  const saved={id:'owned77',name:'Existing striped polo',image:jpeg77(older),\n   ownerId:'owner-A',visualSignature:Array(768).fill(20),visualAspect:.75,\n   category:'Tops',itemType:'Polo',color:'Blue',seasons:[],recognitionMemory:vector};\n  const draft={id:'draft77',name:'New candidate',image:jpeg77(newer),\n   ownerId:'owner-A',visualSignature:Array(768).fill(60),visualAspect:.75,\n   category:'Tops',itemType:'Polo',color:'Blue',seasons:[],recognitionMemory:vector,\n   requiresOwnershipConfirmation:true,localAnalyzed:true};\n  window.closetAuth={user:{id:'owner-A'}};\n  db={name:'closet-current-user-owner-A'};items=[saved];batch=[draft];\n  adjustPhoto(draft);return true;\n };\n window.switch77=owner=>{window.closetAuth.user={id:owner};\n   db={name:'closet-current-user-'+owner};};\n window.changeSaved77=()=>{items[0].name='Changed by another writer';};\n window.state77=()=>({writes:window.writes.length,drafts:batch.length,owned:items.length,\n  sourceSame:batch[0]?.image===items[0]?.image,storedExtra:!!items[0]?.alternateViews77});\n";
for(const [browserName,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch({headless:true,...(browserName==='chromium'?{args:['--no-sandbox']}:{})});
 try{
  for(const width of [320,390,430]){
   const page=await browser.newPage({viewport:{width,height:850},hasTouch:true,isMobile:true});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.route('http://127.0.0.1:27277/**',route=>route.fulfill({
    status:200,contentType:'text/html',body:'<!doctype html><html><body><main id="root"></main></body></html>'
   }));
   await page.goto('http://127.0.0.1:27277/?crossCapture77=1');
   await page.addStyleTag({content:styles});
   for(const source of [taxonomy,details,cross,harness,editor])
    await page.addScriptTag({content:source});
   const same=page.getByRole('button',{name:/Same owned garment/});
   const different=page.getByRole('button',{name:/Different garment/});
   const acknowledgement=page.getByRole('checkbox',{name:/I compared both photos/});
   const approval=page.getByRole('checkbox',{name:/I checked the clothing photo/});
   const submit=page.getByRole('button',{name:'Save changes'});
   await page.evaluate(()=>setup77());
   try{await same.waitFor({state:'visible',timeout:15000});}catch(error){
    console.log('P77_BROWSER_PROPOSAL_DIAGNOSTIC',JSON.stringify(await page.evaluate(()=>({
     secure:window.isSecureContext,module:typeof CrossCaptureDuplicate77,
     dialogCount:document.querySelectorAll('dialog').length,
     panel:document.querySelector('.duplicate-review-77')?.textContent?.slice(0,500),
     shortlist:typeof CrossCaptureDuplicate77!=='undefined'?CrossCaptureDuplicate77.candidateRank(batch[0],items):null,
     scopeReady:!!window.closetAuth?.user,dbName:db?.name
    }))));
    throw error;
   }
   assert.equal(await page.getByAltText('New unsaved clothing photograph').count(),1);
   assert.equal(await page.getByAltText(/Existing owned item/).count(),1);
   assert.equal(await submit.isDisabled(),true);
   await same.click();
   assert.match(await page.locator('.duplicate-review-77 [role="status"]').innerText(),/not accepted/i);
   await acknowledgement.check();await same.click();
   assert.match(await page.locator('.duplicate-review-77 [role="status"]').innerText(),/NOT saved/);
   assert.equal(await page.evaluate(()=>state77().writes),0);
   assert.equal(await page.evaluate(()=>state77().drafts),1);
   assert.equal(await page.evaluate(()=>state77().storedExtra),false);
   await page.getByRole('button',{name:'Cancel'}).click();
   await page.evaluate(()=>setup77());
   await different.waitFor({state:'visible',timeout:15000});
   await acknowledgement.check();await different.click();
   await page.waitForFunction(()=>document.querySelector('.duplicate-review-77 [role=status]')?.textContent?.includes('Different item'));
   assert.equal(await submit.isDisabled(),true);
   await approval.check();await submit.click();
   await page.waitForFunction(()=>window.writes.length===1);
   assert.equal(await page.evaluate(()=>state77().writes),1);
   assert.equal(await page.evaluate(()=>state77().owned),2);
   assert.equal(await page.evaluate(()=>state77().drafts),0);
   await page.evaluate(()=>setup77());await different.waitFor({state:'visible'});
   await acknowledgement.check();await different.click();await approval.check();
   await page.evaluate(()=>changeSaved77());
   await submit.click();
   assert.equal(await page.evaluate(()=>state77().writes),0);
   await page.getByRole('button',{name:'Cancel'}).click();
   await page.evaluate(()=>setup77());await different.waitFor({state:'visible'});
   await acknowledgement.check();await different.click();await approval.check();
   await page.evaluate(()=>switch77('owner-B'));await submit.click();
   assert.equal(await page.evaluate(()=>state77().writes),0);
   assert.deepEqual(errors,[]);
   console.log('P77_ACTUAL_EDITOR_BROWSER',JSON.stringify({browser:browserName,width,
    baselineLive:true,generatedSyntheticJpeg:true,sourceBoundDecision:true,
    pendingSameNeverWrites:true,differentRequiresP843:true,staleSavedDenied:true,
    ownerSwitchDenied:true,pageErrors:errors.length,physicalPhone:false}));
   await page.close();
  }
 }finally{await browser.close();}
}
