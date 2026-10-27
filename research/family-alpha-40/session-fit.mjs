/**
 * Family Alpha: in-memory alignment adjustments for one authorized session,
 * source JPEG and reviewed cutout. NO persistence, cloud or photo copies.
 *
 * This is state retention for the existing rigid controls, NOT body draping.
 * The parent still requires trusted approved PNG and original JPEG audits.
 */
import {mountManualGarmentAlignment} from '../family-alpha-36/manual-fit.mjs';
const SLOTS=new Set(['top','bottom','dress','layer','layer2','layer3']);
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const HEX=/^[0-9a-f]{64}$/;
export const MAX_ADJUSTMENTS=24;
function currentScope(readContext){
 const s=readContext?.(),owner=s?.authenticatedUserId;
 if(!UUID.test(owner||'')||s.currentUserId!==owner||s.cloudOwnerId!==owner||
  s.indexedDbName!=='closet-current-user-'+owner||
  !Number.isSafeInteger(s.sessionGeneration)||s.sessionGeneration<0)
  throw Error('Current private authenticated wardrobe session required');
 return {owner,epoch:s.sessionGeneration};
}
function scopeId(v){return v.owner+':'+v.epoch;}
export function createFitSessionStore(){
 const values=new Map();
 let ownerSession=null;
 function clear(){values.clear();ownerSession=null;}
 function requireOwner(ctx){
  if(!ctx||!UUID.test(ctx.owner||'')||!Number.isSafeInteger(ctx.epoch))
   throw Error('Malformed signed-in session');
  const key=scopeId(ctx);
  if(ownerSession!==null&&key!==ownerSession)clear();
  ownerSession=key;
 }
 function keyFor({owner,epoch,slot,itemId,sha}){
  if(!SLOTS.has(slot)||!UUID.test(owner||'')||
   !Number.isSafeInteger(epoch)||epoch<0||
   typeof itemId!=='string'||!(/^[a-z0-9:_-]{1,160}$/i.test(itemId))||
   !HEX.test(sha||''))
   throw Error('Unverified garment, image or account fit identity');
  return [owner,epoch,slot,itemId,sha].join('|');
 }
 const valid=e=>e&&['dx','dy','scale'].every(k=>typeof e[k]==='number'&&Number.isFinite(e[k]))&&
  Math.abs(e.dx)<=.09+1e-8&&Math.abs(e.dy)<=.10+1e-8&&e.scale>=.78-1e-8&&e.scale<=1.22+1e-8;
 function put(ref,edit){
  requireOwner(ref);
  const key=keyFor(ref);
  if(!valid(edit))throw Error('Impossible manual fit adjustment');
  if(values.has(key))values.delete(key);
  values.set(key,Object.freeze({dx:edit.dx,dy:edit.dy,scale:edit.scale}));
  while(values.size>MAX_ADJUSTMENTS)values.delete(values.keys().next().value);
  return values.size;
 }
 function get(ref){
  requireOwner(ref);
  const key=keyFor(ref);
  const value=values.get(key);
  return value?{...value}:null;
 }
 return Object.freeze({put,get,clear,size:()=>values.size});
}
const digest=async (src,cryptoProvider)=>{
 if(typeof src!=='string'||!src.startsWith('data:image/png;base64,')||
  src.length>16_000_000||!cryptoProvider?.subtle?.digest)
  throw Error('Unverified decoded PNG for fit review');
 const bytes=new TextEncoder().encode(src);
 const hash=new Uint8Array(await cryptoProvider.subtle.digest('SHA-256',bytes));
 return [...hash].map(b=>b.toString(16).padStart(2,'0')).join('');
};
export function createSessionScopedFit({
 readContext,cryptoProvider=globalThis.crypto,sessionTarget=globalThis.window
}={}){
 if(typeof readContext!=='function')throw Error('Live account context getter required');
 const store=createFitSessionStore();
 let stopped=false;
 function clear(){store.clear();}
 function stop(){
  if(stopped)return;
  stopped=true;clear();
  sessionTarget?.removeEventListener?.('closet:alpha-session-changed',stop);
  sessionTarget?.removeEventListener?.('pagehide',stop);
 }
 sessionTarget?.addEventListener?.('closet:alpha-session-changed',stop,{once:true});
 sessionTarget?.addEventListener?.('pagehide',stop,{once:true});
 async function mount({container,board,guard}={}){
  if(stopped||!container||typeof guard!=='function')throw Error('Disposed fit preview');
  const start=currentScope(readContext);
  guard();
  const frame=container.querySelector('.family-alpha-avatar');
  if(!frame)throw Error('Reviewed human figure missing');
  const refs=new Map(),initial={};
  const nodes=[...frame.querySelectorAll('img[data-slot]')];
  for(const img of nodes){
   const slot=img.dataset.slot;
   if(!SLOTS.has(slot)||img.dataset.displayMode==='footwear-photo-reference')continue;
   const itemId=slot==='dress'?board?.slots?.top:board?.slots?.[slot];
   if(!itemId||!img.complete||img.naturalWidth===0)
    throw Error('No verified matching garment photo to align');
   const src=img.currentSrc||img.src;
   const sha=await digest(src,cryptoProvider);
   guard();
   const now=currentScope(readContext);
   if(now.owner!==start.owner||now.epoch!==start.epoch)
    throw Error('Session changed during alignment verification');
   const ref={...start,slot,itemId,sha};
   refs.set(slot,{ref,img,src});
   const edit=store.get(ref);
   if(edit)initial[slot]=edit;
  }
  guard();
  const handle=mountManualGarmentAlignment(container,{
   isActive:()=>{
    if(stopped)return false;
    try{guard();const now=currentScope(readContext);
     return now.owner===start.owner&&now.epoch===start.epoch;
    }catch{clear();return false;}
   },
   sessionTarget,initialAdjustments:initial,
   onAdjustment({slot,edit}){
    const binding=refs.get(slot);
    if(!binding||binding.img.src!==binding.src||
     !container.contains(frame)||stopped)return;
    try{
     guard();const now=currentScope(readContext);
     if(now.owner!==start.owner||now.epoch!==start.epoch){clear();return;}
     store.put(binding.ref,edit);
    }catch{clear();}
   }
  });
  return {mounted:handle.mounted,dispose:handle.dispose,restoredSlots:Object.keys(initial).length};
 }
 return Object.freeze({mount,clear,stop,metrics:()=>({entries:store.size(),stopped})});
}
