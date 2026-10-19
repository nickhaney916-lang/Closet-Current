'use strict';
// Pilot UI: one click starts REAL provider inference. No pasted-garment
// mockups, hidden paid calls, or automatic selfie uploads.
let tryOnFigure='female',tryOnBusy=false,tryOnRevision=0,tryOnImage=null,tryOnFingerprint=null,tryOnPendingInputs=null;
let tryOnReady=false,tryOnReadinessPending=true;
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
 return {figure:tryOnFigure,slots:['top','bottom','layer','layer2','layer3','shoes'].map(slot=>{
  const id=selected[slot]||null,item=items.find(x=>x.id===id);
  return {slot,id,category:item?.category||null,itemType:item?.itemType||null,image:item?.image||null};
 })};
}
function sameTryOnInputs(a,b){
 return !!a&&!!b&&a.figure===b.figure&&a.slots.length===b.slots.length&&
  a.slots.every((x,i)=>{const y=b.slots[i];return x.slot===y.slot&&x.id===y.id&&
   x.category===y.category&&x.itemType===y.itemType&&x.image===y.image;});
}
function resetTryOnPreview(){
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
function tryOnRequest(token,body){
 return fetch('https://hlkgymugtfbirlpunsra.supabase.co/functions/v1/ai-try-on',{
  method:'POST',headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'},
  body:JSON.stringify(body),cache:'no-store'
 }).then(async response=>{
  const result=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(result.error||'AI try-on is unavailable');
  return result;
 });
}
// A status check never starts an AI generation or uploads a clothing photo.
async function checkTryOnReadiness(){
 try{
  await (window.closetAuth?.ready||Promise.resolve());
  if(typeof window.closetAuth?.getAccessToken!=='function')throw Error('Sign in required');
  const token=await window.closetAuth.getAccessToken();
  const response=await tryOnRequest(token,{action:'availability'});
  tryOnReady=response?.status==='ready';
 }catch{tryOnReady=false;}
 finally{
  tryOnReadinessPending=false;
  if(!tryOnReady){
   $('tryOnStatus').textContent='AI virtual try-on is not available yet. Your closet and outfit builder still work normally; no paid AI call will run.';
   $('tryOnGenerate').textContent='AI try-on coming soon';
  }else{
   $('tryOnGenerate').textContent='Generate AI try-on';
   $('tryOnStatus').textContent='Ready for pilot accounts. Generate sends only the selected clothing crop to our AI provider.';
  }
  onTryOnBoardChanged();
 }
}
async function tryOnOne(token,image,category,figure,isCurrent){
 let result=await tryOnRequest(token,{action:'start',figure,category,garmentImage:image});
 if(typeof result.token!=='string')throw Error('AI try-on did not start');
 // One provider call per step. Status requests never submit extra billable jobs.
 for(let i=0;i<32;i++){
  if(!isCurrent())throw Error('Outfit changed; the old preview was discarded');
  await new Promise(resolve=>setTimeout(resolve,1500));
  result=await tryOnRequest(token,{action:'status',token:result.token});
  if(result.status==='completed'){
   if(!window.AiTryOnPlan.validImage(result.image))throw Error('Generated try-on image is invalid');
   return result.image;
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
 const signature=tryOnInputs(),revision=++tryOnRevision,figure=tryOnFigure;
 const isCurrent=()=>revision===tryOnRevision&&sameTryOnInputs(signature,tryOnInputs());
 tryOnPendingInputs=signature;
 tryOnBusy=true;$('tryOnGenerate').disabled=true;
 $('tryOnStatus').textContent='Generating a realistic AI try-on…';
 try{
  // Preserve the user's real source photo; this is transient generated output.
  const auth=window.closetAuth;
  if(typeof auth?.getAccessToken!=='function')throw Error('Sign in to try on clothing');
  const token=await auth.getAccessToken();
  let modelImage=null;
  for(let i=0;i<plan.steps.length;i++){
   if(!isCurrent())return;
   const step=plan.steps[i];
   $('tryOnStatus').textContent='Generating AI try-on · '+(i+1)+' of '+plan.steps.length+'…';
   // Follow-up garments use the previous AI-generated figure as the
   // model input only after the server supports a signed chained image.
   // First pilot deliberately handles just ONE garment to avoid presenting
   // unrendered bottoms, shoes, or coats as if they were worn.
   if(i>0)break;
   modelImage=await tryOnOne(token,step.image,step.category,figure,isCurrent);
  }
  if(!isCurrent()||!modelImage)return;
  tryOnImage=modelImage;tryOnFingerprint=signature;tryOnPendingInputs=null;
  const image=$('tryOnImage');image.src=modelImage;image.hidden=false;
  $('outfitFigure')?.classList.add('ai-tryon-active');
  $('tryOnStatus').textContent=plan.steps.length>1?
   'AI try-on of your '+plan.steps[0].slot+' is ready. Other selected pieces are not rendered yet.':
   'AI-generated try-on preview. Exact sizing and fabric drape are not guaranteed.';
 }catch(error){
  if(!isCurrent())return;
  $('tryOnStatus').textContent=error instanceof Error?error.message:'Try-on unavailable';
 }finally{
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
