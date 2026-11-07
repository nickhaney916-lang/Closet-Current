/**
 * RESTORE-ATOMIC-01 native application handoff. Feature-gated, does not
 * replace auth.js, outfit editing, cloud RLS or the normal consumer importer.
 */
import {createNativeAuthEpoch01} from '../native-consumer-board-04/native-session-epoch-550-pinned.mjs';
import {validateRestore01,readOwnerSnapshot01,exportBackup01,restoreOwner01} from './atomic-restore.mjs';

const clone=x=>structuredClone(x);
export async function createNativeRestore01({
 win=window,db,board=win.nativeLossless04Bridge,onRestored=async()=>{}
}={}){
 if(new URLSearchParams(win.location.search).get('restoreAtomic01')!=='research'||
  new URLSearchParams(win.location.search).get('nativeLossless04')!=='research'||
  !board?.status()?.active||!db||db.name!=='closet-current-user-'+win.closetAuth?.user?.id)
  throw Error('RESTORE01 independent owner-private research gates required');
 const native=win.closetAuth,epoch=createNativeAuthEpoch01({nativeAuth:native,win,doc:win.document});
 let lease,closed=false,operation=false;
 try{lease=await epoch.attest();}
 catch(e){epoch.dispose();throw e;}
 const assertLease=()=>{
  if(closed||!lease||!board.status().active||
   board.status().dirty||win.closetAuth!==native||
   native.user?.id!==lease.ownerId||
   epoch.auth.getSessionGeneration()!==lease.generation||
   db.name!=='closet-current-user-'+lease.ownerId)
   throw Error('RESTORE01 authenticated owner/session changed or unsaved outfit exists');
 };
 // A visible 3D viewer is a separate read-only snapshot of saved outfit IDs.
 // Prevent an owner-authorized restore or remote replacement from leaving that
 // snapshot displayed against a newly replaced wardrobe. Never auto-close it
 // before explicit owner action: fail closed and ask to close preview first.
 const assert3DClosed=()=>{
  if(win.native3D05Bridge?.state?.().active===true)
   throw Error('RESTORE01 close the active 3D preview before restoring wardrobe');
 };
 const exportJSON=async()=>{
  assertLease();
  const snap=await readOwnerSnapshot01(db,assertLease);
  const data=exportBackup01({ownerId:lease.ownerId,rows:snap.rows});
  const receipt=await validateRestore01(data,{ownerId:lease.ownerId});
  assertLease();
  return {data,receipt};
 };
 const importBackup=async(data,{confirm=()=>false}={})=>{
  if(operation)throw Error('RESTORE01 restore in progress');
  operation=true;
  try{
   assertLease();assert3DClosed();
   // Validate all photos and all saved references BEFORE asking to replace.
   const receipt=await validateRestore01(data,{ownerId:lease.ownerId});
   const snap=await readOwnerSnapshot01(db,assertLease);
   // PHOTO127: confirmation can be an asynchronous UI promise. A Promise
   // object itself is truthy even when it resolves to false. Only an EXACT
   // affirmative result permits the atomic owner-private replacement.
   const approved=await confirm({incoming:receipt,existing:snap.rows.items.length,
    savedExisting:snap.restore.state['outfit-board']?.saved?.length||0});
   assertLease();assert3DClosed();
   if(approved!==true)return {cancelled:true,originalUntouched:true};
   // The lease must be valid AFTER the owner's decision, not only before
   // an arbitrarily long asynchronous confirmation dialog.
   const result=await restoreOwner01({db,assertLease,backup:data,
    ownerId:lease.ownerId,expectedFingerprint:snap.fingerprint,confirmed:true});
   assertLease();
   await onRestored();
   // onRestored may await UI/database refresh; sign-out or token rotation
   // during it must not notify a subsequent account's cloud synchronizer.
   assertLease();
   win.closetCloud?.changed?.();
   return {...result,receipt,realSignedCloudRecovery:false};
  }finally{operation=false;}
 };
 // A remote change is not an authorized replacement until an owner opts in;
 // cloud-backup.js performs its own single-transaction apply/revision CAS.
 const allowCloud=async({document,revision,expectedRevision}={})=>{
  if(operation)return false;
  assertLease();assert3DClosed();
  await validateRestore01(document,{ownerId:lease.ownerId,mode:'cloud'});
  assertLease();
  const snap=await readOwnerSnapshot01(db,assertLease);
  const marker=snap.rows.state.find(x=>x.id==='cloud-sync');
  if((marker?.localRevision||0)!==expectedRevision||
     marker?.dirty===true||!Number.isSafeInteger(revision)||revision<1)
   return false;
  const local=snap.restore;
  const hasContent=local.items.length||Object.values(local.state).some(x=>
   x.batch?.length||x.looks?.length||x.saved?.length||
   Object.keys(x.current?.slots||{}).length);
  if(hasContent){
   if(!win.confirm('Another device has a different cloud wardrobe. Replace this device’s clothing and saved outfits with that version? Your current local data will not be changed if you Cancel.'))
    return false;
  }
  assertLease();
  return true;
 };
 return Object.freeze({exportJSON,importBackup,allowCloud,
  assertLease,status:()=>({active:!closed&&epoch.status().active,
   ownerPrivate:true,releaseAuthorized:false,liveSupabaseRLSVerified:false}),
  dispose(){if(closed)return;closed=true;epoch.dispose();},
  productionAuthorized:false,familyAlpha:'HOLD'});
}
