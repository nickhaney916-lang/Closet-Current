'use strict';
/**
 * Actual Outfit Builder entry point. Hard-off on public hosts and unless an
 * explicit developer flag was injected before page load on localhost.
 *
 * This flag is ONLY a UI exposure switch, never an authorization boundary.
 * All successful previews still require Auth / private db / cloud owner
 * checks, server checked /auth/v1/user and explicit real-JPEG human review.
 *
 * No deployment or staging activation is authorized by this file.
 */
(async function(){
 const host=location.hostname;
 if((host!=='localhost'&&host!=='127.0.0.1')||
    window.__CLOSET_CURRENT_FAMILY_ALPHA_LOCAL_PREVIEW__!==true)return;
 const panel=document.getElementById('familyAlphaLocalPreview');
 const launch=document.getElementById('familyAlphaPreviewStart');
 if(!panel||!launch)return;
 try{
  await Promise.all([closetReady,outfitBoardReady]);
  if(!db||!window.closetAuth?.user?.id||!window.closetCloud?.getOwnerId)
   throw Error('Private wardrobe unavailable');
  const {mountAlphaBuilderPreview}=await import('./family-alpha-preview-controller.mjs');
  const controller=mountAlphaBuilderPreview({
   panel,launch,
   review:document.getElementById('familyAlphaPreviewReview'),
   avatar:document.getElementById('familyAlphaPreviewAvatar'),
   status:document.getElementById('familyAlphaPreviewStatus'),
   auth:window.closetAuth,cloud:window.closetCloud,
   getDatabase:()=>db,
   getLatestItem:id=>items.find(item=>item.id===id)||null,
   fetchFn:window.fetch.bind(window),
   publicKey:window.closetAuth.getPublicKey?.(),
   cryptoProvider:window.crypto,
   localApproved:true
  });
  window.addEventListener('pagehide',()=>controller.stop(),{once:true});
 }catch{
  // Deliberately keep the development-only preview hidden if anything fails.
  panel.hidden=true;launch.disabled=true;
 }
})();
