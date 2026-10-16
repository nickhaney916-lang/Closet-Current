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
 const height=dims[2],width=dims[3],area=height*width,labels=new Uint8Array(area),confidence=new Float32Array(area),groups=new Float64Array(18),bodyCounts=new Uint32Array(18);
 for(let i=0;i<area;i++){
  let max=-Infinity;for(let c=0;c<18;c++){const value=data[c*area+i];if(!Number.isFinite(value))throw Error('Invalid outfit segmentation values.');max=Math.max(max,value);}
  groups.fill(0);let total=0;
  for(let c=0;c<18;c++){const weight=Math.exp(data[c*area+i]-max);groups[c===10?9:c]+=weight;total+=weight;}
  let first=0,second=0,id=0;for(let c=0;c<18;c++){if(groups[c]>first){second=first;first=groups[c];id=c;}else if(groups[c]>second)second=groups[c];}
  const score=first/total;
  if(score>=.7&&(first-second)/total>=.15){
   if([2,11,12,13,14,15].includes(id))bodyCounts[id]++;
   if(clothingRegions.some(x=>x.id===id)){labels[i]=id;confidence[i]=score;}
  }
 }
 const head=bodyCounts[2]+bodyCounts[11],limbs=bodyCounts[12]+bodyCounts[13]+bodyCounts[14]+bodyCounts[15];
 const personDetected=head+limbs>=Math.max(8,Math.ceil(area*.005))&&(head>=Math.max(4,Math.ceil(area*.002))||limbs>=Math.max(8,Math.ceil(area*.02)));
 return {labels,confidence,width,height,personDetected};
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
export function clothingCropBounds(image,map,group){
 if(![3,4].includes(image.channels)||image.data.length!==image.width*image.height*image.channels)throw Error('Invalid outfit image pixels.');
 const scaleX=image.width/map.width,scaleY=image.height/map.height,pad=Math.max(2,Math.round(Math.max((group.bounds.right-group.bounds.left)*scaleX,(group.bounds.bottom-group.bounds.top)*scaleY)*.025));
 const left=Math.max(0,Math.floor(group.bounds.left*scaleX)-pad),top=Math.max(0,Math.floor(group.bounds.top*scaleY)-pad),right=Math.min(image.width,Math.ceil(group.bounds.right*scaleX)+pad),bottom=Math.min(image.height,Math.ceil(group.bounds.bottom*scaleY)+pad),width=right-left,height=bottom-top;
 return {left,top,width,height};
}
// Keep source pixels for review and classification. A coarse semantic mask
// locates the crop; it must not erase fine garment texture or nearby edges.
export function cropClothingPhotoPixels(image,map,group){
 const bounds=clothingCropBounds(image,map,group),{left,top,width,height}=bounds,data=new Uint8ClampedArray(width*height*3);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const source=((y+top)*image.width+x+left)*image.channels,target=(y*width+x)*3;
  for(let c=0;c<3;c++)data[target+c]=image.data[source+c];
 }
 return {data,width,height,channels:3,bounds};
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
export function isolateClothingPixels(image,map,group){
 const {left,top,width,height}=clothingCropBounds(image,map,group),scaleX=image.width/map.width,scaleY=image.height/map.height;
 const data=new Uint8ClampedArray(width*height*3);data.fill(255);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const sourceX=x+left,sourceY=y+top,maskIndex=Math.min(map.height-1,Math.floor(sourceY/scaleY))*map.width+Math.min(map.width-1,Math.floor(sourceX/scaleX));
  if(!group.selected[maskIndex])continue;
  const source=(sourceY*image.width+sourceX)*image.channels,target=(y*width+x)*3;
  for(let c=0;c<3;c++)data[target+c]=image.data[source+c];
 }
 return {data,width,height,channels:3,bounds:{left,top,width,height}};
}

// Sample only original pixels belonging to this garment, never the scene or
// the white display background. Spread samples evenly across the mask.
export function clothingColorSample(image,map,group){
 clothingCropBounds(image,map,group);
 const selected=[];for(let i=0;i<group.selected.length;i++)if(group.selected[i])selected.push(i);
 if(!selected.length)throw Error('Empty clothing mask.');
 const data=new Uint8ClampedArray(16*16*4);
 for(let n=0;n<256;n++){
  const i=selected[Math.min(selected.length-1,Math.floor((n+.5)*selected.length/256))];
  const x=Math.min(image.width-1,Math.floor((i%map.width+.5)*image.width/map.width)),y=Math.min(image.height-1,Math.floor((Math.floor(i/map.width)+.5)*image.height/map.height)),source=(y*image.width+x)*image.channels;
  for(let c=0;c<3;c++)data[n*4+c]=image.data[source+c];data[n*4+3]=255;
 }
 return {data,width:16,height:16};
}
