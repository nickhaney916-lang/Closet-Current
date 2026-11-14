/**
 * P89 genuine public-photo source inventory. Emits only source IDs, categories,
 * licenses and numerical coverage; never original RGB, private data or geometry.
 */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {SOURCE_CLASSES89,attestOriginalSource89,auditSourceOutfit89} from '../research/parallel89/source-contract.mjs';
const manifest=JSON.parse(readFileSync(new URL('../benchmark/locked-photo-sources.json',import.meta.url)));
const receipts=[];
for(const sourceId of Object.keys(SOURCE_CLASSES89)){
 const originalBytes=readFileSync(new URL('../benchmark/fixtures/'+sourceId+'.jpg',import.meta.url));
 const receipt=attestOriginalSource89({sourceId,originalBytes,lockedRecord:manifest.find(x=>x.id===sourceId)});
 if(receipt.status!=='ORIGINAL_JPEG_VERIFIED')throw Error('P89 real source check FAILED: '+sourceId);
 receipts.push(receipt);
}
const byId=new Map(receipts.map(x=>[x.sourceId,x]));
const pair=['commons-0003','commons-0023'].map(id=>byId.get(id));
const outfits=['female','male'].map(avatar=>auditSourceOutfit89({avatar,pieces:pair}));
if(outfits.some(x=>x.status!=='MULTICATEGORY_PUBLIC_SOURCE_PAIR_VERIFIED_3D_NOT_CLEARED'||x.releaseAuthorized!==false))
 throw Error('P89 research outfit original-photo guard FAILED');
const evidence={schema:'M2-P89-actual-public-photo-source-inventory-v1',sourceCount:receipts.length,
 categoryCount:new Set(receipts.map(x=>x.category)).size,
 originals:receipts.map(x=>({sourceId:x.sourceId,category:x.category,slot:x.slot,originalSHA256:x.originalSHA256,
  originalByteCount:x.originalByteCount,license:x.license,viewEvidence:'single published image, camera angle not independently adjudicated',
  segmentationApproved:false,fitted163BoneSource:false,independentRealismAccepted:false})),
 testedOutfitPair:pair.map(x=>x.sourceId),
 avatarResearchContracts:outfits.map(x=>({avatar:x.avatar,status:x.status,mode:x.mode,actualPairedSkinnedMeshesValidated:false})),
 categoriesWithoutFitted3DEvidence:['shirt','blouse','jeans','skirt','jacket','footwear'],
 authenticSourceRenderNewInP89:false,
 photorealisticAcceptance:false,realLayerCollisionMetricsNewInP89:false,
 physicalPhonesTested:false,independentHumanReviewCollected:false,
 releaseAuthorized:false,familyAlpha:'HOLD'};
const output=process.argv[2];
if(output){mkdirSync(new URL('../benchmark/parallel89/',import.meta.url),{recursive:true});
 writeFileSync(output,JSON.stringify(evidence,null,2)+'\n');}
console.log(JSON.stringify(evidence,null,2));