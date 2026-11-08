/** P176 fail-closed source and render admission for the saved shirt + jeans pair. */
export const SHIRT_SHA176='cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64';
export const JEANS_SHA176='b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c';
const fail=reason=>Object.freeze({admitted:false,mode:'verified-original-photo-2d-fallback',reason,
 releaseAuthorized:false,photorealismApproved:false,familyAlpha:'HOLD'});
export function inspectSavedShirtDenim176({selection,sources,render,proofs}={}){
 const top=selection?.slots?.top,bottom=selection?.slots?.bottom;
 if(!selection?.ownerId||!top||!bottom||sources?.ownerId!==selection.ownerId||
   !Array.isArray(sources.sources)||sources.sources.length!==2||
   proofs?.p171!==true||proofs?.p173!==true||proofs?.p174!==true)
  return fail('current-owner-two-source-P171-P173-P174-proof-required');
 const shirt=sources.sources.find(x=>x?.id===top),jeans=sources.sources.find(x=>x?.id===bottom);
 if(!shirt||!jeans||shirt.sha256!==SHIRT_SHA176||jeans.sha256!==JEANS_SHA176)
  return fail('saved-shirt-or-CC0-jeans-original-source-SHA-changed');
 if(render?.privateVisible!==true||render.viewerReady!==true||render.bones!==163||
   render.viewerMode!=='shirt-pants'||render.meshCount<2||render.fallbackCount!==0||
   render.productionDeployed===true||render.releaseAuthorized===true)
  return fail('actual-owner-read-only-163-bone-two-piece-WebGL-required');
 return Object.freeze({admitted:true,mode:'source-verified-original-shirt-and-jeans-research-3d',
  ownerId:selection.ownerId,itemIds:[top,bottom],sourceSHA256:[SHIRT_SHA176,JEANS_SHA176],
  bones:163,renderedMeshes:render.meshCount,sourcePhotosUnmodified:true,
  arbitraryOwnerPhotoFittingApproved:false,photorealismApproved:false,
  physicalPhonesVerified:false,releaseAuthorized:false,familyAlpha:'HOLD'});
}
