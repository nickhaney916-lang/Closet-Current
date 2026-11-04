'use strict';
async function nativeLossless04RestoreSafe(){
 if(typeof location==='undefined'||typeof URLSearchParams!=='function'||
    new URLSearchParams(location.search).get('nativeLossless04')!=='research')return true;
 const owner=window.closetAuth?.user?.id;
 if(!owner||!db||db.name!=='closet-current-user-'+owner||
    document.getElementById('appShell')?.hidden)return false;
 const board=window.nativeLossless04Bridge;
 if(!board)return false;
 try{
  const current=board.status();
  if(current.active===true)return current.dirty===false;
  // SIGNED37 research only: AUTH01 deliberately revokes its private board lease
  // on a *legitimate token refresh*. The preceding signed cloud GET confirmed
  // server RLS; only an unchanged, unlocked owner may explicitly re-attest.
  // BOARD04.load() itself refuses to discard unsaved draft edits.
  const native=window.closetAuth;
  native.assertCurrent?.();
  await board.load();
  native.assertCurrent?.();
  if(window.closetAuth!==native||window.closetAuth?.user?.id!==owner||
     db?.name!=='closet-current-user-'+owner||
     document.getElementById('appShell')?.hidden)return false;
  const checked=board.status();
  return checked.active===true&&checked.dirty===false;
 }catch{return false;}
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
  canRestore:async()=>!busy&&!automaticRunning&&!memoryReviewRunning&&
   !document.querySelector('dialog[open]')&&await nativeLossless04RestoreSafe(),
  async restored(){items=(await readAll()).map(normalizeClothing);batch=(await readDraft()).map(normalizeClothing);await reloadCloudLooks();await reloadCloudBoard();render();window.closetIndex02?.refresh().catch(()=>{});for(const item of batch)if(!item.localAnalyzed)queueAutomatic(item);}
 });
})().catch(()=>{const label=document.getElementById('cloudStatus');if(label){label.hidden=false;label.textContent='Saved on this device · cloud backup pending';}});
