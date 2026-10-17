'use strict';
// Pilot UI: one click starts REAL provider inference. No pasted-garment
// mockups, hidden paid calls, or automatic selfie uploads.
let tryOnFigure='female',tryOnBusy=false,tryOnRevision=0,tryOnImage=null,tryOnFingerprint='';
function tryOnSignature(){
 const ids=currentBoard?.slots||{};
 return tryOnFigure+':'+['top','bottom','layer','layer2','layer3','shoes'].map(k=>{const item=items.find(x=>x.id===ids[k]);return (ids[k]||'')+':'+(item?.image?.length||0)+':'+(item?.image?.slice(-24)||'');}).join('|');
}
function resetTryOnPreview(){
 tryOnRevision++;tryOnImage=null;tryOnFingerprint='';
 const image=$('tryOnImage');if(image){image.hidden=true;image.removeAttribute('src');}
 $('outfitFigure')?.classList.remove('ai-tryon-active');
 $('tryOnStatus').textContent='Select your clothes, then tap Generate AI try-on.';
}
function onTryOnBoardChanged(){
 if(tryOnImage&&tryOnFingerprint!==tryOnSignature())resetTryOnPreview();
 $('tryOnGenerate').disabled=tryOnBusy||!window.AiTryOnPlan?.plan(currentBoard,items).steps.length;
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
 const plan=window.AiTryOnPlan.plan(currentBoard,items);
 if(!plan.steps.length){$('tryOnStatus').textContent='Choose a shirt, dress, or bottoms first.';return;}
 const signature=tryOnSignature(),revision=++tryOnRevision,figure=tryOnFigure;
 const isCurrent=()=>revision===tryOnRevision&&signature===tryOnSignature();
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
  tryOnImage=modelImage;tryOnFingerprint=signature;
  const image=$('tryOnImage');image.src=modelImage;image.hidden=false;
  $('outfitFigure')?.classList.add('ai-tryon-active');
  $('tryOnStatus').textContent=plan.steps.length>1?
   'AI try-on of your '+plan.steps[0].slot+' is ready. Other selected pieces are not rendered yet.':
   'AI-generated try-on preview. Exact sizing and fabric drape are not guaranteed.';
 }catch(error){
  if(!isCurrent())return;
  $('tryOnStatus').textContent=error instanceof Error?error.message:'Try-on unavailable';
 }finally{
  tryOnBusy=false;onTryOnBoardChanged();
 }
}
$('tryOnFigure').onchange=event=>{
 tryOnFigure=window.AiTryOnPlan.figure(event.target.value);
 resetTryOnPreview();onTryOnBoardChanged();
};
$('tryOnGenerate').onclick=generateTryOn;
onTryOnBoardChanged();
