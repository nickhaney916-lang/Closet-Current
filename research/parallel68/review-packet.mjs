// Research handoff contract. Mission1 owns authenticated confirmation/save.
const categories=new Set(['Tops','Bottoms','Dresses','Outerwear','Shoes','Accessories']);
const colors=new Set(['Unknown','Black','White','Gray','Beige','Brown','Blue','Green','Red','Pink','Purple','Yellow','Orange','Multicolor']);
const sha=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
export function makeReviewPacket68(row){
 if(!row||!sha(row.sha256)||!Number.isInteger(row.width)||!Number.isInteger(row.height)||row.width<1||row.height<1||!Array.isArray(row.regions))throw Error('Invalid original source evidence');
 const ids=new Set();
 const instances=row.regions.map((r,i)=>{
  if(!sha(r.maskSha256))throw Error('Missing actual mask receipt');
  const suggestions=r.categories||[r.category];if(!suggestions.length||suggestions.some(c=>!categories.has(c)))throw Error('Invalid garment category proposal');
  const id=row.sha256+':'+i+':'+r.maskSha256;if(ids.has(id))throw Error('Duplicate proposal');ids.add(id);
  return {id,sourceSha256:row.sha256,maskSha256:r.maskSha256,categoryProposals:[...suggestions],category:suggestions.length===1?suggestions[0]:null,itemType:'Unknown',color:'Unknown',requiresReview:true,strong:false,classificationVerified:false,colorVerified:false};
 });
 return {schema:'closet-current-p68-review-packet/v1',original:{sha256:row.sha256,mimeType:'image/jpeg',width:row.width,height:row.height},instances,requiresReview:true,automaticSaveAllowed:false,canSaveToCloset:false,requiresAuthenticatedConfirmation:true,reviewReason:instances.length?'Inspect outlines and check for missed clothing before confirming':'No garment found: inspect the entire original photo; manual review is required'};
}
export function editReviewNote68(packet,instanceId,changes){
 if(packet?.schema!=='closet-current-p68-review-packet/v1'||!sha(packet.original?.sha256)||packet.automaticSaveAllowed!==false)throw Error('Invalid review packet');
 const instance=packet.instances.find(x=>x.id===instanceId);
 if(!instance||instance.sourceSha256!==packet.original.sha256)throw Error('Cross-source or missing garment note');
 const allowed=new Set(['category','itemType','color']);if(!changes||Object.keys(changes).some(x=>!allowed.has(x)))throw Error('Unsupported review edit');
 if(changes.category!==undefined&&!categories.has(changes.category))throw Error('Unsupported category');
 if(changes.color!==undefined&&!colors.has(changes.color))throw Error('Unsupported color');
 if(changes.itemType!==undefined&&(typeof changes.itemType!=='string'||!changes.itemType.trim()||changes.itemType.length>80||/[<>\u0000-\u001f]/.test(changes.itemType)))throw Error('Invalid subtype note');
 const next=structuredClone(packet),target=next.instances.find(x=>x.id===instanceId);Object.assign(target,changes,{manuallyEditedLocally:true,requiresReview:true,strong:false,classificationVerified:false,colorVerified:false});return next;
}
export function exportReviewNotes68(packet){
 if(packet?.schema!=='closet-current-p68-review-packet/v1'||packet.canSaveToCloset!==false||packet.automaticSaveAllowed!==false||packet.requiresAuthenticatedConfirmation!==true)throw Error('No authenticated save authority in research notes');
 for(const item of packet.instances)if(item.sourceSha256!==packet.original.sha256||item.requiresReview!==true||item.strong!==false)throw Error('Unreviewed or cross-source note');
 return {...structuredClone(packet),purpose:'manual_research_notes_not_authenticated_wardrobe_save',independentGroundTruth:false};
}
