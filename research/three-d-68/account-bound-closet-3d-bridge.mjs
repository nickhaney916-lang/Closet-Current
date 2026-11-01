/** 3D68: read-only integration entrypoint for Closet Current's existing
 * window.closetAuth.ready / .user.id / .getSessionGeneration() and the
 * already authenticated IndexedDB readAll() caller. No network, storage or
 * production app edits. Never infer account ownership from item metadata.
 */
import {indexAuthenticatedSavedCloset,planIndexedBoardToAnatomical3D,previewExistingThreeSuggestions,swapRealBoardGarment} from './saved-closet-3d-adapter.mjs';
export function createAccountBoundCloset3DBridge({auth,readSavedItems}={}){
 if(!auth?.ready||typeof auth.getSessionGeneration!=='function'||
    typeof readSavedItems!=='function')throw Error('Existing authenticated closet access and local readAll required');
 function current(){
  const id=auth.user?.id,generation=auth.getSessionGeneration();
  if(typeof id!=='string'||!id||!Number.isSafeInteger(generation)||generation<0)
   throw Error('Sign in before reading 3D wardrobe; no stale owner view');
  return {ownerId:id,generation,authenticated:true};
 }
 async function loadIndex(){
  await auth.ready;
  const session=current();
  const items=await readSavedItems();
  const latest=current();
  if(session.ownerId!==latest.ownerId||session.generation!==latest.generation)
   throw Error('Wardrobe account changed while reading original saved clothes');
  const snapshot={authenticated:true,ownerId:session.ownerId,generation:session.generation,
   origin:'authenticated-account-scoped-closet-read',items};
  const indexed=await indexAuthenticatedSavedCloset(snapshot,session,{getCurrentSession:current});
  const final=current();
  if(final.ownerId!==session.ownerId||final.generation!==session.generation)
   throw Error('Wardrobe account switched during local JPEG fingerprinting');
  return Object.freeze({
   ownerId:session.ownerId,generation:session.generation,
   indexed,
   // Defers all outfit commands until session freshness is checked AGAIN.
   planExistingBoard(board){const now=current();if(now.ownerId!==session.ownerId||now.generation!==session.generation)throw Error('3D outfit invalidated by account switch');return planIndexedBoardToAnatomical3D(board,indexed);},
   planThreeOwnedLooks(boards){const now=current();if(now.ownerId!==session.ownerId||now.generation!==session.generation)throw Error('3D suggestions invalidated by account switch');return previewExistingThreeSuggestions(boards,indexed);},
   swapExistingPiece(board,request){const now=current();if(now.ownerId!==session.ownerId||now.generation!==session.generation)throw Error('3D item swap invalidated by account switch');return swapRealBoardGarment(board,indexed,request);},
   releaseAuthorized:false,originalImageDataExposed:false
  });
 }
 return Object.freeze({loadIndex,productionConnected:false,credentialsAccessed:false,
  accountIsolationDependsOnExistingAuthenticatedReadAll:true});
}
