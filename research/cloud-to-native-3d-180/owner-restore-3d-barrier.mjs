/**
 * Closet Current main #180 — owner-reviewed private cloud → native saved
 * outfit 163-bone 3D consistency barrier. Opt-in loopback research only.
 *
 * Defect fixed: P146 P137/P129 atomic cloud restore originally passed an
 * empty onRestored callback. P126 restored the ORIGINAL+cutout JPEGs into
 * IndexedDB, but P550's native board closure still contained the old
 * saved outfit/garment photo until a reload. Its 163-bone viewer could then
 * refer to stale objects, even though the private DB had new content.
 *
 * Two-phase: reject actual destructive owner restore while an unsaved edit,
 * existing WebGL viewer, stale source, or foreign owner is present; hold an
 * explicit restore lease through the consent dialog; reload the REAL native
 * owner board and SHA-re-attest recovered outfit originals after P126 atomic
 * restore completed. Never force-discard an unsaved draft or overwrite cloud.
 *
 * This does not turn synthetic HTTP auth into live Supabase Auth/RLS or
 * claim arbitrary clothes are 3D-ready.
 */
export const CLOUD_3D_180=Object.freeze({
 researchOnly:true,ownerReviewedP146Restore:true,
 originalAndCropP177P178Required:true,atomicPrivateRestoreP126:true,
 existingNativeSavedOutfitP550:true,
 oldSource3DSceneCannotSurviveReplacement:true,
 requireFreshOriginalJPEGBytesAfterRestore:true,
 hostedSignedJWTVerified:false,productionAuthorized:false,familyAlpha:'HOLD'
});
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[0-9a-f]{12}$/i;
const safeHosts=new Set(['127.0.0.1','localhost','[::1]']);
const fail=(reason)=>{throw Error('P180 '+reason);};
export function researchMode180(loc=globalThis.location){
 if(!loc||loc.protocol!=='http:'||!safeHosts.has(loc.hostname))return false;
 const q=new URLSearchParams(loc.search);
 return ['ownerReview145','ownerReview146','ownerCutout178','nativeLossless04',
  'native3D05','cloud3D180'].every(k=>q.get(k)==='research');
}
export function createCloudToNative3D180({
 auth,db,board,viewer,loc=globalThis.location,win=globalThis.window
}={}){
 if(!researchMode180(loc))fail('all six isolated native cloud-to-3D flags required');
 const owner=auth?.user?.id;
 if(!UUID.test(owner||'')||db?.name!=='closet-current-user-'+owner||
   typeof auth?.getAccessToken!=='function'||
   typeof board?.status!=='function'||typeof board?.load!=='function'||
   typeof board?.readOnlySnapshot!=='function'||
   typeof board?.attestOriginalPhotoBytes92!=='function'||
   typeof board?.readOnlyGarmentSources91!=='function'||
   typeof board?.readOnlyWardrobeRevision93!=='function'||
   typeof viewer?.state!=='function'||typeof viewer?.close!=='function'||
   typeof win?.addEventListener!=='function')
   fail('existing native original-photo board and WebGL viewer required');
 let revoked=false,working=false,restores=0,sourceProofs=0,reloaded=0;
 // P182: after P126 writes IndexedDB, failure of read-back/byte SHA is NOT
 // rollback. Quarantine 3D until native owner source integrity is re-attested.
 let postCommitUnverified=false,postCommitWrites=0,postCommitFailures=0,rechecks=0;
 let token=null,generation=0,initialFingerprint=null;
 function requireOwner(){
  if(revoked)fail('owner restore bridge revoked');
  if(auth.user?.id!==owner||db.name!=='closet-current-user-'+owner)
   fail('owner or signed-in database changed');
  auth.assertCurrent?.();
  const s=board.status();
  if(!s?.active)fail('native owner saved-outfit board inactive');
  if(s.dirty)fail('unsaved outfit must be saved or canceled before restore');
  const v=viewer.state();
  if(v?.active||v?.modelReady)fail('close active anatomical 3D before replacing saved originals');
  return s;
 }
 function snapshot(){
  requireOwner();
  const saved=board.readOnlySnapshot().saved;
  if(!Array.isArray(saved)||saved.length>50)fail('owner native board state invalid');
  return saved.map(x=>Object.freeze({
   id:x.id||x.outfit3dId||'',
   slots:structuredClone(x.slots||{})
  }));
 }
 function begin({recovery=false}={}){
  if(postCommitUnverified&&!recovery)
   fail('prior restore already wrote private storage; retry photo verification before a new restore');
  if(working)fail('concurrent destructive restore lease refused');
  const s=requireOwner();
  token=Object.freeze({owner,generation:++generation,selected:s.selected,
   savedCount:s.savedCount,oldSaved:snapshot()});
  initialFingerprint=JSON.stringify(token.oldSaved);
  working=true;return token;
 }
 function check(lease){
  if(!working||token!==lease||lease?.owner!==owner||
     lease.generation!==generation)
   fail('obsolete owner cloud restore lease');
  return requireOwner();
 }
 async function consent(lease,decision){
  check(lease);
  if(typeof decision!=='function')fail('actual owner consent function required');
  const accepted=await decision();
  check(lease);
  if(accepted!==true)return false;
  if(JSON.stringify(snapshot())!==initialFingerprint)
   fail('saved outfit or photo source changed while consent was pending');
  return true;
 }
 function markAtomicCommitted(lease){
  if(!working||token!==lease)fail('invalid post-commit owner lease');
  // P129 calls onRestored ONLY after P126 atomic IndexedDB commit. Mark
  // before any additional async session read or SHA check can reject.
  postCommitUnverified=true;
  postCommitWrites++;
  check(lease);
 }
 function notePostCommitFailure(lease){
  if(token!==lease||!postCommitUnverified)return false;
  postCommitFailures++;
  return true;
 }
 async function afterAtomicRestore(lease,{recovery=false}={}){
  if(!recovery)postCommitUnverified=true;
  else if(!postCommitUnverified)fail('no incomplete post-commit verification to retry');
  check(lease);
  // P126 has already verified SHA/owner and completed its IndexedDB atomic
  // write; reload is a read-only reconciliation, never a second restore.
  const adopted=await board.load({discard:false});
  if(adopted?.loaded!==true)fail('restored private wardrobe not read by native board');
  reloaded++;
  check(lease);
  const saved=board.readOnlySnapshot().saved||[];
  if(!Array.isArray(saved)||saved.length>50)
   fail('restored private saved outfit collection invalid');
  // P181: an asynchronous original-JPEG digest must not span a second
  // wardrobe refresh, owner change, or saved-slot edit. Only the REAL NATIVE91
  // source receipt, not a method's mere non-throwing result, grants proof.
  const revision=board.readOnlyWardrobeRevision93();
  if(revision?.ownerId!==owner||!Number.isSafeInteger(revision.revision)||
     !Number.isSafeInteger(revision.generation))
   fail('restored private wardrobe revision unavailable');
  const savedFingerprint=JSON.stringify(saved);
  function assertUnchanged181(){
   check(lease);
   if(JSON.stringify(board.readOnlyWardrobeRevision93())!==JSON.stringify(revision)||
      JSON.stringify(board.readOnlySnapshot().saved)!==savedFingerprint)
    fail('restored saved outfit or JPEG wardrobe changed during source attestation');
  }
  let attested=0,photoFallbackOutfits=0;
  for(const outfit of saved){
   assertUnchanged181();
   const values=Object.values(outfit?.slots||{});
   const ids=values.filter(x=>typeof x==='string'&&x);
   if(!ids.length||ids.length!==values.length||ids.length>9||
      new Set(ids).size!==ids.length){
    photoFallbackOutfits++;continue;
   }
   let expected;
   try{
    expected=board.readOnlyGarmentSources91(ids);
   }catch(e){
    // Missing original legacy photos retain 2D fallback, never a synthetic
    // fitted 3D image. Other failures (owner, stale epoch, invalid selection)
    // must NOT be silently swallowed.
    if(!String(e?.message||e).includes('NATIVE91_MISSING_OR_CHANGED_ORIGINAL_SOURCE'))
     throw e;
    photoFallbackOutfits++;continue;
   }
   if(expected?.ownerId!==owner||!Array.isArray(expected.sources)||
      expected.sources.length!==ids.length||expected.sources.some((r,i)=>
       r?.id!==ids[i]||!/^[a-f0-9]{64}$/.test(r.sha256||'')))
    fail('NATIVE91 owner/source receipt does not match restored saved outfit');
   // NATIVE92 returns exactly the same {ownerId,sources} as NATIVE91,
   // after re-hashing real owner-private ORIGINAL JPEG bytes. A void/false,
   // wrong-owner, mismatched SHA or stale source return is not success.
   const verified=await board.attestOriginalPhotoBytes92(ids);
   assertUnchanged181();
   if(JSON.stringify(verified)!==JSON.stringify(expected)||
      JSON.stringify(board.readOnlyGarmentSources91(ids))!==JSON.stringify(expected))
    fail('NATIVE92 original JPEG byte receipt differs from owner source');
   attested+=ids.length;
  }
  assertUnchanged181();
  sourceProofs+=attested;
  if(recovery)rechecks++;else restores++;
  postCommitUnverified=false;
  return Object.freeze({restored:!recovery,reconciled:true,adopted:true,ownerId:owner,
   savedOutfits:saved.length,originalJPEGsAttested:attested,
   photoFallbackOutfits,stale3DClosed:true,
   privateSourceIntegrity:photoFallbackOutfits===0,
   verifiedSourceReceiptsOnly:true,ownerSessionUnchanged:true,
   hostedSignedJWTVerified:false,productionAuthorized:false,familyAlpha:'HOLD'});
 }
 async function retryVerification(){
  if(!postCommitUnverified)fail('no pending committed restore verification');
  const lease=begin({recovery:true});
  try{
   // Read and digest the owner's CURRENT private local wardrobe; this is
   // NOT a remote cloud restore and NEVER writes or discards saved outfits.
   return await afterAtomicRestore(lease,{recovery:true});
  }catch(e){postCommitFailures++;throw e;}
  finally{finish(lease);}
 }
 function finish(lease){
  if(token!==lease)return false;
  token=null;working=false;initialFingerprint=null;
  return true;
 }
 function revoke(){revoked=true;token=null;working=false;initialFingerprint=null;}
 const listener=()=>revoke();
 win.addEventListener('closet:session-locked',listener);
 win.addEventListener('pagehide',listener);
 return Object.freeze({
  begin,check,consent,markAtomicCommitted,notePostCommitFailure,
  afterAtomicRestore,retryVerification,finish,revoke,
  pending(){return !revoked&&(working||postCommitUnverified);},
  state(){if(!revoked){auth.assertCurrent?.();if(auth.user?.id!==owner)revoke();}
   return Object.freeze({
   active:!revoked,pending:working||postCommitUnverified,restores,
   postCommitUnverified,postCommitWrites,postCommitFailures,
   localOnlyPhotoRechecks:rechecks,noSecondDestructiveRestore:true,
   nativeOwnerBoardReloaded:reloaded,originalJPEGsAttested:sourceProofs,
   staleAnatomical3DNotReused:true,realHostedJWT:false,
   productionAuthorized:false,familyAlpha:'HOLD'
  });},
  dispose(){
   revoke();win.removeEventListener('closet:session-locked',listener);
   win.removeEventListener('pagehide',listener);
  }
 });
}
