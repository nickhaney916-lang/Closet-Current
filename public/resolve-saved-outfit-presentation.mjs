import {classifySavedOutfitFor3D} from './saved-outfit-3d-compatibility.mjs';
import {restoreVerifiedCapturedOutfitBoard} from './restore-verified-captured-outfit-board.mjs';

/**
 * Offline restoration router. Legacy records remain 2D; invalid verified records
 * never silently downgrade to legacy to conceal a provenance failure.
 */
export async function resolveSavedOutfitPresentation(record,items,accountId,verifyOwnership,cryptoProvider=globalThis.crypto){
 if(typeof accountId!=='string'||!accountId.trim()||typeof verifyOwnership!=='function')return {mode:'unavailable',reason:'Authenticated account and ownership verifier required'};
 const classified=classifySavedOutfitFor3D(record);
 if(classified.mode==='legacy-2d'){
  if(!Array.isArray(items))return {mode:'unavailable',reason:'Account-scoped wardrobe unavailable'};
  const selected=Object.values(classified.board.slots).filter(id=>id!==null&&id!==undefined&&id!=='');
  if(!selected.length||!selected.every(id=>typeof id==='string'&&id.trim())||new Set(selected).size!==selected.length)return {mode:'unavailable',reason:'Invalid legacy garment selection'};
  const byId=new Map();
  for(const item of items){
   if(!item||typeof item.id!=='string'||!item.id.trim()||byId.has(item.id))return {mode:'unavailable',reason:'Ambiguous account-scoped wardrobe'};
   byId.set(item.id,item);
  }
  for(const id of selected){
   const item=byId.get(id);
   if(!item)return {mode:'unavailable',reason:'Legacy garment unavailable'};
   try{if(await verifyOwnership(item,accountId)!==true)return {mode:'unavailable',reason:'Legacy garment ownership unverified'};}
   catch{return {mode:'unavailable',reason:'Legacy garment ownership unverified'};}
  }
  return {mode:'2d',board:classified.board,reason:classified.reason};
 }
 if(classified.mode!=='verify-3d')return {mode:'unavailable',reason:classified.reason};
 if(typeof accountId!=='string'||!accountId.trim()||classified.snapshot.accountId!==accountId)return {mode:'unavailable',reason:'Saved outfit account scope mismatch'};
 try{
  const verified=await restoreVerifiedCapturedOutfitBoard(classified.snapshot,classified.board,items,accountId,verifyOwnership,cryptoProvider);
  return {mode:'3d-placeholder',board:classified.board,verified};
 }catch(error){
  if(/ownership|Foreign wardrobe item|account scope/i.test(String(error?.message||error)))return {mode:'unavailable',reason:'Outfit ownership verification failed'};
  // A 2D fallback may only use garments that still exist and pass ownership checks.
  if(!Array.isArray(items))return {mode:'unavailable',reason:'Account-scoped wardrobe unavailable'};
  const ids=Object.values(classified.board.slots).filter(id=>id!==null&&id!==undefined&&id!=='');
  const byId=new Map();
  for(const item of items){
   if(!item||typeof item.id!=='string'||!item.id.trim()||byId.has(item.id))return {mode:'unavailable',reason:'Ambiguous account-scoped wardrobe'};
   byId.set(item.id,item);
  }
  if(!ids.length||new Set(ids).size!==ids.length)return {mode:'unavailable',reason:'Invalid saved outfit garment selection'};
  for(const id of ids){
   if(typeof id!=='string'||!id.trim()||!byId.has(id))return {mode:'unavailable',reason:'Saved outfit garment unavailable'};
   try{if(await verifyOwnership(byId.get(id),accountId)!==true)return {mode:'unavailable',reason:'Saved outfit ownership unverified'};}
   catch{return {mode:'unavailable',reason:'Saved outfit ownership unverified'};}
  }
  return {mode:'2d',board:classified.board,reason:'Verified 3D source unavailable; use existing 2D outfit',verificationFailed:true};
 }
}
