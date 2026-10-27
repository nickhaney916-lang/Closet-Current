/** Work #46 source-backed PHOTO PREVIEW integration patch (offline HOLD).
 * No user-provided owner, photo hash, image Blob or visual approval trusted.
 * Existing authenticated verification, private DB and wardrobe guards are
 * borrowed from the SOURCE PINNED Work #43 app; no new auth is invented.
 */
import {createPhotoBoard} from './board.mjs';
import {createTrustedOutfitPhotoSourceBoundary}
 from './trusted-photo-source-boundary.mjs';
export async function renderVerifiedBoard({
 look,container,guard,readContext,getDatabase,verifySession,register,
 cryptoProvider=globalThis.crypto
}={}){
 if(typeof guard!=='function'||typeof register!=='function')
  throw Error('Protected wardrobe preview unavailable');
 guard();
 const trusted=createTrustedOutfitPhotoSourceBoundary({
  readContext,getDatabase,verifySession,cryptoProvider
 });
 const source=await trusted.resolveBoard(look?.board);
 guard();
 const board=createPhotoBoard(container,{getContext:()=>{
  try{guard();return source.getContext();}
  catch{return null;}
 }});
 register(board);
 try{
  const decision=await board.show(source.items);
  guard();
  if(decision.mode!=='PHOTO PREVIEW')
   throw Error('Original garment photo requires review');
  return decision;
 }catch(error){
  board.clear();
  throw error;
 }
}
