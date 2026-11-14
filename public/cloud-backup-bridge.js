'use strict';
// Mission 3: one async restore callback belongs to ONE authenticated owner,
// exact IndexedDB connection and capture/session epoch, even after relogin.
async function mission3ReloadOwnerCloudView({ownerDB,assertLease},{queueUnreviewed=false}={}){
 assertLease();
 // A cloud restore may commit before its asynchronous UI rehydration finishes.
 // A freshly captured JPEG can be appended to the SAME tab's in-memory batch
 // between the items and draft reads. Never publish an older list over that
 // live original even when the owner/session lease is still valid.
 const initialItems=items,initialBatch=batch,initialWrites=writes;
 const smallStamp=row=>JSON.stringify(row,(key,value)=>
  typeof value==='string'&&value.startsWith('data:image/')
   ?{photoBytes:value.length,tail:value.slice(-12)}:value);
 const freeze=rows=>rows.map(row=>({
  row,signature:smallStamp(row),source:row?.image,
  original:row?.originalPhoto?.image
 }));
 const initialSaved=freeze(initialItems),initialDraft=freeze(initialBatch);
 const error=()=>Object.assign(Error('CLOSET_CLOUD_RELOAD_LOCAL_PHOTO_CHANGED'),{
  code:'CLOSET_CLOUD_RELOAD_LOCAL_PHOTO_CHANGED'
 });
 const safe=()=>!busy&&!automaticRunning&&!memoryReviewRunning&&
  mission3CloudRestoreReviewIdle()&&
  !document.querySelector('dialog[open]')&&nativeLossless04RestoreSafe();
 const unchanged=(rows,initial,frozen)=>rows===initial&&rows.length===frozen.length&&
  frozen.every((saved,i)=>rows[i]===saved.row&&
   rows[i]?.image===saved.source&&
   rows[i]?.originalPhoto?.image===saved.original&&
   smallStamp(rows[i])===saved.signature);
 const beforePublish=()=>{
  assertLease();
  if(!safe()||writes!==initialWrites||
     !unchanged(items,initialItems,initialSaved)||
     !unchanged(batch,initialBatch,initialDraft))
   throw error();
 };
 const afterPublish=()=>{
  assertLease();
  if(!safe()||writes!==initialWrites)throw error();
 };
 beforePublish();
 const saved=await readAllFrom(ownerDB);beforePublish();
 const draft=await readDraftFrom(ownerDB);beforePublish();
 const nextItems=saved.map(normalizeClothing),nextBatch=draft.map(normalizeClothing);
 beforePublish();
 // No asynchronous operation occurs between the final source check and
 // publication. The next local capture remains visible and will be queued.
 items=nextItems;batch=nextBatch;
 await reloadCloudLooks({ownerDB,assertLease});afterPublish();
 await reloadCloudBoard({ownerDB,assertLease});afterPublish();
 render();assertLease();
 window.closetIndex02?.refresh().catch(()=>{});
 if(queueUnreviewed){
  // Queueing the first review intentionally flips automaticRunning. Recheck
  // once before that deliberate transition; the queue owns later work.
  afterPublish();
  for(const item of nextBatch){
   assertLease();
   if(!item.localAnalyzed)queueAutomatic(item);
  }
 }
}
// Never replace private wardrobe and draft rows while a canonical original
// exists only in the owner-visible review buffer. A failed required capture
// cannot be recovered by re-reading IndexedDB; restoring cloud state while
// its Retry saving photo control is present would irreversibly hide it.
function mission3CloudRestoreReviewIdle(){
 return !(typeof failedDraftCaptures!=='undefined'&&failedDraftCaptures.size>0) &&
  !(typeof localPending!=='undefined'&&localPending.size>0) &&
  !(typeof automaticQueue!=='undefined'&&automaticQueue.length>0) &&
  !(typeof captureProofTaking!=='undefined'&&captureProofTaking) &&
  !(typeof photoImportActive!=='undefined'&&photoImportActive) &&
  !(typeof videoImportActive!=='undefined'&&videoImportActive) &&
  !(typeof cameraOpening!=='undefined'&&cameraOpening) &&
  !(typeof stream!=='undefined'&&stream) &&
  !(typeof saving!=='undefined'&&saving);
}
function nativeLossless04RestoreSafe(){
 if(typeof location==='undefined'||typeof URLSearchParams!=='function'||
    new URLSearchParams(location.search).get('nativeLossless04')!=='research')return true;
 const state=window.nativeLossless04Bridge?.status();
 return state?.active===true&&state.dirty===false;
}
(async()=>{
 const initialAuth=window.closetAuth,initialEpoch=captureOperationEpoch;
 let restoreLease=null;
 const current=()=>{
  try{restoreLease?.assertLease();return !!restoreLease;}catch{return false;}
 };
 try{
  await Promise.all([closetReady,outfitBoardReady,inspirationReady]);
  if(!db||window.closetAuth!==initialAuth||captureOperationEpoch!==initialEpoch)return;
  restoreLease=ownerWardrobeMutationLease();
  const {ownerDB,assertLease}=restoreLease;
  const restored=(queueUnreviewed=false)=>mission3ReloadOwnerCloudView(
   restoreLease,{queueUnreviewed});
  const query=new URLSearchParams(location.search);
  if(query.get('restoreAtomic01')==='research'){
   if(query.get('nativeLossless04')!=='research')
    throw Error('RESTORE01 requires lossless private board research mode');
   const {createNativeRestore01}=await import('../research/restore-atomic-01/native-restore-bridge.mjs');
   assertLease();
   const bridge=await createNativeRestore01({
    db:ownerDB,board:window.nativeLossless04Bridge,
    onRestored:()=>restored()
   });
   try{assertLease();}catch(error){bridge.dispose?.();throw error;}
   window.restoreAtomic01Bridge=bridge;
  }
  // Owner-reviewed recovery is isolated to explicit research flags and local host.
  if(location.protocol==='http:'&&
     ['localhost','127.0.0.1','[::1]'].includes(location.hostname)&&
     query.get('ownerReview145')==='research'&&
     query.get('ownerReview146')==='research'){
   assertLease();
   const {ownerReviewedMode146,mountOwnerReviewedCloud146}=
    await import('../research/native-owner-reviewed-cloud-ui-146/app-owner-review-bridge.mjs');
   assertLease();
   if(!ownerReviewedMode146())throw Error('P146 owner review only works in isolated local research mode');
   const paused=await window.closetCloud.start(ownerDB,{});
   assertLease();
   if(paused?.paused!==true)throw Error('P146 legacy sync must be held before reviewed cloud UI');
   const bridge=await mountOwnerReviewedCloud146({
    auth:initialAuth,db:ownerDB,onRestored:()=>restored()
   });
   // P146 creates owner-private DOM and attaches Auth listeners before its
   // async factory resolves. Revoke that stale UI after account switches,
   // including a same-owner re-login with a different auth generation.
   try{assertLease();}
   catch(error){
    try{bridge?.revoke?.();}catch{}
    throw error;
   }
   window.ownerReviewedCloud146=bridge;
   return;
  }
  assertLease();
  await window.closetCloud.start(ownerDB,{
   capture(work){
    assertLease();
    const result=writes.then(async()=>{
     assertLease();
     const output=await work();
     assertLease();
     return output;
    });
    writes=result.catch(()=>{});
    return result;
   },
   canRestore(){
    if(!current())return false;
    return !busy&&!automaticRunning&&!memoryReviewRunning&&
     mission3CloudRestoreReviewIdle()&&
     !document.querySelector('dialog[open]')&&nativeLossless04RestoreSafe();
   },
   restored:()=>restored(true)
  });
  assertLease();
 }catch(error){
  // An old callback may reject after logout/relogin; it cannot change
  // another person's visible private cloud backup warning.
  if(restoreLease&&!current())return;
  if(window.closetAuth!==initialAuth||captureOperationEpoch!==initialEpoch)return;
  const label=document.getElementById('cloudStatus');
  if(label){label.hidden=false;label.textContent='Saved on this device · cloud backup pending';}
 }
})();
