/**
 * SOURCE-COVERAGE-10: paired TRUE browser-canvas RGB proof, clipped to
 * original lower-garment rows, never UI edges or the unphotographed backdrop.
 * The matched source, rig and camera are validated by the caller.
 */
export function photographedLowerGarmentPixelWitness10(before,after){
 const a=before?.info,b=after?.info;
 if(!a||!b||!Number.isInteger(a.width)||!Number.isInteger(a.height)||
   a.width<100||a.height<200||a.width!==b.width||a.height!==b.height||
   a.channels!==3||b.channels!==3||
   before.data?.length!==a.width*a.height*3||
   after.data?.length!==a.width*a.height*3)
  throw Error('Exact paired browser RGB garment frame dimensions required');
 const startY=Math.floor(a.height*.50),endY=Math.ceil(a.height*.95);
 let changed=0;
 for(let y=startY;y<endY;y++)for(let x=0;x<a.width;x++){
  const i=(y*a.width+x)*3;
  if(Math.abs(before.data[i]-after.data[i])+
   Math.abs(before.data[i+1]-after.data[i+1])+
   Math.abs(before.data[i+2]-after.data[i+2])>24)changed++;
 }
 return Object.freeze({changedGarmentPixels:changed,topRowExcluded:true,
  originalLowerGarmentRowsOnly:true,rowStart:startY,rowEnd:endY,
  sourceIdentityValidatedByCaller:true,releaseAuthorized:false});
}
