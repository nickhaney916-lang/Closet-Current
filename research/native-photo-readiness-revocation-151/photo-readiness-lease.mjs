/**
 * PHOTO151: keep an original-JPEG readiness panel bound to the SAME owner,
 * exact selected saved look and native wardrobe revision that were attested.
 *
 * This never contains/returns original photo bytes, cloud tokens or object
 * URLs. The existing P08 photo SHA verifier remains unchanged. The optional
 * panel bridge must revoke on tab background/freeze, session lock and source
 * mutation, not keep showing stale private photo cards.
 */
export const PHOTO151=Object.freeze({
 gate:'nativeLossless04=research&native3D05=research&sourceReadiness08=research&readinessLease151=research',
 requiresOriginalNativeOwner:true,sourceRevision93Required:true,
 visibilityRevocation:true,guestPhotoFallback:true,originalPhotosUnmodified:true,
 productionAuthorized:false,releaseAuthorized:false,familyAlpha:'HOLD'
});
const UUID=/^[a-zA-Z0-9_-]{1,180}$/;
// Do not return even an unknown future saved-look field (which could contain
// photo bytes or account data). Keep the complete continuity fingerprint in
// module-private storage keyed to the short-lived immutable receipt only.
const privateSavedState151=new WeakMap();
const fail=msg=>{const e=Error('PHOTO151 '+msg);e.code='PHOTO151_STALE_PRIVATE_PHOTO';throw e;};
const ensure=x=>typeof x==='string'&&UUID.test(x);
const visible=doc=>doc&&doc.hidden!==true&&doc.visibilityState!=='hidden'&&doc.visibilityState!=='prerender';
function sessionState({win,doc,board,db,auth,ownerId}={}){
 if(!win||!doc||!board||!db||!auth||!ensure(ownerId)||
    win.closetAuth!==auth||auth.user?.id!==ownerId||
    db.name!=='closet-current-user-'+ownerId||
    doc.getElementById('authGate')?.hidden!==true||
    doc.getElementById('appShell')?.hidden!==false||
    !visible(doc))fail('owner, original session or visibility revoked');
 try{auth.assertCurrent?.();}catch{fail('original signed-in session revoked');}
 const status=board.status?.();
 if(status?.active!==true||status.dirty===true||!Number.isInteger(status.selected)||
    status.selected<0)fail('saved outfit selection changed or unsaved');
 let saved,epoch;
 try{
  const snapshot=board.readOnlySnapshot();
  saved=snapshot?.saved?.[status.selected];
  epoch=board.readOnlyWardrobeRevision93();
 }catch{fail('owner wardrobe revision unavailable');}
 if(!saved||typeof saved!=='object'||Array.isArray(saved)||
    typeof saved.id!=='string'||!saved.id||!saved.slots||
    typeof saved.slots!=='object'||Array.isArray(saved.slots)||
    saved.ownerId!==undefined&&saved.ownerId!==ownerId)
  fail('invalid owner saved outfit');
 if(epoch?.ownerId!==ownerId||!Number.isSafeInteger(epoch.generation)||
    !Number.isSafeInteger(epoch.revision)||epoch.revision<1)
  fail('stale owner source-revision stamp');
 // Keep the fingerprint ephemeral: not image bytes, not loggable. Snapshot
 // includes all original owner-confirmed slot IDs, source metadata, layers.
 const fingerprint=JSON.stringify(saved);
 if(fingerprint.length>100000)fail('saved outfit metadata exceeds bounded limit');
 const receipt=Object.freeze({ownerId,selectedIndex:status.selected,
  savedId:saved.id,revision:epoch.revision,generation:epoch.generation});
 privateSavedState151.set(receipt,fingerprint);
 return receipt;
}
export function captureReadinessLease151(context){
 return sessionState(context);
}
export function assertReadinessLease151(lease,context){
 if(!lease||typeof lease!=='object'||!privateSavedState151.has(lease))
  fail('missing or forged original read lease');
 const live=sessionState(context);
 if(live.ownerId!==lease.ownerId||live.selectedIndex!==lease.selectedIndex||
    live.savedId!==lease.savedId||live.revision!==lease.revision||
    live.generation!==lease.generation||
    privateSavedState151.get(live)!==privateSavedState151.get(lease))
  fail('saved outfit, original photo source or owner changed after attestation');
 return true;
}
