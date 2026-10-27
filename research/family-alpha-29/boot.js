'use strict';
// Separate opt-in offline surface. Never runs on staging/public hosts.
(async()=>{
 if(!['localhost','127.0.0.1'].includes(location.hostname)||window.__CLOSET_ALPHA29_OFFLINE__!==true)return;
 const root=document.getElementById('alpha29NewClothes');if(!root)return;
 try{
  await Promise.all([closetReady,outfitBoardReady]);
  const [{createNewClothesWorkflow},{createNewClothesStore},{mountNewClothesUI},authModule,avatarModule,photoModule,confirmation]=await Promise.all([
   import('./workflow.mjs'),import('./store.mjs'),import('./ui.mjs'),
   import('../../family-alpha-2d-auth-preflight.mjs'),import('../../family-alpha-2d-saved-board.mjs'),
   import('../family-alpha-reviewed-photo/real-jpeg-review-provider.mjs'),import('../family-alpha-reviewed-photo/preview-confirmation.mjs')
  ]);
  const readContext=()=>({authenticatedUserId:window.closetAuth?.user?.id,currentUserId:window.closetAuth?.user?.id,cloudOwnerId:window.closetCloud?.getOwnerId?.(db),indexedDbName:db?.name,sessionGeneration:window.closetAuth?.getSessionGeneration?.()});
  const verifySession=()=>authModule.verifyAlphaAuthUser({auth:window.closetAuth,database:db,fetchFn:window.fetch.bind(window),publicKey:window.closetAuth?.getPublicKey?.(),getCloudOwnerId:()=>window.closetCloud?.getOwnerId?.(db),getSessionGeneration:()=>window.closetAuth?.getSessionGeneration?.()});
  const aborts=new Set();
  const workflow=createNewClothesWorkflow({readContext,readWardrobe:()=>items,verifySession,
   stylistItemScore,stylistHarmony,cleanOutfitBoard,cryptoProvider:crypto,
   store:createNewClothesStore({getDatabase:()=>db,queue:queued,readContext}),
   cancelPreviews(){for(const a of aborts)a.abort();aborts.clear();},
   async renderPreview({look,container,review,guard,context}){
    const abort=new AbortController();aborts.add(abort);
    try{
     const presentations={};
     for(const id of Object.values(look.board.slots)){
      guard();const item=items.find(x=>x.id===id);
      const prepared=await photoModule.prepareReviewedPhotoPresentation({item,ownerId:context.authenticatedUserId,cryptoProvider:crypto,
       getScope:()=>({ownerId:readContext().authenticatedUserId,epoch:readContext().sessionGeneration}),getItem:()=>items.find(x=>x.id===id),
       isCurrent:()=>{try{guard();return !abort.signal.aborted;}catch{return false;}},
       reviewPreview:detail=>confirmation.confirmReviewedPhotoInContainer(review,detail,{signal:abort.signal,isActive:()=>{try{guard();return true;}catch{return false;}}})});
      guard();if(prepared.status!=='approved-for-staging-preview'||!prepared.presentation?.humanPreviewConfirmed||!prepared.presentation?.sourcePixelAuditPassed)throw Error('Photo needs review');
      presentations[id]=prepared.presentation;
     }
     await verifySession();guard();
     const outcome=await avatarModule.renderSavedBoard2D(container,{board:look.board,items,presentations,getContext:readContext,cryptoProvider:crypto});guard();return outcome;
    }catch(e){container.replaceChildren();throw e;}finally{aborts.delete(abort);review.replaceChildren();}
   }
  });
  const ui=mountNewClothesUI({root,workflow,readWardrobe:()=>items,addPhotos:()=>switchView('scan'),onRestore(record){currentBoard=cleanOutfitBoard(record.current,items);savedOutfitBoards=(record.saved||[]).map(x=>cleanOutfitBoard(x,items));syncBoardInputs();renderOutfitBoard();}});
  const observer=new MutationObserver(()=>ui.refresh());
  for(const id of ['closetGrid','scanResults']){const target=document.getElementById(id);if(target)observer.observe(target,{childList:true,subtree:true});}
  const stop=()=>{observer.disconnect();ui.stop();};
  window.addEventListener('closet:alpha-session-changed',stop,{once:true});window.addEventListener('pagehide',stop,{once:true});
  document.getElementById('logout')?.addEventListener('click',stop,{once:true,capture:true});
 }catch{root.hidden=true;root.replaceChildren();}
})();
