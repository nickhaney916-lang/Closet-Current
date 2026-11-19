/**
 * Mission 2 P89 original institutional museum RGB foreground proposal,
 * tested alongside actually licensed 163-bone female/male GLB anatomy.
 *
 * This is an honest independent camera/physical-scale BLOCKER experiment,
 * never a source-fitted wearable, no owner/private imagery, no consumer 3D.
 * Requires untouched original three-d donor worktree for real licensed GLBs.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,extname} from 'node:path';
import sharp from 'sharp';
import {controlledFullContactFixtures,classifyExactTriangleContact,
 evaluateFullIndexedContact}
 from '../research/parallel89/full-indexed-contact-calibration89.mjs';
import {buildMetSourceFrontNeutralBackShell89 as build}
 from '../research/parallel89/met-source-front-neutral-shell89.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const fullFixture=controlledFullContactFixtures();
assert.equal(fullFixture.cases.crossing,'CROSSING');
assert.equal(fullFixture.cases.separated,'NONE');
assert.equal(fullFixture.cases.identicalCoplanar,'COPLANAR_OVERLAP');
assert.equal(fullFixture.cases.shiftedCoplanar,'COPLANAR_OVERLAP');
assert.equal(fullFixture.cases.sharedCoplanarEdge,'TOUCHING');
assert.equal(fullFixture.cases.endpoint,'TOUCHING');
assert.equal(fullFixture.cases.degenerate,'INDETERMINATE');
assert.equal(fullFixture.indexedResult.fullOriginalIndexedScopeEvaluated,true);
assert.equal(fullFixture.indexedResult.originalBodyFaceSubsetUsed,false);
assert.equal(fullFixture.indexedResult.originalPhotoFaceSubsetUsed,false);
assert.equal(fullFixture.indexedResult.originalBodyIndexedFacesAudited,2);
assert.equal(fullFixture.indexedResult.originalPhotoFrontIndexedFacesAudited,3);
assert.ok(fullFixture.indexedResult.classifications.CROSSING>0);
assert.ok(fullFixture.indexedResult.classifications.COPLANAR_OVERLAP>0);
assert.ok(fullFixture.indexedResult.classifications.TOUCHING>0);
assert.equal(fullFixture.indexedResult.garmentPhysicalFitCertified,false);
assert.throws(()=>evaluateFullIndexedContact([],[]),/full-face-counts-required/);
assert.throws(()=>evaluateFullIndexedContact([[[0,0,0],[0,1,0],[0,0,1]]],
 [[[0,0,0],[0,1,0],[0,0,1]]],{maxPairs:0}),
 /resource-bound-reached/);
const limited=evaluateFullIndexedContact(
 [[[0,0,0],[0,1,0],[0,0,1]]],
 [[[0,0,0],[0,1,0],[0,0,1]]],
 {maxPairs:0,reportResourceBlockerInsteadOfThrow:true});
assert.equal(limited.resourceBoundReached,true);
assert.equal(limited.contactDecision,'BLOCKED_INCOMPLETE_ORIGINAL_INDEXED_AUDIT');
assert.equal(limited.fullOriginalIndexedScopeEvaluated,false);
assert.equal(limited.garmentPhysicalFitCertified,false);
assert.equal(limited.consumer3DAdmitted,false);
assert.equal(limited.sourceOriginalPhoto2DFallbackRequired,true);
assert.equal(limited.familyAlpha,'HOLD');
console.log('M2_FULL_INDEXED_ADVERSARIAL_GEOMETRY_NODES_PASS '+JSON.stringify(fullFixture.cases));
const rigHashes=Object.freeze({
 female:'a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1',
 male:'d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8'
});
const donor=resolve(process.argv[2]||'.'),here=resolve('.');
assert.notEqual(donor,here,'separate original licensed rig donor required');
for(const [kind,sha] of Object.entries(rigHashes)){
 const bytes=await readFile(donor+'/research/three-d-06/models/'+kind+'-cc0-rigged.glb');
 assert.equal(hash(bytes),sha,'original anatomically rigged public CC0 GLB tampered');
}
const srcDir='benchmark/parallel89-met70759-four-photo-research',
 maskDir='benchmark/parallel89-met70759-full-alpha-proposals',
 image=await readFile(srcDir+'/met-70759-gallery-2551406.jpg'),
 mask=await readFile(maskDir+'/met-70759-2551406-AUTO-UNREVIEWED-foreground-mask.png');
const receipts=JSON.parse(await readFile(maskDir+'/met-70759-four-photo-AUTO-UNREVIEWED-mask-receipts.json'));
assert.equal(receipts.allMasksMachineGeneratedAndUnreviewed,true);
assert.equal(receipts.humanOrCuratorialMaskAcceptanceReceived,false);
assert.equal(receipts.sourceObjectNumber,'1983.21a, b');
const receipt=receipts.maskedOriginalPhotoPixels.find(x=>x.imageId===2551406);
assert.ok(receipt);assert.equal(receipt.outputMaskPngSHA256,hash(mask));
const shell=await build({imageId:2551406,originalJPEGBytes:image,conservativeMaskPNGBytes:mask});
assert.equal(shell.status,'EDGE_CLOSED_SOURCE_SILHOUETTE_SHELL_INFERRED_REAR_UNAPPROVED',shell.reason);
assert.equal(shell.originalMuseumExactCaption,'a) front');
assert.equal(shell.originalJPEGByteSHA256,hash(image));
assert.equal(shell.originalDecodedRGBSHA256,receipt.originalFullDecodedRGBSHA256);
assert.equal(shell.originalSourceMaskUncertainPixelsExcluded,13913);
assert.equal(shell.sourceMaskedOriginalRGBTexSHA256,hash(shell.originalRGBAFront));
assert.equal(shell.shellIndexedEdgeIncidenceExactlyTwo,true);
assert.equal(shell.neutralBackHasNoOriginalPhotographRGB,true);
assert.equal(shell.original163BoneSkinningAttached,false);
assert.equal(shell.consumer3DAdmitted,false);
const sourceDims=shell.photoDimensions;
assert.deepEqual(sourceDims,[192,149]);
const payload={
 schema:'M2-P89-authentic-real-anatomy-original-Met-source-shell/RESEARCH/v1',
 imageId:2551406,museumCaption:'a) front',
 originalJPEGByteSHA256:shell.originalJPEGByteSHA256,
 decodedOriginalRGBSHA256:shell.originalDecodedRGBSHA256,
 conservativeOriginalMaskPNG_SHA256:hash(mask),
 sourceTextureRGBA_SHA256:shell.sourceMaskedOriginalRGBTexSHA256,
 materialRoles:['ORIGINAL_PHOTOGRAPH_FRONT','UNOBSERVED_NEUTRAL_REAR',
  'INFERRED_NEUTRAL_EDGE'],
 positions:Array.from(shell.positions),uv:Array.from(shell.uv),
 indices:Array.from(shell.indices),originalRGBAFront:Array.from(shell.originalRGBAFront),
 photoDimensions:sourceDims,drawRanges:shell.drawRanges,
 originalPhoto2DFallbackRequired:true,consumer3DAdmitted:false,
 releaseAuthorized:false,familyAlpha:'HOLD'
};
const resultDir='benchmark/parallel89-met-real-anatomy-uncalibrated-HOLD/';
await mkdir(resultDir,{recursive:true});
await writeFile(resultDir+'original-source-rig-plan.json',JSON.stringify({
 schema:payload.schema,sourceOriginalByteSHA256:hash(image),
 sourceOriginalRGBSHA256:shell.originalDecodedRGBSHA256,
 sourceOriginalMaskPNG_SHA256:hash(mask),
 sourceOriginalTextureRGBA_SHA256:shell.sourceMaskedOriginalRGBTexSHA256,
 originalMuseumCaptionVerified:'a) front',
 trueOriginalMaleFemale163boneSHA256:rigHashes,
 sourcePhotoFrontOnly:true,physicalGarmentScaleUnknown:true,
 sourcePhotographCameraUncalibrated:true,
 reverseNeutralNotObserved:true,physicalGarmentFitProved:false,
 realOriginalBodyClothCollisionProved:false,
 sourceHumanMaskApproved:false,
 consumer3DAdmitted:false,originalPhoto2DFallbackRequired:true,
 releaseAuthorized:false,familyAlpha:'HOLD'
},null,2)+'\n');
const browserName=process.env.P89_BROWSER;
if(!browserName){
 console.log('M2_REAL_RIG_INPUT_ORIGINAL_RGB_SHA_VERIFIED '+JSON.stringify({
  imageId:2551406,realSourceOriginalMask:true,
  genuineMaleFemale163BoneGLBFileSHA:true,
  originalSourceFitted:false,familyAlpha:'HOLD'
 }));
 process.exit(0);
}
assert.ok(['chromium','webkit'].includes(browserName));
const {chromium,webkit}=await import('playwright');
const sourceJson=Buffer.from(JSON.stringify(payload));
const mime={'.js':'text/javascript','.mjs':'text/javascript','.json':'application/json',
 '.glb':'model/gltf-binary','.png':'image/png'};
const server=createServer(async(req,res)=>{
 try{
  const u=new URL(req.url||'/', 'http://127.0.0.1');
  const p=decodeURIComponent(u.pathname);
  if(p.includes('..')||p.includes('\\')||p.includes('\0'))throw Error('invalid');
  const host=(req.headers.host||'').split(':')[0];
  if(host!=='127.0.0.1'&&host!=='localhost')throw Error('host');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(p==='/'){res.setHeader('Content-Type','text/html');res.end(`<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Original photo and dual licensed anatomical 163-bone models, research HOLD</title>
<script type="importmap">
{"imports":{"three":"/node_modules/three/build/three.module.js",
"three/addons/":"/node_modules/three/examples/jsm/"}}</script>
</head><body style="margin:0;background:#f5f4f2">
<h1 style="font:18px system-ui">UNAPPROVED Met museum source on TRUE CC0 anatomy — NOT fitted</h1>
<p id="status" role="status">Original JPEG and mask source-image space NOT physically calibrated</p>
<div style="font:14px system-ui">Avatar: <span id="rig"></span>,
arbitrary scale <span id="trial"></span>, orbit <span id="angle"></span></div>
<canvas id="scene" width="390" height="690"></canvas>
<script type="module" src="/research/parallel89/met-original-163bone-uncalibrated-registration89.mjs"></script>
</body></html>`);return;}
  if(p==='/research-source/shell.json'){
   res.setHeader('Content-Type','application/json');
   res.end(sourceJson);return;
  }
  let file,root;
  if(p.startsWith('/immutable-rig/')){
   root=donor+'/research/three-d-06/models/';
   file=resolve(root,p.slice('/immutable-rig/'.length));
  }else if(p.startsWith('/research/')){
   root=here+'/research/';
   file=resolve(here,p.slice(1));
  }else if(p.startsWith('/node_modules/')){
   root=here+'/node_modules/';
   file=resolve(here,p.slice(1));
  }else throw Error('not allowed');
  if(!file.startsWith(root)||!['.mjs','.js','.json','.glb'].includes(extname(file)))
   throw Error('not-original-static-allowlisted');
  const bytes=await readFile(file);
  res.setHeader('Content-Type',mime[extname(file)]||'application/octet-stream');
  res.end(bytes);
 }catch(e){res.writeHead(404);res.end('not present');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
const browser=await ({webkit,chromium})[browserName].launch({
 headless:true,args:browserName==='chromium'?['--no-sandbox']:[]
});
const failures=[],httpExternal=[],sourceRows=[],pngHash=[],httpFailures=[],browserConsole=[];
try{
 const page=await browser.newPage({viewport:{width:390,height:870},deviceScaleFactor:1});
 page.on('pageerror',e=>failures.push(e.message));
 page.on('console',m=>{if(m.type()==='error')browserConsole.push(m.text())});
 page.on('requestfailed',r=>httpFailures.push({url:r.url(),failure:r.failure()}));
 page.on('response',r=>{if(r.status()>=400)httpFailures.push({
  url:r.url(),status:r.status()})});
 page.on('request',r=>{if(/^https?:/i.test(r.url())&&!r.url().startsWith(origin))
  httpExternal.push(r.url())});
 await page.goto(origin,{waitUntil:'load'});
 try{
  await page.waitForFunction(()=>window.__M2RealRigPhotoTrial?.getFlags().ready===true,
   null,{timeout:85000});
 }catch(e){
  const status=await page.locator('#status').textContent().catch(()=>null);
  const exists=await page.evaluate(()=>Boolean(window.__M2RealRigPhotoTrial))
   .catch(()=>false);
  throw Error('original 163bone native startup NOT VERIFIED '+JSON.stringify({
   engine:browserName,status,exists,failures,httpFailures,browserConsole,
   message:e.message
  }).slice(0,6000));
 }
 const baseline=await page.evaluate(()=>window.__M2RealRigPhotoTrial.getProof());
 assert.equal(baseline.trueOriginalAnatomicalBoneCount,163);
 assert.equal(baseline.actualLicensedRig,'female');
 assert.equal(baseline.consumer3DAdmitted,false);
 for(const kind of ['female','male']){
  for(const [index,rotation] of [[0,0],[1,65],[2,180]]){
   const proof=await page.evaluate(async x=>await window.__M2RealRigPhotoTrial.select(
    x.kind,x.index,x.rotation),{kind,index,rotation});
   assert.equal(proof.actualLicensedRig,kind);
   assert.equal(proof.trueOriginalAnatomicalBoneCount,163);
   assert.equal(proof.actualOriginalGLBSHA256,rigHashes[kind]);
   assert.ok(proof.actualOriginalBodyTriangles>5000);
   assert.equal(proof.originalMuseumImageId,2551406);
   assert.equal(proof.independentlyVerifiedFullDecodedRGBSHA256,shell.originalDecodedRGBSHA256);
   assert.equal(proof.sourceOriginalRGBTextureSHA256,shell.sourceMaskedOriginalRGBTexSHA256);
   assert.equal(proof.sourceOriginalMaskPNG_SHA256,hash(mask));
   assert.ok(proof.avatarWidthFromOriginalRigNormalized>.1);
   assert.ok(proof.originalSourceMaskWidthImageSpace>.2);
   assert.ok(proof.trialIndependentUncalibratedScale>.1);
   assert.equal(proof.trialScaleFactor,[.8,1,1.2][index]);
   assert.equal(proof.actualRigPhotoGarmentBinding,false);
   assert.equal(proof.staticUnskinnedPhotoShell,true);
   assert.equal(proof.noCameraMetricCalibration,true);
   assert.equal(proof.noGarmentPhysicalSizeKnown,true);
   assert.equal(proof.noBodyClothBVHIntersectionsProved,true);
   assert.equal(proof.originalGeometrySourceUnmodified,true);
   assert.equal(proof.mannequinSkeletonGeometryUnchanged,true);
   assert.equal(proof.originalPhoto2DFallbackRequired,true);
   assert.equal(proof.consumer3DAdmitted,false);
   assert.equal(proof.releaseAuthorized,false);
   assert.equal(proof.familyAlpha,'HOLD');
   const png=await page.locator('#scene').screenshot();
   assert.ok(png.byteLength>9000,'original rig must visibly render with source');
   const output=resultDir+browserName+'-'+kind+'-original-Met-photo-uncalibrated-'+
    [0,65,180][index]+'deg-HOLD.png';
   await writeFile(output,png);
   pngHash.push({kind,rotation,sha256:hash(png),bytes:png.length});
   sourceRows.push({
    rig:kind,rotation,arbitraryScale:[.8,1,1.2][index],
    rigSHA256:proof.actualOriginalGLBSHA256,actualSourceSkinnedTriangles:proof.actualOriginalBodyTriangles,
    actualOriginal163BoneCount:proof.trueOriginalAnatomicalBoneCount,
    sourceOriginalVertexUnchanged:proof.originalGeometrySourceUnmodified,
    sourcePhotoOriginalRGBAndUVUnmodified:proof.sourcePhotoOriginalRGBAndUVUnmodified,
    actualPhysicalWearabilityFitProved:false
   });
  }
 }
 // NEXT ACTUAL SOURCE-to-REAL-163BONE RESEARCH MILESTONE:
 // real original institutional RGB-front mesh becomes a THREE.SkinnedMesh,
 // bound to the original licensed male/female skeleton, and its original
 // source geometry/UV is sampled at rest / genuine named-spine bend / rest.
 // No physical-size, fit, body collision, or owner admission is asserted.
 const crossingKernel=await page.evaluate(()=>window.__M2RealRigPhotoTrial
  .getControlledTriangleCrossingKernelProof());
 assert.deepEqual(crossingKernel,{
  actualStrictCrossingDetected:true,separatedTriangleRejected:true,
  coplanarClaimExplicitlyUnresolved:true,
  syntheticControlOnlyNotGenuineBodyCollisionEvidence:true
 },'actual native intersection detector must reject manufactured clearances');
 const fullControl=await page.evaluate(()=>window.__M2RealRigPhotoTrial
  .getFullContactControlProof());
 assert.deepEqual(fullControl.cases,fullFixture.cases);
 assert.deepEqual(fullControl.indexedResult,fullFixture.indexedResult);
 const skeletonPoseEvidence=[];
 for(const kind of ['female','male']){
  const accept=await page.evaluate(async kind=>
   window.__M2RealRigPhotoTrial.startSourceSkinnedMotionTrial(kind),kind);
  assert.equal(accept.avatar,kind);
  assert.equal(accept.status,
   'REAL_163BONE_ORIGINAL_PHOTO_SOURCE_SKIN_DEFORMATION_RESEARCH_ONLY');
  assert.equal(accept.actualOriginalBoneCount,163);
  assert.equal(accept.realOriginalSkinReuse,true);
  assert.equal(accept.actualTHREESkinnedMesh,true);
  assert.deepEqual(accept.actualTwoNamedSourceBones,['spine03','spine04']);
  assert.equal(accept.originalPhotoVerticesUnmodified,true);
  assert.equal(accept.originalPhotoUVUnmodified,true);
  assert.equal(accept.originalBodySkinIndicesAndWeightsUnmodified,true);
  assert.equal(accept.trueSourceFrontAndNeutralReverseMaterialGroups,3);
  assert.equal(accept.sourceOriginalFullDecodedRGBSHA256,shell.originalDecodedRGBSHA256);
  assert.equal(accept.sourceFrontRGBTextureSHA256,shell.sourceMaskedOriginalRGBTexSHA256);
  assert.equal(accept.provisionalBindWeights,true);
  assert.equal(accept.provisionalActualBodyBoneAnchorWeights,true);
  assert.equal(accept.weightRule,
   'actual-rest-spine03-spine04-segment-smooth-projection');
  assert.ok(accept.genuineSpineSegmentLengthRigUnits>.001,
   'authentic original spine joint separation must be measured');
  assert.equal(accept.noClothDrapeOrContactSafetyClaim,true);
  assert.equal(accept.consumer3DAdmitted,false);
  assert.equal(accept.familyAlpha,'HOLD');
  const rest=await page.evaluate(()=>window.__M2RealRigPhotoTrial
   .setSourceSkinnedMotionTrialPose('rest'));
  assert.equal(rest.actualSourceSkinnedPhotoMesh,true);
  assert.equal(rest.trueSkeletonBoneCount,163);
  assert.ok(rest.threeOriginalPhotoVertexDisplacements.every(x=>x<=.00001),
   'original bound source 3D not stable in true source rest');
  const checkGap=pose=>{
   const gap=pose.originalRigBodySurfaceGapResearchOnly;
   assert.equal(gap.measuredUnsignedSampledTriangleSurfaceProximity,true);
   assert.equal(gap.actualPoseDeformedSourceFrontVerticesSampled,24);
   assert.ok(gap.actualPoseDeformedBodySurfaceTrianglesSampled>=128);
   assert.ok(gap.actualPoseDeformedBodySurfaceTrianglesSampled<=1536);
   assert.ok(Number.isFinite(gap.minimumUnsignedSampledBodyClothGapRigUnits));
   assert.ok(Number.isFinite(gap.medianUnsignedSampledBodyClothGapRigUnits));
   assert.ok(gap.minimumUnsignedSampledBodyClothGapRigUnits>=0);
   assert.ok(gap.medianUnsignedSampledBodyClothGapRigUnits>=
    gap.minimumUnsignedSampledBodyClothGapRigUnits);
   assert.ok(gap.nearSurfaceSampleCountAt005RigUnits>=0);
   assert.ok(gap.nearSurfaceSampleCountAt005RigUnits<=24);
   assert.equal(gap.fullIndexedTriangleCoverage,false);
   assert.equal(gap.signedInteriorOrTriangleIntersectionEstablished,false);
   assert.equal(gap.physicalCollisionOrSweptClearanceEstablished,false);
   assert.equal(pose.actualMeasuredBodyClothIntersection,false);
   assert.equal(pose.physicalContactOrDrapeCleared,false);
   return gap;
  };
  const checkCrossing=pose=>{
   const c=pose.originalRigPhotoFrontBodyFaceCrossingResearchOnly;
   assert.equal(c.trueLicensedBodyRig,kind);
   assert.equal(c.originalPublicPhotoFrontOnly,true);
   assert.ok(c.actualOriginalBodyFacesSampled>=128);
   assert.ok(c.actualOriginalBodyFacesSampled<=2048);
   assert.ok(c.actualOriginalFrontFacesSampled>=32);
   assert.ok(c.actualOriginalFrontFacesSampled<=192);
   assert.ok(Number.isSafeInteger(c.overlappingFaceAxisAlignedBoundsPairs));
   assert.ok(Number.isSafeInteger(c.strictPositiveNonCoplanarFaceCrossingPairs));
   assert.ok(c.overlappingFaceAxisAlignedBoundsPairs>=
    c.strictPositiveNonCoplanarFaceCrossingPairs);
   assert.ok(c.strictPositiveNonCoplanarFaceCrossingPairs>=0);
   assert.equal(c.controlledCrossingKernelPositiveAndNegativePassed,true);
   assert.equal(c.countOnlyDiscreteSampledFaces,true);
   assert.equal(c.coplanarTouchingEnclosedAndUnsampledUnknown,true);
   assert.equal(c.physicallyCalibratedBodyGarmentSize,false);
   assert.equal(c.fullBodyClothIntersectionCoverage,false);
   assert.equal(c.continuousSweptClothContactEstablished,false);
   assert.equal(c.collisionFreeFitProved,false);
   assert.equal(c.consumer3DAdmitted,false);
   assert.equal(c.originalPhoto2DFallbackRequired,true);
   assert.equal(c.familyAlpha,'HOLD');
   return c;
  };
  const restGap=checkGap(rest),restCrossing=checkCrossing(rest);
  const shot1=await page.locator('#scene').screenshot();
  assert.ok(shot1.length>9000);
  await writeFile(resultDir+browserName+'-'+kind+
   '-ORIGINAL-MET-SOURCE-SKINNED-REST-163bone-HOLD.png',shot1);
  const posed=await page.evaluate(()=>window.__M2RealRigPhotoTrial
   .setSourceSkinnedMotionTrialPose('bend'));
  assert.equal(posed.actualNamedOriginalJoint,'spine04');
  assert.equal(posed.actualOriginalJointPoseChanged,true);
  assert.equal(posed.trueSkeletonBoneCount,163);
  assert.ok(posed.maximumMeasuredOriginalPhotoSourceVertexDisplacement>.001,
   'true original photo front MUST ACTUALLY DEFORM with original source joint');
  assert.ok(posed.threeOriginalPhotoVertexDisplacements.some(x=>x>.001),
   'source original photopanel has no skeletal deformation witness');
  assert.equal(posed.originalSourcePositionAndUVStillImmutable,true);
  assert.equal(posed.consumer3DAdmitted,false);
  assert.equal(posed.physicalContactOrDrapeCleared,false);
  const bentGap=checkGap(posed),bentCrossing=checkCrossing(posed);
  const shot2=await page.locator('#scene').screenshot();
  assert.ok(shot2.length>9000);
  assert.notEqual(hash(shot1),hash(shot2),
   'real CC0 skeleton motion must visibly change original-photo-posed GL render');
  await writeFile(resultDir+browserName+'-'+kind+
   '-ORIGINAL-MET-SOURCE-SKINNED-SPINE04-BEND-163bone-HOLD.png',shot2);
  const fiveDiscretePoses=await page.evaluate(()=>window.__M2RealRigPhotoTrial
   .sampleFiveAuthenticSpinePoseCrossings());
  assert.equal(fiveDiscretePoses.actualOriginalLicensed163BoneRig,kind);
  assert.equal(fiveDiscretePoses.discretePosesOnly,true);
  assert.equal(fiveDiscretePoses.continuousCollisionSafetyUnproved,true);
  assert.equal(fiveDiscretePoses.arbitraryImageToAnatomyRegistration,true);
  assert.equal(fiveDiscretePoses.consumer3DAdmitted,false);
  assert.equal(fiveDiscretePoses.familyAlpha,'HOLD');
  assert.equal(fiveDiscretePoses
   .fullOriginalBodyAndPhotoFrontFacesIndexedForFailClosedContactGate,true);
  assert.equal(fiveDiscretePoses.noCollisionClaimWithoutCompleteFacePairAudit,true);
  const calibration=fiveDiscretePoses.physicalCalibrationEvidence;
  assert.equal(calibration.verifiedMuseumPhotoImageId,2551406);
  assert.equal(calibration.trueLicensedRig,kind);
  assert.equal(calibration.originalLicensedRigSHA256,rigHashes[kind]);
  assert.deepEqual(calibration.originalImageSizePixels,[192,149]);
  assert.deepEqual(calibration.threeArbitraryDisplayWidthRatios,[.512,.64,.768]);
  assert.equal(calibration.originalCameraFocalLengthPixels,null);
  assert.equal(calibration.originalCameraDistanceCM,null);
  assert.equal(calibration.independentlyMeasuredGarmentWidthCM,null);
  assert.equal(calibration.independentlyMeasuredGarmentHeightCM,null);
  assert.equal(calibration.independentlyMeasuredWearerChestCM,null);
  assert.equal(calibration.independentlyMeasuredWearerHeightCM,null);
  assert.equal(calibration.approvedExactFrontSilhouetteMask,false);
  assert.equal(calibration.authenticatedCalibrationEvidenceAvailable,false);
  assert.equal(calibration.validPhysicalGarmentCalibration,false);
  assert.equal(calibration.physicalScaleUnits,'UNKNOWN');
  assert.equal(calibration.consumer3DAdmitted,false);
  assert.equal(calibration.sourceOriginalPhoto2DFallbackRequired,true);
  assert.equal(calibration.familyAlpha,'HOLD');
  assert.deepEqual(fiveDiscretePoses.samples.map(x=>x.degrees),
   [-12,-6,0,6,12]);
  const completeEvidence=[];
  for(const trial of fiveDiscretePoses.samples){
   checkCrossing({originalRigPhotoFrontBodyFaceCrossingResearchOnly:
    trial.actualPosePhotoFrontBodyCrossings});
   const full=trial.everyIndexedBodyComponentAndSourceFrontContact;
   assert.ok(full.fullOriginalIndexedScopeEvaluated===true||
    (full.definitiveCollisionRejection===true&&
     full.pairEnumerationStoppedAfterRealContact===true)||
    (full.resourceBoundReached===true&&
     full.contactDecision==='BLOCKED_INCOMPLETE_ORIGINAL_INDEXED_AUDIT'),
    'genuine full negative OR actual contact OR explicit blocked resource required');
   assert.equal(full.allOriginalBodyIndexedFacesPresentInBVH,true);
   assert.ok(full.originalBodyBVHNodes>=full.originalBodyBVHLeaves);
   assert.ok(full.originalBodyBVHLeaves>0);
   if(full.pairEnumerationStoppedAfterRealContact){
    assert.equal(full.fullOriginalIndexedScopeEvaluated,false);
    assert.equal(full.contactDecision,'BLOCKED_ACTUAL_ORIGINAL_FRONT_BODY_CONTACT');
    assert.ok(full.firstObservedContactFaceIndices);
    assert.equal(full.strictGeometricContactObserved,true);
   }else if(full.resourceBoundReached){
    assert.equal(full.fullOriginalIndexedScopeEvaluated,false);
    assert.equal(full.definitiveCollisionRejection,false);
    assert.equal(full.contactDecision,'BLOCKED_INCOMPLETE_ORIGINAL_INDEXED_AUDIT');
    assert.ok(['EXACT_AABB_CONTACT_BUDGET','BROADPHASE_BUDGET']
     .includes(full.resourceBoundKind));
    assert.ok(full.lastOriginalFrontFaceIndexChecked>=0);
    assert.ok(full.lastOriginalFrontFaceIndexChecked<
     full.originalPhotoFrontIndexedFacesAudited);
    assert.equal(full.entireOriginalFrontAndBodyDataIndexedButNotAllPairsExamined,true);
    assert.ok(full.numberOfAABBOverlapsNotYetClassifiedAtLimit===0||
     full.numberOfAABBOverlapsNotYetClassifiedAtLimit===1);
   }else{
    assert.equal(full.fullOriginalIndexedScopeEvaluated,true);
    assert.ok(['BLOCKED_ACTUAL_ORIGINAL_FRONT_BODY_CONTACT',
     'BLOCKED_INDETERMINATE_GEOMETRY',
     'NO_CONTACT_DETECTED_IN_COMPLETE_DISCRETE_FACE_AUDIT']
     .includes(full.contactDecision));
   }
   assert.equal(full.originalBodyFaceSubsetUsed,false);
   assert.equal(full.originalPhotoFaceSubsetUsed,false);
   assert.ok(full.originalBodyIndexedFacesAudited>5000,
    'genuine licensed body original entire component face coverage required');
   assert.ok(full.originalPhotoFrontIndexedFacesAudited>=192,
    'entire original front indexed silhouette required');
   assert.ok(full.originalBodySkinnedMeshComponentsAudited>=1);
   assert.equal(full.originalBodyComponentTriangleCounts.reduce((a,b)=>a+b,0),
    full.originalBodyIndexedFacesAudited);
   assert.equal(full.photoFrontOnly,true);
   assert.equal(full.originalPhotoSourceJPEGByteSHA256,hash(image));
   assert.equal(full.sourceOriginalRGBSHA256,shell.originalDecodedRGBSHA256);
   assert.equal(full.actualRigOriginalGLBSHA256,rigHashes[kind]);
   assert.equal(full.fullMotionSweepCertified,false);
   assert.equal(full.originalUnobservedRearCertified,false);
   assert.equal(full.actualPhysicallyCalibratedFit,false);
   assert.equal(full.garmentPhysicalFitCertified,false);
   assert.equal(full.humanApprovedMask,false);
   assert.equal(full.consumer3DAdmitted,false);
   assert.equal(full.sourceOriginalPhoto2DFallbackRequired,true);
   assert.equal(full.familyAlpha,'HOLD');
   const counts=full.classifications;
   assert.ok(['CROSSING','COPLANAR_OVERLAP','TOUCHING','INDETERMINATE','NONE']
    .every(key=>Number.isSafeInteger(counts[key])&&counts[key]>=0));
   assert.equal(Object.values(counts).reduce((a,b)=>a+b,0),
    full.actualAABBOverlappingPairs-
     (full.numberOfAABBOverlapsNotYetClassifiedAtLimit||0));
   assert.ok(full.fullBroadphaseUniqueCandidatePairs>=full.actualAABBOverlappingPairs);
   assert.equal(full.strictGeometricContactObserved,
    counts.CROSSING+counts.COPLANAR_OVERLAP+counts.TOUCHING>0);
   completeEvidence.push(full);
  }
  assert.deepEqual(fiveDiscretePoses.samples[2].actualPosePhotoFrontBodyCrossings,
   restCrossing,'0 degree discrete photo/body face witness must equal rest');
  assert.deepEqual(fiveDiscretePoses.samples[4].actualPosePhotoFrontBodyCrossings,
   bentCrossing,'12 degree discrete photo/body face witness must equal posed');
  const restored=await page.evaluate(()=>window.__M2RealRigPhotoTrial
   .setSourceSkinnedMotionTrialPose('rest'));
  assert.equal(restored.stage,'rest');
  assert.ok(restored.threeOriginalPhotoVertexDisplacements.every(x=>x<=.00001),
   'original 163bone pose failed to restore source photo vertices exactly');
  const shot3=await page.locator('#scene').screenshot();
  assert.equal(hash(shot3),hash(shot1),
   'restored genuine source skeleton should return to same native raster');
  assert.equal(restored.consumer3DAdmitted,false);
  assert.deepEqual(checkGap(restored),restGap,
   'original signed-free body/cloth proximity must restore exactly');
  assert.deepEqual(checkCrossing(restored),restCrossing,
   'original genuine photo-front body-surface sampled crossings must restore');
  skeletonPoseEvidence.push({avatar:kind,boneCount:163,
   originalGLBSHA256:rigHashes[kind],
   genuineSourceJPEG_SHA256:hash(image),
   authenticPhotoRGBA_SHA256:shell.sourceMaskedOriginalRGBTexSHA256,
   trueOriginalNamedSpine04AngleDegrees:12,
   observedPhotoSkinnedMaxWorldVertexMove:
    posed.maximumMeasuredOriginalPhotoSourceVertexDisplacement,
   originalRestFrameSHA256:hash(shot1),originalPosedFrameSHA256:hash(shot2),
   originalRestoredFrameSHA256:hash(shot3),
   originalRestRestoredRasterIdentical:hash(shot1)===hash(shot3),
   photoUVRGBAAndOriginalRigWeightsUnmodified:true,
   realOriginalSkeletonBinding:true,provisionalNotPhysicallyFitted:true,
   realBodyBoneAnchoredWeightsButUnapproved:true,
   originalSpineBoneAnchorDistanceRigUnits:
    accept.genuineSpineSegmentLengthRigUnits,
   actualSkinnedSourceToBodySampledUnsignedGapAtRest:restGap,
   actualSkinnedSourceToBodySampledUnsignedGapAtBend:bentGap,
   sampledOriginalBodyPhotoNonCoplanarCrossingsAtRest:restCrossing,
   sampledOriginalBodyPhotoNonCoplanarCrossingsAtBend:bentCrossing,
   fiveOriginalRealSpinePoseBodyPhotoFaceCrossingStudies:fiveDiscretePoses,
   originalFrontBodyEveryIndexedFaceIndexedAndGatedInFivePoses:true,
   originalFullNegativeActualContactOrBlockedResourceDecisions:completeEvidence,
   physicalCalibrationEvidenceStillMissing:calibration,
   trueContactControlsWithCoplanarTouchAndUnknown:true,
   nativeTriangleCrossingPositiveAndSeparatedControlsPassed:true,
   unsampledOriginalFacesAndContinuousMotionRemainUnknown:true,
   fullSurfaceOrSweptIntersectionNotProved:true,
   noCollisionSafetyOrDrapeProved:true,consumer3DAdmitted:false});
 }
 assert.equal(skeletonPoseEvidence.length,2);
 assert.equal(sourceRows.length,6);
 assert.equal(new Set(pngHash.map(x=>x.sha256)).size,6,
  'genuine original anatomy/render image must vary across 2 rigs and rotations');
 assert.deepEqual(failures,[]);
 assert.deepEqual(httpExternal,[]);
 const receipt={
  schema:'M2-actual-Met-original-source-and-real-licensed-163bone-native-trial/v1',
  engine:browserName,viewportWidth:390,realNativeWebGLBrowser:true,
  actualOriginalMuseumJPEG_SHA256:hash(image),originalMaskPNG_SHA256:hash(mask),
  originalSourceRGB_SHA256:shell.originalDecodedRGBSHA256,
  originalPhotoTextureRGBA_SHA256:shell.sourceMaskedOriginalRGBTexSHA256,
  genuineRealMaleFemaleRigSHA256:rigHashes,
  sourceRows,originalRenderedScreenshotSHA256:pngHash,
  trueOriginalLicensedBoneSkinnedSourcePhotoResearch:skeletonPoseEvidence,
  noRealSourceCameraCalibration:true,noOriginalMetricScale:true,
  noActualBodySourceGarmentFitClaim:true,noBVHBodyClothSafetyAcceptance:true,
  sourceUnknownReverseAndUnknownClothDrape:true,
  realSpineBoneAnchoredResearchWeights:true,
  actualSkinnedBodyTriangleProximitySampled:true,
  unsignedDistanceNotIntersectionProof:true,
  sampledOriginalFrontActualBodyTriangleCrossingsMeasured:true,
  controlledPositiveSeparatedAndCoplanarKernelOutcomes:true,
  realBodyFrontOnlyFiveDiscretePoseTrials:true,
  fullSurfaceAndContinuousCollisionNotProved:true,
  fullExhaustiveOriginalContactMayRemainResourceBlocked:true,
  allOriginalFaceDataIndexedForFailClosedGateAcrossFiveDiscretePoses:true,
  positiveContactMayShortCircuitBeforeAllPairs:true,
  coplanarAndTouchingAndIndeterminateExercised:true,
  physicalSizeCalibrationRefusedWithoutExternalMeasurements:true,
  noActualHumanMaskReview:true,noPhysicalMobileDevice:true,
  sourceOriginalPhoto2DFallbackRequired:true,consumer3DAdmitted:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 };
 await writeFile(resultDir+browserName+'-original-rig-scenarios.json',
  JSON.stringify(receipt,null,2)+'\n');
 console.log('M2_TRUE_MET_ORIGINAL_SOURCE_BOTH_163BONE_NO_PHYSICAL_CALIBRATION '+JSON.stringify({
  engine:browserName,rigs:['female','male'],samples:sourceRows.length,
  distinctActualRenderedScreenshots:pngHash.length,
  originalReal163boneSkinnedAndReversiblyPosedAvatars:skeletonPoseEvidence.length,
  genuineOriginalSourceSkinnedVertexDisplacementProved:true,
  originalMaskedRGBVerified:true,originalRigBytesAndSkinsUnmodified:true,
  physicallyFitted:false,collisionCleared:false,
  genuineBodyBoneAnchorWeightsButNotFitted:true,
  actualTriangleProximityMeasuredButNotCollisionCertified:true,
  strictTriangleFaceIntersectionSampledForBothOriginalLicensedRigs:true,
  fiveDiscreteAuthenticSpinePoseCrossingStudies:true,
  kernelPositiveAndSeparatedControlProof:true,
  realFullIndexedOriginalFaceFailClosedContactGateBothLicensedRigs:true,
  coplanarAndTouchingControlVerified:true,
  actualPhysicalScaleAndCameraNotInvented:true,
  originalContactEligibilityFailsClosedOnUnfinishedResourceAudits:true,
  browserErrors:failures.length,externalHTTP:0,
  consumer3DAdmitted:false,familyAlpha:'HOLD'
 }));
}finally{
 await browser.close();
 await new Promise(ok=>server.close(ok));
}
