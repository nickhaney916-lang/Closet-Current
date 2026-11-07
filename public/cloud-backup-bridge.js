'use strict';
function nativeLossless04RestoreSafe(){
 if(typeof location==='undefined'||typeof URLSearchParams!=='function'||
    new URLSearchParams(location.search).get('nativeLossless04')!=='research')return true;
 const state=window.nativeLossless04Bridge?.status();
 return state?.active===true&&state.dirty===false;
}
(async()=>{
 await Promise.all([closetReady,outfitBoardReady,inspirationReady]);if(!db)return;
 if(new URLSearchParams(location.search).get('restoreAtomic01')==='research'){
  if(new URLSearchParams(location.search).get('nativeLossless04')!=='research')
   throw Error('RESTORE01 requires lossless private board research mode');
  const {createNativeRestore01}=await import('../research/restore-atomic-01/native-restore-bridge.mjs');
  window.restoreAtomic01Bridge=await createNativeRestore01({
   db,board:window.nativeLossless04Bridge,
   async onRestored(){
    items=(await readAll()).map(normalizeClothing);
    batch=(await readDraft()).map(normalizeClothing);
    await reloadCloudLooks();
    await reloadCloudBoard();
    render();
    window.closetIndex02?.refresh().catch(()=>{});
   }
  });
 }
 // P146: the actual account menu mounts P134/P137 only on a loopback
 // research host with both explicit flags. P145 pauses the legacy writer
 // before this adapter is mounted. The adapter rejects real access tokens.
 if(location.protocol==='http:'&&
    ['localhost','127.0.0.1','[::1]'].includes(location.hostname)&&
    new URLSearchParams(location.search).get('ownerReview145')==='research'&&
    new URLSearchParams(location.search).get('ownerReview146')==='research'){
  const {ownerReviewedMode146,mountOwnerReviewedCloud146}=
   await import('../research/native-owner-reviewed-cloud-ui-146/app-owner-review-bridge.mjs');
  if(!ownerReviewedMode146())throw Error('P146 owner review only works in isolated local research mode');
  const paused=await window.closetCloud.start(db,{});
  if(paused?.paused!==true)throw Error('P146 legacy sync must be held before reviewed cloud UI');
  window.ownerReviewedCloud146=await mountOwnerReviewedCloud146({
   auth:window.closetAuth,db,
   async onRestored(){
    items=(await readAll()).map(normalizeClothing);
    batch=(await readDraft()).map(normalizeClothing);
    await reloadCloudLooks();await reloadCloudBoard();
    render();
    window.closetIndex02?.refresh().catch(()=>{});
   }
  });
  return;
 }
 await window.closetCloud.start(db,{
  capture(work){const result=writes.then(work);writes=result.catch(()=>{});return result;},
  canRestore:()=>!busy&&!automaticRunning&&!memoryReviewRunning&&
   !document.querySelector('dialog[open]')&&nativeLossless04RestoreSafe(),
  async restored(){items=(await readAll()).map(normalizeClothing);batch=(await readDraft()).map(normalizeClothing);await reloadCloudLooks();await reloadCloudBoard();render();window.closetIndex02?.refresh().catch(()=>{});for(const item of batch)if(!item.localAnalyzed)queueAutomatic(item);}
 });
})().catch(()=>{const label=document.getElementById('cloudStatus');if(label){label.hidden=false;label.textContent='Saved on this device · cloud backup pending';}});
