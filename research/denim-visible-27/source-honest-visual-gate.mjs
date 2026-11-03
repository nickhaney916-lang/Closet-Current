/**
 * DENIM-VISUAL-27: deterministic evidence validator and raw-pixel analysis.
 * Research only. This evaluates original WebGL screenshots; it does not
 * generate garments, invent back photographs, or rate photorealism as passed.
 */
const validSha=s=>typeof s==='string'&&/^[0-9a-f]{64}$/.test(s);
export const DENIM_VISUAL27=Object.freeze({
 requiredWidths:Object.freeze([320,390,430]),
 requiredRigs:Object.freeze(['female','male']),
 requiredAngles:Object.freeze([0,90,135,180]),
 requiredSources:2,requiredPairs:48,requiredWebGLFrames:96,
 syntheticRearIsNotPhotography:true,physicalPhonesApproved:false,
 humanPhotorealismApproved:false,releaseAuthorized:false,familyAlpha:'HOLD'
});
export function validateDenimEvidence27(m){
 if(!m||m.genuineBeforeAfterWebGLFrames!==96||m.matchedGenuineOriginalDenimPairs!==48||
    m.authenticPhotographedSources!==2||!Array.isArray(m.results)||m.results.length!==48)
   throw Error('DENIM27 requires 96 actual source-photographed WebGL frames');
 if(JSON.stringify(m.mobileBrowserWidths)!=='[320,390,430]'||
    JSON.stringify(m.anatomical163BoneFigures)!=='["female","male"]'||
    JSON.stringify(m.angles)!=='[0,90,135,180]'||
    m.originalFrontPhotoRGBUntouched===false||m.actualSourceRGBNeverChanged!==true||
    m.independentRearPhotographAvailable!==false||m.rearTextileIsModeled!==true||
    m.physicalAndroidIPhoneTested!==false||m.humanPhotorealismApproved!==false||
    m.productionModified!==false||m.releaseAuthorized!==false||m.familyAlpha!=='HOLD'||
    !Array.isArray(m.errors)||m.errors.length||!Array.isArray(m.external)||m.external.length)
   throw Error('DENIM27 metadata must remain source-honest and HOLD');
 const keys=new Set(),sources=new Set();
 for(const r of m.results){
  if(![320,390,430].includes(r.width)||!['female','male'].includes(r.rig)||
     ![0,90,135,180].includes(r.angle)||![0,1].includes(r.denimIndex)||
     !validSha(r.sourceSHA256)||r.owner!=='fixture-account-a'||r.bones!==163||
     !r.P23Compiled||!r.P25Compiled||!r.P26Fitted||!r.noNewBVHContacts||
     !r.originalFrontPhotoRGBUntouched||!r.sourceOriginalSHAUVRestSkinPreserved||
     !r.noFabricatedRearPhoto||!r.neutralSurfaceExplicitlyModeled||
     r.physicalPhonesTested!==false||r.humanPhotorealismApproved!==false||
     r.productionModified!==false||r.releaseAuthorized!==false||
     !Number.isSafeInteger(r.beforeVisibleDenimPixels)||r.beforeVisibleDenimPixels<1200||
     !Number.isSafeInteger(r.afterVisibleDenimPixels)||r.afterVisibleDenimPixels<1200)
   throw Error('DENIM27 invalid source, account, original photograph or genuine 3D proof');
  const key=[r.width,r.rig,r.denimIndex,r.angle].join('-');
  if(keys.has(key))throw Error('DENIM27 duplicate browser comparison');
  keys.add(key);sources.add(r.sourceSHA256);
  if(r.angle===180&&r.viewClass!=='unphotographed-rear')
   throw Error('DENIM27 modeled rear cannot be falsely labeled photographed');
  if(r.angle!==0&&r.changedOnRealDenimPixels<20)
   throw Error('DENIM27 side/rear geometric change not demonstrated');
 }
 if(keys.size!==48||sources.size!==2)throw Error('DENIM27 incomplete real before/after matrix');
 for(const width of [320,390,430])for(const rig of ['female','male'])
  for(const denim of [0,1])for(const angle of [0,90,135,180])
   if(!keys.has([width,rig,denim,angle].join('-')))
    throw Error('DENIM27 missing original-camera angle comparison');
 return Object.freeze({comparisons:48,frames:96,sourcePhotographs:2,
  exactOriginalRGBProtected:true,unphotographedRearModeled:true,
  consumerPhoneVerified:false,visualAestheticVerdict:'REVIEW',
  releaseAuthorized:false});
}
export function looksLikeDenimBlue27(r,g,b){
 return b-r>24&&b-g>13&&g-r>8&&r>15;
}
/** Compare raw RGB (3 channels) produced by Sharp, not guessed geometry. */
export function compareVisibleDenim27(a,b,width,height){
 if(!Number.isSafeInteger(width)||width<3||!Number.isSafeInteger(height)||height<3||
    a?.length!==width*height*3||b?.length!==width*height*3)
  throw Error('DENIM27 identical, valid original WebGL RGB dimensions required');
 let before=0,after=0,common=0,changed=0,silhouetteDelta=0;
 let minX=width,minY=height,maxX=-1,maxY=-1;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*3,A=looksLikeDenimBlue27(a[i],a[i+1],a[i+2]),
   B=looksLikeDenimBlue27(b[i],b[i+1],b[i+2]);
  if(A)before++;if(B){after++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);
   minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
  if(A!==B)silhouetteDelta++;
  if(A&&B){common++;
   if(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+
      Math.abs(a[i+2]-b[i+2])>6)changed++;
  }
 }
 if(before===0||after===0)throw Error('DENIM27 no authentic blue photographed garment visible');
 return Object.freeze({beforeDenimPixels:before,afterDenimPixels:after,
  overlappingDenimPixels:common,changedCommonDenimPixels:changed,
  silhouetteChangedPixels:silhouetteDelta,
  changedCommonFraction:changed/common,
  silhouetteChangeFraction:silhouetteDelta/(before+after-common),
  afterBBox:Object.freeze([minX,minY,maxX,maxY]),
  imageWidth:width,imageHeight:height,
  fullyVisible:minX>=1&&minY>=1&&maxX<=width-2&&maxY<=height-2,
  /* A low visual delta is evidence of SUBTLE change, not "10/10" realism. */
  changeStrength:changed/common<.015?'SUBTLE':'VISIBLE',
  aestheticVerdict:'REVIEW'});
}
