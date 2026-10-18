// Clothing classes only. Face, hair, skin, limbs and background never become
// clothing entries. Upper-clothes is a broad region, not a guessed shirt type.
export const clothingRegions=[
 {id:1,label:'Hat',categories:['Accessories'],types:['Hat']},
 {id:3,label:'Sunglasses',categories:['Accessories'],types:['Sunglasses']},
 {id:4,label:'Upper garment',categories:['Tops','Outerwear']},
 {id:5,label:'Skirt',categories:['Bottoms'],types:['Skirt']},
 {id:6,label:'Bottoms',categories:['Bottoms']},
 {id:7,label:'Dress',categories:['Dresses']},
 {id:8,label:'Belt',categories:['Accessories'],types:['Belt']},
 {id:9,label:'Shoes',categories:['Shoes']},
 {id:16,label:'Bag',categories:['Accessories'],types:['Bag']},
 {id:17,label:'Scarf',categories:['Accessories'],types:['Scarf']}
];
export function clothingLabelMap(data,dims){
 if(!Array.isArray(dims)||dims.length!==4||dims[0]!==1||dims[1]!==18||!Number.isInteger(dims[2])||!Number.isInteger(dims[3])||dims[2]<1||dims[3]<1||dims[2]>512||dims[3]>512||data.length!==dims.reduce((a,b)=>a*b,1))throw Error('Invalid outfit segmentation output.');
 const height=dims[2],width=dims[3],area=height*width,labels=new Uint8Array(area),semanticLabels=new Uint8Array(area),confidence=new Float32Array(area),groups=new Float64Array(18),bodyCounts=new Uint32Array(18);
 for(let i=0;i<area;i++){
  let max=-Infinity;for(let c=0;c<18;c++){const value=data[c*area+i];if(!Number.isFinite(value))throw Error('Invalid outfit segmentation values.');max=Math.max(max,value);}
  groups.fill(0);let total=0;
  for(let c=0;c<18;c++){const weight=Math.exp(data[c*area+i]-max);groups[c===10?9:c]+=weight;total+=weight;}
  let first=0,second=0,id=0;for(let c=0;c<18;c++){if(groups[c]>first){second=first;first=groups[c];id=c;}else if(groups[c]>second)second=groups[c];}
  const score=first/total;
  if(score>=.7&&(first-second)/total>=.15){
   // Retain trusted non-clothing evidence for cleanup vetoes without making
   // skin, hair or limbs eligible for clothing groups or color sampling.
   semanticLabels[i]=id;
   if([2,11,12,13,14,15].includes(id))bodyCounts[id]++;
   if(clothingRegions.some(x=>x.id===id)){labels[i]=id;confidence[i]=score;}
  }
 }
 const head=bodyCounts[2]+bodyCounts[11],limbs=bodyCounts[12]+bodyCounts[13]+bodyCounts[14]+bodyCounts[15];
 const personDetected=head+limbs>=Math.max(8,Math.ceil(area*.005))&&(head>=Math.max(4,Math.ceil(area*.002))||limbs>=Math.max(8,Math.ceil(area*.02)));
 return {labels,semanticLabels,confidence,width,height,personDetected};
}
export function clothingMaskGroups(map){
 const {labels,confidence,width,height}=map;if(labels.length!==width*height||confidence.length!==labels.length)throw Error('Invalid outfit mask.');
 const output=[];
 for(const region of clothingRegions){
  const selected=new Uint8Array(labels.length),seen=new Uint8Array(labels.length),minimum=Math.max(4,Math.ceil(labels.length*.0007));let count=0,sum=0,minX=width,minY=height,maxX=-1,maxY=-1;
  for(let start=0;start<labels.length;start++){
   if(seen[start]||labels[start]!==region.id)continue;
   const queue=[start],component=[];seen[start]=1;
   for(let head=0;head<queue.length;head++){
    const i=queue[head],x=i%width,y=Math.floor(i/width);component.push(i);
    for(const n of [x>0?i-1:-1,x+1<width?i+1:-1,y>0?i-width:-1,y+1<height?i+width:-1])if(n>=0&&!seen[n]&&labels[n]===region.id){seen[n]=1;queue.push(n);}
   }
   if(component.length<minimum)continue;
   for(const i of component){selected[i]=1;count++;sum+=confidence[i];minX=Math.min(minX,i%width);maxX=Math.max(maxX,i%width);minY=Math.min(minY,Math.floor(i/width));maxY=Math.max(maxY,Math.floor(i/width));}
  }
  if(count<Math.max(12,Math.ceil(labels.length*.001))||sum/count<.8)continue;
  output.push({...region,selected,count,confidence:sum/count,bounds:{left:minX,top:minY,right:maxX+1,bottom:maxY+1},clipped:minX===0||minY===0||maxX===width-1||maxY===height-1});
 }
 return output;
}
export function clothingCropBounds(image,map,group,{marginFraction=.05}={}){
 if(![3,4].includes(image.channels)||image.data.length!==image.width*image.height*image.channels)throw Error('Invalid outfit image pixels.');
 if(!Number.isFinite(marginFraction)||marginFraction<.05||marginFraction>.15)
  throw Error('Invalid original photo crop margin.');
 // Recognition must keep the same 5% source crop as before. A display-only
 // fallback caused by unreliable segmentation may elect a broader margin to
 // retain photographed cuffs, hems or soles just OUTSIDE the model box.
 // Neither margin can infer, repaint, mask or reconstruct garment pixels.
 const scaleX=image.width/map.width,scaleY=image.height/map.height,pad=Math.max(2,Math.round(Math.max((group.bounds.right-group.bounds.left)*scaleX,(group.bounds.bottom-group.bounds.top)*scaleY)*marginFraction));
 const left=Math.max(0,Math.floor(group.bounds.left*scaleX)-pad),top=Math.max(0,Math.floor(group.bounds.top*scaleY)-pad),right=Math.min(image.width,Math.ceil(group.bounds.right*scaleX)+pad),bottom=Math.min(image.height,Math.ceil(group.bounds.bottom*scaleY)+pad),width=right-left,height=bottom-top;
 return {left,top,width,height};
}
// Keep source pixels for review and classification. A coarse semantic mask
// locates the crop; it must not erase fine garment texture or nearby edges.
export function cropClothingPhotoPixels(image,map,group,options){
 const bounds=clothingCropBounds(image,map,group,options),{left,top,width,height}=bounds,data=new Uint8ClampedArray(width*height*3);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const source=((y+top)*image.width+x+left)*image.channels,target=(y*width+x)*3;
  for(let c=0;c<3;c++)data[target+c]=image.data[source+c];
 }
 return {data,width,height,channels:3,bounds};
}
// Production display-only cleanup: repair TINY, entirely enclosed pinholes
// using *actual original RGB*, never invented colors or external foreground.
// Recognition crops, account originals and classification masks remain intact.
// This is not generic shape completion, de-occlusion, or proof of mask accuracy.
export function repairGarmentDisplayPinholes(image,map,group,{
 maxHolePixels=4,maxTotalGrowthFraction=.015,maxNeighborColorDistance=32
}={}){
 const {width,height}=map??{},n=width*height,seed=group?.selected;
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<3||height<3
   ||n>262144||seed?.length!==n||![3,4].includes(image?.channels)
   ||!Number.isInteger(image.width)||!Number.isInteger(image.height)
   ||image.width<width||image.height<height
   ||image.data?.length!==image.width*image.height*image.channels
   ||map.labels&&map.labels.length!==n
   ||map.semanticLabels&&map.semanticLabels.length!==n
   ||!Number.isInteger(maxHolePixels)||maxHolePixels<1||maxHolePixels>12
   ||!Number.isFinite(maxTotalGrowthFraction)||maxTotalGrowthFraction<0||maxTotalGrowthFraction>.04
   ||!Number.isFinite(maxNeighborColorDistance)||maxNeighborColorDistance<0||maxNeighborColorDistance>60)
  throw Error('Invalid display pinhole repair inputs');
 const out=new Uint8Array(seed),seen=new Uint8Array(n),queue=new Int32Array(n);
 let base=0;
 for(const value of seed){if(value!==0&&value!==1&&value!==255)throw Error('Invalid garment seed');if(value)base++;}
 const budget=Math.floor(base*maxTotalGrowthFraction);
 const diagnostic={repairedPixels:0,examinedHoles:0,repairedHoles:0,
  unchangedForegroundPixels:base,growthBudget:budget,
  originalPixelsOnly:true,semanticMaskUntouched:true,
  recognitionPixelsUntouched:true,notVerifiedSegmentationAccuracy:true};
 if(base<64||budget<1||group.clipped===true)return {selected:out,...diagnostic};
 const rgb=i=>{
  const x=i%width,y=Math.floor(i/width),px=Math.min(image.width-1,Math.floor((x+.5)*image.width/width)),
    py=Math.min(image.height-1,Math.floor((y+.5)*image.height/height)),k=(py*image.width+px)*image.channels;
  return [image.data[k],image.data[k+1],image.data[k+2]];
 };
 const neighbors=i=>{
  const x=i%width,y=Math.floor(i/width);
  return [x>0?i-1:-1,x<width-1?i+1:-1,y>0?i-width:-1,y<height-1?i+width:-1]
   .filter(v=>v>=0);
 };
 // Eight-way traversal prevents filling legitimate diagonal openings.
 for(let start=0;start<n;start++){
  if(seed[start]||seen[start])continue;
  let front=0,back=1,border=false,otherClass=false;
  queue[0]=start;seen[start]=1;
  while(front<back){
   const i=queue[front++],x=i%width,y=Math.floor(i/width);
   if(x===0||x===width-1||y===0||y===height-1)border=true;
   if(map.labels?.[i]&&map.labels[i]!==group.id)otherClass=true;
   if(map.semanticLabels?.[i]&&map.semanticLabels[i]!==group.id)otherClass=true;
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    if(!dx&&!dy)continue;
    const xx=x+dx,yy=y+dy;
    if(xx<0||xx>=width||yy<0||yy>=height)continue;
    const j=yy*width+xx;
    if(!seed[j]&&!seen[j]){queue[back++]=j;seen[j]=1;}
   }
  }
  if(border)continue;
  diagnostic.examinedHoles++;
  if(otherClass||back>maxHolePixels||diagnostic.repairedPixels+back>budget)continue;
  // At least TWO trusted four-neighbor garment pixels must locally support
  // every restored pixel. Do not use a global garment color (patterns vary).
  let supported=true;
  for(let p=0;p<back&&supported;p++){
   const i=queue[p],candidate=rgb(i);
   const confirmed=neighbors(i).filter(j=>Boolean(seed[j]));
   if(confirmed.length<2){supported=false;break;}
   let matching=0;
   for(const j of confirmed){
    const fabric=rgb(j);
    if(Math.hypot(candidate[0]-fabric[0],candidate[1]-fabric[1],candidate[2]-fabric[2])
       <=maxNeighborColorDistance)matching++;
   }
   if(matching<2||matching/confirmed.length<.75)supported=false;
  }
  if(!supported)continue;
  for(let p=0;p<back;p++)out[queue[p]]=1;
  diagnostic.repairedHoles++;
  diagnostic.repairedPixels+=back;
 }
 return {selected:out,...diagnostic};
}

// Experimental edge recovery for comparison only. Never alter recognition masks.
// Candidate pixels must be near the original region AND match its sampled fabric
// color; this cannot reliably recover arbitrary multicolor garments.
export function conservativeEdgeMask(image,map,group,{maxColorDistance=35}={}){
 const {width,height}=map,{selected}=group;
 if(selected.length!==width*height||!Number.isFinite(maxColorDistance)||maxColorDistance<0)throw Error('Invalid conservative mask');
 const output=new Uint8Array(selected);
 const samples=[0,0,0];let n=0;
 const sx=image.width/width,sy=image.height/height;
 const color=(x,y)=>{const px=Math.min(image.width-1,Math.floor((x+.5)*sx)),py=Math.min(image.height-1,Math.floor((y+.5)*sy)),i=(py*image.width+px)*image.channels;return [image.data[i],image.data[i+1],image.data[i+2]];};
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(selected[y*width+x]){
  const rgb=color(x,y);for(let c=0;c<3;c++)samples[c]+=rgb[c];n++;
 }
 if(!n)return output;
 for(let c=0;c<3;c++)samples[c]/=n;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=y*width+x;if(selected[i])continue;
  const nearby=(x>0&&selected[i-1])||(x<width-1&&selected[i+1])||(y>0&&selected[i-width])||(y<height-1&&selected[i+width]);
  if(!nearby)continue;
  // Reject pixels assigned to another known garment.
  if(map.labels&&map.labels[i]&&map.labels[i]!==group.id)continue;
  const rgb=color(x,y),dist=Math.hypot(rgb[0]-samples[0],rgb[1]-samples[1],rgb[2]-samples[2]);
  if(dist<=maxColorDistance)output[i]=1;
 }
 return output;
}
// Experimental multi-step recovery: grow only through pixels similar to the
// garment seed. This is intentionally NOT used by the production crop path.
export function connectedEdgeMask(image,map,group,{maxSteps=3,maxColorDistance=35}={}){
 if(!Number.isInteger(maxSteps)||maxSteps<0||maxSteps>6)throw Error('Invalid edge recovery steps');
 const {width,height}=map,seed=group.selected;
 if(seed?.length!==width*height||![3,4].includes(image.channels)||image.data.length!==image.width*image.height*image.channels||!Number.isFinite(maxColorDistance)||maxColorDistance<0)throw Error('Invalid edge recovery inputs');
 const out=new Uint8Array(seed),sx=image.width/width,sy=image.height/height;
 const color=(i)=>{const x=i%width,y=Math.floor(i/width),px=Math.min(image.width-1,Math.floor((x+.5)*sx)),py=Math.min(image.height-1,Math.floor((y+.5)*sy)),offset=(py*image.width+px)*image.channels;return [image.data[offset],image.data[offset+1],image.data[offset+2]];};
 for(let step=0;step<maxSteps;step++){
  const frontier=[];
  for(let i=0;i<out.length;i++){
   if(out[i])continue;
   if(map.labels?.[i]&&map.labels[i]!==group.id)continue;
   const x=i%width,y=Math.floor(i/width),neighbors=[x>0?i-1:-1,x<width-1?i+1:-1,y>0?i-width:-1,y<height-1?i+width:-1];
   const rgb=color(i);
   if(neighbors.some(n=>{if(n<0||!out[n])return false;const reference=color(n);return Math.hypot(...rgb.map((v,k)=>v-reference[k]))<=maxColorDistance;}))frontier.push(i);
  }
  if(!frontier.length)break;
  for(const i of frontier)out[i]=1;
 }
 return out;
}
// Experimental only: limit recovery by how much *new* mask area is admitted.
// Area is a contamination proxy, not a guarantee that background is excluded.
// Preserve model-assigned other garment regions. Do not use for live isolation.
export function adaptiveEdgeMask(image,map,group,{maxSteps=4,maxColorDistance=35,maxGrowthRatio=.2}={}){
 if(!Number.isFinite(maxGrowthRatio)||maxGrowthRatio<0||maxGrowthRatio>1)throw Error('Invalid growth limit');
 const seed=group.selected,baseCount=seed.reduce((sum,v)=>sum+(v?1:0),0);
 if(!baseCount)throw Error('Empty garment mask');
 const budget=Math.floor(baseCount*maxGrowthRatio);
 let best=new Uint8Array(seed),acceptedSteps=0;
 for(let steps=1;steps<=maxSteps;steps++){
  const candidate=connectedEdgeMask(image,map,group,{maxSteps:steps,maxColorDistance});
  const growth=candidate.reduce((sum,v,i)=>sum+(v&&!seed[i]?1:0),0);
  if(growth>budget)break;
  best=candidate;acceptedSteps=steps;
 }
 return {selected:best,acceptedSteps,addedPixels:best.reduce((sum,v,i)=>sum+(v&&!seed[i]?1:0),0),budget};
}
// Experimental discriminative recovery. Compare each proposed coarse pixel
// against neighboring confirmed garment AND background samples. Never applied
// to the production isolation or recognition paths.
export function discriminativeEdgeMask(image,map,group,{maxSteps=3,margin=12,maxGrowthRatio=.4}={}){
 const {width,height}=map,seed=group.selected;
 if(seed?.length!==width*height||![3,4].includes(image.channels)||!Number.isInteger(maxSteps)||maxSteps<0||maxSteps>6||!Number.isFinite(margin)||margin<0||!Number.isFinite(maxGrowthRatio)||maxGrowthRatio<0||maxGrowthRatio>2)throw Error('Invalid edge recovery inputs');
 const color=i=>{const x=i%width,y=Math.floor(i/width),px=Math.min(image.width-1,Math.floor((x+.5)*image.width/width)),py=Math.min(image.height-1,Math.floor((y+.5)*image.height/height)),k=(py*image.width+px)*image.channels;return [image.data[k],image.data[k+1],image.data[k+2]];};
 const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
 const neighbors=i=>{const x=i%width,y=Math.floor(i/width);return [x>0?i-1:-1,x<width-1?i+1:-1,y>0?i-width:-1,y<height-1?i+width:-1].filter(n=>n>=0);};
 const out=new Uint8Array(seed),original=seed.reduce((n,v)=>n+(v?1:0),0),budget=Math.floor(original*maxGrowthRatio);let added=0,acceptedSteps=0;
 // Fixed reference backgrounds prevent a recovered garment region from
 // redefining the background as it grows.
 for(let step=0;step<maxSteps;step++){
  const candidates=[];
  for(let i=0;i<seed.length;i++){
   if(out[i]||(map.labels?.[i]&&map.labels[i]!==group.id))continue;
   const touching=neighbors(i).filter(n=>out[n]);if(!touching.length)continue;
   const rgb=color(i),garmentDistance=Math.min(...touching.map(n=>distance(rgb,color(n))));
   const external=neighbors(i).filter(n=>!out[n]&&!seed[n]);
   if(!external.length)continue;
   const backgroundDistance=Math.min(...external.map(n=>distance(rgb,color(n))));
   if(garmentDistance+margin<backgroundDistance)candidates.push(i);
  }
  if(!candidates.length||added+candidates.length>budget)break;
  for(const i of candidates)out[i]=1;added+=candidates.length;acceptedSteps++;
 }
 return {selected:out,acceptedSteps,addedPixels:added,budget};
}
// Display integrity is a conservative *structure* check, NOT garment-mask
// accuracy. When a prediction splits into large disconnected pieces or is
// clipped at the camera edge, show the untouched padded source crop rather
// than a white-matted image that appears to have missing fabric. This never
// expands model masks, recolors pixels or changes the classifier's source.
export function garmentDisplayMaskReliability(map,group,{maxDetachedShare=.2,maxEnclosedHoleShare=.012}={}){
 const {width,height}=map??{},length=width*height,selected=group?.selected;
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<2||height<2||
   length>262144||selected?.length!==length||
   (map.labels&&map.labels.length!==length)||
   (map.semanticLabels&&map.semanticLabels.length!==length)||
   !Number.isFinite(maxDetachedShare)||maxDetachedShare<0||maxDetachedShare>.5||
   !Number.isFinite(maxEnclosedHoleShare)||
   maxEnclosedHoleShare<.001||maxEnclosedHoleShare>.08)
  throw Error('Invalid garment display mask');
 const seen=new Uint8Array(length),queue=new Int32Array(length);
 let total=0,largest=0,components=0;const regions=[];
 for(const v of selected){if(v!==0&&v!==1&&v!==255)throw Error('Invalid garment display mask values');if(v)total++;}
 for(let start=0;start<length;start++){
  if(!selected[start]||seen[start])continue;
  queue[0]=start;seen[start]=1;let front=0,back=1;
  while(front<back){
   const i=queue[front++],x=i%width,y=Math.floor(i/width);
   const adjacent=[x?i-1:-1,x+1<width?i+1:-1,y?i-width:-1,y+1<height?i+width:-1];
   for(const j of adjacent)if(j>=0&&selected[j]&&!seen[j]){seen[j]=1;queue[back++]=j;}
  }
  largest=Math.max(largest,back);components++;
  let minX=width,minY=height,maxX=-1,maxY=-1;
  for(let p=0;p<back;p++){
   const x=queue[p]%width,y=Math.floor(queue[p]/width);
   minX=Math.min(minX,x);maxX=Math.max(maxX,x);
   minY=Math.min(minY,y);maxY=Math.max(maxY,y);
  }
  regions.push({area:back,left:minX,top:minY,right:maxX+1,bottom:maxY+1});
 }
 const detachedShare=total?(total-largest)/total:1;
 // A large enclosed void can erase material even when the outside silhouette
 // remains one connected region (e.g., a sneaker side panel or dress bodice).
 // Eight-way flood-fill distinguishes true interior gaps from exterior paths
 // and diagonal sleeve/leg openings. A *substantial* consistently classified
 // skin/underlayer region can explain a real garment opening. A single noisy
 // body pixel must NOT hide a large missing garment panel.
 // This is a *display-only risk indicator*, NOT verified pixel accuracy and
 // never a license to manufacture or grow garment pixels.
 let largestUnexplainedHole=0,unexplainedHoles=0;
 if(total>=48&&[4,5,6,7,9].includes(group.id)&&!group.clipped){
  const seenBackground=new Uint8Array(length),backgroundQueue=new Int32Array(length);
  for(let start=0;start<length;start++){
   if(selected[start]||seenBackground[start])continue;
   let front=0,back=1,exterior=false,otherSemanticPixels=0;
   backgroundQueue[0]=start;seenBackground[start]=1;
   while(front<back){
    const i=backgroundQueue[front++],x=i%width,y=Math.floor(i/width);
    if(!x||!y||x===width-1||y===height-1)exterior=true;
    if((map.labels?.[i]&&map.labels[i]!==group.id)||
       (map.semanticLabels?.[i]&&map.semanticLabels[i]!==group.id))otherSemanticPixels++;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
     if(!dx&&!dy)continue;
     const xx=x+dx,yy=y+dy;
     if(xx<0||xx>=width||yy<0||yy>=height)continue;
     const j=yy*width+xx;
     if(!selected[j]&&!seenBackground[j]){seenBackground[j]=1;backgroundQueue[back++]=j;}
    }
   }
   // Require >=90% independently classified body/other-garment pixels.
   // Low-confidence gaps preserve the original photograph instead of
   // silently removing potentially missing fabric from the display cutout.
   const explainedOpening=otherSemanticPixels>0&&otherSemanticPixels/back>=.9;
   if(!exterior&&!explainedOpening){
    largestUnexplainedHole=Math.max(largestUnexplainedHole,back);
    unexplainedHoles++;
   }
  }
 }
 const riskyEnclosedGap=largestUnexplainedHole>=Math.max(8,Math.ceil(total*maxEnclosedHoleShare));
 // Left and right shoes can be two correctly isolated islands. They are not
 // a damaged garment just because their alpha masks do not touch. Accept ONLY
 // two comparable, well-separated, horizontally aligned shoe regions fully
 // inside the frame; ambiguous pairs still retain the original crop.
 // This is structural evidence, not a ground-truth segmentation score.
 let pairedFootwear=false;
 if(group.id===9&&!group.clipped&&regions.length===2&&total>=32){
  const [a,b]=regions.sort((x,y)=>x.left-y.left);
  const aw=a.right-a.left,bw=b.right-b.left,ah=a.bottom-a.top,bh=b.bottom-b.top;
  const verticalOverlap=Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top));
  const centerGap=Math.abs((a.top+a.bottom)-(b.top+b.bottom))/2;
  pairedFootwear=a.area>=16&&b.area>=16&&
   Math.min(a.area,b.area)/Math.max(a.area,b.area)>=.55&&
   Math.min(aw,bw)/Math.max(aw,bw)>=.50&&
   Math.min(ah,bh)/Math.max(ah,bh)>=.65&&
   b.left-a.right>=1&&
   verticalOverlap/Math.min(ah,bh)>=.70&&
   centerGap/Math.min(ah,bh)<=.35;
 }
 const reason=group.clipped===true?'clipped-frame':
  total<16?'insufficient-mask':
  riskyEnclosedGap?'unexplained-enclosed-gap':
  detachedShare>maxDetachedShare&&!pairedFootwear?'fragmented-mask':null;
 return {useOriginalCrop:reason!==null,reason,components,pairedFootwear,
  maskedPixels:total,detachedShare:+detachedShare.toFixed(4),
  largestUnexplainedHole,unexplainedHoles,
  sourcePreserved:true,measuresPixelAccuracy:false};
}
export function isolateClothingPixels(image,map,group,{repairDisplayPinholes=true}={}){
 const {left,top,width,height}=clothingCropBounds(image,map,group),scaleX=image.width/map.width,scaleY=image.height/map.height;
 const repaired=repairDisplayPinholes?repairGarmentDisplayPinholes(image,map,group):
  {selected:group.selected,repairedPixels:0,repairedHoles:0,originalPixelsOnly:true};
 const data=new Uint8ClampedArray(width*height*3);data.fill(255);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const sourceX=x+left,sourceY=y+top,maskIndex=Math.min(map.height-1,Math.floor(sourceY/scaleY))*map.width+Math.min(map.width-1,Math.floor(sourceX/scaleX));
  if(!repaired.selected[maskIndex])continue;
  const source=(sourceY*image.width+sourceX)*image.channels,target=(y*width+x)*3;
  for(let c=0;c<3;c++)data[target+c]=image.data[source+c];
 }
 return {data,width,height,channels:3,bounds:{left,top,width,height},displayRepair:{repairedPixels:repaired.repairedPixels,repairedHoles:repaired.repairedHoles,originalPixelsOnly:true}};
}

// Sample only original pixels belonging to this garment, never the scene or
// the white display background. Spread samples evenly across the mask.
export function clothingColorSample(image,map,group){
 clothingCropBounds(image,map,group);
 const selected=[],sourcePixels=new Set();let distinctMaskPixels=0;
 for(let i=0;i<group.selected.length;i++)if(group.selected[i]){
  distinctMaskPixels++;
  const x=Math.min(image.width-1,Math.floor((i%map.width+.5)*image.width/map.width)),
   y=Math.min(image.height-1,Math.floor((Math.floor(i/map.width)+.5)*image.height/map.height)),
   source=(y*image.width+x)*image.channels;
  // A processor can upscale a small source into many model cells. Repeated
  // references to one original pixel are not independent color observations.
  if(!sourcePixels.has(source)){sourcePixels.add(source);selected.push(source);}
 }
 if(!selected.length)throw Error('Empty clothing mask.');
 // Do not inflate a tiny mask into 256 apparently independent observations.
 // The color estimator ignores transparent, unfilled slots and can request
 // review rather than confidently label a handful of repeated pixels.
 const sampleCount=Math.min(256,selected.length),data=new Uint8ClampedArray(16*16*4);
 for(let n=0;n<sampleCount;n++){
  const source=selected[Math.min(selected.length-1,Math.floor((n+.5)*selected.length/sampleCount))];
  for(let c=0;c<3;c++)data[n*4+c]=image.data[source+c];data[n*4+3]=255;
 }
 return {data,width:16,height:16,distinctMaskPixels,distinctSourcePixels:selected.length,sampledPixels:sampleCount};
}


// Deliberately excludes the outer one-model-pixel ring of a garment mask.
// Coarse segmentation boundaries are where skin, walls, adjacent clothing,
// hangers and floor frequently leak into sampled colors. A slim or fragmented
// garment without a useful interior returns null rather than invented color.
export function clothingInteriorColorSample(image,map,group,{minimumInterior=96}={}){
 const width=map.width,height=map.height,selected=group.selected;
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<3||height<3||
    selected?.length!==width*height||!Number.isInteger(minimumInterior)||minimumInterior<32||minimumInterior>256)
  throw Error('Invalid garment interior mask');
 const core=new Uint8Array(selected.length);
 let corePixels=0,maskPixels=0;
 for(let i=0;i<selected.length;i++)if(selected[i]){
  maskPixels++;
  const x=i%width,y=Math.floor(i/width);
  if(x===0||y===0||x===width-1||y===height-1)continue;
  let interior=true;
  for(let dy=-1;dy<=1&&interior;dy++)for(let dx=-1;dx<=1;dx++)
   if(!selected[i+dy*width+dx]){interior=false;break;}
  if(interior){core[i]=1;corePixels++;}
 }
 if(corePixels<minimumInterior)return null;
 const sample=clothingColorSample(image,map,{...group,selected:core});
 return {...sample,corePixels,maskPixels,interiorFraction:+(corePixels/maskPixels).toFixed(3)};
}
