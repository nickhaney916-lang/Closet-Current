'use strict';
(async()=>{
 await Promise.all([closetReady,outfitBoardReady,inspirationReady]);if(!db)return;
 await window.closetCloud.start(db,{
  capture(work){const result=writes.then(work);writes=result.catch(()=>{});return result;},
  canRestore:()=>!busy&&!automaticRunning&&!memoryReviewRunning&&
   !document.querySelector('dialog[open]')&&
   !(new URLSearchParams(location.search).get('nativeLossless04')==='research'&&
     (!window.nativeLossless04Bridge||window.nativeLossless04Bridge.status().dirty)),
  async restored(){items=(await readAll()).map(normalizeClothing);batch=(await readDraft()).map(normalizeClothing);await reloadCloudLooks();await reloadCloudBoard();render();window.closetIndex02?.refresh().catch(()=>{});for(const item of batch)if(!item.localAnalyzed)queueAutomatic(item);}
 });
})().catch(()=>{const label=document.getElementById('cloudStatus');if(label){label.hidden=false;label.textContent='Saved on this device · cloud backup pending';}});
