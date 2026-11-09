/**
 * Closet Current P194 — source-specific hairline fabric continuity, HOLD.
 * P191 global IoU + topology and P192 per-row wide-slit tests are required
 * first. A narrow vertical rip (<10% of any single torso row) can still
 * persist for dozens of rows while presenting a plausible bounding box.
 *
 * Inspect only robust original licensed source-alpha INTERIORS; ignore
 * 14%-inset edges to preserve legitimate P190 narrow contour changes and
 * source neckline/strap negative space. A connected missing interior fabric
 * run must be BOTH tall and sufficiently populated to fail; isolated noise
 * never masquerades as independent human segmentation adjudication.
 */
const fail=x=>{throw Error('P194 '+x);};
const good=(p,w,h)=>p instanceof Uint8Array&&p.length===w*h;
export function verifyHairlineSourceContinuity194({
 sourcePixels,ownerPixels,width,height
}={}){
 if(!Number.isInteger(width)||!Number.isInteger(height)||
    width<32||height<32||width*height>192*192||
    !good(sourcePixels,width,height)||!good(ownerPixels,width,height))
  fail('bounded genuine decoded original and reviewed alpha pixels required');
 const gaps=new Uint8Array(width*height);
 let inspectedRows=0,corePixels=0;
 for(let y=0;y<height;y++){
  let x=0,hasCore=false;
  while(x<width){
   if(sourcePixels[y*width+x]!==1){x++;continue;}
   const first=x;
   while(x<width&&sourcePixels[y*width+x]===1)x++;
   const span=x-first;
   // Short source sleeves/straps and a genuine neckline are NOT fabricated
   // as torso material. Use robust original licensed silhouette interiors.
   if(span<Math.max(20,Math.ceil(width*.16)))continue;
   const inset=Math.max(3,Math.ceil(span*.14));
   if(span<=inset*2+8)continue;
   hasCore=true;
   for(let k=first+inset;k<x-inset;k++){
    const i=y*width+k;
    corePixels++;
    if(ownerPixels[i]!==1)gaps[i]=1;
   }
  }
  if(hasCore)inspectedRows++;
 }
 if(inspectedRows<Math.ceil(height*.2)||corePixels<width*height*.035)
  fail('adequate original source garment interior pixels not available');
 // Connected differences, not scattered pixel counts. Iterative bounded
 // flood scan avoids stack overflow on unusual masks; never returns pixels.
 const seen=new Uint8Array(gaps.length),queue=new Int32Array(gaps.length);
 const thresholdArea=Math.max(24,Math.ceil(width*height*.00055));
 const thresholdHeight=Math.max(12,Math.ceil(height*.14));
 let maxComponentPixels=0,maxComponentHeight=0,components=0;
 for(let root=0;root<gaps.length;root++){
  if(!gaps[root]||seen[root])continue;
  let count=0,read=0,write=1,minY=height,maxY=0,minX=width,maxX=0;
  seen[root]=1;queue[0]=root;components++;
  while(read<write){
   const i=queue[read++],x=i%width,y=Math.floor(i/width);
   count++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);
   minY=Math.min(minY,y);maxY=Math.max(maxY,y);
   for(const neighbor of [x>0?i-1:-1,x+1<width?i+1:-1,
                          y>0?i-width:-1,y+1<height?i+width:-1]){
    if(neighbor>=0&&!seen[neighbor]&&gaps[neighbor]){
     seen[neighbor]=1;queue[write++]=neighbor;
    }
   }
  }
  const heightPixels=maxY-minY+1,widthPixels=maxX-minX+1;
  maxComponentPixels=Math.max(maxComponentPixels,count);
  maxComponentHeight=Math.max(maxComponentHeight,heightPixels);
  if(count>=thresholdArea&&heightPixels>=thresholdHeight&&
     widthPixels>=2)
   fail('persistent narrow missing-fabric hairline in actual owner alpha');
 }
 return Object.freeze({
  ownerSourceHairlineContinuous194:true,
  sourceInteriorExaminedRows194:inspectedRows,
  sourceInteriorExaminedPixels194:corePixels,
  missingInteriorComponents194:components,
  maxMissingComponentPixels194:maxComponentPixels,
  maxMissingComponentHeight194:maxComponentHeight,
  licensedSourceOnly:true,
  independentHumanSegmentationReviewed:false,
  otherGarmentTypesCertified:false,
  releasedToProduction:false,releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
