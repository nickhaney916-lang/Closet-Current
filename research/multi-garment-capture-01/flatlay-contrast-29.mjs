/**
 * FLATLAY-CONTRAST-FALLBACK-29 (research) — extra *unclassified* review
 * rectangles on sufficiently uniform photo backdrops, requested by a person.
 *
 * This is deterministic background contrast, NOT clothing recognition,
 * segmentation confidence, person inference, garment identity or acceptance.
 * Never runs automatically and never stores or transmits source image pixels.
 */
const no=(reason,metadata={})=>({eligible:false,reason,boxes:[],...metadata});
const median=values=>{const sorted=values.slice().sort((a,b)=>a-b);
 return sorted[Math.floor(sorted.length/2)]??0;};
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
const rgb=(data,i,channels)=>[data[i*channels],data[i*channels+1],data[i*channels+2]];
/**
 * @param {{data:Uint8Array|Uint8ClampedArray,width:number,height:number,channels?:3|4}} photo
 * @returns {{eligible:boolean,boxes:Array<{x:number,y:number,width:number,height:number}>,reason:string}}
 */
export function flatlayContrastBoxes29(photo,{limit=12}={}){
 const {data,width:w,height:h,channels=4}=photo||{};
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<40||h<40||
    w>512||h>512||w*h>512*512||![3,4].includes(channels)||
    !(data instanceof Uint8Array||data instanceof Uint8ClampedArray)||
    data.length!==w*h*channels||!Number.isInteger(limit)||limit<1||limit>24)
  return no('invalid-bounded-pixels');
 // A garment touching the frame can spoil one corner; allow at most one
 // contaminated corner. Do not hallucinate background on cluttered scenes.
 const corners=[],span=Math.max(3,Math.floor(Math.min(w,h)*.065));
 for(const [left,top] of [[0,0],[w-span,0],[0,h-span],[w-span,h-span]]){
  const samples=[[],[],[]];
  for(let y=top;y<top+span;y+=2)for(let x=left;x<left+span;x+=2){
   const v=rgb(data,y*w+x,channels);
   for(let c=0;c<3;c++)samples[c].push(v[c]);
  }
  corners.push(samples.map(median));
 }
 let reference=null,agreeCount=0;
 for(const base of corners){
  const count=corners.filter(other=>distance(base,other)<=48).length;
  if(count>agreeCount){reference=base;agreeCount=count;}
 }
 if(agreeCount<3)return no('nonuniform-corners',{cornerAgreement:agreeCount});
 const accepted=corners.filter(c=>distance(c,reference)<=48);
 const background=[0,1,2].map(c=>median(accepted.map(a=>a[c])));
 let bgSpread=0,bgCount=0;
 const rim=Math.max(2,Math.floor(Math.min(w,h)*.025));
 for(let y=0;y<h;y+=2)for(let x=0;x<w;x+=2){
  if(x>=rim&&x<w-rim&&y>=rim&&y<h-rim)continue;
  const d=distance(rgb(data,y*w+x,channels),background);
  if(d<=85){bgSpread+=d;bgCount++;}
 }
 if(bgCount<8||bgSpread/bgCount>27)return no('textured-or-uneven-backdrop');
 // A conservative adaptive distance threshold. On smooth white / neutral
 // backdrops it catches reasonably contrasted items without claiming truth.
 const threshold=Math.max(62,Math.min(104,48+bgSpread/bgCount*2));
 const candidates=new Uint8Array(w*h),filtered=new Uint8Array(w*h);
 let rawCount=0;
 for(let i=0;i<w*h;i++){
  const d=distance(rgb(data,i,channels),background);
  if(d>threshold){candidates[i]=1;rawCount++;}
 }
 const occupancy=rawCount/(w*h);
 if(occupancy<.008||occupancy>.83)
  return no('foreground-coverage-unsafe',{cornerAgreement:agreeCount,coverage:occupancy});
 // 3x3 majority suppresses isolated shadows/texture noise; does not
 // recolor or alter any JPEG, manual crop, segmentation mask or metadata.
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
  let adjacent=0;const i=y*w+x;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)
   adjacent+=candidates[i+dy*w+dx];
  if(adjacent>=5)filtered[i]=1;
 }
 const visited=new Uint8Array(w*h),parts=[];
 const minPixels=Math.max(18,Math.ceil(w*h*.004));
 for(let start=0;start<filtered.length;start++){
  if(!filtered[start]||visited[start])continue;
  const queue=[start];visited[start]=1;
  let xmin=w,ymin=h,xmax=-1,ymax=-1;
  for(let q=0;q<queue.length;q++){
   const n=queue[q],x=n%w,y=Math.floor(n/w);
   xmin=Math.min(xmin,x);ymin=Math.min(ymin,y);
   xmax=Math.max(xmax,x);ymax=Math.max(ymax,y);
   for(const neighbor of [x>0?n-1:-1,x<w-1?n+1:-1,y>0?n-w:-1,y<h-1?n+w:-1]){
    if(neighbor>=0&&filtered[neighbor]&&!visited[neighbor]){
     visited[neighbor]=1;queue.push(neighbor);
    }
   }
  }
  const count=queue.length,boxWidth=xmax-xmin+1,boxHeight=ymax-ymin+1;
  const frac=(boxWidth*boxHeight)/(w*h);
  if(count<minPixels||boxWidth<Math.ceil(w*.055)||
     boxHeight<Math.ceil(h*.055)||frac<.008||frac>.76||
     count/(boxWidth*boxHeight)<.18)continue;
  const px=Math.max(2,Math.floor(Math.min(w,h)*.012));
  const x0=Math.max(0,xmin-px),y0=Math.max(0,ymin-px);
  const x1=Math.min(w,xmax+1+px),y1=Math.min(h,ymax+1+px);
  parts.push({x:x0/w,y:y0/h,width:(x1-x0)/w,height:(y1-y0)/h,
   count,sortKey:y0*w+x0});
 }
 parts.sort((a,b)=>b.count-a.count||a.sortKey-b.sortKey);
 const boxes=parts.slice(0,limit).map(({x,y,width,height})=>({x,y,width,height}));
 return {eligible:true,reason:boxes.length?'review-only-contrast-proposals':'no-distinct-regions',
  boxes,cornerAgreement:agreeCount,coverage:occupancy,
  noTypeOrColorInferred:true,automaticSaveAllowed:false};
}
/** Browser-bound in-memory analysis; the original image and SHA are unchanged. */
export function detectFlatlayFromImage29(image,{maxDimension=512}={}){
 const w=image?.naturalWidth||image?.width,h=image?.naturalHeight||image?.height;
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<40||h<40||
    w>8192||h>8192||w*h>48_000_000)return no('invalid-original-dimensions');
 if(!Number.isInteger(maxDimension)||maxDimension<128||maxDimension>512)
  return no('invalid-analysis-dimension');
 const scale=Math.min(1,maxDimension/Math.max(w,h));
 const canvas=document.createElement('canvas');
 canvas.width=Math.max(1,Math.round(w*scale));
 canvas.height=Math.max(1,Math.round(h*scale));
 const context=canvas.getContext('2d',{willReadFrequently:true});
 if(!context)return no('canvas-unavailable');
 context.drawImage(image,0,0,canvas.width,canvas.height);
 const pixels=context.getImageData(0,0,canvas.width,canvas.height);
 // Real browser ImageData exposes width/height/data through non-enumerable
 // prototype getters. Spreading ImageData drops them and silently rejects
 // every real photo; copy the three properties explicitly.
 return flatlayContrastBoxes29({data:pixels.data,width:pixels.width,height:pixels.height,channels:4});
}
