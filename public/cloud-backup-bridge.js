'use strict';
// Mission 3: one async restore callback belongs to ONE authenticated owner,
// exact IndexedDB connection and capture/session epoch, even after relogin.
async function mission3ReloadOwnerCloudView({ownerDB,assertLease},{queueUnreviewed=false}={}){
 assertLease();
 const saved=await readAllFrom(ownerDB);assertLease();
 const draft=await readDraftFrom(ownerDB);assertLease();
 // Publish both collections together only while this exact session is live.
 const nextItems=saved.map(normalizeClothing),nextBatch=draft.map(normalizeClothing);
 assertLease();items=nextItems;batch=nextBatch;
 await reloadCloudLooks({ownerDB,assertLease});assertLease();
 await reloadCloudBoard({ownerDB,assertLease});assertLease();
 render();assertLease();
 window.closetIndex02?.refresh().catch(()=>{});
 if(queueUnreviewed){
  for(const item of nextBatch){assertLease();if(!item.localAnalyzed)queueAutomatic(item);}
 }
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
   assertLease();
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
