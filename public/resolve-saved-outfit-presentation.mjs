import {classifySavedOutfitFor3D} from './saved-outfit-3d-compatibility.mjs';
import {restoreVerifiedCapturedOutfitBoard} from './restore-verified-captured-outfit-board.mjs';

/**
 * Offline restoration router. Legacy records remain 2D; invalid verified records
 * never silently downgrade to legacy to conceal a provenance failure.
 */
export async function resolveSavedOutfitPresentation(record,items,accountId,verifyOwnership,cryptoProvider=globalThis.crypto){
 if(typeof accountId!=='string'||!accountId.trim()||typeof verifyOwnership!=='function')return {mode:'unavailable',reason:'Authenticated account and ownership verifier required'};
 const classified=classifySavedOutfitFor3D(record);
 if(classified.mode==='legacy-2d')return {mode:'2d',board:classified.board,reason:classified.reason};
 if(classified.mode!=='verify-3d')return {mode:'unavailable',reason:classified.reason};
 if(typeof accountId!=='string'||!accountId.trim()||classified.snapshot.accountId!==accountId)return {mode:'unavailable',reason:'Saved outfit account scope mismatch'};
 try{
  const verified=await restoreVerifiedCapturedOutfitBoard(classified.snapshot,classified.board,items,accountId,verifyOwnership,cryptoProvider);
  return {mode:'3d-placeholder',board:classified.board,verified};
 }catch(error){
  if(/ownership|Foreign wardrobe item|account scope/i.test(String(error?.message||error)))return {mode:'unavailable',reason:'Outfit ownership verification failed'};
  return {mode:'2d',board:classified.board,reason:'Verified 3D source unavailable; use existing 2D outfit',verificationFailed:true};
 }
}
