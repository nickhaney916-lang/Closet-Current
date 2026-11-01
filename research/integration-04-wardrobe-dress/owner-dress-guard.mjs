/** Research-only source-gated dress adapter; never authorizes arbitrary JPEG to 3D. */
export const DRESS_SHA='e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019';
export function planSavedSourceDress({bound,live,slots,dress}){
 const s=live?.();
 if(!s?.authenticated||!s.ownerId||!Number.isSafeInteger(s.generation)||
    bound?.ownerId!==s.ownerId||bound.generation!==s.generation)
  throw Error('Dress owner/session stale');
 if(Object.keys(slots||{}).length!==1||typeof slots.top!=='string')
  throw Error('One-piece dress cannot overlap jeans');
 const item=bound.indexed?.byId?.get(slots.top);
 if(item?.ownerId!==s.ownerId||item?.category!=='Dresses'||
    item?.itemType!=='Dress'||item?.sourceSHA256!==DRESS_SHA)
  throw Error('Owner garment source identity rejected');
 if(dress?.id!=='commons-0053'||dress.sourceSHA256!==DRESS_SHA||!dress.realFabricTexture)
  throw Error('Licensed source cutout or SHA invalid');
 return Object.freeze({ownerId:s.ownerId,generation:s.generation,
  sourceSHA256:DRESS_SHA,dress,releaseAuthorized:false});
}
export function applySavedSourceDress({viewer,plan,live}){
 const before=live?.();
 if(!before?.authenticated||before.ownerId!==plan?.ownerId||
    before.generation!==plan.generation)
  throw Error('Dress owner revoked before render');
 viewer.applyOutfit('dress',plan.dress,{reviewed:true});
 const state=viewer.getState(),o=state?.outfit,d=o?.dress;
 if(state?.stats?.bones!==163||o?.mode!=='dress'||o.slots?.length!==1||
    o.slots[0]!=='dress'||o.pants||o.shirt||d?.sourceId!=='commons-0053'||
    d.sourceSHA256!==DRESS_SHA||d.dress74ProvisionalDrape!==true||
    d.dress74OriginalPhotoCoordinatesPreserved!==true||
    d.dress74OriginalSkinWeightsPreserved!==true||
    d.dress74SourcePhotographUnchanged!==true||d.releaseAuthorized!==false)
  throw Error('Dress source, rig or one-piece geometry integrity failed');
 const after=live?.();
 if(!after?.authenticated||after.ownerId!==before.ownerId||
    after.generation!==before.generation)
  throw Error('Dress owner revoked after render');
 return Object.freeze({ownerId:after.ownerId,generation:after.generation,
  anatomicalSkeletonBones:163,realPhotoApplied:true,
  originalPhotoSHA256s:Object.freeze({dress:DRESS_SHA}),releaseAuthorized:false});
}
