/** Owner/session/source binding for the P62 provisional blouse mesh. */
const SOURCE='e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24';
const HEX=/^[a-f0-9]{64}$/;
const fallback=reason=>Object.freeze({admitted:false,
 mode:'verified-original-photo-2d-fallback',reason,releaseAuthorized:false,
 humanVisualApproval:false,familyAlpha:'HOLD'});
export function inspectPhotoSilhouetteFit62({selection,sources,render,proof171}={}){
 if(!selection?.ownerId||sources?.ownerId!==selection.ownerId||!proof171?.admitted||
   !Array.isArray(sources.sources))return fallback('owner-or-P171-source-admission-missing');
 if(render?.privateVisible!==true||render?.viewerReady!==true||render?.bones!==163||
   !['shirt','shirt-pants'].includes(render?.viewerMode)||render?.releaseAuthorized===true||
   render?.productionDeployed===true)return fallback('visible-163-bone-native-shirt-viewer-missing');
 const id=selection.slots?.top,source=sources.sources.find(x=>x?.id===id);
 if(!source||source.sha256!==SOURCE)return fallback('owner-saved-source-is-not-the-reviewed-P62-blouse');
 const receipt=render.fitReceipts171?.shirt?.silhouette62;
 if(!receipt||receipt.sourcePhotoSilhouetteFit62!==true||
  receipt.silhouetteSourceSHA256!==SOURCE||!HEX.test(receipt.cutoutSHA256||'')||
  !Number.isInteger(receipt.silhouetteFit62MovedVertices)||receipt.silhouetteFit62MovedVertices<20||
  !Number.isFinite(receipt.silhouetteFit62MaxMeters)||receipt.silhouetteFit62MaxMeters<.001||
  receipt.silhouetteFit62MaxMeters>.025||receipt.normalizedSilhouetteOnly!==true||
  receipt.inferredRear62!==true)
  return fallback('actual-source-silhouette-fit-receipt-unavailable');
 return Object.freeze({admitted:true,mode:'owner-bound-reviewed-source-silhouette-3d-research',
  ownerId:selection.ownerId,itemId:id,sourceSHA256:SOURCE,cutoutSHA256:receipt.cutoutSHA256,
  movedVertices:receipt.silhouetteFit62MovedVertices,
  maxMovementMeters:receipt.silhouetteFit62MaxMeters,
  bothHumanoidsSupported:true,normalizedSilhouetteOnly:true,
  inferredBack:true,collisionCertified:false,humanVisualApproval:false,
  arbitraryPrivatePhoto3DApproved:false,releaseAuthorized:false,familyAlpha:'HOLD'});
}
