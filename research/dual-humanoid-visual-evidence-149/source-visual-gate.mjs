/**
 * P149 — independent original-photo/dual-humanoid 3D evidence contract.
 * All data is public-license research only. No image content or account
 * fields enter evaluation receipts. This is NOT a human photorealism rating.
 */
export const PHOTO149=Object.freeze({
 researchOnly:true,familyAlpha:'HOLD',releaseAuthorized:false,
 donorSourcePinned:'df6885d6011cb33fb22dceb81a08f35a0ac4dd61',
 rigBones:163,
 lockedShirt:'cb909d7ad9c3940bfa4db0cc50b2ea7025faebe3dcec8fe80067f900760bba64',
 licensedDenim:Object.freeze({
  public:'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
  second:'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a'
 }),
 viewDegrees:Object.freeze({
  front:0,
  'front-three-quarter':45,
  right:90,
  rear:180,
  left:270,
  'rear-three-quarter':225
 }),
 figures:Object.freeze(['female','male']),
 widths:Object.freeze([320,390,430]),
 engines:Object.freeze(['chromium','webkit']),
 unsupportedFullOutfits:Object.freeze(['dress-and-footwear','jacket-layered']),
 photo3DFromArbitraryPrivateUsersVerified:false,
 independentlyHumanPhotorealismApproved:false,
 physicalAndroidIphoneVerified:false
});
const HEX=/^[a-f0-9]{64}$/;
const validFile=/^(chromium|webkit)-(female|male)-(320|390|430)-(public|second)-(front|front-three-quarter|right|rear|left|rear-three-quarter)\.png$/;
const key=f=>[f.engine,f.figure,f.width,f.denim,f.view].join('|');
const fail=s=>{const e=Error('PHOTO149 '+s);e.code='photo149-evidence-refused';throw e;};
const VIEWS=Object.keys(PHOTO149.viewDegrees);
const EXPECTED=PHOTO149.engines.flatMap(engine=>PHOTO149.figures.flatMap(figure=>
 PHOTO149.widths.flatMap(width=>Object.keys(PHOTO149.licensedDenim).flatMap(denim=>
 VIEWS.map(view=>[engine,figure,width,denim,view].join('|'))))));
export const requiredVisualMatrix149=Object.freeze(EXPECTED);
export function evaluateVisualEvidence149({frames=[],verifiedImageKeys=[],
 donorHead=PHOTO149.donorSourcePinned,allNetworkPrivate=false,
 independentHumanReview=false,physicalPhoneProof=false
}={}){
 if(!Array.isArray(frames)||!Array.isArray(verifiedImageKeys)||
    donorHead!==PHOTO149.donorSourcePinned)fail('exact pinned donor and screenshot arrays required');
 const checked=new Set(verifiedImageKeys);
 if(checked.size!==verifiedImageKeys.length||
    [...checked].some(x=>typeof x!=='string'||!EXPECTED.includes(x)))
  fail('duplicate or unknown verified image keys');
 const seen=new Set(),accepted=[];
 for(const f of frames){
  if(!f||typeof f!=='object'||!EXPECTED.includes(key(f))||
     seen.has(key(f))||typeof f.file!=='string'||!validFile.test(f.file)||
     f.file!==[f.engine,f.figure,f.width,f.denim,f.view].join('-')+'.png'||
     f.angle!==PHOTO149.viewDegrees[f.view]||
     f.originalShirtSHA256!==PHOTO149.lockedShirt||
     f.originalDenimSHA256!==PHOTO149.licensedDenim[f.denim]||
     !HEX.test(f.imageSHA256||'')||
     f.rigBones!==163||f.realSourceSkinnedGarments!==true||
     f.genuineWebGLRendered!==true||f.privateUserPhoto===true||
     f.releaseAuthorized!==false)
   fail('invalid or duplicate source-verified WebGL frame');
  if(!Number.isInteger(f.width)||!Number.isSafeInteger(f.imageWidth)||
     f.imageWidth<200||f.imageWidth>f.width||
     !Number.isSafeInteger(f.imageHeight)||f.imageHeight<300)
   fail('real mobile canvas dimensions required');
  seen.add(key(f));
  if(checked.has(key(f)))accepted.push(key(f));
 }
 if(checked.size!==seen.size||[...seen].some(k=>!checked.has(k)))
  fail('every frame must have independent JPEG/PNG byte-hash inspection');
 const missing=EXPECTED.filter(k=>!seen.has(k));
 const genders=PHOTO149.figures.map(figure=>({
  figure,
  verified:accepted.filter(k=>k.split('|')[1]===figure).length,
  required:PHOTO149.engines.length*PHOTO149.widths.length*
   Object.keys(PHOTO149.licensedDenim).length*VIEWS.length
 }));
 const engineWidths=PHOTO149.engines.map(engine=>({
  engine,verified:accepted.filter(k=>k.split('|')[0]===engine).length,
  required:PHOTO149.figures.length*PHOTO149.widths.length*
   Object.keys(PHOTO149.licensedDenim).length*VIEWS.length
 }));
 const sourceWebGLComplete=missing.length===0;
 // Neither an in-repository boolean nor screenshot brightness can substitute
 // for independent human inspection of face, fabric contact and backside.
 return Object.freeze({
  schema:'closet-current-dual-humanoid-source-truth-149/v1',
  inputFrames:frames.length,independentlyByteVerifiedFrames:accepted.length,
  expectedFrames:EXPECTED.length,
  missingFrameCount:missing.length,
  missingMatrix:Object.freeze(missing),
  genders:Object.freeze(genders),
  engines:Object.freeze(engineWidths),
  pinnedOriginal163BoneWebGLSourceVerified:accepted.length>0,
  completeSourceGarmentViewportAngleCoverage:sourceWebGLComplete,
  publicLicensedDenimOnly:true,
  actualRealPersonalPhotoReconstructionAccepted:false,
  dressShoesJacketLayeringVerified:false,
  independentHumanRealismReviewComplete:false,
  physicalPhoneAcceptanceComplete:false,
  trueScientificPhotorealismScore:null,
  familyAlpha:'HOLD',releaseAuthorized:false,
  // Human review and device proof cannot be self-certified by accepting
  // untrusted user-input booleans or internally generated screenshots.
  result:'RESEARCH_EVIDENCE_ONLY_HOLD',
  nextPriority:'Parallel 57 / P150: improve independently inspected female/male faces, fabric contact, photographed clothes and 2D fallback',
  allNetworkPrivate:allNetworkPrivate===true,
  discardedUntrustedHumanClaim:independentHumanReview===true,
  discardedUntrustedPhoneClaim:physicalPhoneProof===true
 });
}
