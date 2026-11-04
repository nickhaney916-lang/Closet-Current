// Research-only spatial relationships between model proposals on exactly one
// SHA-identified source photograph. Proximity ≠ same garment; overlap ≠
// accurate mask. This never performs clustering/auto-save or creates truth.
import {decodeReferenceMask} from './garment-mask-metrics.mjs';
const ID=/^(?:commons|validation)-[0-9]{4}$/;
const SHA=/^[0-9a-f]{64}$/;
const CATEGORY={
 short_sleeve_top:'Tops',long_sleeve_top:'Tops',vest:'Tops',sling:'Tops',
 short_sleeve_outwear:'Outerwear',long_sleeve_outwear:'Outerwear',
 shorts:'Bottoms',trousers:'Bottoms',skirt:'Bottoms',
 short_sleeve_dress:'Dresses',long_sleeve_dress:'Dresses',
 vest_dress:'Dresses',sling_dress:'Dresses'
};
const MAX_SIZE=12_000_000,GRID=96;
function decodeProposal(seed,scene,id){
 if(!seed||seed.schemaVersion!==1||seed.modelProposalId!==id||
  !new RegExp('^'+scene.id+'-candidate-[0-9]{2}$').test(id)||
  seed.image!==scene.image||seed.sourceSha256!==scene.sourceSha256||
  seed.reviewStatus!=='prediction-unreviewed'||seed.independentReference!==false||
  seed.canSaveToCustomerCloset!==false||seed.approvedBy!==null||
  seed.sourceRgbChanged!==false||seed.garmentCountVerified!==false||
  !Object.hasOwn(CATEGORY,seed.modelGarmentLabel)||
  !Number.isInteger(seed.width)||!Number.isInteger(seed.height)||
  seed.width<1||seed.height<1||seed.width*seed.height>MAX_SIZE)
  throw Error('Unsafe or altered model-proposal provenance: '+id);
 const mask=decodeReferenceMask(seed),coarse=new Uint8Array(GRID*GRID);
 const cols=new Int32Array(seed.width),rows=new Int32Array(seed.height);
 for(let x=0;x<cols.length;x++)cols[x]=Math.min(GRID-1,Math.floor(x*GRID/seed.width));
 for(let y=0;y<rows.length;y++)rows[y]=Math.min(GRID-1,Math.floor(y*GRID/seed.height));
 let foreground=0,left=seed.width,top=seed.height,right=-1,bottom=-1;
 for(let y=0;y<seed.height;y++)for(let x=0;x<seed.width;x++){
  if(!mask[y*seed.width+x])continue;
  foreground++;left=Math.min(left,x);right=Math.max(right,x);
  top=Math.min(top,y);bottom=Math.max(bottom,y);
  coarse[rows[y]*GRID+cols[x]]=1;
 }
 if(!foreground)throw Error('Empty experimental model proposal');
 return {id,mask,width:seed.width,height:seed.height,coarse,
  label:seed.modelGarmentLabel,category:CATEGORY[seed.modelGarmentLabel],
  pixels:foreground,bounds:{left,top,right:right+1,bottom:bottom+1}};
}
// Multi-source 4-neighbor grid distances: bounded O(96²), not an
// O(foregroundA × foregroundB) pixel-pair comparison.
function minimumGridGap(first,second){
 const n=GRID*GRID,dist=new Int16Array(n),queue=new Int32Array(n);
 dist.fill(-1);let tail=0,head=0;
 for(let i=0;i<n;i++)if(first[i]){dist[i]=0;queue[tail++]=i;}
 let result=Infinity;
 while(head<tail){
  const i=queue[head++],d=dist[i];
  if(second[i]){result=d;break;}
  const x=i%GRID,y=Math.floor(i/GRID);
  for(const k of [x?i-1:-1,x<GRID-1?i+1:-1,y?i-GRID:-1,y<GRID-1?i+GRID:-1]){
   if(k<0||dist[k]!==-1)continue;
   dist[k]=d+1;queue[tail++]=k;
  }
 }
 return Number.isFinite(result)?result:null;
}
export function auditModelProposalSpatialRelations(scene,seeds){
 if(!ID.test(scene?.id)||scene.image!==scene.id+'.jpg'||!SHA.test(scene.sourceSha256)||
   !(seeds instanceof Map)||seeds.size>20)
  throw Error('Invalid spatial review source or candidate collection');
 const proposals=[...seeds.entries()].sort((a,b)=>a[0].localeCompare(b[0]))
  .map(([id,seed])=>decodeProposal(seed,scene,id));
 const geom=proposals[0];
 if(proposals.some(x=>x.width!==geom?.width||x.height!==geom?.height))
  throw Error('Cannot compare model masks from different geometries');
 const pairs=[];let nearSameCategory=0,crossCategoryOverlap=0,disjointSameCategory=0;
 for(let i=0;i<proposals.length;i++)for(let j=i+1;j<proposals.length;j++){
  const a=proposals[i],b=proposals[j],n=a.mask.length;
  let overlap=0;for(let p=0;p<n;p++)if(a.mask[p]&&b.mask[p])overlap++;
  const union=a.pixels+b.pixels-overlap,IoU=overlap/union;
  const gap=minimumGridGap(a.coarse,b.coarse);
  const same=a.category===b.category;
  const near=gap!==null&&gap<=3;
  const potentialPanelFragment=same&&(overlap>0||near);
  const possibleLayerConflict=!same&&overlap>0;
  if(same&&overlap===0)disjointSameCategory++;
  if(potentialPanelFragment)nearSameCategory++;
  if(possibleLayerConflict)crossCategoryOverlap++;
  pairs.push({
   ids:[a.id,b.id],categories:[a.category,b.category],labels:[a.label,b.label],
   originalSourceShared:true,sameBroadModelCategory:same,
   actualModelOverlapPixels:overlap,modelToModelIoU:IoU,
   nearestOccupiedCoarseGridSteps:gap,coarseGridResolution:GRID,
   geometryReviewPriority:potentialPanelFragment?
    'possibly-connected-or-fragmented-same-class-pieces':
    possibleLayerConflict?'potential-overlapping-layer-or-label-conflict':
    same?'distinct-mask-same-class-unknown-physical-identity':'unresolved-physical-garment-relationship',
   independentlyVerifiedSameGarment:false,
   independentlyVerifiedDifferentGarments:false
  });
 }
 return {
  status:'unreviewed-model-spatial-relationships',
  sourceId:scene.id,image:scene.image,sourceSha256:scene.sourceSha256,
  proposalCount:proposals.length,physicalGarmentCount:null,
  foregroundPixelCounts:proposals.map(x=>({id:x.id,pixels:x.pixels,
   category:x.category,label:x.label,bounds:x.bounds})),
  candidatePairs:pairs,
  possiblyRelatedSameCategoryPairs:nearSameCategory,
  disjointSameCategoryPairs:disjointSameCategory,
  overlappingDifferentCategoryPairs:crossCategoryOverlap,
  pixelGroundTruth:false,
  exactModelToModelOverlapMeasured:true,
  proximityIsCoarseReviewPriorityOnly:true,
  instanceAccuracy:null,garmentRecall:null,garmentPrecision:null,
  approvedReferenceMasks:0,autoSavedCustomerItems:0,canPromoteModel:false,
  customerCodeChanged:false,sourceRgbModified:false
 };
}
