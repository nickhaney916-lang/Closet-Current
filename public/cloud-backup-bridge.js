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
 await window.closetCloud.start(db,{
  capture(work){const result=writes.then(work);writes=result.catch(()=>{});return result;},
  canRestore:()=>!busy&&!automaticRunning&&!memoryReviewRunning&&
   !document.querySelector('dialog[open]')&&nativeLossless04RestoreSafe(),
  async restored(){items=(await readAll()).map(normalizeClothing);batch=(await readDraft()).map(normalizeClothing);await reloadCloudLooks();await reloadCloudBoard();render();window.closetIndex02?.refresh().catch(()=>{});for(const item of batch)if(!item.localAnalyzed)queueAutomatic(item);}
 });
})().catch(()=>{const label=document.getElementById('cloudStatus');if(label){label.hidden=false;label.textContent='Saved on this device · cloud backup pending';}});
