// Experimental mask-based instance evidence gate. Never imported by the app.
// Connected fragments are not automatically distinct items: sleeves, shoelaces,
// hems, shadows and occlusion can yield multiple regions from ONE garment.
const allowed=new Map([
  [4,new Set(['Tops','Outerwear'])],
  [5,new Set(['Bottoms'])],
  [6,new Set(['Bottoms'])],
  [7,new Set(['Dresses'])],
  [9,new Set(['Shoes'])]
]);
const sha=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
const maskArea=(a)=>a.reduce((sum,v)=>sum+(v?1:0),0);
const neighbors=(index,w,h)=>{const x=index%w,y=Math.floor(index/w);
 return [x>0?index-1:-1,x<w-1?index+1:-1,y>0?index-w:-1,y<h-1?index+w:-1].filter(i=>i>=0);};
function verifyMap(map){
 const {width:w,height:h,labels,confidence}=map??{};
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w*h>512*512
   ||labels?.length!==w*h||confidence?.length!==w*h)throw Error('Invalid semantic map dimensions');
 for(let i=0;i<labels.length;i++)if(!Number.isInteger(labels[i])||labels[i]<0||labels[i]>17
   ||!Number.isFinite(confidence[i])||confidence[i]<0||confidence[i]>1)
   throw Error('Invalid semantic class or confidence');
 return {w,h};
}
export function semanticFragmentEvidence(map,{classes=[4,5,6,7,9],minimumPixels=12}={}){
 const {w,h}=verifyMap(map);
 if(!Array.isArray(classes)||classes.some(c=>!allowed.has(c))
   ||new Set(classes).size!==classes.length
   ||!Number.isInteger(minimumPixels)||minimumPixels<1||minimumPixels>w*h)
   throw Error('Invalid fragment extraction settings');
 const visited=new Uint8Array(w*h),counts=[],details=[];
 for(const klass of classes){
   let retained=0,rejected=0;
   for(let i=0;i<map.labels.length;i++){
     if(map.labels[i]!==klass||visited[i])continue;
     let top=h,left=w,bottom=-1,right=-1,area=0,weight=0;
     const queue=[i];visited[i]=1;
     for(let q=0;q<queue.length;q++){
       const cell=queue[q],x=cell%w,y=Math.floor(cell/w);
       area++;weight+=map.confidence[cell];
       top=Math.min(top,y);bottom=Math.max(bottom,y);
       left=Math.min(left,x);right=Math.max(right,x);
       for(const n of neighbors(cell,w,h)){
         if(!visited[n]&&map.labels[n]===klass){visited[n]=1;queue.push(n);}
       }
     }
     if(area<minimumPixels){rejected++;continue;}
     retained++;
     details.push({semanticClass:klass,componentIndex:retained,
       pixels:area,meanConfidence:weight/area,
       bbox:{left,top,right:right+1,bottom:bottom+1},
       borderClipped:left===0||top===0||right===w-1||bottom===h-1,
       independentlyConfirmedGarment:false,possibleSingleGarmentFragment:true});
   }
   counts.push({semanticClass:klass,retainedFragments:retained,rejectedSmallFragments:rejected,
     canInferPhysicalInstanceCount:false});
 }
 return {width:w,height:h,counts,fragments:details,
   distinctPhysicalGarmentsMeasured:false,automaticCatalogApproved:false,
   sourcePhotoPreserved:true};
}
export function validateInstanceMaskProposals({
 sourceSha256,semanticMap,proposals,minPixels=12,minAgreement=.82,maxPairOverlap=.025
}){
 if(!sha(sourceSha256)||!Array.isArray(proposals)||proposals.length>12
   ||!Number.isInteger(minPixels)||minPixels<4||minPixels>262144
   ||!Number.isFinite(minAgreement)||minAgreement<.6||minAgreement>1
   ||!Number.isFinite(maxPairOverlap)||maxPairOverlap<0||maxPairOverlap>.1)
   throw Error('Invalid instance proposal evidence');
 const {w,h}=verifyMap(semanticMap),size=w*h;
 const ids=new Set(),candidates=[],rejected=[];
 const valid=[];
 for(const p of proposals){
   if(!p||typeof p.id!=='string'||!p.id||p.id.length>80||ids.has(p.id)
     ||!allowed.has(p.semanticClass)||!allowed.get(p.semanticClass).has(p.category)
     ||!sha(p.sourceSha256)||typeof p.modelId!=='string'||!p.modelId||p.modelId.length>160
     ||p.mask?.length!==size||!Number.isFinite(p.confidence)
     ||p.confidence<0||p.confidence>1)throw Error('Invalid, duplicate, or unsupported instance proposal');
   ids.add(p.id);
   if(p.sourceSha256!==sourceSha256){
     rejected.push({id:p.id,reason:'source-photo-hash-mismatch'});continue;
   }
   let area=0,onClass=0,otherGarment=0,bodyOrBackground=0;
   for(let i=0;i<size;i++){
     const value=p.mask[i];
     if(value!==0&&value!==1&&value!==255)throw Error('Invalid binary instance pixels');
     if(!value)continue;
     area++;
     const klass=semanticMap.labels[i];
     if(klass===p.semanticClass)onClass++;
     else if(allowed.has(klass))otherGarment++;
     else bodyOrBackground++;
   }
   const agreement=area?onClass/area:0;
   const flags=[];
   if(area<minPixels)flags.push('candidate-mask-too-small');
   if(agreement<minAgreement)flags.push('semantic-label-conflict');
   if(p.confidence<.65)flags.push('low-instance-model-confidence');
   const entry={id:p.id,semanticClass:p.semanticClass,category:p.category,
     modelId:p.modelId,pixels:area,semanticAgreement:agreement,
     contaminationPixels:otherGarment+bodyOrBackground,
     reviewedByHuman:false,independentPixelGroundTruth:false};
   valid.push({...entry,mask:p.mask,flags});
 }
 // Reject substantially overlapping proposals, including different types
 // assigned to the same visible pixels (no double garment inventory).
 for(let i=0;i<valid.length;i++)for(let j=i+1;j<valid.length;j++){
   let intersection=0;
   const a=valid[i],b=valid[j];
   for(let k=0;k<size;k++)if(a.mask[k]&&b.mask[k])intersection++;
   const share=intersection/Math.max(1,Math.min(a.pixels,b.pixels));
   if(share>maxPairOverlap){
     if(!a.flags.includes('overlapping-instance-proposals'))a.flags.push('overlapping-instance-proposals');
     if(!b.flags.includes('overlapping-instance-proposals'))b.flags.push('overlapping-instance-proposals');
   }
 }
 for(const p of valid){
   const {mask,flags,...rest}=p;
   if(flags.length)rejected.push({...rest,reasons:flags});
   else candidates.push({...rest,status:'candidate-only-needs-independent-review'});
 }
 return {sourceSha256,width:w,height:h,candidates,rejected,
   inputProposalCount:proposals.length,
   verifiedDistinctItemCount:0,autoCreatedItems:0,
   productionAuthorized:false,originalSourcePreserved:true,
   canInferGarmentCount:false,groundTruthAvailable:false,
   matchingSourceAndNonoverlapNotSufficientForAutoApproval:true};
}
