'use strict';
// Pilot UI: one click starts REAL provider inference. No pasted-garment
// mockups, hidden paid calls, or automatic selfie uploads.
let tryOnFigure='female',tryOnBusy=false,tryOnRevision=0,tryOnImage=null,tryOnFingerprint=null,tryOnPendingInputs=null;
let tryOnReady=false,tryOnMultiReady=false,tryOnReadinessPending=true;
let tryOnController=null;
// These are lightweight local previews of the two fixed AI figures, not
// generated try-on results. They make selecting a model possible offline.
function updateStandardModelPreview(){
 const preview=$('tryOnModelPreview');
 if(preview){
  preview.src='ai-models/'+tryOnFigure+'-preview.webp';
  preview.alt='Standard '+tryOnFigure+' AI fashion model, before any outfit generation';
 }
 const caption=$('tryOnModelCaption');
 if(caption)caption.textContent='Standard '+tryOnFigure+' model · preview only. Your selected clothing has not been rendered yet.';
}
// Source photos must be checked EXACTLY. Same-length data URIs can share
// their last 24 characters even when the clothing pixels have changed.
// A snapshot holds references to existing strings, not copies of giant images;
// equality compares the complete original selected input without lossy hashes.
function tryOnInputs(){
 const selected=currentBoard?.slots||{};
 return {owner:typeof window==='undefined'?null:window.closetAuth?.user?.id||null,figure:tryOnFigure,slots:['top','bottom','layer','layer2','layer3','shoes'].map(slot=>{
  const id=selected[slot]||null,item=items.find(x=>x.id===id);
  return {slot,id,category:item?.category||null,itemType:item?.itemType||null,image:item?.image||null};
 })};
}
function sameTryOnInputs(a,b){
 return !!a&&!!b&&a.owner===b.owner&&a.figure===b.figure&&a.slots.length===b.slots.length&&
  a.slots.every((x,i)=>{const y=b.slots[i];return x.slot===y.slot&&x.id===y.id&&
   x.category===y.category&&x.itemType===y.itemType&&x.image===y.image;});
}
function resetTryOnPreview(){
 tryOnController?.abort(Error('Outfit changed; the old preview was discarded'));
 tryOnRevision++;tryOnImage=null;tryOnFingerprint=null;tryOnPendingInputs=null;
 const image=$('tryOnImage');if(image){image.hidden=true;image.removeAttribute('src');}
 $('outfitFigure')?.classList.remove('ai-tryon-active');
 $('tryOnStatus').textContent=tryOnReady?'Select your clothes, then tap Generate AI try-on.':'AI try-on preview is being prepared. No paid generation is enabled.';
}
function onTryOnBoardChanged(){
 const now=tryOnInputs();
 if((tryOnImage&&!sameTryOnInputs(tryOnFingerprint,now))||
    (tryOnBusy&&tryOnPendingInputs&&!sameTryOnInputs(tryOnPendingInputs,now)))
  resetTryOnPreview();
 $('tryOnGenerate').disabled=tryOnBusy||!tryOnReady||!window.AiTryOnPlan?.plan(currentBoard,items).steps.length;
}
async function tryOnRequest(token,body,signal){
 const controller=new AbortController(),cancel=()=>controller.abort(signal.reason);
 if(signal?.aborted)cancel();else signal?.addEventListener('abort',cancel,{once:true});
 const timer=setTimeout(()=>controller.abort(Error('AI request timed out. No automatic retry was made; a submitted job may still finish.')),['start','continue'].includes(body.action)?85000:25000);
 try{
  if(controller.signal.aborted)throw controller.signal.reason;
  const response=await fetch('https://hlkgymugtfbirlpunsra.supabase.co/functions/v1/ai-try-on',{
  method:'POST',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},
  body:JSON.stringify(body),cache:'no-store',signal:controller.signal
  });
  const result=await response.json().catch(()=>null);
  if(!response.ok){
   const error=Error(typeof result?.error==='string'?result.error:'AI try-on is unavailable');
   error.retryable=body.action==='status'&&[408,429,500,502,503,504].includes(response.status);
   throw error;
  }
  if(!result||typeof result!=='object'||Array.isArray(result))throw Error('Invalid try-on response');
  return result;
 }catch(error){
  // Only read-only status polls can recover automatically. A start/continue
  // POST might already have been accepted and must never be resubmitted.
  if(signal?.aborted)throw signal.reason;
  if(controller.signal.aborted){
   const timeout=controller.signal.reason;timeout.retryable=body.action==='status';throw timeout;
  }
  if(body.action==='status'&&error?.name==='TypeError')error.retryable=true;
  throw error;
 }finally{clearTimeout(timer);signal?.removeEventListener('abort',cancel);}
}
function tryOnAbortable(promise,signal){
 if(!signal)return promise;
 return new Promise((resolve,reject)=>{
  const cancel=()=>reject(signal.reason);
  if(signal.aborted)reject(signal.reason);
  else signal.addEventListener('abort',cancel,{once:true});
  Promise.resolve(promise).then(resolve,reject).finally(()=>signal.removeEventListener('abort',cancel));
 });
}
function tryOnPollDelay(signal){
 return new Promise((resolve,reject)=>{
  const cancel=()=>{clearTimeout(timer);reject(signal.reason);};
  const timer=setTimeout(()=>{signal?.removeEventListener('abort',cancel);resolve();},1500);
  if(signal?.aborted)cancel();else signal?.addEventListener('abort',cancel,{once:true});
 });
}
// Validate actual browser decoding before a second paid pass or visible output.
// A base64-shaped string alone does not prove usable image bytes.
async function decodeTryOnImage(value,label='Generated try-on',signal){
 const message=label+' image could not be decoded';
 if(!(label==='Selected garment'?window.AiTryOnPlan.validImage(value):window.AiTryOnPlan.validOutputImage(value)))throw Error(label+' image is invalid');
 const probe=new Image();probe.src=value;
 let timer;
 try{
  await tryOnAbortable(Promise.race([probe.decode(),new Promise((_,reject)=>{
   timer=setTimeout(()=>reject(Error(message)),10000);
  })]),signal);
  if(!probe.naturalWidth||!probe.naturalHeight||probe.naturalWidth*probe.naturalHeight>16_000_000)throw Error('Unsupported image dimensions');
 }catch(error){if(signal?.aborted)throw signal.reason;throw Error(message);}
 finally{clearTimeout(timer);probe.removeAttribute('src');}
}
// A status check never starts an AI generation or uploads a clothing photo.
async function checkTryOnReadiness(){
 try{
  await (window.closetAuth?.ready||Promise.resolve());
  if(typeof window.closetAuth?.getAccessToken!=='function')throw Error('Sign in required');
  const token=await window.closetAuth.getAccessToken();
  const response=await tryOnRequest(token,{action:'availability'});
  tryOnReady=response?.status==='ready';
  tryOnMultiReady=tryOnReady&&response?.multiGarmentReady===true;
 }catch{tryOnReady=false;tryOnMultiReady=false;}
 finally{
  tryOnReadinessPending=false;
  if(!tryOnReady){
   $('tryOnStatus').textContent='AI virtual try-on is not available yet. Your closet and outfit builder still work normally; no paid AI call will run.';
   $('tryOnGenerate').textContent='AI try-on coming soon';
  }else{
   $('tryOnGenerate').textContent=tryOnMultiReady?'Generate two-garment AI try-on':'Generate AI try-on';
   $('tryOnStatus').textContent=tryOnMultiReady?
    'Two-garment AI research is available for this pilot. Each garment uses a separate provider pass. Results must be checked for fabric and identity fidelity.':
    'Ready for the single-garment pilot. Generate sends only your selected clothing crop to our AI provider.';
  }
  onTryOnBoardChanged();
 }
}
// Keep the same request IDs after an uncertain HTTP outcome, including reload.
// Only a digest and random IDs enter sessionStorage; garment pixels stay out.
async function tryOnDigest(value){
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
 return Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');
}
let tryOnAttempt=null;
async function tryOnAttemptFor(signature,steps){
 steps=steps||window.AiTryOnPlan.plan(currentBoard,items).steps.slice(0,tryOnMultiReady?2:1);
 // Hash sources individually: avoid expanding a whole closet of base64 photos
 // into one large JSON string. Unsupported shoe/layer changes reuse the job.
 const inputs=[];
 for(const step of steps)inputs.push({slot:step.slot,id:step.itemId,category:step.category,image:await tryOnDigest(step.image)});
 const digest=await tryOnDigest(JSON.stringify({owner:signature.owner,figure:signature.figure,inputs}));
 if(tryOnAttempt?.digest===digest)return tryOnAttempt;
 try{
  const saved=JSON.parse(sessionStorage.getItem('closet-tryon-attempt-v1'));
  if(saved?.digest===digest&&Array.isArray(saved.ids)&&saved.ids.length===2&&
   saved.ids.every(x=>typeof x==='string'&&/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(x)))
   return tryOnAttempt=saved;
 }catch{}
 const uuid=()=>{
  const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
  const h=Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
  return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);
 };
 tryOnAttempt={digest,ids:[uuid(),uuid()]};
 try{sessionStorage.setItem('closet-tryon-attempt-v1',JSON.stringify(tryOnAttempt));}catch{}
 return tryOnAttempt;
}
async function tryOnOne(token,image,category,figure,isCurrent,previousToken=null,requestId,plannedPasses=1,nextGarmentDigest=null,signal){
 let result=await tryOnRequest(token,previousToken?
  {action:'continue',previousToken,figure,category,garmentImage:image,requestId}:
  {action:'start',figure,category,garmentImage:image,requestId,plannedPasses,nextGarmentDigest},signal);
 if(result.status!=='processing'||typeof result.token!=='string'||!result.token||result.token.length>1024)throw Error('AI try-on did not start');
 const jobToken=result.token;
 let statusFailures=0;
 // One provider call per step. Status requests never submit extra billable jobs.
 for(let i=0;i<32;i++){
  if(!isCurrent())throw Error('Outfit changed; the old preview was discarded');
  await tryOnPollDelay(signal);
  if(!isCurrent())throw Error('Outfit changed; the old preview was discarded');
  try{
   result=await tryOnRequest(token,{action:'status',token:jobToken},signal);
   statusFailures=0;
  }catch(error){
   if(signal?.aborted||!error.retryable||++statusFailures>2)throw error;
   $('tryOnStatus').textContent='Connection interrupted. Checking the same AI render…';
   continue;
  }
  if(result.status==='completed'){
   await decodeTryOnImage(result.image,'Generated try-on',signal);
   if(!isCurrent())throw Error('Outfit changed; stale result discarded');
   return {image:result.image,jobToken:jobToken};
  }
  if(result.status==='failed')throw Error('AI try-on could not render this garment');
  if(result.status!=='processing')throw Error('Unexpected try-on response');
 }
 throw Error('AI try-on exceeded the preview time limit');
}
async function generateTryOn(){
 if(tryOnBusy)return;
 if(!tryOnReady){$('tryOnStatus').textContent='AI try-on is not enabled for this account. No generation started.';return;}
 const plan=window.AiTryOnPlan.plan(currentBoard,items);
 if(!plan.steps.length){$('tryOnStatus').textContent='Choose a shirt, dress, or bottoms first.';return;}
 // A failed regeneration must not leave the previous successful image visible.
 resetTryOnPreview();
 const signature=tryOnInputs(),revision=++tryOnRevision,figure=tryOnFigure;
 const isCurrent=()=>revision===tryOnRevision&&sameTryOnInputs(signature,tryOnInputs());
 const controller=new AbortController();tryOnController=controller;
 const deadline=setTimeout(()=>controller.abort(Error('AI try-on exceeded the preview time limit. No generation was retried.')),180000);
 tryOnPendingInputs=signature;
 tryOnBusy=true;$('tryOnGenerate').disabled=true;
 $('tryOnStatus').textContent='Generating a realistic AI try-on…';
 try{
  // Preserve the user's real source photo; this is transient generated output.
  const auth=window.closetAuth;
  if(typeof auth?.getAccessToken!=='function')throw Error('Sign in to try on clothing');
  const token=await tryOnAbortable(auth.getAccessToken(),controller.signal);
  let modelImage=null,priorJob=null;
  const enabledSteps=tryOnMultiReady?plan.steps:plan.steps.slice(0,1);
  // Validate BOTH source photos before any paid submission or budget use.
  for(const step of enabledSteps){
   await decodeTryOnImage(step.image,'Selected garment',controller.signal);if(!isCurrent())return;
  }
  const attempt=await tryOnAbortable(tryOnAttemptFor(signature,enabledSteps),controller.signal);
  const nextDigest=enabledSteps.length===2?await tryOnDigest(enabledSteps[1].image):null;
  for(let i=0;i<enabledSteps.length;i++){
   if(!isCurrent())return;
   const step=enabledSteps[i];
   $('tryOnStatus').textContent='Generating AI try-on · '+(i+1)+' of '+enabledSteps.length+'…';
   // "continue" is allowed only when the server verifies a completed,
   // same-user/same-figure prior job and is independently approved for
   // multi-pass paid inference. Never submit a client-picked model photo.
   const current=await tryOnOne(token,step.image,step.category,figure,isCurrent,priorJob,attempt.ids[i],i===0?enabledSteps.length:1,i===0?nextDigest:null,controller.signal);
   modelImage=current.image;priorJob=current.jobToken;
  }
  if(!isCurrent()||!modelImage)return;
  tryOnImage=modelImage;tryOnFingerprint=signature;tryOnPendingInputs=null;
  const image=$('tryOnImage');image.src=modelImage;image.hidden=false;
  $('outfitFigure')?.classList.add('ai-tryon-active');
  // Even when two provider passes completed, it is NOT proof that both
  // clothing identities were preserved in the final output. Full outfit
  // footwear/outer layers remain unsupported by v1.6.
  const rendered=enabledSteps.map(x=>x.slot),
   unrendered=Object.keys(currentBoard?.slots||{}).filter(slot=>currentBoard.slots[slot]&&!rendered.includes(slot)),
   summary=rendered.map(x=>x==='top'&&plan.dress?'dress':x).join(' + ');
  $('tryOnStatus').textContent='AI-generated '+summary+' preview ('+rendered.length+
   ' pass'+(rendered.length===1?'':'es')+').'+
   (unrendered.length?' Not rendered: '+unrendered.join(', ')+'.':'')+
   ' Check both original garments against the preview; fabric details, drape and earlier garments may change between AI passes.';
 }catch(error){
  if(!isCurrent())return;
  $('tryOnStatus').textContent=error instanceof Error?error.message:'Try-on unavailable';
 }finally{
  clearTimeout(deadline);tryOnController=null;
  tryOnBusy=false;tryOnPendingInputs=null;onTryOnBoardChanged();
 }
}
$('tryOnFigure').onchange=event=>{
 tryOnFigure=window.AiTryOnPlan.figure(event.target.value);
 updateStandardModelPreview();
 resetTryOnPreview();onTryOnBoardChanged();
};
$('tryOnGenerate').onclick=generateTryOn;
updateStandardModelPreview();
onTryOnBoardChanged();
checkTryOnReadiness();
