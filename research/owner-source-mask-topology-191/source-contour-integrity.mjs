import {verifyLocalSourceContinuity192} from '../owner-local-mask-continuity-192/source-local-continuity.mjs';
/**
 * Closet Current MAIN P191 — actual decoded owner alpha topology vs pinned
 * licensed original garment PNG. Research-only; source geometry authenticity
 * and independent human annotation are NEVER inferred from a passing score.
 *
 * Stops fragmented / shifted / punctured masks before physical 163-bone P190
 * garment deformation. The input mask JPEG/PNG remains owner-private; only
 * bounded scalar integrity receipts cross the private research seam.
 */
const SOURCE='e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24';
const SHA=/^[0-9a-f]{64}$/;
const fail=message=>{throw Error('P191 '+message);};
const valid=(bytes,w,h)=>bytes instanceof Uint8ClampedArray&&
 Number.isInteger(w)&&Number.isInteger(h)&&w>=32&&h>=32&&
 w*h<=192*192&&bytes.length===w*h*4;
const pct=n=>Math.round(n*10000)/10000;
function shape(bytes,w,h){
 const pixels=new Uint8Array(w*h);
 let count=0,edge=0,left=w,right=-1,top=h,bottom=-1;
 const rows=Array.from({length:h},()=>({first:w,last:-1,visible:0}));
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=y*w+x;
  if(bytes[i*4+3]<160)continue;
  pixels[i]=1;count++;left=Math.min(left,x);right=Math.max(right,x);
  top=Math.min(top,y);bottom=Math.max(bottom,y);
  const row=rows[y];row.first=Math.min(row.first,x);row.last=Math.max(row.last,x);row.visible++;
  if(x===0||y===0||x===w-1||y===h-1)edge++;
 }
 if(count<w*h*.03||count>w*h*.9||left<1||right>=w-1||top<1||bottom>=h-1)
  fail('blank, clipped, overfilled or border-touching photograph alpha');
 const flood=(foreground)=>{
  const seen=new Uint8Array(w*h),queue=new Int32Array(w*h);
  let largest=0,holes=0;
  const visit=(start)=>{
   let read=0,write=1;queue[0]=start;seen[start]=1;
   while(read<write){
    const idx=queue[read++],x=idx%w,y=Math.floor(idx/w);
    if(x>0){const p=idx-1;if(!seen[p]&&pixels[p]===foreground){seen[p]=1;queue[write++]=p;}}
    if(x<w-1){const p=idx+1;if(!seen[p]&&pixels[p]===foreground){seen[p]=1;queue[write++]=p;}}
    if(y>0){const p=idx-w;if(!seen[p]&&pixels[p]===foreground){seen[p]=1;queue[write++]=p;}}
    if(y<h-1){const p=idx+w;if(!seen[p]&&pixels[p]===foreground){seen[p]=1;queue[write++]=p;}}
   }
   return write;
  };
  for(let i=0;i<pixels.length;i++)if(pixels[i]===foreground&&!seen[i]){
   const n=visit(i);
   if(foreground===1)largest=Math.max(largest,n);
   else{
    // Background pockets connected to the image border are not fabric holes.
    let touches=false;
    // Check component membership via scanning its queue, whose last visit
    // is still live here; no image pixels are returned to the caller.
    for(let j=0;j<n;j++){
     const p=queue[j],x=p%w,y=Math.floor(p/w);
     if(x===0||y===0||x===w-1||y===h-1){touches=true;break;}
    }
    if(!touches)holes+=n;
   }
  }
  return foreground===1?largest:holes;
 };
 const largest=flood(1);
 const holes=flood(0);
 return {pixels,rows,count,edge,left,right,top,bottom,
  largestConnectedRatio:largest/count,holePixelRatio:holes/count};
}
/** Byte-array algorithm useful for both genuine browser masks and adversarial tests. */
export function verifyDecodedSourceContour191({
 sourceData,ownerData,width,height,sourceSHA256,ownerMaskSHA256
}={}){
 if(!valid(sourceData,width,height)||!valid(ownerData,width,height)||
    sourceSHA256!==SOURCE||!SHA.test(ownerMaskSHA256||'')||
    ownerMaskSHA256===SOURCE)
  fail('exact original source and current owner PNG SHA plus RGBA pixel arrays required');
 const src=shape(sourceData,width,height),own=shape(ownerData,width,height);
 let intersection=0,union=0;
 for(let i=0;i<src.pixels.length;i++){
  const a=src.pixels[i]===1,b=own.pixels[i]===1;
  if(a&&b)intersection++;
  if(a||b)union++;
 }
 const iou=intersection/union,contained=intersection/own.count;
 const areaRatio=own.count/src.count,changed=(union-intersection)/src.count;
 if(iou<.80||contained<.965||areaRatio<.80||areaRatio>1.03||
    changed<.007||changed>.24)
  fail('owner mask does not match original licensed garment source coverage');
 if(own.largestConnectedRatio<.87||
    own.largestConnectedRatio+0.025<src.largestConnectedRatio||
    own.holePixelRatio>src.holePixelRatio+.016)
  fail('disconnected garment islands or artificial internal alpha holes');
 let rows=0,centerSum=0,maxCenter=0;
 for(let y=0;y<height;y++){
  const a=src.rows[y],b=own.rows[y];
  if(a.visible<Math.max(12,width*.13))continue;
  if(b.visible<Math.max(11,width*.11))
   fail('source torso row erased from verified owner garment');
  const center=Math.abs((a.first+a.last-b.first-b.last)/2)/width;
  centerSum+=center;maxCenter=Math.max(maxCenter,center);rows++;
 }
 if(rows<height*.28||centerSum/rows>.022||maxCenter>.072)
  fail('unregistered or laterally shifted owner alpha contour');
 const local192=verifyLocalSourceContinuity192({
  sourcePixels:src.pixels,ownerPixels:own.pixels,width,height
 });
 return Object.freeze({...local192,sourceId:'commons-0016',
  sourceSHA256:SOURCE,ownerMaskSHA256,
  ownerSourceOverlapIoU191:pct(iou),
  ownerInsideSourceFraction191:pct(contained),
  ownerLargestComponentRatio191:pct(own.largestConnectedRatio),
  ownerInternalHoleRatio191:pct(own.holePixelRatio),
  sourceInternalHoleRatio191:pct(src.holePixelRatio),
  ownerAreaRatio191:pct(areaRatio),
  registrationRows191:rows,
  registrationMaxOffset191:pct(maxCenter),
  actualDecodedAlphaConnected191:true,sourceSpecificLicensedBlouseOnly:true,
  independentHumanReviewVerified:false,maskSegmentationAccuracyCertified:false,
  generalOwnerPhotoGarmentFitting:false,rearIsInferred:true,
  releaseAuthorized:false,familyAlpha:'HOLD'});
}
export function verifyOwnerSourceTopology191({
 source,owner,sourceSHA256,ownerMaskSHA256
}={}){
 const w=source?.naturalWidth||source?.width,h=source?.naturalHeight||source?.height;
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<32||h<32||
    w*h>8000000||
    (owner?.naturalWidth||owner?.width)!==w||
    (owner?.naturalHeight||owner?.height)!==h)
  fail('source and owner image must share the same exact registered pixel coordinates');
 if(typeof document?.createElement!=='function')
  fail('original source and private PNG canvas availability required');
 // Only bounded raster samples are used for integrity; full owner originals
 // remain in the native owner-private donor, never returned through status.
 const scale=Math.min(1,192/Math.max(w,h));
 const sw=Math.max(32,Math.round(w*scale)),sh=Math.max(32,Math.round(h*scale));
 const data=image=>{
  const c=document.createElement('canvas');c.width=sw;c.height=sh;
  const ctx=c.getContext('2d',{willReadFrequently:true});
  if(!ctx)fail('actual source/owner alpha readback unavailable');
  ctx.drawImage(image,0,0,sw,sh);
  try{return ctx.getImageData(0,0,sw,sh).data;}
  catch{fail('cross-origin or unreadable owner/source alpha cannot be trusted');}
 };
 return verifyDecodedSourceContour191({
  sourceData:data(source),ownerData:data(owner),width:sw,height:sh,
  sourceSHA256,ownerMaskSHA256});
}
