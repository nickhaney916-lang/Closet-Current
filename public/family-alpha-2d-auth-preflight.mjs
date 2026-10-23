import {renderSavedBoard2D,invalidateSavedBoard2D} from './family-alpha-2d-saved-board.mjs';

/**
 * RESEARCH ONLY: proof-of-concept authenticated entry boundary for saved 2D
 * outfit rendering. The app is NOT wired to this module.
 *
 * Real security is Supabase Auth, RLS and private bucket policies, which
 * require independent deployed staging verification. Caller callbacks remain
 * trusted dependencies; client checks are defense in depth, not RLS proof.
 */
const SUPABASE_AUTH_USER='https://hlkgymugtfbirlpunsra.supabase.co/auth/v1/user';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const renders=new WeakMap();
const authError=()=>new Error('Family Alpha account verification failed');
const safeId=id=>typeof id==='string'&&UUID.test(id);

function currentSession({auth,database,getCloudOwnerId,getSessionGeneration}){
 const id=auth?.user?.id;
 const generation=getSessionGeneration?.();
 const cloud=getCloudOwnerId?.();
 const dbName=database?.name;
 if(!safeId(id)||!Number.isSafeInteger(generation)||generation<0||
    typeof auth.getAccessToken!=='function'||
    dbName!=='closet-current-user-'+id||cloud!==id)
  throw authError();
 return Object.freeze({ownerId:id,sessionGeneration:generation,indexedDbName:dbName});
}
function requireUnchanged(options,start){
 const now=currentSession(options);
 if(now.ownerId!==start.ownerId||
    now.sessionGeneration!==start.sessionGeneration||
    now.indexedDbName!==start.indexedDbName)
  throw new Error('Family Alpha account changed during verification');
 return now;
}

/**
 * Performs the same GET /auth/v1/user identity check as the real auth.js
 * email-link callback, without accepting unsigned JWT fields or app UI labels.
 * No token appears in returned values, diagnostics, or console output.
 */
export async function verifyAlphaAuthUser(options){
 const {auth,fetchFn,publicKey}=options||{};
 if(typeof fetchFn!=='function'||typeof publicKey!=='string'||!publicKey)
  throw new Error('Auth verifier unavailable');
 const start=currentSession(options);
 let token;
 try{token=await auth.getAccessToken({force:false});}
 catch{throw authError();}
 requireUnchanged(options,start);
 if(typeof token!=='string'||!token.trim())throw authError();
 let response,identity;
 try{
  response=await fetchFn(SUPABASE_AUTH_USER,{
   method:'GET',cache:'no-store',redirect:'error',
   headers:{apikey:publicKey,Authorization:'Bearer '+token}
  });
  if(!response?.ok||response.status!==200)throw authError();
  identity=await response.json();
 }catch{throw authError();}
 requireUnchanged(options,start);
 if(!identity||Array.isArray(identity)||!safeId(identity.id)||identity.id!==start.ownerId)
  throw authError();
 return Object.freeze({ownerId:start.ownerId,sessionGeneration:start.sessionGeneration,
  indexedDbName:start.indexedDbName,serverChecked:true,upstreamRlsUnverified:true});
}
function contextCallback(options){
 return ()=>{
  const now=currentSession(options);
  return {authenticatedUserId:now.ownerId,currentUserId:now.ownerId,
   cloudOwnerId:options.getCloudOwnerId(),indexedDbName:now.indexedDbName,
   sessionGeneration:now.sessionGeneration};
 };
}
/**
 * Isolated orchestration of Auth preflight -> owner-labeled local read ->
 * source-bound 2D render. Inputs use actual app contracts:
 *   auth = window.closetAuth; database = IndexedDB handle
 *   loadScopedWardrobe({ownerId,indexedDbName,database}) => {ownerId,indexedDbName,board,items}
 *   preparePresentations({ownerId,board,items}) => {itemId: {sourceIdentity,sourceVersion,approved,image,...}}
 *
 * A source-preparation callback MUST itself verify decoded JPEG -> garment mask
 * correspondence. Never use an arbitrary {approved:true} to claim provenance.
 */
export async function renderAlphaAuthenticatedBoard(container,options={}){
 if(!container||typeof container.replaceChildren!=='function')
  throw new TypeError('Avatar container required');
 const sequence=(renders.get(container)||0)+1;
 renders.set(container,sequence);
 // Also cancel the inner source-SHA renderer NOW. Otherwise an earlier
 // authenticated request could commit stale pixels while this newer request
 // is still waiting on Auth and owner-scoped wardrobe data.
 invalidateSavedBoard2D(container);
 const assertCurrent=verified=>{
  if(renders.get(container)!==sequence)throw new Error('Superseded avatar verification');
  const current=requireUnchanged(options,verified);
  if(!verified.serverChecked||current.ownerId!==verified.ownerId)
   throw authError();
 };
 try{
  if(typeof options.loadScopedWardrobe!=='function'||
     typeof options.preparePresentations!=='function')
   throw new Error('Wardrobe and garment source providers required');
  const verified=await verifyAlphaAuthUser(options);
  assertCurrent(verified);
  const data=await options.loadScopedWardrobe({
   ownerId:verified.ownerId,indexedDbName:verified.indexedDbName,database:options.database
  });
  assertCurrent(verified);
  if(!data||data.ownerId!==verified.ownerId||
     data.indexedDbName!==verified.indexedDbName||
     !data.board||!Array.isArray(data.items))
   throw new Error('Saved wardrobe belongs to a different or unavailable account');
  const presentations=await options.preparePresentations({
   ownerId:verified.ownerId,board:data.board,items:data.items
  });
  assertCurrent(verified);
  const result=await renderSavedBoard2D(container,{
   board:data.board,items:data.items,presentations,
   getContext:contextCallback(options),
   cryptoProvider:options.cryptoProvider
  });
  assertCurrent(verified);
  return Object.freeze({renderedLayers:result.renderedLayers,ownerId:verified.ownerId,
   sourceHashes:result.sourceHashes,serverAuthChecked:true,
   upstreamRlsUnverified:true,sourceMaskProofPending:true});
 }catch(error){
  // Don't erase a later/current account's render when this earlier request fails.
  if(renders.get(container)===sequence)container.replaceChildren();
  throw error;
 }
}
