/** Observed FRONT panel only, derived from supplied alpha, never a fitted
 * garment, hidden surface, fabric simulation or anatomical rig. Image-space
 * units retain source aspect ratio; metric size is deliberately unknown.
 */
export function buildObservedPhotoPanel86({alpha,width,height,sourceSHA256,maskSHA256}={}){
 if(!(alpha instanceof Uint8Array)||!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||
  width<2||height<2||width>256||height>256||alpha.length!==width*height||
  ![sourceSHA256,maskSHA256].every(s=>/^[a-f0-9]{64}$/.test(s||'')))throw Error('bounded authenticated alpha required');
 const positions=[],uv=[],indices=[],corners=new Map();let pixels=0;
 const vertex=(x,y)=>{const k=y*(width+1)+x;if(corners.has(k))return corners.get(k);
  const i=positions.length/3;corners.set(k,i);
  positions.push((x-width/2)/height,(height/2-y)/height,0);uv.push(x/width,1-y/height);return i;};
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(alpha[y*width+x]>=128){
  pixels++;const a=vertex(x,y),b=vertex(x+1,y),c=vertex(x+1,y+1),d=vertex(x,y+1);
  indices.push(a,c,b,a,d,c);
 }
 if(!pixels||pixels===width*height)throw Error('empty or unsegmented full frame rejected');
 return {positions:new Float32Array(positions),uv:new Float32Array(uv),indices:new Uint32Array(indices),
  receipt:Object.freeze({sourceSHA256,maskSHA256,width,height,foregroundPixels:pixels,
   triangles:indices.length/3,vertices:positions.length/3,
   silhouetteAreaImageUnits:pixels/(height*height),frontOnly:true,depthMeasured:false,
   physicalSizeMeasured:false,rigged:false,maskHumanApproved:false,
   hiddenSurface:'UNOBSERVED',fittedGarment:false,releaseAuthorized:false,familyAlpha:'HOLD'})};
}
