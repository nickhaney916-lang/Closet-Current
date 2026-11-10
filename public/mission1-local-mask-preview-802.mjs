/**
 * Mission 1 P802: bounded, entirely on-device source-pixel COLOR-CONNECTED
 * experimental garment preview from a genuinely owner-verified original box
 * AND point. This is not SAM2, automatic garment detection, a verified mask,
 * a learned clothing label, or authorization to save any derived cutout.
 *
 * No network calls, external images, storage, canvas, DOM, or WebGL here.
 * The caller supplies a <=512x512 resampling of its already-shown original
 * JPEG, validated by P798/P800. Result is an ephemeral RGBA overlay only.
 */
const SHA=/^[a-f0-9]{64}$/;
const fail=why=>{throw Error('M1_LOCAL_MASK_802 '+why);};
function validPoint(box,point){
 if(!box||!point||
    box.schema!=='closet-current-m1-owner-original-rectangle-800/review-only/v1'||
    point.schema!=='closet-current-m1-owner-original-point-798/review-only/v1'||
    !SHA.test(box.sourceSHA256||'')||
    point.sourceSHA256!==box.sourceSHA256||
    !box.twoVerifiedOriginalJPEGCornerTaps||
    !point.sourceBytesSHA256Verified||!point.capturedFromOriginalJPEG||
    !box.ownerId||point.ownerId!==box.ownerId||
    !box.sourceId||point.sourceId!==box.sourceId||
    !Number.isInteger(box.sourceWidth)||!Number.isInteger(box.sourceHeight)||
    box.sourceWidth<1||box.sourceHeight<1||
    box.sourceWidth>8192||box.sourceHeight>8192||
    point.sourceWidth!==box.sourceWidth||point.sourceHeight!==box.sourceHeight||
    !Number.isInteger(point.pointX)||!Number.isInteger(point.pointY)||
    ![box.x0,box.y0,box.x1,box.y1].every(Number.isInteger)||
    !(0<=box.x0&&box.x0<box.x1&&box.x1<=box.sourceWidth)||
    !(0<=box.y0&&box.y0<box.y1&&box.y1<=box.sourceHeight)||
    point.pointX<box.x0||point.pointX>=box.x1||
    point.pointY<box.y0||point.pointY>=box.y1)
  fail('matching SHA-verified original owner box AND garment seed required');
}
export function makeOwnerSeededLocalPreview802({
 box,point,pixels,width,height,colorTolerance=90
}={}){
 validPoint(box,point);
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||
    width>512||height>512||width*height>262144||
    !(pixels instanceof Uint8ClampedArray)||
    pixels.length!==width*height*4||
    !Number.isInteger(colorTolerance)||colorTolerance<30||colorTolerance>120)
  fail('original thumbnail pixels or bounded local-memory budget invalid');
 const x0=Math.max(0,Math.floor(box.x0*width/box.sourceWidth));
 const y0=Math.max(0,Math.floor(box.y0*height/box.sourceHeight));
 const x1=Math.min(width,Math.ceil(box.x1*width/box.sourceWidth));
 const y1=Math.min(height,Math.ceil(box.y1*height/box.sourceHeight));
 if(x1-x0<2||y1-y0<2)fail('owner rectangle too small at bounded preview resolution');
 const seedX=Math.min(width-1,Math.floor((point.pointX+.5)*width/box.sourceWidth));
 const seedY=Math.min(height-1,Math.floor((point.pointY+.5)*height/box.sourceHeight));
 if(seedX<x0||seedY<y0||seedX>=x1||seedY>=y1)
  fail('seed outside pixel-space rectangle');
 const seed=seedY*width+seedX,offset=seed*4;
 if(pixels[offset+3]<200)fail('unavailable original JPEG seed pixel');
 const rgb=[pixels[offset],pixels[offset+1],pixels[offset+2]];
 const threshold=3*colorTolerance*colorTolerance;
 const visited=new Uint8Array(width*height);
 const queue=new Int32Array((x1-x0)*(y1-y0));
 const overlay=new Uint8ClampedArray(width*height*4);
 let read=0,write=0;
 visited[seed]=1;queue[write++]=seed;
 while(read<write){
  const p=queue[read++],i=p*4;
  // True original-image pixels (resampled once), with a bounded
  // four-connected region seeded by the owner's actual garment point.
  overlay[i]=31;overlay[i+1]=117;overlay[i+2]=219;overlay[i+3]=112;
  const x=p%width,y=Math.floor(p/width);
  const neighbors=[];
  if(x>x0)neighbors.push(p-1);
  if(x+1<x1)neighbors.push(p+1);
  if(y>y0)neighbors.push(p-width);
  if(y+1<y1)neighbors.push(p+width);
  for(const n of neighbors){
   if(visited[n])continue;
   visited[n]=1;
   const j=n*4;
   const dr=pixels[j]-rgb[0],dg=pixels[j+1]-rgb[1],db=pixels[j+2]-rgb[2];
   if(pixels[j+3]<200||dr*dr+dg*dg+db*db>threshold)continue;
   queue[write++]=n;
  }
 }
 if(write<3)fail('no meaningful local connected-color region: use manual review');
 return {
  schema:'closet-current-m1-owner-local-color-mask-802/ephemeral-preview/v1',
  sourceSHA256:box.sourceSHA256,ownerId:box.ownerId,sourceId:box.sourceId,
  width,height,maskPixels:write,ownerBoxPixels:(x1-x0)*(y1-y0),
  fractionOfBox:write/((x1-x0)*(y1-y0)),overlay,
  previewOnly:true,originalJPEGUnchanged:true,
  pixelDerivedLocalHeuristic:true,actualPixelRegionGenerated:true,
  sam2ModelRun:false,learnedGarmentSegmentation:false,
  independentHumanVerified:false,ownerApprovedMask:false,
  categoryConfirmed:false,subtypeConfirmed:false,colorConfirmed:false,
  autoSaveAllowed:false,privatePersisted:false,externalUpload:false
 };
}
