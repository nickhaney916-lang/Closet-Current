import {fingerprintAlphaRetainedOriginal,fingerprintAlphaReviewContext,identityForSavedGarment} from '../../public/family-alpha-2d-saved-board.mjs';
import {planFit,paintFit,clearOnScopeChange} from './fit.mjs';
const active=new WeakMap();
// Adapter preserves existing approved-photo identity and live account contracts.
// Matching local hashes do NOT establish Auth/RLS. Caller owns upstream authorization.
export async function renderApprovedFit(container,{item,presentation,annotation,getContext,getItem=()=>item,document=globalThis.document,cryptoProvider=globalThis.crypto,signal,sessionTarget=globalThis.window}){
 const token={};active.set(container,token);container.replaceChildren();
 const ctx=getContext(),owner=ctx?.authenticatedUserId;
 const scope=()=>{const c=getContext();return active.get(container)===token&&!signal?.aborted&&c&&c.authenticatedUserId===owner&&c.currentUserId===owner&&c.cloudOwnerId===owner&&c.indexedDbName==='closet-current-user-'+owner&&c.sessionGeneration===ctx.sessionGeneration&&getItem()===item;};
 const reject=()=>{if(active.get(container)===token)container.replaceChildren();throw Error('Unapproved, stale or foreign fitting source');};
 if(!owner||!Number.isSafeInteger(ctx.sessionGeneration)||!scope()||!item||!presentation||presentation.itemId!==item.id||presentation.ownerId!==owner||item.ownerId&&item.ownerId!==owner||!presentation.approved||!presentation.humanPreviewConfirmed||!presentation.sourcePixelAuditPassed||presentation.sourceIdentity!==identityForSavedGarment(item))return reject();
 const original=item.originalPhoto?.image||item.image,identity=presentation.sourceIdentity;
 const version=await fingerprintAlphaRetainedOriginal(original,cryptoProvider),review=await fingerprintAlphaReviewContext(item,cryptoProvider);
 if(!scope()||version!==presentation.sourceVersion||review!==(presentation.reviewContextVersion??null))return reject();
 const image=presentation.image;
 if(!image?.complete||!image.naturalWidth||!/^data:image\/png;base64,/.test(image.src)||image.naturalWidth*image.naturalHeight>4_000_000)return reject();
 const digest=async text=>Array.from(new Uint8Array(await cryptoProvider.subtle.digest('SHA-256',new TextEncoder().encode(text))),n=>n.toString(16).padStart(2,'0')).join('');
 const src=image.src,pngHash=await digest(src);
 if(!scope()||annotation?.itemId!==item.id||annotation.sourceVersion!==version||annotation.sourceIdentity!==identity||annotation.pngHash!==pngHash||annotation.ownerId!==owner||!annotation.reviewed)return reject();
 const plan=planFit({width:image.naturalWidth,height:image.naturalHeight,...annotation.fit,anchors:{...annotation.fit?.anchors,reviewed:true}});
 if(plan.status!=='preview-only')return {plan,displayed:false}; // Caller retains separately approved original preview.
 const canvas=document.createElement('canvas');canvas.width=360;canvas.height=600;
 paintFit(canvas,image,plan);
 if(!scope()||image.src!==src||identityForSavedGarment(item)!==identity||await fingerprintAlphaRetainedOriginal(item.originalPhoto?.image||item.image,cryptoProvider)!==version||await fingerprintAlphaReviewContext(item,cryptoProvider)!==review)return reject();
 if(!scope())return reject();container.replaceChildren(canvas);
 const clearIfStale=()=>active.get(container)===token&&clearOnScopeChange(container,()=>scope()?{ownerId:owner,sessionGeneration:ctx.sessionGeneration}:null,{ownerId:owner,sessionGeneration:ctx.sessionGeneration});
 const clear=()=>{if(active.get(container)===token){container.replaceChildren();active.delete(container);}dispose();};
 const dispose=()=>{sessionTarget?.removeEventListener('closet:alpha-session-changed',clear);signal?.removeEventListener('abort',clear);};
 sessionTarget?.addEventListener('closet:alpha-session-changed',clear,{once:true});signal?.addEventListener('abort',clear,{once:true});
 return {plan,displayed:true,sourceUnchanged:image.src===src,clearIfStale,dispose};
}
