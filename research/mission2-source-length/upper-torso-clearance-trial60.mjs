/**
 * Mission 2 C60: bounded, DISPOSABLE world-coordinate upper-torso fit
 * experiment on a genuine SHA-pinned licensed source 163-bone photograph.
 * The returned world buffer is never written to the original garment mesh,
 * original JPEG, 3D skin, source rest/UV, or private owner wardrobe.
 *
 * This is a single numerical fit hypothesis, not a validated 3D garment
 * reconstruction, preview rendering, natural textile simulation or an
 * authorization to alter source photographs or production geometry.
 */
import assert from 'node:assert/strict';
const finite3=p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite);
const smooth=(a,b,x)=>{
 const t=Math.max(0,Math.min(1,(x-a)/(b-a)));
 return t*t*(3-2*t);
};
export const UPPER_TORSO_TRIAL_OUTWARD60=.006;
export function createDisposableUpperTorsoWorldTrial60(
 originalWorld,{neck,spine,outwardMeters=UPPER_TORSO_TRIAL_OUTWARD60}={}
){
 assert.ok(originalWorld instanceof Float32Array&&
  originalWorld.length>=9&&originalWorld.length%3===0,
  'C60 genuine skinned original cloth world positions are required');
 assert.ok(finite3(neck)&&finite3(spine)&&
  neck[1]>spine[1]+.001,
  'C60 original source upright neck/spine landmarks required');
 assert.ok(Number.isFinite(outwardMeters)&&
  outwardMeters>0&&outwardMeters<=.012,
  'C60 outward trial must stay within original-source 12mm research bound');
 const out=originalWorld.slice();
 let moved=0,maxDelta=0;
 // C59 detects strict witnesses only in the height band neck01..spine04.
 // Feather outside BOTH landmarks, avoiding an artificial discontinuity
 // or sharp edges at the waist or neckline. Do not translate the skirt.
 const lower=spine[1]-.12,lowerFull=spine[1]+.12,
  upperFull=neck[1]-.12,upper=neck[1]+.12;
 assert.ok(upperFull>lowerFull,
  'C60 authentic original neck/spine source separation insufficient for controlled feather');
 for(let i=0;i<originalWorld.length;i+=3){
  const x=originalWorld[i],y=originalWorld[i+1],z=originalWorld[i+2];
  assert.ok([x,y,z].every(Number.isFinite),
   'C60 original photo-linked source world triangle nonfinite');
  const weight=smooth(lower,lowerFull,y)*
   (1-smooth(upperFull,upper,y));
  if(weight<=0)continue;
  const dx=x-spine[0],dz=z-spine[2],
   radius=Math.hypot(dx,dz);
  if(radius<=1e-8)continue;
  const amount=outwardMeters*weight;
  const nx=Math.fround(x+dx/radius*amount),
   nz=Math.fround(z+dz/radius*amount);
  const delta=Math.hypot(nx-x,nz-z);
  assert.ok(delta<=outwardMeters+2e-6,
   'C60 no source trial vertex may move beyond conservative upper torso bound');
  if(delta>1e-8){moved++;maxDelta=Math.max(maxDelta,delta);}
  out[i]=nx;out[i+2]=nz;
 }
 return Object.freeze({
  world:out,
  movedVertices:moved,
  maxAppliedMeters:maxDelta,
  originalPhotographedSourceMeshChanged:false,
  originalSkinned163BoneSourceChanged:false,
  originalPhotoOrShaderTextureChanged:false,
  allRawTrialCoordinatesRemainInMemoryOnly:true,
  sourceClothFitCertified:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
