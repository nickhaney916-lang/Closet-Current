'use strict';
// Display-only anti-jagged edge finishing for ALREADY approved hard-alpha
// cutouts. Never attempts extraction, background removal, photo repair,
// segmentation, or fabric generation. Returns a new RGBA copy.
(function(root){
 const MAX_PIXELS=600000;
 const finish=(pixels,width,height)=>{
  const hold=reason=>Object.freeze({eligible:false,reason,sourceAltered:false,
   inventedPixels:false,visualQualityVerified:false});
  if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||
    width<24||height<24||width*height>MAX_PIXELS||
    !(pixels instanceof Uint8Array||pixels instanceof Uint8ClampedArray)||
    pixels.length!==width*height*4)return hold('invalid-approved-cutout');
  let clear=0,opaque=0,soft=0;
  for(let i=3;i<pixels.length;i+=4){
   if(pixels[i]===0)clear++;
   else if(pixels[i]===255)opaque++;
   else soft++;
  }
  const n=width*height;
  // A native PNG with true semi-transparency may contain intentional fine
  // mesh/cuffs/hair. Never modify its existing soft edge treatment.
  if(soft>0)return hold('existing-soft-alpha-preserved');
  if(clear<n*.05||opaque<n*.05)return hold('missing-verified-clear-and-opaque-regions');
  const copy=new Uint8ClampedArray(pixels);
  let softened=0;
  for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){
   const i=y*width+x,at=i*4;
   if(pixels[at+3]!==255)continue;
   let transparentNeighbors=0,opaqueNeighbors=0;
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    if(!dx&&!dy)continue;
    const value=pixels[((y+dy)*width+x+dx)*4+3];
    if(value===0)transparentNeighbors++;
    else if(value===255)opaqueNeighbors++;
   }
   // Soften only one-pixel, reasonably broad contour edges. Isolated fine
   // fibres, seams and small points are not cropped or thinned.
   if(transparentNeighbors>=2&&transparentNeighbors<=4&&opaqueNeighbors>=4){
    copy[at+3]=232;softened++;
   }
  }
  if(softened<8)return hold('insufficient-stable-hard-edge');
  const loss=softened*23/(opaque*255);
  if(loss>.01)return hold('excessive-display-opacity-loss');
  return {eligible:true,reason:'bounded-hard-edge-antialias',
   pixels:copy,softenedEdgePixels:softened,alphaMassLossFraction:loss,
   allRgbUnchanged:true,alphaNeverIncreased:true,sourceAltered:false,
   inventedPixels:false,visualQualityVerified:false};
 };
 root.ClosetGarmentEdgeFinish=Object.freeze({finish,MAX_PIXELS});
 if(typeof module!=='undefined')module.exports=root.ClosetGarmentEdgeFinish;
})(typeof window!=='undefined'?window:globalThis);
