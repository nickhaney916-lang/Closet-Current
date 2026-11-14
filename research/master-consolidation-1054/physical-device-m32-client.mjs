/** M32 physical-browser operator handoff, never releases Closet Current.
 * All original photos are public licensed SHA-locked development fixtures.
 * No uploads, localStorage, private accounts, owner IDs or raw model vectors.
 */
const $=id=>document.getElementById(id);
const status=t=>{$('status').textContent=t;};
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const sha256=async b=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].
 map(v=>v.toString(16).padStart(2,'0')).join('');
const photoUrl=b=>{
 const bytes=new Uint8Array(b),chunks=[];
 for(let i=0;i<bytes.length;i+=8192)
  chunks.push(String.fromCharCode(...bytes.subarray(i,i+8192)));
 return 'data:image/jpeg;base64,'+btoa(chunks.join(''));
};
const safeNumber=(x,min=0,max=1e10)=>Number.isFinite(x)&&x>=min&&x<=max?Math.round(x):null;
const platform=(()=>{
 const ua=navigator.userAgent||'';
 if(/iPhone|iPad|iPod/i.test(ua))return 'IPHONE_SAFARI_RESEARCH_UNVERIFIED';
 if(/Android/i.test(ua))return 'ANDROID_CHROME_RESEARCH_UNVERIFIED';
 return 'DESKTOP_OR_OTHER_UNVERIFIED';
})();
const userAgentIsNotHardwareProof=true;
let manifest=null,rows=[],running=false,scriptErrors=0,rejections=0;
window.addEventListener('error',()=>scriptErrors++);
window.addEventListener('unhandledrejection',()=>rejections++);
const display=()=>{
 $('rows').replaceChildren();
 for(const r of rows){
  const li=document.createElement('li');
  li.textContent=r.caseId+' · '+r.sourceId+' · '+r.result+' · '+(r.elapsedMs??'unknown')+' ms';
  $('rows').append(li);
 }
 $('export').disabled=rows.length===0;
};
const buttons=['run4','run16','cancel','lock','clear'];
const setBusy=v=>{running=v;for(const id of buttons)$(id).disabled=v;};
const cancelScope=()=>{
 try{window.dialog1054?.close();}catch{}
 try{window.mounted1054?.close?.();}catch{}
};
const evidence=async source=>{
 const response=await fetch('/device/jpeg/'+source.id,{cache:'no-store'});
 if(!response.ok)throw Error('PUBLIC_JPEG_LOAD');
 const bytes=await response.arrayBuffer();
 if(bytes.byteLength<1000||bytes.byteLength>8*1024*1024)throw Error('PUBLIC_JPEG_SIZE');
 const digest=await sha256(bytes);
 if(digest!==source.sha256)throw Error('PUBLIC_JPEG_SHA');
 return {data:photoUrl(bytes),digest};
};
const find= (parent,tag,text)=>[...parent.querySelectorAll(tag)].
 find(node=>node.textContent?.trim().startsWith(text));
const mount=async (source,cancelMode=false)=>{
 const bytes=await evidence(source);
 window.m32CancelMode=cancelMode;
 window.publicPhoto1054=bytes.data;
 window.publicSHA1054=source.sha256;
 const ready=await window.stage1054();
 if(!ready?.mounted)throw Error('NATIVE_SIGNED_OWNER_MISSING');
 const field=document.querySelector('[data-dual82]');
 if(!field)throw Error('ORIGINAL_REVIEW_PANEL_MISSING');
 const checkboxes=[...field.querySelectorAll('input[type=checkbox]')];
 if(checkboxes.length<2)throw Error('NATIVE_CONSENT_FIELDS_MISSING');
 for(const input of checkboxes.slice(0,2)){
  input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));
 }
 const compare=find(field,'button','Compare with two models');
 if(!compare||compare.disabled)throw Error('NATIVE_COMPARE_UNAVAILABLE');
 return {field,compare,originalSHA:source.sha256};
};
const waitFor=async(fn,timeoutMs)=>{
 const begin=performance.now();
 while(performance.now()-begin<timeoutMs){
  const v=fn();if(v)return v;
  await delay(100);
 }
 throw Error('RESEARCH_MODEL_TIMEOUT');
};
const readOriginalHash=async()=>{
 const img=window.item1054?.image;
 if(typeof img!=='string'||!img.startsWith('data:image/jpeg;base64,'))
  throw Error('SOURCE_MISSING_AFTER_MODEL');
 const raw=atob(img.slice('data:image/jpeg;base64,'.length));
 const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
 return sha256(bytes);
};
const runOne=async(source,index)=>{
 const time=performance.now();
 const ctx=await mount(source,false);
 ctx.compare.click();
 await waitFor(()=>window.actual1054||window.workerError1054,270000);
 if(window.workerError1054)throw Error('MODEL_WORKER_REPORTED_FAILURE');
 await delay(80); // UI consumes the exact validated model response
 const {output,request}=window.actual1054||{};
 const [{validateResponse82},{sharedRankChoices82}]=await Promise.all([
  import('/dual-core-82.mjs'),import('/dual-panel-82.mjs')]);
 const decision=validateResponse82(output,request);
 const choices=sharedRankChoices82(decision,output.observations);
 const digest=await readOriginalHash();
 if(digest!==ctx.originalSHA||window.item1054.image!==window.item1054.originalPhoto.image)
  throw Error('ORIGINAL_JPEG_CHANGED');
 if(window.writes1054!==0||window.ack1054?.checked||window.item1054?.itemType!=='Unknown')
  throw Error('UNAPPROVED_OWNER_SAVE');
 if(output?.researchRuntime!=='m25-cpu-only-wasm'||
   output?.automaticAdmissions!==0||output?.hostedWrites!==0||
   output?.productionAdoption!==false)throw Error('NON_CPU_OR_SAVE_RESPONSE');
 const families=output.observations.map(o=>o.modelKey).sort();
 if(JSON.stringify(families)!==JSON.stringify(['fashionSiglip','fashionclip'].sort()))
  throw Error('INCOMPLETE_DUAL_MODEL');
 const displayChoices=[...ctx.field.querySelectorAll('button')].
  filter(v=>v.textContent?.startsWith('Use ')).length;
 if(displayChoices!==choices.length)throw Error('OWNER_HINT_MISMATCH');
 const ended=performance.now();
 const rec={caseId:'photo-'+String(index).padStart(2,'0'),
  sourceId:source.id,sourceSHA256:source.sha256,observedSourceSHA256:digest,
  result:'COMPLETE_UNSAVED',bothModelsCompleted:true,ownerConsent:true,
  manualOwnerApprovalRequired:true,automaticAdmissions:0,privateWrites:0,
  unchangedSource:true,workerTerminatedIndependentlyVerified:false,
  modelMs:safeNumber(output.totalMs),elapsedMs:safeNumber(ended-time),
  ownerDecision:['abstain','cross_family_hypothesis'].includes(decision.status)?decision.status:'UNEXPECTED',
  ownerSuggestionCount:displayChoices,memoryRSSVerified:false};
 if(rec.ownerDecision==='UNEXPECTED')throw Error('UNEXPECTED_DECISION');
 return rec;
};
const waitForStage=(field,needle,timeoutMs)=>new Promise((resolve,reject)=>{
 const status=field.querySelector('[role="status"]');
 if(!status)return reject(Error('MODEL_STAGE_STATUS_MISSING'));
 let done=false;
 const observer=new MutationObserver(()=>{
  if(done)return;
  if(status.textContent?.includes(needle)){
   done=true;clearTimeout(timer);observer.disconnect();resolve(true);
  }
 });
 const timer=setTimeout(()=>{if(!done){done=true;observer.disconnect();
  reject(Error('ONNX_STAGE_NOT_OBSERVED'));}},timeoutMs);
 observer.observe(status,{subtree:true,childList:true,characterData:true});
 if(status.textContent?.includes(needle)){done=true;clearTimeout(timer);observer.disconnect();resolve(true);}
});
const runAbort=async(source,mode)=>{
 const start=performance.now();
 const ctx=await mount(source,true);
 const signal=waitForStage(ctx.field,'M28_CPU_ONNX_RUN_INVOKED_fashionclip',180000);
 ctx.compare.click();await signal;
 if(mode==='cancel'){
  const button=find(ctx.field,'button','Cancel comparison');
  if(!button||button.hidden)throw Error('CANCEL_BUTTON_MISSING');
  button.click();
 }else window.revoke1054('lock');
 await delay(180);
 const digest=await readOriginalHash();
 if(digest!==source.sha256||window.writes1054!==0||window.ack1054?.checked||
  window.item1054?.itemType!=='Unknown'||window.draft1054?.itemType!=='Unknown'||
  window.actual1054!==null)
  throw Error('UNAUTHORIZED_RESULT_AFTER_ABORT');
 const panel=!!document.querySelector('[data-dual82]');
 if(panel!==(mode==='cancel'))throw Error('PANEL_REVOKE_MISMATCH');
 return {caseId:mode==='cancel'?'onnx-invoked-cancel':'onnx-invoked-session-lock',
  sourceId:source.id,sourceSHA256:source.sha256,observedSourceSHA256:digest,
  result:'ONNX_INVOKED_ABORT_NO_RESULT',onnxRunInvocationObserved:true,
  workerTerminatedIndependentlyVerified:false,completedInferenceCredited:false,
  kernelExecutionAtCancelProven:false,manualOwnerApprovalRequired:true,
  automaticAdmissions:0,privateWrites:0,unchangedSource:true,
  elapsedMs:safeNumber(performance.now()-start),memoryRSSVerified:false};
};
async function task(count=null,action=null){
 if(running||!manifest)return;
 setBusy(true);
 try{
  const sources=manifest.sources;
  const all=action?[action==='cancel'?sources[0]:sources[1]]:Array.from({length:count},
   (_,i)=>sources[i%sources.length]);
  for(let i=0;i<all.length;i++){
   status('Public original '+(i+1)+'/'+all.length+' — '+all[i].id+
    ' · native CPU recognition; no save');
   let receipt;
   try{receipt=action?await runAbort(all[i],action):await runOne(all[i],i+1);}
   catch(e){
    receipt={caseId:action||('photo-'+String(i+1).padStart(2,'0')),
     sourceId:all[i].id,sourceSHA256:all[i].sha256,
     result:'BLOCKED',errorCode:/^(?:[A-Z_]{4,45})$/.test(e?.message||'')?
      e.message:'UNCLASSIFIED_FAILURE',completedInferenceCredited:false,
     hardwareVerified:false,releaseAuthorized:false};
    rows.push(receipt);display();
    status('BLOCKED: '+receipt.errorCode+'. Original source and consent require review.');
    break;
   }
   rows.push(receipt);display();
  }
  if(rows.length&&rows.at(-1).result!=='BLOCKED')status(
   'Local browser completed requested research cases; physical hardware and release remain UNVERIFIED.');
 }finally{cancelScope();setBusy(false);}
}
function exportReceipt(){
 if(!rows.length)return;
 const report={
  schema:'main1054-physical-device-handoff-m32-receipt-v1',
  sourceCommit:manifest.codeCommit,manifestSchema:manifest.schema,
  observedPlatform:platform,
  viewportWidth:safeNumber(innerWidth,200,1600),
  pixelRatio:Number.isFinite(devicePixelRatio)?Math.round(devicePixelRatio*1000)/1000:null,
  touchPoints:safeNumber(navigator.maxTouchPoints,0,50),
  observedBrowserErrors:scriptErrors,observedUnhandledRejections:rejections,
  selectedPhotoSources:manifest.sources.map(s=>({id:s.id,sha256:s.sha256})),
  rows:rows.map(x=>({...x})),
  hardwareVerified:false,operatorAttestationNotIndependentProof:true,
  phoneProcessMemoryVerified:false,cloudOrPrivateWardrobeTested:false,
  independentHumanLabelsVerified:false,blindAccuracy:null,
  releaseAuthorized:false,familyAlpha:'HOLD',
  caution:'Operator-run browser results require external physical device, screenshot/video, source-commit and identity verification. Local receipt is not device acceptance.'
 };
 const json=JSON.stringify(report,null,2),blob=new Blob([json],{type:'application/json'});
 const url=URL.createObjectURL(blob),anchor=document.createElement('a');
 anchor.href=url;anchor.download='main1054-m32-LOCAL-UNVERIFIED-receipt.json';
 anchor.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
$('run4').addEventListener('click',()=>task(4));
$('run16').addEventListener('click',()=>task(16));
$('cancel').addEventListener('click',()=>task(null,'cancel'));
$('lock').addEventListener('click',()=>task(null,'lock'));
$('clear').addEventListener('click',()=>{rows=[];display();status('Local receipt cleared.');});
$('export').addEventListener('click',exportReceipt);
try{
 const r=await fetch('/device/manifest.json',{cache:'no-store'});
 if(!r.ok)throw Error('UNAVAILABLE_SOURCE_MANIFEST');
 manifest=await r.json();
 if(manifest?.schema!=='main1054-physical-device-handoff-m32-v1'||
   !/^[0-9a-f]{40}$/.test(manifest.codeCommit||'')||
   !Array.isArray(manifest.sources)||manifest.sources.length!==4||
   new Set(manifest.sources.map(x=>x.id)).size!==4||
   manifest.sources.some(x=>!/^[0-9a-f]{64}$/.test(x.sha256))||
   manifest.familyAlpha!=='HOLD'||manifest.releaseAuthorized!==false)
  throw Error('SOURCE_MANIFEST_INVALID');
 $('source').textContent='Test commit '+manifest.codeCommit.slice(0,12)+
  ' · '+manifest.sources.length+' public originals · no private photos';
 status('Ready for operator-controlled local testing. No physical phone is independently verified.');
}catch(e){status('BLOCKED: source manifest or trusted HTTPS unavailable.');
 for(const id of buttons)$(id).disabled=true;
}
