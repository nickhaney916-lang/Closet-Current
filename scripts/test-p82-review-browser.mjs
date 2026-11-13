/** Actual camera snapshot/candidate/Adjust functions. Synthetic owner/storage and model policy cases. */
import {readFile} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
import assert from 'node:assert/strict';
import {server82} from './p82-browser-server.mjs';
const app=await readFile('public/app.js','utf8'),between=(a,b)=>{const i=app.indexOf(a),j=app.indexOf(b,i+a.length);assert.ok(i>=0&&j>i);return app.slice(i,j);};
const source=(between('function node(','function cropClothingPhoto(')+between('function unit70Receipts(','function renderRecognitionNotice(')+between('function snap()','function beep()')+between('function candidate(','function queueAutomatic('))
 .replace('}catch{if(fillPhoto.isConnected)', '}catch(error){window.p870FillError=String(error?.stack||error);if(fillPhoto.isConnected)');
const harness=`
const categories=['Uncategorized','Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories'];
let items=[],batch=[],stream=null,cameraOpening=false,session=0;const localPending=new Set(),sessionCapturedIds=new Set();
const video=document.createElement('video'),canvas=document.createElement('canvas');video.muted=true;video.playsInline=true;document.body.append(video);video.hidden=true;
const $=id=>{let e=document.getElementById(id);if(!e){e=document.createElement(id==='lastCaptureImage'?'img':'div');e.id=id;document.body.append(e);}return e;};
window.closetAuth={user:{id:'synthetic-owner-82'}};window.writes=0;window.queued=0;window.lastMessage='';
const queueAutomatic=()=>{window.queued++;};const checkPhoto=async()=>({colorEstimate:null});const enableLocal=async()=>true;
// P870: source editor async Fill-photo path: mocks only the model candidate, never owner persistence.
const segmentationAllows=()=>true;
const applyLocalChoice=(item,choice)=>{item.category=choice.category;item.itemType=choice.itemType;};
const localRequest=async()=>({strong:true,categoryConfirmed:true,choices:[{category:'Bottoms',itemType:'Shorts',sleeveLength:'Not applicable'}],details:{pattern:'Solid'}});
const removeItem=async()=>{};const persistDraft=async()=>{};const render=()=>{};const scheduleMemoryReview=()=>{};const stopCamera=()=>{stream?.getTracks?.().forEach(t=>t.stop());stream=null;};const message=s=>window.lastMessage=s;
const savePiece=async value=>{window.writes++;window.savedValue=structuredClone(value);await new Promise(r=>setTimeout(r,40));};
window.fixture82=({flag=true,owner=true,saved=false,segmented=false}={})=>{
 for(const d of document.querySelectorAll('dialog')){d.close();d.remove();}history.replaceState(null,'',flag?'/?dual82=1':'/');window.closetAuth.user=owner?{id:'synthetic-owner-82'}:null;window.writes=0;window.savedValue=null;items=[];batch=[];
 const c=document.createElement('canvas');c.width=360;c.height=480;const x=c.getContext('2d');x.fillStyle='#ddd';x.fillRect(0,0,360,480);x.fillStyle='#145a9f';x.fillRect(50,40,260,400);x.fillStyle='#8ac';x.fillRect(80,90,150,20);
 candidate(c.toDataURL('image/jpeg',.9));const item=batch[0];Object.assign(item,{ownerId:owner?'synthetic-owner-82':undefined,category:'Bottoms',itemType:'Unknown',color:'Blue',colorSource:'user',requiresOwnershipConfirmation:true});if(segmented){item.segmentHint={clipped:true};item.outfitSourceId='synthetic-scene';}if(saved){items=[item];batch=[];}window.current82=item;adjustPhoto(item);
};
window.capture82=async()=>{stream=await navigator.mediaDevices.getUserMedia({video:true});video.srcObject=stream;await video.play();await new Promise(r=>setTimeout(r,200));const jpeg=snap();candidate(jpeg);stopCamera();return {jpeg:jpeg.startsWith('data:image/jpeg;base64,'),queued:window.queued,unsaved:batch.length,writes:window.writes};};
window.mutate82=kind=>{if(kind==='owner')window.closetAuth.user={id:'other-owner'};if(kind==='same-owner')window.closetAuth.user={id:'synthetic-owner-82'};if(kind==='owner-id')window.closetAuth.user.id='changed';if(kind==='crop')window.current82.cropBounds={x:1};if(kind==='image')window.current82.image+='x';if(kind==='mask')window.current82.segmentHint={clipped:true};if(kind==='unit')window.current82.reconciliation70Status='unresolved';};
window.state82=()=>({writes:window.writes,itemType:window.current82.itemType,color:window.current82.color,photo:window.current82.image,kind:window.savedValue?.itemType});
`;
const {server,origin}=await server82();let browser;
try{for(const [name,engine] of Object.entries({chromium,webkit})){
 browser=await engine.launch({headless:true,args:name==='chromium'?['--no-sandbox','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream']:[]});
 try{for(const width of [320,390,430]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/?dual82=1');
  for(const path of ['public/taxonomy.js','public/clothing-details.js'])await page.addScriptTag({content:await readFile(path,'utf8')});await page.addScriptTag({content:harness+source});
  if(name==='chromium'&&width===390){const c=await page.evaluate(()=>window.capture82());assert.ok(c.jpeg&&c.unsaved===1&&c.writes===0);console.log('P82_VIRTUAL_CAMERA_CHROMIUM',JSON.stringify(c));}
  // Full app flag, guest and already-owned exclusion. No inference without explicit action.
  for(const fixture of [{flag:false},{owner:false},{saved:true}]){await page.evaluate(x=>window.fixture82(x),fixture);await page.waitForTimeout(100);assert.equal(await page.locator('[data-dual82]').count(),0);}
  await page.evaluate(()=>window.fixture82());await page.locator('[data-dual82]').waitFor();assert.equal((await page.evaluate(()=>window.state82())).writes,0);if(name==='webkit')assert.equal(await page.getByRole('button',{name:'Compare with two models'}).isDisabled(),true);
  // P870: run the actual extracted app.js editor's asynchronous Fill-photo path.
  // This mutates draft fields programmatically WITHOUT dispatching an input event.
  // The actual mounted dual panel must revoke consent and clear its stale state.
  if(name==='chromium'&&width===390){
   await page.evaluate(()=>window.fixture82());
   await page.locator('[data-dual82]').waitFor();
   const originalConsent=page.getByRole('checkbox',{name:/I consent to a local two-model/});
   const originalIsolated=page.getByRole('checkbox',{name:/One garment is isolated/});
   await originalConsent.check();await originalIsolated.check();
   await page.evaluate(()=>{window.p870ExternalInputs=0;document.querySelector('dialog form').addEventListener('input',e=>{if(!e.target.closest('[data-dual82]'))window.p870ExternalInputs++;});});
   await page.getByRole('button',{name:'Fill missing details from photo'}).click();
   await page.waitForTimeout(350);
   console.log('P870_DIAGNOSTIC',JSON.stringify(await page.evaluate(()=>({type:document.querySelector('dialog select[aria-label="Item type"]')?.value,status:[...document.querySelectorAll('dialog p')].map(x=>x.textContent).filter(x=>/Garment|garment|Color|color|Checking|checking|comparison|Comparison/.test(x)).slice(0,8),originalConsent:document.querySelector('[data-dual82] input')?.checked,available:!!document.querySelector('[data-dual82]'),error:window.p870FillError}))));
   await page.waitForFunction(()=>document.querySelector('dialog select[aria-label="Item type"]')?.value==='Shorts');
   assert.equal(await originalConsent.isChecked(),false,'auto editor update must revoke prior comparison consent');
   assert.equal(await originalIsolated.isChecked(),false,'auto editor update must revoke visibility declaration');
   assert.equal(await page.evaluate(()=>window.p870ExternalInputs),0,'this real app update has no form-input event');
   assert.equal(await page.getByText(/Comparison cleared. Review the current photo/).count(),1);
   assert.equal((await page.evaluate(()=>window.state82())).writes,0);
   console.log('P870_REAL_EDITOR_PROGRAMMATIC_FILL_REVOKES_CONSENT chromium 390 no-form-input zero-writes');
  }
  // Replace only the panel's request dependency for policy testing; real worker is tested separately.
  await page.evaluate(async()=>{
   const {mountDual82}=await import('/dual-panel-82.mjs'),{VERSION82,MODEL_ASSETS82}=await import('/dual-core-82.mjs'),{localCandidates}=await import('/local-catalog.mjs'),{observation81}=await import('/model-arbitration-81.mjs');
   window.mountSynthetic82=()=>{
    window.syntheticPanel82?.close();document.querySelector('[data-dual82]')?.remove();window.calls82=0;window.hold82=false;window.apply82=0;window.negative82=false;
    const form=document.querySelector('dialog form');window.syntheticPanel82=mountDual82({supported:true,form,item:window.current82,getOwner:()=>window.closetAuth.user,getDraftRevision:()=>JSON.stringify([form.querySelector('select[aria-label="Main category"]')?.value,form.querySelector('select[aria-label="Item type"]')?.value,form.querySelector('input[aria-label="Color"]')?.value]),isLive:()=>!!document.querySelector('dialog')?.open,unitAllowed:()=>!window.current82.segmentHint,onChoose:c=>{window.apply82++;window.applied82=c;const type=form.querySelector('select[aria-label="Item type"]');type.value=c.itemType;type.dispatchEvent(new Event('input',{bubbles:true}));},request:async(r,{signal})=>{
     window.calls82++;window.lastRequest82=r;while(window.hold82&&!signal.aborted)await new Promise(x=>setTimeout(x,10));if(signal.aborted)throw Error('cancelled');
     return {schema:VERSION82,assets:MODEL_ASSETS82,requestId:r.requestId,createdAt:Date.now(),sourceCodeSha256:r.sourceCodeSha256,observations:['fashionclip','fashionSiglip'].map((modelKey,i)=>observation81({modelKey,binding:r.binding,workerSourceSha256:r.sourceCodeSha256,vectorSha256:MODEL_ASSETS82[modelKey].vectorsSha256,latencyMs:2,scores:localCandidates.map((c,j)=>({label:c.label,score:(window.negative82?c.label==='a blank wall':c.itemType===(i?'Skirt':'Shorts'))?1:j/1000}))}))};
    }});
   };window.mountSynthetic82();
  });
  const consent=()=>page.getByRole('checkbox',{name:/I consent to a local two-model/}),visible=()=>page.getByRole('checkbox',{name:/One garment is isolated/}),check=()=>page.getByRole('button',{name:'Compare with two models'});
  await check().click();assert.equal(await page.evaluate(()=>window.calls82),0);
  await consent().check();await visible().check();await check().click();await page.getByRole('button',{name:/Use Shorts/}).waitFor();assert.equal(await page.evaluate(()=>window.apply82),0);
  await page.getByRole('button',{name:/Use Shorts/}).click();assert.equal(await page.evaluate(()=>window.apply82),0);
  await page.getByRole('checkbox',{name:/I compared the original photo/}).check();await page.getByRole('button',{name:/Use Shorts/}).click();assert.equal(await page.evaluate(()=>window.apply82),1);assert.equal((await page.evaluate(()=>window.state82())).writes,0);
  const normal=page.getByRole('checkbox',{name:/I checked the clothing photo/});assert.equal(await normal.isChecked(),false);
  await normal.check();await page.getByRole('button',{name:'Save changes',exact:true}).click();await page.waitForTimeout(100);assert.equal((await page.evaluate(()=>window.state82())).writes,1);
  for(const attack of ['owner','same-owner','owner-id','crop','image','mask','unit']){
   await page.evaluate(()=>window.fixture82());await page.locator('[data-dual82]').waitFor();await page.evaluate(()=>{window.mountSynthetic82();window.hold82=true;});await consent().check();await visible().check();await check().click();await page.waitForFunction(()=>window.calls82===1);await page.evaluate(k=>{window.mutate82(k);window.hold82=false;},attack);await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>window.apply82),0);assert.equal((await page.evaluate(()=>window.state82())).writes,0);
  }
  // P869: non-evented automatic photo-fill changes must invalidate a running or displayed comparison.
  await page.evaluate(()=>window.fixture82());await page.locator('[data-dual82]').waitFor();await page.evaluate(()=>{window.mountSynthetic82();window.hold82=true;});
  await consent().check();await visible().check();await check().click();await page.waitForFunction(()=>window.calls82===1);
  await page.evaluate(()=>{const color=document.querySelector('dialog input[aria-label="Color"]');if(!color)throw Error('Missing color field');color.value='Red';window.hold82=false;});
  await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>window.apply82),0);assert.equal((await page.evaluate(()=>window.state82())).writes,0);
  assert.equal(await page.getByRole('button',{name:/^Use Shorts/}).count(),0);
  await page.evaluate(()=>window.fixture82());await page.locator('[data-dual82]').waitFor();await page.evaluate(()=>{window.mountSynthetic82();window.hold82=false;});
  await consent().check();await visible().check();await check().click();await page.getByRole('button',{name:/Use Shorts/}).waitFor();
  await page.getByRole('checkbox',{name:/I compared the original photo/}).check();
  await page.evaluate(()=>{const type=document.querySelector('dialog select[aria-label="Item type"]');if(!type)throw Error('Missing type field');type.value='Skirt';});
  await page.getByRole('button',{name:/Use Shorts/}).click();
  assert.equal(await page.evaluate(()=>window.apply82),0);assert.equal((await page.evaluate(()=>window.state82())).writes,0);
  await page.evaluate(()=>window.fixture82());await page.locator('[data-dual82]').waitFor();await page.evaluate(()=>{window.mountSynthetic82();window.hold82=true;});await consent().check();await visible().check();await check().click();await page.getByRole('button',{name:'Cancel comparison'}).click();await page.evaluate(()=>window.hold82=false);assert.equal(await page.evaluate(()=>window.apply82),0);
  await page.evaluate(()=>window.fixture82());await page.locator('[data-dual82]').waitFor();await page.evaluate(()=>{window.mountSynthetic82();window.negative82=true;});await consent().check();await visible().check();await check().click();await page.getByText(/At least one model sees non-clothing/).waitFor();assert.equal(await page.getByRole('button',{name:/^Use /}).count(),0);assert.equal(await page.evaluate(()=>window.apply82),0);assert.equal((await page.evaluate(()=>window.state82())).writes,0);
  const transport=await page.evaluate(async()=>{
   const Native=window.Worker;let killed=0;window.Worker=class{postMessage(){}terminate(){killed++;}};
   const {browserRequest82}=await import('/dual-core-82.mjs');const r={requestId:'synthetic-deadline'};let busy=false,timeout=false,cancelled=false,allocation=false;
   try{const p=browserRequest82(r,{timeoutMs:30}).catch(e=>{timeout=e.message==='P82_TIMEOUT';});try{await browserRequest82(r);}catch(e){busy=e.message==='P82_BUSY';}await p;
    const abort=new AbortController(),q=browserRequest82(r,{signal:abort.signal}).catch(e=>{cancelled=e.message==='P82_CANCELLED';});abort.abort();await q;
    window.Worker=class{constructor(){throw Error('synthetic allocation failure');}};try{await browserRequest82(r);}catch(e){allocation=e.message==='P82_WORKER_UNAVAILABLE';}
   }finally{window.Worker=Native;}return {busy,timeout,cancelled,allocation,killed};
  });assert.deepEqual(transport,{busy:true,timeout:true,cancelled:true,allocation:true,killed:2});
  assert.deepEqual(errors,[]);console.log('P82_DESKTOP_POLICY_PASS',name,width,'7-stale-attacks+silent-photo-fill-drift+consent+one-explicit-save+cancel');await page.close();
 }}finally{await browser.close();browser=null;}
}}finally{await browser?.close();server.close();}
