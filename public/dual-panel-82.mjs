/** Existing Adjust screen extension; opt-in, ephemeral and owner-confirmed only. */
import {VERSION82,bind82,codeHash82,browserRequest82,validateResponse82} from './dual-core-82.mjs';
import {evidence80,binding80,revision80} from './subtype-review-80.mjs';
export const dualBrowserAvailable82=(ua=globalThis.navigator?.userAgent||'')=>/(?:Chrome|Chromium|Edg)\//.test(ua)&&!/(?:iPhone|iPad|iPod)/.test(ua);
const el=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
export function mountDual82({form,item,getOwner,isLive,unitAllowed,onChoose,getDraftRevision=()=>'',request=browserRequest82,supported=dualBrowserAvailable82()}){
 const owner=getOwner(),ownerId=owner?.id,sessionId=crypto.randomUUID(),opened=revision80(item);
 let active=true,epoch=0,controller=null,pending=false;
 const valid=()=>active&&getOwner()===owner&&getOwner()?.id===ownerId&&!!ownerId&&unitAllowed()&&revision80(item)===opened;
 const scopeLive=()=>valid()&&isLive();
 const panel=el('fieldset');panel.dataset.dual82='true';panel.append(el('legend','Two-model photo review · research'));
 panel.append(el('p','Optional local comparison. Suggestions can be wrong. Your original stays unchanged; nothing is saved until you confirm the photo.'));
 const consent=el('input'),detail=el('input');consent.type=detail.type='checkbox';
 const a=el('label'),b=el('label');a.append(consent,document.createTextNode(' I consent to a local two-model comparison (about 200 MB of model downloads).'));b.append(detail,document.createTextNode(' One garment is isolated and its hems, sleeves, ankles or soles are visible.'));
 const check=el('button','Compare with two models'),cancel=el('button','Cancel comparison'),status=el('p'),results=el('div');check.type=cancel.type='button';cancel.hidden=true;status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 panel.append(a,b,check,cancel,status,results);form.prepend(panel);
 const revoke=()=>{epoch++;controller?.abort();controller=null;pending=false;results.replaceChildren();cancel.hidden=true;check.disabled=!supported;};
 const invalidated=()=>{revoke();consent.checked=false;detail.checked=false;status.textContent='Comparison cleared. Review the current photo before trying again.';};
 const input=e=>{if(!panel.contains(e.target))invalidated();};form.addEventListener('input',input);
 consent.onchange=detail.onchange=()=>{revoke();};cancel.onclick=()=>{revoke();status.textContent='Comparison cancelled. Your photo is ready for manual review.';};
 check.onclick=async()=>{
  if(!supported||pending||!scopeLive()||!consent.checked||!detail.checked){status.textContent='Check both declarations for this signed owner and isolated garment first.';return;}
  revoke();const ticket=++epoch;controller=new AbortController();const signal=controller.signal;pending=true;check.disabled=true;cancel.hidden=false;status.textContent='Checking the current photo…';
  // P869: async photo-fill can change draft fields without dispatching a form input event.
  // Bind this comparison to exactly the owner-visible category/type/color revision.
  const draftAtStart=getDraftRevision(),sameDraft=()=>getDraftRevision()===draftAtStart;
  try{
   const scope={ownerId,sessionId,live:scopeLive},before=await evidence80(item,scope);
   if(before.segmented)throw Error('Segmented garments need the existing manual grouping review');
   const requestData={schema:VERSION82,requestId:crypto.randomUUID(),enabled:true,consent:true,detailVisible:true,evidence:before,binding:bind82(before),original:item.originalPhoto?.image||item.recognitionPhoto?.image||item.image,image:item.recognitionPhoto?.image||item.image,sourceCodeSha256:await codeHash82()};
   if(!scopeLive()||ticket!==epoch||signal.aborted||!sameDraft())throw Error('P82_REVOKED');
   const output=await request(requestData,{signal,onProgress:text=>{if(scopeLive()&&ticket===epoch)status.textContent=text+'… Your photo remains unsaved.';}});
   const current=await evidence80(item,scope);
   if(!scopeLive()||ticket!==epoch||signal.aborted||!sameDraft()||!binding80(before,current)||!consent.checked||!detail.checked)throw Error('P82_REVOKED');
   const decision=validateResponse82(output,requestData); // never trust an externally supplied decision/status
   if(decision.reasons.includes('nonclothing_evidence')){status.textContent='At least one model sees non-clothing. No clothing suggestions were applied. Keep the original and use manual Adjust.';return;}
   // P873: an exact equal top score is not an identified subtype. Even two
   // families choosing the same lexicographic tie winner cannot break it.
   if(decision.reasons.includes('top_rank_tied')){status.textContent='A model cannot distinguish its top clothing labels. No two-model suggestion can be applied; use manual Adjust and retain Unknown until you confirm the photo.';return;}
   status.textContent=decision.status==='abstain'?'The models disagree or cannot identify this garment. Unknown is retained; compare the alternatives with your original.':'The models suggest these possibilities. Agreement does not establish that a subtype is correct.';
   const ack=el('input');ack.type='checkbox';const label=el('label');label.append(ack,document.createTextNode(' I compared the original photo and want to apply this possibility to my unsaved draft.'));results.append(label);
   let used=false;
   for(const h of decision.hypotheses.filter(x=>x.category!=='Uncategorized')){
    const choose=el('button','Use '+h.itemType+' · '+h.category);choose.type='button';
    choose.onclick=async()=>{
     if(used||!ack.checked||!consent.checked||!detail.checked||!scopeLive()||ticket!==epoch)return;
     if(!sameDraft()){invalidated();return;}
     used=true;choose.disabled=true;
     try{
      const fresh=await evidence80(item,scope);
      if(!scopeLive()||ticket!==epoch||!sameDraft()||!binding80(before,fresh)||!ack.checked||Date.now()-output.createdAt>60000)throw Error('P82_REVOKED');
      if(onChoose({category:h.category,itemType:h.itemType})!==true)throw Error('P82_CHOICE_NOT_APPLIED');
      revoke();status.textContent='Your unsaved draft was updated. Check category and color, then confirm the normal photo review before saving.';
     }catch{revoke();status.textContent='No suggestion applied. Request a fresh check or adjust manually.';}
    };results.append(choose);
   }
  }catch{if(ticket===epoch){results.replaceChildren();status.textContent='Comparison unavailable, cancelled, or photo evidence changed. Keep the original and use manual Adjust. No suggestion was applied.';}}
  finally{if(ticket===epoch){pending=false;check.disabled=false;cancel.hidden=true;controller=null;}}
 };
 if(!supported){consent.disabled=detail.disabled=check.disabled=true;status.textContent='Two-model research is not ready in this browser. Keep the original and use manual Adjust.';}
 return {valid,invalidate(){if(active)invalidated();},close(){active=false;revoke();form.removeEventListener('input',input);panel.remove();}};
}
