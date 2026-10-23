/**
 * Family Alpha Assignment #13: research-only, offline garment-photo preparation.
 * NEVER writes, resizes, re-encodes, or modifies an original. The caller MUST
 * independently authenticate owner and original-image provenance. A string
 * source token is not proof of ownership. No ML model/network/storage calls.
 *
 * Input: decoded retained-original RGBA pixels from an approved source.
 * Only near-uniform/corner-confirmed backgrounds can be isolated safely here.
 * Complex scenes return REVIEW for the upstream segmentation model; never
 * pass an entire person/scene as if it were a masked garment.
 */
const VALID=new Set(['Tops','Bottoms','Dresses','Outerwear','Shoes']);
const pixelIndex=(w,x,y)=>(y*w+x)*4;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const failure=reason=>({status:'review',reason,autoSaved:false,image:null,verifiedOwner:false});
function frameCheck(frame){
 const {width:w,height:h,data}=frame||{};
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<32||h<32||w*h>8_000_000||
  !(data instanceof Uint8Array||data instanceof Uint8ClampedArray)||
  data.length!==w*h*4)throw new Error('Invalid decoded original RGBA frame');
 return {w,h,data};
}
function backgroundEstimate(w,h,data){
 const coords=[[0,0],[w-1,0],[0,h-1],[w-1,h-1]];
 const corners=coords.map(([x,y])=>Array.from(data.slice(pixelIndex(w,x,y),pixelIndex(w,x,y)+4)));
 if(corners.some(c=>c[3]<250))return null;
 const background=[0,1,2].map(i=>Math.round(corners.reduce((s,c)=>s+c[i],0)/4));
 if(corners.some(c=>Math.max(...background.map((v,i)=>Math.abs(v-c[i])))>15))return null;
 // Explicitly refuse backgrounds with inconsistent sides/large light gradients.
 const samples=Array.from({length:11},(_,i)=>i/10);
 const sides=[];
 for(const a of samples){const x=Math.min(w-1,Math.round((w-1)*a)),y=Math.min(h-1,Math.round((h-1)*a));
  for(const [sx,sy] of [[x,0],[x,h-1],[0,y],[w-1,y]]){
   const p=pixelIndex(w,sx,sy);
   sides.push(Math.max(...background.map((v,k)=>Math.abs(v-data[p+k]))));
  }
 }
 if(sides.filter(v=>v>27).length>3)return null;
 return background;
}
function connected(mask,w,h){
 const visited=new Uint8Array(mask.length),parts=[],queue=new Int32Array(mask.length);
 for(let i=0;i<mask.length;i++){
  if(mask[i]===0||visited[i])continue;
  let head=0,tail=1,left=w,top=h,right=0,bottom=0;
  queue[0]=i;visited[i]=1;
  while(head<tail){
   const p=queue[head++],x=p%w,y=Math.floor(p/w);
   left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
   for(const n of [x>0?p-1:-1,x+1<w?p+1:-1,y>0?p-w:-1,y+1<h?p+w:-1]){
    if(n>=0&&mask[n]&&!visited[n]){visited[n]=1;queue[tail++]=n;}
   }
  }
  parts.push({count:tail,left,top,right,bottom,pixels:queue.slice(0,tail)});
 }
 return parts.sort((a,b)=>b.count-a.count);
}
function within(bounds,w,h,padding=.045){
 const bw=bounds.right-bounds.left+1,bh=bounds.bottom-bounds.top+1,
  p=Math.max(2,Math.ceil(Math.max(bw,bh)*padding));
 return {left:clamp(bounds.left-p,0,w-1),top:clamp(bounds.top-p,0,h-1),
  right:clamp(bounds.right+p+1,1,w),bottom:clamp(bounds.bottom+p+1,1,h)};
}
export function prepareSyntheticGarmentOriginal(frame,{
 category,sourceIdentity,sourceVersion,mask=null,edgeTolerance=42
}={}){
 const {w,h,data}=frameCheck(frame);
 if(!VALID.has(category))return failure('unsupported-garment-category');
 // Source references only; never claim original ownership is verified here.
 if(typeof sourceIdentity!=='string'||sourceIdentity.length<1||sourceIdentity.length>120||
  !/^[a-zA-Z0-9:_-]+$/.test(sourceIdentity)||typeof sourceVersion!=='string'||
  sourceVersion.length<8||sourceVersion.length>128||!/^[a-zA-Z0-9:_-]+$/.test(sourceVersion))
  return failure('missing-source-identity');
 if(mask!==null&&(!(mask instanceof Uint8Array)||mask.length!==w*h||
    mask.some(x=>x!==0&&x!==1&&x!==255)))return failure('invalid-segmentation-mask');
 let selected;
 if(mask){
  selected=Uint8Array.from(mask,x=>Number(x>0));
 }else{
  const bg=backgroundEstimate(w,h,data);
  if(!bg)return failure('busy-or-ambiguous-background');
  selected=new Uint8Array(w*h);
  for(let i=0;i<selected.length;i++){
   const p=i*4,diff=Math.max(...bg.map((v,k)=>Math.abs(data[p+k]-v)));
   selected[i]=Number(data[p+3]>=220&&diff>edgeTolerance);
  }
 }
 const parts=connected(selected,w,h);
 if(!parts.length)return failure('blank-or-indistinguishable-garment');
 const largest=parts[0],minPixels=Math.max(64,Math.ceil(w*h*.018));
 if(largest.count<minPixels)return failure('garment-too-small');
 // The pair-of-shoes exception is explicit. Never merge split garments from
 // separate captures, stripes, or overlapping people into one avatar texture.
 let chosen=[largest];
 if(category==='Shoes'&&parts[1]&&parts[1].count>=Math.max(40,largest.count*.20))chosen.push(parts[1]);
 const count=chosen.reduce((n,p)=>n+p.count,0);
 if(parts.slice(chosen.length).some(p=>p.count>=Math.max(80,largest.count*.22)))
  return failure('multiple-garments-or-ambiguous-pieces');
 if(count>=w*h*.93)return failure('full-frame-not-isolated');
 const bbox={left:Math.min(...chosen.map(p=>p.left)),top:Math.min(...chosen.map(p=>p.top)),
  right:Math.max(...chosen.map(p=>p.right)),bottom:Math.max(...chosen.map(p=>p.bottom))};
 if(bbox.left===0||bbox.top===0||bbox.right===w-1||bbox.bottom===h-1)
  return failure('garment-clipped-by-photo-edge');
 const bounding=within(bbox,w,h),pw=bounding.right-bounding.left,ph=bounding.bottom-bounding.top;
 if(Math.min(pw,ph)<24||count/(pw*ph)<.045)return failure('garment-details-not-reliable');
 const kept=new Uint8Array(w*h);
 for(const component of chosen)for(const position of component.pixels)kept[position]=1;
 const pixels=new Uint8ClampedArray(pw*ph*4);
 for(let y=0;y<ph;y++)for(let x=0;x<pw;x++){
  const src=(y+bounding.top)*w+x+bounding.left,from=4*src,to=4*(y*pw+x);
  // Preserve RGB bytes even for transparent pixels so foreground hues/stripes
  // are never substituted with a generic solid-color garment.
  pixels[to]=data[from];pixels[to+1]=data[from+1];pixels[to+2]=data[from+2];
  pixels[to+3]=kept[src]?data[from+3]:0;
 }
 const visible=chosen.reduce((s,p)=>s+p.count,0);
 return {
  status:'prepared',format:'rgba-transparent-uncompressed',width:pw,height:ph,
  naturalWidth:w,naturalHeight:h,bounds:bounding,foregroundPixels:visible,
  backgroundPixels:pw*ph-visible,rgba:pixels,
  sourceIdentity,sourceVersion,sourceRole:'retained-original',
  category,autoSaved:false,verifiedOwner:false,garmentSilhouetteConfidence:'uniform-background-only',
  originalPixelsModified:false,requiresOwnerVerification:true
 };
}
/** Contain placement computed against the PR #256 normalized layer planner.
 * Unlike CSS object-fit:fill, contain preserves the actual photographed
 * garment's aspect ratio; caller still owns body fitting and layering.
 */
export function containGarmentInSlot(prepared,slot,{frameWidth=360,frameHeight=600}={}){
 if(prepared?.status!=='prepared'||!slot||!['x','y','width','height'].every(k=>typeof slot[k]==='number'&&Number.isFinite(slot[k]))||
  !Number.isFinite(frameWidth)||!Number.isFinite(frameHeight)||frameWidth<=0||frameHeight<=0||
  slot.width<=0||slot.height<=0||slot.x<0||slot.x>1||slot.y<0||slot.y>1)
  throw Error('Invalid prepared garment or proposed slot');
 const boxW=frameWidth*slot.width,boxH=frameHeight*slot.height;
 const scale=Math.min(boxW/prepared.width,boxH/prepared.height);
 const width=prepared.width*scale,height=prepared.height*scale;
 const centerX=slot.x*frameWidth,centerY=slot.y*frameHeight;
 return {left:centerX-width/2,top:centerY-height/2,width,height,
  originalAspectRatio:prepared.width/prepared.height,
  displayedAspectRatio:width/height,scale,clipped:false,
  bodyFitVerified:false};
}
