import {evaluateOutfit} from './policy.mjs';
const same=(a,b)=>a?.ownerId===b?.ownerId&&a?.sessionId===b?.sessionId&&!!a?.ownerId&&!!a?.sessionId;
const hash=async bytes=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
export function createPhotoBoard(root,{getContext,sessionTarget=window}={}){
 if(!root||typeof getContext!=='function')throw Error('Context is required');let urls=[],serial=0,stopped=false;
 const clear=()=>{serial++;root.replaceChildren();for(const u of urls)URL.revokeObjectURL(u);urls=[];};
 const stop=()=>{stopped=true;clear();};sessionTarget.addEventListener('closet:alpha-session-changed',stop);sessionTarget.addEventListener('pagehide',stop);
 async function show(items){
  clear();const token=serial,context=getContext();const active=()=>!stopped&&token===serial&&same(context,getContext());
  const result=await evaluateOutfit({items,context,getContext,digest:hash});if(!active())return {mode:'REVIEW REQUIRED',reason:'Session changed.'};
  if(result.mode!=='PHOTO PREVIEW'){root.textContent=result.reason;return result;}
  const next=[],images=[];
  try{
   // Decode before showing anything. Never leave stale/private images on screen.
   for(const item of items){const u=URL.createObjectURL(item.original);next.push(u);const im=new Image();im.src=u;await im.decode();if(!active())throw Error('stale');images.push(im);}
   if(!active())throw Error('stale');
   const wrap=document.createElement('section');wrap.className='work42-board';const title=document.createElement('h3');title.textContent='Outfit combination';const desc=document.createElement('p');desc.textContent='Your clothing photos shown together. This is not a virtual try-on.';const grid=document.createElement('div');grid.className='work42-grid';
   items.forEach((item,i)=>{const fig=document.createElement('figure');const cap=document.createElement('figcaption');cap.textContent=String(item.label||'Clothing').slice(0,80);images[i].alt=cap.textContent;fig.append(images[i],cap);grid.append(fig);});wrap.append(title,desc,grid);root.replaceChildren(wrap);urls=next;return result;
  }catch{for(const u of next)URL.revokeObjectURL(u);if(active())root.textContent='Photo could not be opened. Review the original.';return {mode:'REVIEW REQUIRED',reason:'Photo could not be opened or session changed.'};}
 }
 function dispose(){stop();sessionTarget.removeEventListener('closet:alpha-session-changed',stop);sessionTarget.removeEventListener('pagehide',stop);}
 return {show,clear,dispose};
}
