/**
 * PHOTO104 pure, source-measured neutral-rear knee fold field.
 * Actual vertex deformation is applied only by pose-responsive-denim-folds.mjs.
 * This is an anatomical-pose-conditioned procedural fabric *shape*, not
 * a cloth physics simulation or independent human photorealism verdict.
 */
export function poseDenimFoldAmplitude104({degrees,kneeY,y,across,rear,sourceFront}={}){
 const vals=[degrees,kneeY,y,across,rear,sourceFront];
 if(vals.some(v=>typeof v!=='number'||!Number.isFinite(v))||
  degrees<0||degrees>16||Math.abs(across)>.35||
  sourceFront<0||sourceFront>1||rear<0||rear>1)
  throw Error('PHOTO104 requires finite original bone/knee/rear measurements within verified source range');
 if(!degrees||sourceFront>=.16||rear<=0)return 0;
 const angleWeight=Math.sin(degrees*Math.PI/(16*2));
 // Two anatomically local overlapping transverse fold peaks, measured
 // relative to actual knee height, with a slight diagonal leg-wise phase.
 // On the source-neutral rear ONLY, pull outward a bounded depth. Signed
 // negative z is posterior on the exact vetted PR541 torso orientation.
 const shifted=y-kneeY+.028-.13*across;
 const gaussian=(position,width)=>Math.exp(-.5*((shifted-position)/width)**2);
 const ridge=gaussian(0,.038)+.59*gaussian(-.080,.030)-.24*gaussian(-.045,.020);
 const envelope=Math.max(0,Math.min(1.2,ridge));
 const sourceNeutral=Math.max(0,1-sourceFront/.16);
 const delta=-.009*angleWeight*rear*sourceNeutral*envelope;
 if(!Number.isFinite(delta)||delta>0||delta<-.011)
  throw Error('PHOTO104 source-neutral rear fold exceeded 11 mm geometry envelope');
 return delta;
}
