'use strict';
let signed37Reattest=null;
function nativeLossless04RestoreSafe(){
 if(typeof location==='undefined'||typeof URLSearchParams!=='function'||
    new URLSearchParams(location.search).get('nativeLossless04')!=='research')return true;
 const board=window.nativeLossless04Bridge;
 const state=board?.status();
 // Existing synchronous pre/post-decode fail-closed contract is unchanged:
 // no cloud wardrobe overwrite while the native board has unsaved edits.
 if(state?.active===true&&state.dirty===false)return true;
 if(state?.active===true||!board)return false;
 const owner=window.closetAuth?.user?.id;
 if(!owner||!db||db.name!=='closet-current-user-'+owner||
    document.getElementById('appShell')?.hidden)return false;
 // SIGNED37 research gate only. AUTH01 intentionally revokes BOARD04's lease
 // on legitimate JWT refresh. The preceding genuine signed cloud RLS GET has
 // succeeded. Re-admit the same native owner through BOARD04.load(), which
 // itself refuses to discard uncommitted outfit edits. Until that completes,
 // return false so the unchanged cloud adapter retries safely.
 if(!signed37Reattest){
  const native=window.closetAuth,ownerDb=db;
  signed37Reattest=(async()=>{
   try{
    native.assertCurrent?.();
    await board.load();
    native.assertCurrent?.();
    return window.closetAuth===native&&window.closetAuth?.user?.id===owner&&
      db===ownerDb&&db.name==='closet-current-user-'+owner&&
      !document.getElementById('appShell')?.hidden&&
      board.status().active===true&&board.status().dirty===false;
   }catch{return false;}
   finally{signed37Reattest=null;}
  })();
 }
 return false;
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
