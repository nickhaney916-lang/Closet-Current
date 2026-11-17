/**
 * P89 actual original Commons-0043 photo-to-THREE source skirt on REAL
 * licensed P541 CC0 male/female 163-bone avatars, native Chromium + WebKit.
 * Scans ALL skirt/body source skinned triangles with immutable P84 BVH,
 * witnesses intersections only (not containment, depth sign, swept motion).
 * Always blocks consumer 3D and preserves original-photo 2D fallback.
 */
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,join,extname} from 'node:path';
import {chromium,webkit} from 'playwright';
import sharp from 'sharp';
import {auditOriginalSkirtResearchFrontCoverage89}
 from '../research/parallel89/skirt-original-front-visibility89.mjs';
import {summarizeOriginalSkirtUnphotographedRear89}
 from '../research/parallel89/skirt-rear-evidence-gate89.mjs';
const [donorArg,p84Arg]=process.argv.slice(2);
const donor=resolve(donorArg||'.'),p84=resolve(p84Arg||'.'),here=resolve('.');
const engine=process.env.P89_BROWSER||'chromium';
assert.ok(donorArg&&p84Arg&&donor!==here&&p84!==here&&
 donor!==p84&&['chromium','webkit'].includes(engine),
 'Immutable separate real P541/P84 research worktrees and native browser required');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const required={
 skirt:'c8d0812ab69d698f5bf8dc5a14ace6b8034e4c74152471acf4f079fdd6d0c344',
 cutout:'b9717f71fffb65beb7b17beebd54702333d41e34f10f214831251660b1664be4',
 female:'a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1',
 male:'d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8'
};
const sourceFiles=[
 [here+'/benchmark/fixtures/commons-0043.jpg','skirt'],
 [donor+'/benchmark/work47/assets/commons-0043.jpg','skirt'],
 [donor+'/benchmark/work47/assets/commons-0043.png','cutout'],
 ...['female','male'].map(x=>[donor+'/research/three-d-06/models/'+x+'-cc0-rigged.glb',x])
];
for(const [path,id] of sourceFiles){
 const bytes=await readFile(path);assert.equal(hash(bytes),required[id],'original public source/rig SHA altered: '+id);
}
const out='benchmark/parallel89-native-original-skirt/'+engine;
await mkdir(out,{recursive:true});
const mime={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript',
 '.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg',
 '.json':'application/json','.css':'text/css','.wasm':'application/wasm'};
const server=createServer(async(req,res)=>{
 try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(path.includes('..')||path.includes('\0')||path.includes('\\'))throw Error('invalid-path');
  let root,trim;
  for(const [prefix,base] of [['/donor/',donor],['/p84/',p84],
    ['/research/',here],['/benchmark/',here],['/node_modules/',here]]){
   if(path.startsWith(prefix)){root=base;trim=prefix==='/donor/'||prefix==='/p84/'?
    path.slice(prefix.length):path.slice(1);break;}
  }
  if(!root)throw Error('outside-source');
  const file=resolve(root,trim);if(!file.startsWith(root+'/'))throw Error('outside-root');
  const bytes=await readFile(file);
  res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream',
   'cache-control':'no-store','x-content-type-options':'nosniff'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end('unavailable');}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
const results={schema:'P89-actual-independent-public-photo-skirt-native-163bone-browser/v1',
 engine,skirtSource:'commons-0043',originalSHA256:required.skirt,
 originalMaskSHA256:required.cutout,
 anatomicalModelSHA256:{female:required.female,male:required.male},
 exactIndependentSourceSkirtNotDress:true,
 sourceAlphaDecision:'REVIEW',humanSourceCutoutAccepted:false,
 originalPhoto2DFallbackRequired:true,
 sourceOnlyNoPrivateOwnerData:true,
 engineRealBrowser:true,physicalDeviceTested:false,
 sourcePhotoRearUnobserved:true,
 originalOriginalPhotoOrRigModified:false,
 directSourceTextureOnActualRigProvisional:true,
 garmentFitNotHumanApproved:true,
 fullContinuousMeshContactNotCertified:true,
 originalPhoto2DShown:true,
 screenCaptureCountExpected:54,figurePoseSamplesExpected:6,
 researchOnlyRigid45ScreenCaptureCountExpected:18,
 captures:[],poseSamples:[],diffs:[],neutralRearTrials:[],measuredBodyFitTrials:[],registrationTrials:[],waistAnchorLandmarkReports:[],research45OnlyPreviewScreenshots:[],research45OnlyPoseBVHChecks:[],research45OnlyQuarterPoseChecks:[],
 selectedResearchPoseChecks:[],selectedResearchNativeScreenshots:[],selectedResearchFrontCoverage:[],selectedSourceBodyRadialGapAudits:[],selectedSourceWholeBodyClosureAudits:[],selectedOriginalSourceBodySeamAudits:[],selectedOriginalSourceBodyBoundaryRegionAudits:[],originalPhoto45FrontVisibilityReports:[],originalPublicUnphotographedRearVisibilityReports:[],verifiedOriginalSourceRearEvidenceSummary:null,errors:[],offsite:[],
 releaseAuthorized:false,familyAlpha:'HOLD'};
let browser;
async function screenshot(page,name){
 const bytes=await page.locator('#avatar').screenshot({animations:'disabled'});
 const md=await sharp(bytes).metadata();
 assert.ok(md.width>=300&&md.height>=600,'actual original source rig WebGL pixels missing');
 await writeFile(join(out,name),bytes);
 const row={name,sha256:hash(bytes),width:md.width,height:md.height,
  nativeWebGLOriginalSource:true,realPhone:false,humanRealismApproved:false};
 results.captures.push(row);return bytes;
}
async function changed(a,b){
 const aa=await sharp(a).removeAlpha().raw().toBuffer();
 const bb=await sharp(b).removeAlpha().raw().toBuffer();
 assert.equal(aa.length,bb.length);
 let n=0;for(let i=0;i<aa.length;i++)if(Math.abs(aa[i]-bb[i])>12)n++;
 return n;
}
try{
 browser=await ({chromium,webkit})[engine].launch({headless:true,...(
  engine==='chromium'?{args:['--use-gl=angle','--use-angle=swiftshader',
   '--enable-unsafe-swiftshader','--enable-webgl']}: {})});
 const context=await browser.newContext({viewport:{width:390,height:870},
  deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:'block'});
 const page=await context.newPage();
 page.on('pageerror',e=>results.errors.push('pageerror: '+String(e.message).slice(0,300)));
 page.on('crash',()=>results.errors.push('webgl browser crash'));
 await page.route('**/*',route=>{
  const url=route.request().url();
  if(url.startsWith(origin)||url.startsWith('data:')||url.startsWith('blob:'+origin))
   return route.continue();
  results.offsite.push('forbidden request');return route.abort();
 });
 await page.goto(origin+'/research/parallel89/native-skirt-browser89.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.nativeP89Skirt?.getState()?.phase==='ready'||
  !!window.nativeP89SkirtError,null,{timeout:120000});
 assert.equal(await page.evaluate(()=>window.nativeP89SkirtError||null),null,
  'real-licensed-skirt native setup failed');
 await page.locator('#original').evaluate(img=>img.decode());
 const original=await page.locator('#original').screenshot({animations:'disabled'});
 assert.ok(original.length>10000,'source-matched original JPEG 2D reference not visible');
 await writeFile(join(out,'original-2d-jpeg-reference.png'),original);
 results.original2DJPEGReferenceScreenshotSHA256=hash(original);
 results.realPhoto2DReferenceViews=1;
 for(const avatar of ['female','male']){
  if(avatar==='male')await page.evaluate(()=>window.nativeP89Skirt.load('male'));
  for(const pose of ['source','blend-50','relaxed']){
   const witness=await page.evaluate(name=>window.nativeP89Skirt.setPose(name),pose);
   const state=await page.evaluate(()=>window.nativeP89Skirt.getState());
   assert.equal(state.phase,'ready');assert.equal(state.avatar,avatar);
   assert.equal(state.sourceId,'commons-0043');
   assert.equal(state.originalSourceSHA256,required.skirt);
   assert.equal(state.originalCutoutSHA256,required.cutout);
   assert.equal(state.bones,163);assert.equal(state.attachedSkinnedMesh,true);
   assert.equal(state.skirtTriangleCount,576);
   assert.equal(state.meshSourceFrontTextureVerified,true);
   assert.equal(state.nativeWebGL2,true);
   assert.equal(state.releaseAuthorized,false);
   assert.equal(state.ownerApproved,false);
   assert.equal(state.sourcePhoto2DFallbackRequired,true);
   assert.equal(witness.pose,pose);assert.equal(witness.avatar,avatar);
   assert.equal(witness.realAnatomicalRigBones,163);
   assert.equal(witness.sourceTrianglesAudited,576);
   assert.equal(witness.trueOriginalPhotoSkirtFaceIDsStable,true);
   assert.equal(witness.trueOriginalAnatomicalFaceIDsStable,true);
   assert.equal(witness.originalTriangleIDResolution,
    'BVH_INDIRECT_RESOLVED_ORIGINAL_TRIANGLE_INDICES');
   assert.equal(witness.releaseAuthorized,false);
   assert.equal(witness.fullContinuousClothOrContainmentSafety,false);
   assert.ok(Number.isSafeInteger(witness.strictTransverseSourceBodyTriangleCrossings)&&
    witness.strictTransverseSourceBodyTriangleCrossings>=0);
   results.poseSamples.push(witness);
   for(const angle of [0,90,180]){
    await page.evaluate(x=>window.nativeP89Skirt.setView(x),angle);
    const png=await screenshot(page,['source-skirt',engine,avatar,pose,angle].join('-')+'.png');
    await page.evaluate(()=>window.nativeP89Skirt.toggleSkirt(false));
    const bare=await page.locator('#avatar').screenshot({animations:'disabled'});
    await page.evaluate(()=>window.nativeP89Skirt.toggleSkirt(true));
    const diff=await changed(png,bare);
    if(angle===0)assert.ok(diff>1000,'real original source skirt on true avatar must change WebGL front pixels: '+avatar+' '+pose);
    results.diffs.push({avatar,pose,angle,changedRGBChannelsAbove12:diff,
     referenceIsRealOriginalAnatomicalBody:true,
     sourceSkirtVisible:diff>1000,subjectNotHumanApproved:true});
   }
  }
  const trial=await page.evaluate(()=>window.nativeP89Skirt.trialNeutralRear());
  assert.ok([
   'BOUNDED_NEUTRAL_REAR_CONTACT_REDUCTION_NOT_CLEARANCE',
   'NO_REAR_ONLY_NONWORSENING_REDUCTION_SHOWN'
  ].includes(trial.status),'original photographed skirt rear trial not source-verified');
  assert.equal(trial.avatar,avatar);
  assert.equal(trial.actualFullSourcePoseSamples,3);
  assert.equal(trial.candidateTests.length,3);
  assert.equal(trial.sourcePhoto2DFallbackRequired,true);
  assert.equal(trial.frontPhotoGeometryUntouched,true);
  assert.equal(trial.originalSourceUVAndSourceAlphaUntouched,true);
  assert.equal(trial.allCandidateGeometryRestored,true);
  assert.equal(trial.releaseAuthorized,false);
  assert.equal(trial.consumer3DAdmitted,false);
  const before=results.poseSamples.filter(x=>x.avatar===avatar).reduce(
   (sum,x)=>sum+x.strictTransverseSourceBodyTriangleCrossings,0);
  assert.equal(trial.actualSourceCrossingPairsBefore,before,
   'research rear-only trial must compare against same genuine 163-bone pose contacts');
  if(trial.bestProvisional){
   assert.ok(trial.bestProvisional.trialSourcePoseCrossingSum<
    trial.bestProvisional.originalSourcePoseCrossingSum);
   assert.equal(trial.bestProvisional.newCrossingPairKeys,0);
   assert.equal(trial.bestProvisional.orientedPlaneDepthWorsened,false);
   assert.equal(trial.bestProvisional.originalFrontPositionsAndUVFixed,true);
  }
  const restored=await page.evaluate(()=>window.nativeP89Skirt.getState());
  assert.equal(restored.bones,163);
  assert.equal(restored.originalSourceSHA256,required.skirt);
  assert.equal(restored.releaseAuthorized,false);
  results.neutralRearTrials.push(trial);
  const measured=await page.evaluate(()=>window.nativeP89Skirt.trialMeasuredAnatomyFit());
  assert.ok(['BODY_MEASURED_FIT_RESEARCH_CONTACT_REDUCED_NOT_WEARABLE',
   'BODY_MEASURED_SOURCE_FIT_REFUSED_OR_COLLISIONS_REMAIN'].includes(measured.status),
   'original body source envelope fitting unverified: '+(measured.reason||measured.status));
  assert.equal(measured.avatar,avatar);
  assert.equal(measured.nativeSkinnedRigBones,163);
  assert.equal(measured.trueOriginalLicensedGarment,true);
  assert.equal(measured.actualBodyMeasurementsFromOriginalPublicGLBsOnly,true);
  assert.equal(measured.originalSkinnedSourceFacePlaneIntersectionsUsed,true);
  assert.equal(measured.independentCoreTorsoLegBoneSourcePartMaskVerified,true);
  assert.equal(measured.unrelatedUpperExtremityOnlyExcludedFromRadialDesignNeverFromCollisionBVH,true);
  assert.ok(measured.actualAnatomicalOriginalBodyCrossSectionSummaries.every(x=>
   x.originalBodyCorePartSpecificEnvelope===true&&
   Number.isSafeInteger(x.originalArmHandHeadTrianglesExcludedFromSkirtEnvelopeOnly)&&
   x.originalArmHandHeadTrianglesExcludedFromSkirtEnvelopeOnly>=24&&
   x.fullOriginalBodyStillUsedForIndependentCollisionAudit===true));
  assert.ok(measured.actualAnatomicalOriginalBodyCrossSectionSummaries.every(x=>
   x.genuineSkinnedBodySourceTriangleIntersections===true&&
   x.trueOriginalBodyFacePlaneSegmentsPerBand.length===7&&
   x.trueOriginalBodyFacePlaneSegmentsPerBand.every(n=>Number.isInteger(n)&&n>=4)));
  assert.deepEqual(measured.sampledActualBonePoses,['source','blend-50','relaxed']);
  assert.equal(measured.radialSourceBands,7);
  assert.equal(measured.sectorCount,48);
  assert.equal(measured.candidateRegimes.length,3);
  assert.equal(measured.actualAnatomicalOriginalBodyCrossSectionSummaries.length,3);
  assert.equal(measured.originalPhotographedFrontColorAndUVPreserved,true);
  assert.equal(measured.originalSkirtSourceBuffersUntouched,true);
  assert.equal(measured.allTestsRevertedNoConsumerGeometryChanged,true);
  assert.equal(measured.source2DFallbackRequired,true);
  assert.equal(measured.photoSkirtConsumer3DAdmitted,false);
  assert.equal(measured.releaseAuthorized,false);
  assert.equal(measured.baselineStrictSkirtBodyTriangleCrossingsAcrossPoses,before);
  assert.equal(measured.baselineCrossingsBySourceSkirtBand.length,6);
  assert.equal(measured.baselineCrossingsBySourceSkirtBand.reduce((a,b)=>a+b,0),before);
  for(const test of measured.candidateRegimes){
   assert.equal(test.trueOriginalSkinnedRig,163);
   assert.equal(test.sampledPoseCount,3);
   assert.equal(test.sourceCutoutJPEGAndAlphaBytesPreserved,true);
   assert.equal(test.originalPhotoTextureUVNeverEdited,true);
   assert.equal(test.photoMotifStretchHasNoHumanAcceptance,true);
   assert.equal(test.consumer3DAdmitted,false);
   assert.equal(test.releaseAuthorized,false);
   assert.equal(test.sourceMaskBandFit.length,7);
   assert.ok(Number.isFinite(test.worstAreaRelativeChange)&&
    Number.isFinite(test.worstEdgeRelativeChange));
  }
  if(measured.bestProvisionalStructuralAB){
   const best=measured.bestProvisionalStructuralAB;
   assert.equal(best.refusedReasons.length,0);
   assert.equal(best.acceptedForResearchA_BOnly,true);
   assert.ok(best.trialStrictSkirtBodyCrossingPairSum<
    best.originalStrictSkirtBodyCrossingPairSum);
   assert.equal(best.realHumanVisualFitAccepted,false);
  }
  results.measuredBodyFitTrials.push(measured);
  const registration=await page.evaluate(()=>window.nativeP89Skirt.trialRigidRegistration());
  assert.ok(['RESEARCH_REGISTRATION_REDUCED_STATIC_PAIRS_NOT_WEARABLE',
   'NO_SAFE_REDUCING_ORIGINAL_SKIRT_REGISTRATION_WITNESSED'].includes(registration.status),
   'actual original photo skirt registration source verification rejected: '+
   (registration.reason||registration.status));
  assert.equal(registration.avatar,avatar);
  assert.equal(registration.sourceId,'commons-0043');
  assert.equal(registration.actualOriginalPhotoSkirtFaces,576);
  assert.equal(registration.original163BoneModelUnchanged,true);
  assert.equal(registration.trials.length,11);
  assert.deepEqual(registration.trials.map(t=>t.name),[
   'front-15mm','front-30mm','front-35mm','front-40mm',
   'front-45mm','front-50mm','front-55mm','front-60mm',
   'back-15mm','up-20mm','down-20mm'
  ]);
  assert.equal(registration.allCandidateOriginalAndTrialFivePoseBVHSamplesObserved,true);
  assert.equal(registration.bestResearchCandidateSelectedByFivePosePairSumThenMinimumDisplacement,true);
  assert.equal(registration.candidateMustPassAllFiveSourcePoses,true);
  assert.ok(registration.originalFivePoseStrictCrossingPairSum>=before);
  assert.equal(registration.maximumExploratoryOriginalWaistForwardRegistrationMeters,.06);
  assert.equal(registration.photoRegistrationCandidatesRequireIndependentPhotoFidelityReview,true);
  assert.equal(registration.original3PoseStrictBodyCrossingPairs,before);
  assert.equal(registration.allCandidatesDisposedAndRestored,true);
  assert.equal(registration.sourcePhotoPixelsAndMasksUnmodified,true);
  assert.equal(registration.realPhotoFrontUVAndRestSurfaceUnmodified,true);
  assert.equal(registration.originalPhoto2DFallbackRequired,true);
  assert.equal(registration.consumer3DAdmitted,false);
  assert.equal(registration.releaseAuthorized,false);
  for(const t of registration.trials){
   assert.equal(t.actual163BoneBodyTriangleBVHAcrossThreePoses,true);
   assert.equal(t.identicalOriginalSourceFaceIDsAcrossRebuiltBVHs,true);
   assert.equal(t.useOfBVHIndirectIndexMappingVerified,true);
   assert.equal(t.sourceRGBAndReviewAlphaBytesUnchanged,true);
   assert.equal(t.originalSkirtUVUnchanged,true);
   assert.equal(t.originalSkirtRestEdgeLengthUnchanged,true);
   assert.equal(t.originalSkirtRestTriangleShapeUnchanged,true);
   assert.equal(t.perPoseContacts.length,3);
   assert.equal(t.intermediatePoseContactChecks.length,2);
   assert.equal(t.originalFivePoseStrictCrossingPairSum,
    registration.originalFivePoseStrictCrossingPairSum);
   assert.equal(t.trialFivePoseStrictCrossingPairSum,
    t.trialThreePoseStrictCrossingPairSum+
     t.intermediatePoseContactChecks.reduce((n,x)=>n+x.trialStrictTransversePairs,0));
   assert.equal(t.introducedFivePoseSourceFacePairIDs,
    t.introducedOriginalSourceFacePairIDs+
     t.intermediatePoseContactChecks.reduce((n,x)=>n+x.newOriginalSourceFacePairIDs,0));
   assert.equal(t.fivePoseEvidenceIsStaticNotSwept,true);
   assert.ok(t.displacementMeters>0&&t.displacementMeters<=.06001);
   assert.equal(t.originalThreePoseStrictCrossingPairSum,before);
   const topology=t.genuineOriginalSkirtContactTopology;
   assert.equal(topology?.status,
    'GENUINE_ORIGINAL_FULL_BODY_SOURCE_CONTACT_TURNOVER_MEASURED_NOT_CLEARANCE',
    'real original photo source garment/body BVH triangle pair topology missing');
   assert.equal(topology.avatar,avatar);
   assert.equal(topology.trialName,t.name);
   assert.equal(topology.originalSkirtSourceId,'commons-0043');
   assert.equal(topology.sourceSkirtFaceCount,576);
   assert.equal(topology.originalSourceFaceIndicesAreStableAcrossBVHRebuilds,true);
   assert.equal(topology.indirectOriginalFaceResolutionRequired,true);
   assert.ok(topology.bodySourceFaceCount>=1000);
   assert.equal(topology.poses.length,3);
   assert.equal(topology.originalStrictCrossingPairSum,before);
   assert.equal(topology.trialStrictCrossingPairSum,t.trialThreePoseStrictCrossingPairSum);
   assert.equal(topology.newlyIntroducedOriginalBodySkirtFacePairSum,
    t.introducedOriginalSourceFacePairIDs);
   assert.equal(topology.persistedOriginalBodySkirtFacePairSum+
    topology.resolvedOriginalBodySkirtFacePairSum,before);
   assert.equal(topology.persistedOriginalBodySkirtFacePairSum+
    topology.newlyIntroducedOriginalBodySkirtFacePairSum,
    t.trialThreePoseStrictCrossingPairSum);
   for(const key of ['originalContactBands','trialContactBands',
    'introducedContactBands','resolvedContactBands']){
    assert.equal(topology[key].length,6);
   }
   assert.equal(topology.originalContactBands.reduce((a,b)=>a+b,0),before);
   assert.equal(topology.trialContactBands.reduce((a,b)=>a+b,0),
    t.trialThreePoseStrictCrossingPairSum);
   assert.equal(topology.introducedContactBands.reduce((a,b)=>a+b,0),
    t.introducedOriginalSourceFacePairIDs);
   assert.equal(topology.originalContactSurfaces.photoFront+
    topology.originalContactSurfaces.unphotographedBack,before);
   assert.equal(topology.trialContactSurfaces.photoFront+
    topology.trialContactSurfaces.unphotographedBack,
    t.trialThreePoseStrictCrossingPairSum);
   assert.equal(topology.rawOriginalAnatomicalSourceCoordinatesPersisted,false);
   assert.equal(topology.exactOriginalSourceTrianglePairIDsPersisted,false);
   assert.equal(topology.unphotographedNeutralRearNotTreatedAsReal,true);
   assert.equal(topology.continuousSweptContactCertified,false);
   assert.equal(topology.releaseAuthorized,false);
   assert.equal(t.releaseAuthorized,false);
   if(t.researchOnlyNonworseningReduction){
    assert.equal(t.introducedOriginalSourceFacePairIDs,0);
    assert.equal(t.maxPlaneDepthWorsened,false);
    assert.equal(t.introducedFivePoseSourceFacePairIDs,0);
    assert.equal(t.intermediatePoseCrossingGuardPassed,true);
    assert.ok(t.trialFivePoseStrictCrossingPairSum<
     registration.originalFivePoseStrictCrossingPairSum);
   }
  }
  if(registration.bestResearchOnly){
   const best=registration.bestResearchOnly;
   assert.ok(registration.trials.filter(x=>x.researchOnlyNonworseningReduction)
    .every(x=>best.trialFivePoseStrictCrossingPairSum<
      x.trialFivePoseStrictCrossingPairSum||
      best.trialFivePoseStrictCrossingPairSum===
       x.trialFivePoseStrictCrossingPairSum&&best.displacementMeters<=
        x.displacementMeters+.000001));
   assert.equal(best.consumer3DAdmitted,false);
  }
  const restoredAfterRegistration=await page.evaluate(()=>window.nativeP89Skirt.getState());
  assert.equal(restoredAfterRegistration.originalSourceSHA256,required.skirt);
  assert.equal(restoredAfterRegistration.bones,163);
  assert.equal(restoredAfterRegistration.releaseAuthorized,false);
  results.registrationTrials.push(registration);
  const waistAnchors=await page.evaluate(()=>window.nativeP89Skirt.auditWaistBoneAnchors());
  assert.equal(waistAnchors.schema,'P89-public-anatomical-waist-bone-attachment-audit/v1');
  assert.equal(waistAnchors.status,
   'ORIGINAL_SOURCE_RIG_WAIST_ANCHOR_VERTICAL_LANDMARKS_MEASURED_NOT_FIT');
  assert.equal(waistAnchors.avatar,avatar);
  assert.equal(waistAnchors.boneCount,163);
  assert.equal(waistAnchors.actualOriginalWaistBinding,'spine04');
  assert.equal(waistAnchors.trueNamedPelvisExists,false);
  assert.ok(waistAnchors.originalPublicBodyJointHeightCandidates.length>=3);
  assert.ok(waistAnchors.nearestObservedNamedOriginalRigLandmarks.length>=1);
  assert.ok(Number.isFinite(waistAnchors.originalSourceWaistRimVerticalHeightMeters));
  assert.ok(Number.isFinite(waistAnchors.originalSourceSpine04VerticalHeightMeters));
  assert.ok(Number.isFinite(waistAnchors.originalWaistRimAndSpine04HeightMismatchMeters));
  assert.equal(waistAnchors.independentPhysicalWaistMeasurementExists,false);
  assert.equal(waistAnchors.originalSourceGarmentUVAndRigUnmodified,true);
  assert.equal(waistAnchors.originalPhoto2DFallbackRequired,true);
  assert.equal(waistAnchors.consumer3DAdmitted,false);
  assert.equal(waistAnchors.releaseAuthorized,false);
  results.waistAnchorLandmarkReports.push(waistAnchors);
  // Never show this on an owner app. Evidence is genuine ORIGINAL PHOTO
  // source-visible 3D against the two immutable licensed skinned GLBs.
  // Compare the +45mm candidate to the EXACT original real WebGL pixels
  // from the same original source rig/avatar and three anatomical poses.
  // We MUST restore the unchanged original garment after every pose.
  const research45=registration.trials.find(t=>t.name==='front-45mm');
  assert.ok(research45,'source-rigid 45mm trial missing');
  assert.equal(research45.sourceRGBAndReviewAlphaBytesUnchanged,true);
  assert.equal(research45.originalSkirtUVUnchanged,true);
  assert.equal(research45.originalSkirtRestTriangleShapeUnchanged,true);
  assert.equal(research45.releaseAuthorized,false);
  for(const testPose of ['source','blend-50','relaxed']){
   const originalWitness=await page.evaluate(name=>window.nativeP89Skirt.setPose(name),testPose);
   const preview=await page.evaluate(()=>
    window.nativeP89Skirt.showOnlySourceRigidRegistration45(true));
   assert.equal(preview.status,'ORIGINAL_PHOTO_RIGID_45MM_STATIC_RESEARCH_PREVIEW_ONLY');
   assert.equal(preview.researchOnlySourceSkirt45mmActive,true);
   assert.equal(preview.releaseAuthorized,false);
   const previewContact=await page.evaluate(name=>window.nativeP89Skirt.setPose(name),testPose);
   const expected=research45.perPoseContacts[
    ['source','blend-50','relaxed'].indexOf(testPose)];
   assert.equal(previewContact.strictTransverseSourceBodyTriangleCrossings,
    expected.trialStrictTransversePairs,
    'actual rendered +45mm original-photo skirt has different source-body BVH than measured 45mm trial');
   const poses=[];
   for(const angle of [0,90,180]){
    await page.evaluate(n=>window.nativeP89Skirt.setView(n),angle);
    const refName=['source-skirt',engine,avatar,testPose,angle].join('-')+'.png';
    const fromOriginal=await readFile(join(out,refName));
    const img=await screenshot(page,['research-only-45mm-source-skirt',
     engine,avatar,testPose,angle].join('-')+'.png');
    const changedRGB=await changed(img,fromOriginal);
    if(angle===0){
     const [baseline,shifted]=await Promise.all([
      sharp(fromOriginal).removeAlpha().raw().toBuffer({resolveWithObject:true}),
      sharp(img).removeAlpha().raw().toBuffer({resolveWithObject:true})
     ]);
     assert.equal(baseline.info.width,390);assert.equal(baseline.info.height,690);
     assert.equal(shifted.info.width,390);assert.equal(shifted.info.height,690);
     assert.equal(baseline.info.channels,3);assert.equal(shifted.info.channels,3);
     const visible=auditOriginalSkirtResearchFrontCoverage89({
      originalRGB:new Uint8Array(baseline.data),
      candidateRGB:new Uint8Array(shifted.data),
      width:390,height:690,avatar,pose:testPose,sourceSHA256:required.skirt
     });
     assert.equal(visible.status,
      'ORIGINAL_PHOTOGRAPH_CENTER_FRONT_COVERAGE_IMPROVED_RESEARCH_ONLY',
      'candidate +45mm must visibly restore original source-photo center panel over original public mannequin, independent of 0 BVH crossings: '+JSON.stringify(visible));
     assert.equal(visible.originalPhotoCenterFrontOcclusionReduced,true);
     assert.equal(visible.humanVisualFitAccepted,false);
     assert.equal(visible.originalPhoto2DFallbackRequired,true);
     assert.equal(visible.consumer3DAdmitted,false);
     assert.equal(visible.releaseAuthorized,false);
     results.originalPhoto45FrontVisibilityReports.push(visible);
    }
    const neutralRear=await page.evaluate(()=>
     window.nativeP89Skirt.auditOnlyUnobservedRearRenderedPixels());
    assert.equal(neutralRear.schema,
     'P89-actual-original-licensed-photo-visible-provisional-neutral-rear/v1');
    assert.equal(neutralRear.status,
     'ORIGINAL_PUBLIC_SKIRT_UNPHOTOGRAPHED_REAR_RENDERED_NOT_REAL_PHOTO');
    assert.equal(neutralRear.avatar,avatar);
    assert.equal(neutralRear.pose,testPose);
    assert.equal(neutralRear.viewAngle,angle);
    assert.equal(neutralRear.actual163BoneSourceRig,true);
    assert.equal(neutralRear.sourceFrontPhotographedSurfaceTriangleCount,288);
    assert.equal(neutralRear.sourceUnphotographedRearTriangleCount,288);
    assert.ok(neutralRear.unphotographedRearMarkerPixels>=0);
    assert.ok(neutralRear.opaqueSourceMeshProjectedMarkerPixels>=
      neutralRear.unphotographedRearMarkerPixels);
    assert.ok(neutralRear.opaqueSourceMeshProjectedMarkerPixels>0);
    assert.ok(neutralRear.inferredRearLowerBoundShareOfOpaqueProjectedOriginalSkirt>=0&&
      neutralRear.inferredRearLowerBoundShareOfOpaqueProjectedOriginalSkirt<=1);
    assert.equal(neutralRear.opaqueFrontMarkerOverestimatesPhotographicAlphaCoverage,true);
    assert.equal(neutralRear.projectedSourceDenominatorNotTruePhotographedVisiblePixels,true);
    assert.equal(neutralRear.temporaryAttributionMaterialDisposedAndRestored,true);
    assert.equal(neutralRear.originalPhotoFrontUVAndRGBUnchanged,true);
    assert.equal(neutralRear.originalRearPhotoObserved,false);
    assert.equal(neutralRear.inferredBackDoesNotBecomePhotographed,true);
    assert.equal(neutralRear.originalMaskOwnerApproved,false);
    assert.equal(neutralRear.sourcePhoto2DFallbackRequired,true);
    assert.equal(neutralRear.consumer3DAdmitted,false);
    assert.equal(neutralRear.releaseAuthorized,false);
    // In an actual 90/180 degree SOURCE native camera, the unphotographed
    // back is visibly on screen. This is a mandatory BLOCKER, regardless
    // of 0 strictly intersecting source body/skirt face pairs.
    if(angle===90)assert.ok(neutralRear.unphotographedRearMarkerPixels>750,
     'actual 90-degree original skirt side view must disclose visible unphotographed rear');
    if(angle===180)assert.ok(neutralRear.unphotographedRearMarkerPixels>2000,
     'actual original 180-degree rear source view must disclose substantial inferred non-photographic back');
    if(angle===180)assert.ok(
     neutralRear.inferredRearLowerBoundShareOfOpaqueProjectedOriginalSkirt>.70,
     'even under source photo alpha-conservative overcount, genuine rear source camera must show dominant inferred back');
    results.originalPublicUnphotographedRearVisibilityReports.push(neutralRear);
    poses.push({angle,changedRGBChannelsAbove12:changedRGB});
    results.research45OnlyPreviewScreenshots.push({
     avatar,pose:testPose,angle,changedRGBChannelsAbove12:changedRGB,
     sourceOriginalJPEG:required.skirt,
     sourceRGBAndTextureUVAndAlphaUnmodified:true,
     trueOriginal163BoneRig:true,
     originalPhoto2DFallbackRequired:true,
     physicalScaleMeasured:false,
     inferredRearFabricUnobserved:true,
     humanVisualFitApproved:false,
     continuouslyCollisionFree:false,
     sourcePhotoBackHumanVerified:false,
     consumer3DAdmitted:false,releaseAuthorized:false
    });
   }
   assert.ok(poses.find(x=>x.angle===90).changedRGBChannelsAbove12>100,
    '45mm original photo skirt registration must physically change real WebGL side pixels');
   const restoredPreview=await page.evaluate(()=>
    window.nativeP89Skirt.showOnlySourceRigidRegistration45(false));
   assert.equal(restoredPreview.status,'ORIGINAL_LICENSED_PHOTO_SKIRT_FULLY_RESTORED');
   assert.equal(restoredPreview.researchOnlySourceSkirt45mmActive,false);
   assert.equal(restoredPreview.photoTextureUVAndOriginalRestGeometryUntouched,true);
   assert.equal(restoredPreview.releaseAuthorized,false);
   const back=await page.evaluate(name=>window.nativeP89Skirt.setPose(name),testPose);
   assert.equal(back.strictTransverseSourceBodyTriangleCrossings,
    originalWitness.strictTransverseSourceBodyTriangleCrossings,
    'original source photographed skirt was not restored after 45mm preview');
   const stateAfter=await page.evaluate(()=>window.nativeP89Skirt.getState());
   assert.equal(stateAfter.researchOnlySourceRigid45PreviewActive,false);
   assert.equal(stateAfter.originalSourceSHA256,required.skirt);
   assert.equal(stateAfter.bones,163);
   assert.equal(stateAfter.consumer3DAdmission,false);
   results.research45OnlyPoseBVHChecks.push({
    avatar,pose:testPose,
    originalPhotoSkirtBodyContactPairs:originalWitness.strictTransverseSourceBodyTriangleCrossings,
    rigid45mmRenderSourceBodyContactPairs:previewContact.strictTransverseSourceBodyTriangleCrossings,
    rigid45mmResearchABMeasuredContactPairs:expected.trialStrictTransversePairs,
    sourceGeometryAndRigRestored:true,originalPhoto2DFallbackRequired:true,
    humanVisualFitApproved:false,consumer3DAdmitted:false,releaseAuthorized:false
   });
  }

  // The source-contact winner differs by *actual avatar*. The older fixed
  // 45mm proof cannot be substituted for the genuinely five-pose-selected
  // 40mm female / 35mm male candidate. Render and verify the actual selected
  // candidate at all five original skinned poses, and independently inspect
  // its real photographed front pixels at the original camera viewport.
  const selected=registration.bestResearchOnly;
  assert.ok(selected?.researchOnlyNonworseningReduction,
   'no selected BVH original-source result; unverified 3D must stay 2D');
  assert.equal(selected.consumer3DAdmitted,false);
  assert.equal(selected.releaseAuthorized,false);
  const selectedPoses=['source','blend-25','blend-50','blend-75','relaxed'];
  for(const selectedPose of selectedPoses){
   await page.evaluate(()=>window.nativeP89Skirt.setView(0));
   const originalPose=await page.evaluate(p=>
    window.nativeP89Skirt.setPose(p),selectedPose);
   const enabled=await page.evaluate(()=>
    window.nativeP89Skirt.showOnlySelectedRegistration89(true));
   assert.equal(enabled.status,
    'SELECTED_FIVE_POSE_ORIGINAL_PHOTO_REGISTRATION_RESEARCH_PREVIEW_ONLY');
   assert.equal(enabled.selectedPreviewActive,true);
   assert.equal(enabled.selectedResearchRegistrationName,selected.name);
   assert.equal(enabled.selectedResearchRegistrationMeters,
    selected.localCameraFacingRegistrationMeters[2]);
   assert.equal(enabled.consumer3DAdmitted,false);
   assert.equal(enabled.releaseAuthorized,false);
   const live=await page.evaluate(p=>
    window.nativeP89Skirt.setPose(p),selectedPose);
   const index=['source','blend-50','relaxed'].indexOf(selectedPose);
   const qindex=['blend-25','blend-75'].indexOf(selectedPose);
   const expected=index<0?
    selected.intermediatePoseContactChecks[qindex].trialStrictTransversePairs:
    selected.perPoseContacts[index].trialStrictTransversePairs;
   assert.equal(live.strictTransverseSourceBodyTriangleCrossings,expected,
    'ACTUAL rendered true selected-original-photo source/BVH trial differs from measured five-pose best');
   // Independent geometric body radial witness. Zero crossing pairs are NOT
   // sufficient to prove the cloth is outside the body or physically sized.
   const radial=await page.evaluate(()=>
    window.nativeP89Skirt.auditSelectedSourceRadialGap89());
   assert.equal(radial.schema,'P89-actual-original-163bone-source-radial-body-gap/v1');
   assert.ok([
    'SAMPLED_SOURCE_RADIAL_INWARD_AND_MISSING_BODY_SECTORS_NOT_WEARABLE',
    'SAMPLED_SOURCE_RADIAL_BODY_COVERAGE_INCOMPLETE_NOT_WEARABLE',
    'SAMPLED_SOURCE_RADIAL_INWARD_BODY_OVERLAP_WITNESSED_NOT_WEARABLE',
    'SAMPLED_SOURCE_RADIAL_GAP_OBSERVED_NOT_CLOSED_VOLUME_FIT'
   ].includes(radial.status),'genuine source ring geometry unavailable: '+JSON.stringify(radial));
   assert.equal(radial.avatar,avatar);
   assert.equal(radial.pose,selectedPose);
   assert.equal(radial.originalPhotoSHA256,required.skirt);
   assert.equal(radial.source163BoneRig,true);
   assert.equal(radial.originalTorsoLegSkinWeightedFaceClassificationUsed,true);
   assert.equal(radial.actualIndexedOriginalBodyFaceCutUsed,true);
   assert.equal(radial.sevenOriginalSourceSkirtBands.length,7);
   assert.equal(radial.originalSourceGarmentRingAngularSamples,336);
   assert.ok(radial.originalBodySourcePlaneCutSegmentCount>=0);
   assert.equal(radial.sampledInwardBodyGapAngularSectors+
    radial.sampledUnknownBodyGapAngularSectors+
    radial.sampledOutwardBodyGapAngularSectors+
    radial.sevenOriginalSourceSkirtBands.reduce((n,x)=>n+x.sampledRadialGapWithin2mm,0),336,
    'true source radial body sectors lost or double counted');
   assert.equal(radial.actualModelBasedRadialInwardWitness,
    radial.sampledInwardBodyGapAngularSectors>0);
   assert.equal(radial.originalBodyAngularSectorEvidenceMissing,
    radial.sampledUnknownBodyGapAngularSectors>0);
   assert.equal(radial.status,
    'SAMPLED_SOURCE_RADIAL_INWARD_AND_MISSING_BODY_SECTORS_NOT_WEARABLE',
    'immutable original public photo model must disclose the independently witnessed radial inward AND missing source body sectors rather than calling zero BVH wearable');
   assert.equal(radial.exactRayBodyContourSourceTopology,
    'ORIGINAL_INDEXED_FACE_HORIZONTAL_PLANE_RAY_INTERSECTION');
   assert.equal(radial.exactRaySampledAngularPositions,336);
   assert.equal(radial.exactRayOutwardSourceSectors+radial.exactRayNearSourceSectors+
    radial.exactRayInwardSourceSectors+radial.exactRayUnknownSourceSectors,336,
    'every original photographed source ring ray must have exact contour evidence or be unknown');
   assert.ok(radial.exactRayOriginalBodyContourSegments>=0);
   assert.ok(radial.exactRayCollinearAmbiguousSourceSectors<=
    radial.exactRayUnknownSourceSectors);
   assert.ok(['EXACT_ORIGINAL_BODY_RAY_INWARD_AND_UNOBSERVED_BLOCKED',
    'EXACT_ORIGINAL_BODY_RAY_INWARD_BLOCKED',
    'EXACT_ORIGINAL_BODY_RAY_UNOBSERVED_BLOCKED',
    'EXACT_ORIGINAL_BODY_RADIAL_GAP_SAMPLED_NOT_WEARABLE'
   ].includes(radial.exactRaySourceFitDisposition),
    'cannot claim genuine body-ray fit from empty/forged source contour');
   assert.equal(radial.originalDilationBasedRadialOverlapIsNotExactIntersection,true);
   assert.equal(radial.exactRayWithoutOriginalBodyContourIsUnknownNotSafe,true);
   assert.equal(radial.exactRayCannotCertifyWatertightVolume,true);
   assert.equal(radial.garmentSourceAbsoluteSizeInferredNotMeasured,true);
   assert.equal(radial.radialWitnessIsNotSignedClosedMeshContainment,true);
   assert.equal(radial.originalPhotographedRearAbsent,true);
   assert.equal(radial.originalPhoto2DFallbackRequired,true);
   assert.equal(radial.consumer3DAdmitted,false);
   assert.equal(radial.releaseAuthorized,false);
   // Mandatory original-body topology precondition for any future signed
   // 3D garment containment. An open, nonmanifold or edge-inconsistent
   // source anatomical shell vetoes parity irrespective of 0 BVH contacts.
   const closure=await page.evaluate(()=>
    window.nativeP89Skirt.auditSelectedOriginalSourceBodyClosure89());
   assert.equal(closure.schema,
    'P89-source-locked-original-body-indexed-closure/v1');
   assert.ok(['ORIGINAL_BODY_OPEN_OR_NONMANIFOLD_CANNOT_PROVE_SIGNED_INSIDE_OUTSIDE',
    'INDEXED_EDGE_PAIR_CANDIDATE_NOT_SIGNED_VOLUME_OR_WEARABLE'].includes(
     closure.status),'genuine original source anatomical closure unavailable');
   assert.equal(closure.avatar,avatar);
   assert.equal(closure.pose,selectedPose);
   assert.equal(closure.originalSourcePhotoSHA256,required.skirt);
   assert.equal(closure.original163BoneGLBSHA256,required[avatar]);
   assert.equal(closure.originalBodyWholeMeshFacesNotCoreFiltered,true);
   assert.equal(closure.sourceWeightedCoreFaceMaskOnlyUsedForProvenance,true);
   assert.equal(closure.clothMayStillBeInsideBodyDespiteNoTransverseBVHPairs,true);
   const topology=closure.anatomicalSourceTopology;
   assert.equal(topology.schema,'P89-pure-indexed-source-shell-edge-incidence/v1');
   assert.ok(topology.originalIndexedTriangleCount>=100);
   assert.ok(topology.originalIndexedVertexCount>=300);
   assert.ok(topology.actualSourceIndexDistinctEdges>=100);
   assert.ok(topology.sourceOpenBoundaryEdgeCount>=0);
   assert.ok(topology.sourceNonmanifoldOverTwoFaceEdgeCount>=0);
   assert.ok(topology.sourceSameDirectionPairEdgeCount>=0);
   assert.equal(topology.originalSourceIndicesNeverWelded,true);
   assert.equal(topology.selfIntersectionFreeEmbeddedVolumeProven,false);
   assert.equal(closure.indexedPairCandidateForSeparateParityResearch,
    topology.originalIndexedEdgePairCandidateOnly);
   assert.equal(closure.closedVolumeCertified,false);
   assert.equal(closure.signedInsideOutsideVerified,false);
   assert.equal(closure.originalPhoto2DFallbackRequired,true);
   assert.equal(closure.consumer3DAdmitted,false);
   assert.equal(closure.releaseAuthorized,false);
   // Indexed original skinned body triangle TOPOLOGY must be invariant
   // across the same genuine avatar's five pose samples. Actual positions
   // can move, but original face identities may never be silently changed.
   const prior=results.selectedSourceWholeBodyClosureAudits.find(
    x=>x.avatar===avatar);
   if(prior){
    const previous=prior.anatomicalSourceTopology;
    for(const key of ['originalIndexedTriangleCount',
     'originalIndexedVertexCount','actualSourceIndexDistinctEdges',
     'sourceOpenBoundaryEdgeCount',
     'sourceNonmanifoldOverTwoFaceEdgeCount',
     'sourceSameDirectionPairEdgeCount',
     'sourceOppositeDirectionPairEdgeCount',
     'sourceDisconnectedVertexIndexedIslands',
     'independentlyCoincidentButIndexSplitVertices']){
     assert.equal(topology[key],previous[key],
      'immutable original 163-bone GLB indexed topology changed across poses: '+key);
    }
   }
   // Independent original source seam classification: a virtual positional
   // match only counts as source-compatible when the original GLB rest and
   // 163bone skin influences and original mesh membership also match.
   // Never turn virtual twins into a sealed or wearer-approved body mesh.
   const seams=await page.evaluate(()=>
    window.nativeP89Skirt.auditSelectedOriginalBodySeams89());
   assert.equal(seams.schema,'P89-original-163bone-source-indexed-boundary-seam-v1');
   assert.ok(['ALL_ORIGINAL_BOUNDARIES_VIRTUALLY_PAIRED_NOT_WATERTIGHT_PROOF',
    'ORIGINAL_INDEXED_BODY_BOUNDARY_REMAINS_UNRESOLVED_FOR_SIGNED_FIT'].includes(
     seams.status),'genuine source seam evidence refused: '+JSON.stringify(seams));
   assert.equal(seams.avatar,avatar);
   assert.equal(seams.pose,selectedPose);
   assert.equal(seams.sourcePhotoOriginalSHA256,required.skirt);
   assert.equal(seams.sourceOriginalRigGLBSHA256,required[avatar]);
   assert.equal(seams.originalBodyCompleteSourceFaceTopologyChecked,true);
   assert.equal(seams.independentOriginalGLBIndexedFaceBoundaryCountVerified,true);
   assert.equal(seams.noSourceGeometryWeldOrRepair,true);
   const proof=seams.virtualSeamEvidence;
   assert.equal(proof.schema,'P89-pure-original-source-virtual-boundary-seam-evidence/v1');
   assert.equal(proof.originalSourceBodyTriangleCount,
    topology.originalIndexedTriangleCount);
   assert.equal(proof.originalSourceBodyIndexedVertices,
    topology.originalIndexedVertexCount);
   assert.equal(proof.rawOriginalSourceSingleFaceBoundaryEdges,
    topology.sourceOpenBoundaryEdgeCount);
   assert.equal(proof.originalSourceBoundaryEdgeConservationVerified,true);
   assert.equal(proof.originalGeometryTwinMismatchReasonsExhaustive,true);
   assert.equal(proof.geometryTwinsWithConflictingOriginalProvenanceEdges,
    proof.geometryTwinsDifferentOriginalSourceMeshEdges+
    proof.geometryTwinsDifferentOriginalRestPoseEdges+
    proof.geometryTwinsDifferentOriginalSkinInfluenceEdges+
    proof.geometryTwinsDifferentOriginalSkinnedWorldEdges+
    proof.geometryTwinsNonDistinctOriginalVertexIndexEdges,
    'every virtual source edge provenance conflict must be explained');

   assert.equal(proof.compatibleOriginalRestAndSkinBoundaryEdges,
    proof.compatibleOriginalRestAndSkinTwinEdgePairs*2);
   assert.equal(proof.compatibleOriginalRestAndSkinTwinEdgePairs,
    proof.compatibleOriginalTwinPairsSharingOneIndexedEndpoint+
    proof.compatibleOriginalTwinPairsWithBothEndpointsSplit);
   assert.equal(proof.originalSourceTwinsMayShareOneRealIndexedEndpoint,true);
   assert.equal(proof.unresolvedOriginalBoundaryEdges+
    proof.compatibleOriginalRestAndSkinBoundaryEdges,
    topology.sourceOpenBoundaryEdgeCount);
   assert.equal(proof.noVirtualRestOrSkinnedMeshMutation,true);
   assert.equal(proof.virtualTwinsNeverProofOfSealedPhysicalAnatomy,true);
   assert.equal(proof.sourceBodyInsideOutsideNotProven,true);
   assert.equal(seams.originalSourceIndexedSurfaceStillOpen,true);
   assert.equal(seams.trueClosedBodyVolumeCertified,false);
   assert.equal(seams.signedExteriorContainmentCertified,false);
   assert.equal(seams.sourcePhoto2DFallbackRequired,true);
   assert.equal(seams.consumer3DAdmitted,false);
   assert.equal(seams.releaseAuthorized,false);
   // Independent anatomical localization: original indexed public source
   // body edge positions → aggregate original source mesh, bone regions and
   // normalized vertical bands only. This must fully agree with the prior
   // genuine-indexed and original-rest/skin seam evidence, not "repair" it.
   const mapped=await page.evaluate(()=>
    window.nativeP89Skirt.auditSelectedOriginalBodyBoundaryRegions89());
   assert.equal(mapped.schema,'P89-original-public-anatomy-unresolved-boundary-regions/v1');
   assert.equal(mapped.status,
    'SOURCE_ANATOMICAL_GAPS_AND_FOREIGN_MESH_CONTACTS_NOT_SIGNED_VOLUME');
   assert.equal(mapped.avatar,avatar);
   assert.equal(mapped.pose,selectedPose);
   assert.equal(mapped.sourcePhotoSHA256,required.skirt);
   assert.equal(mapped.sourceAnatomyGLBSHA256,required[avatar]);
   assert.equal(mapped.originalFullIndexedSourceBodyAnd163BoneRigUsed,true);
   assert.equal(mapped.genuineSourceBoneNamesAndMeshIdentityUsed,true);
   assert.equal(mapped.unresolvedForeignMeshEdgesNeverVirtuallyWelded,true);
   const regions=mapped.sourceAnatomicalRegionEvidence;
   assert.equal(regions.schema,'P89-pure-unmodified-anatomical-body-boundary-regions/v1');
   assert.equal(regions.originalBodyIndexedTriangleCount,
    topology.originalIndexedTriangleCount);
   assert.equal(regions.originalBodyIndexedBoundaryEdgeCount,
    topology.sourceOpenBoundaryEdgeCount);
   assert.equal(regions.sourceCompatibleGeometricTwinBoundaryEdges,
    proof.compatibleOriginalRestAndSkinBoundaryEdges);
   assert.equal(regions.sourceForeignMeshCoincidentTwinBoundaryEdges,
    proof.geometryTwinsDifferentOriginalSourceMeshEdges);
   assert.equal(regions.sourceNoGeometricTwinBoundaryEdges,
    proof.sourceUnmatchedBoundaryEdges);
   assert.equal(regions.ambiguousBoundaryEdges,0);
   assert.equal(regions.sourceCompatibleGeometricTwinBoundaryEdges+
    regions.sourceForeignMeshCoincidentTwinBoundaryEdges+
    regions.sourceNoGeometricTwinBoundaryEdges+regions.ambiguousBoundaryEdges,
    topology.sourceOpenBoundaryEdgeCount);
   // The immutable P541 original licensed source models have exactly
   // 80 one-face edges without original-world-position twins and 1,632
   // edges with coincident geometry across DIFFERENT source meshes.
   assert.equal(regions.sourceNoGeometricTwinBoundaryEdges,80);
   assert.equal(regions.sourceForeignMeshCoincidentTwinBoundaryEdges,1632);
   assert.equal(regions.sourceCompatibleGeometricTwinBoundaryEdges,42998);
   for(const [name,agg,total] of [
    ['unmatched',regions.unmatchedSourceAnatomicalRegions,80],
    ['cross-mesh',regions.foreignSourceMeshAnatomicalRegions,1632]
   ]){
    assert.equal(agg.originalIndexedBoundaryEdgeCount,total);
    for(const group of ['originalSourceMeshBreakdown',
     'originalSourceDominantBoneNameBreakdown',
     'originalSourceBoneRegionBreakdown',
     'originalBodyRelativeHeightBreakdown']){
     assert.ok(Array.isArray(agg[group])&&agg[group].length>0,
      'source '+name+' anatomical evidence missing '+group);
     // The source original mesh and body-region bins are exhaustive;
     // the top source bone-name list can intentionally be truncated.
     if(group!=='originalSourceDominantBoneNameBreakdown')
      assert.equal(agg[group].reduce((n,x)=>n+x.edges,0),total,
       'source '+name+' position classification lost original indexed edges');
    }
    assert.equal(agg.originalBodyHeightBandsNormalizedNotMeasuredCentimeters,true);
    assert.equal(agg.onlyAggregateOriginalPublicBodyRegions,true);
   }
   assert.equal(regions.exactSourceMeshIdentityNeverCombined,true);
   assert.equal(regions.originalSourceBoneSkinProvenanceReadOnly,true);
   assert.equal(regions.realBodySignedExteriorContainmentNotCertified,true);
   assert.equal(mapped.originalBodyIndexedGeometryUnchanged,true);
   assert.equal(mapped.closedBodyVolumeCertified,false);
   assert.equal(mapped.signedExteriorContainmentCertified,false);
   assert.equal(mapped.originalPhoto2DFallbackRequired,true);
   assert.equal(mapped.consumer3DAdmitted,false);
   assert.equal(mapped.releaseAuthorized,false);
   results.selectedOriginalSourceBodyBoundaryRegionAudits.push(mapped);
   results.selectedOriginalSourceBodySeamAudits.push(seams);
   results.selectedSourceWholeBodyClosureAudits.push(closure);
   results.selectedSourceBodyRadialGapAudits.push(radial);
   results.selectedResearchPoseChecks.push({
    avatar,pose:selectedPose,selectedName:selected.name,
    selectedOriginalSourceTrialPairs:expected,
    selectedNativeSourceBodyPairs:live.strictTransverseSourceBodyTriangleCrossings,
    originalSourceBodyPairs:originalPose.strictTransverseSourceBodyTriangleCrossings,
    originalSource163BoneRig:true,originalPhoto2DFallbackRequired:true,
    sourceRealWorldScaleUnmeasured:true,sourceRearMaterialUnphotographed:true,
    humanAppearanceApproved:false,consumer3DAdmitted:false,releaseAuthorized:false
   });
   if(index>=0){
    for(const cameraAngle of [0,90,180]){
     await page.evaluate(deg=>window.nativeP89Skirt.setView(deg),cameraAngle);
     const file=['selected-five-pose-source-skirt',engine,avatar,selectedPose,cameraAngle].join('-')+'.png';
     const shot=await screenshot(page,file);
     const sourceOriginalName=['source-skirt',engine,avatar,selectedPose,cameraAngle].join('-')+'.png';
     const actualSource=await readFile(join(out,sourceOriginalName));
     const change=await changed(shot,actualSource);
     if(cameraAngle===90)assert.ok(change>100,
      'genuinely selected original-source registration must render changed side-view pixels');
     results.selectedResearchNativeScreenshots.push({
      avatar,pose:selectedPose,angle:cameraAngle,selectedName:selected.name,
      selectedOriginalSourceJPEG:required.skirt,sourceTextureUVAndSkinRestUnchanged:true,
      originalPhoto2DFallbackRequired:true,physicalGarmentSizeUnknown:true,
      humanPhotographicFitUnapproved:true,unobservedBackNotSourceVerified:true,
      consumer3DAdmitted:false,releaseAuthorized:false,
      changedRGBChannelsAbove12:change
     });
     if(cameraAngle===0){
      const [before,after]=await Promise.all([
       sharp(actualSource).removeAlpha().raw().toBuffer({resolveWithObject:true}),
       sharp(shot).removeAlpha().raw().toBuffer({resolveWithObject:true})
      ]);
      assert.equal(before.info.width,390);assert.equal(before.info.height,690);
      assert.equal(after.info.width,390);assert.equal(after.info.height,690);
      const visibility=auditOriginalSkirtResearchFrontCoverage89({
       originalRGB:new Uint8Array(before.data),candidateRGB:new Uint8Array(after.data),
       width:390,height:690,avatar,pose:selectedPose,sourceSHA256:required.skirt
      });
      // This is MEASURED photo evidence. A selected zero-contact result
      // may still FAIL visible coverage; never silently promote it to fit.
      assert.ok(['ORIGINAL_PHOTOGRAPH_CENTER_FRONT_COVERAGE_IMPROVED_RESEARCH_ONLY',
       'ORIGINAL_PHOTO_CENTER_FRONT_COVERAGE_NOT_YET_VERIFIED'].includes(visibility.status),
       'selected front photograph RGB audit unavailable: '+JSON.stringify(visibility));
      assert.equal(visibility.originalPhoto2DFallbackRequired,true);
      assert.equal(visibility.consumer3DAdmitted,false);
      assert.equal(visibility.releaseAuthorized,false);
      results.selectedResearchFrontCoverage.push({
       ...visibility,selectedName:selected.name,
       actualSelectedResearchShiftMeters:selected.displacementMeters,
       selectedFitApproved:false,physicalSkirtScaleMeasured:false
      });
     }
    }
   }
   const disabled=await page.evaluate(()=>
    window.nativeP89Skirt.showOnlySelectedRegistration89(false));
   assert.equal(disabled.status,'ORIGINAL_LICENSED_PHOTO_SKIRT_FULLY_RESTORED');
   assert.equal(disabled.selectedPreviewActive,false);
   assert.equal(disabled.originalSourcePositionUVSkinAndRestPreserved,true);
   const restoredPose=await page.evaluate(p=>
    window.nativeP89Skirt.setPose(p),selectedPose);
   assert.equal(restoredPose.strictTransverseSourceBodyTriangleCrossings,
    originalPose.strictTransverseSourceBodyTriangleCrossings,
    'selected-source candidate failed to restore original photographed garment');
   const state=await page.evaluate(()=>window.nativeP89Skirt.getState());
   assert.equal(state.researchOnlySourceSelectedPreviewActive,false);
   assert.equal(state.originalSourceSHA256,required.skirt);
   assert.equal(state.bones,163);
   assert.equal(state.consumer3DAdmission,false);
  }
  // Fixed original+45mm source garment is also checked at two ORIGINAL
  // P541/3D43 quarter-step static arm-pose interpolations, not continuously.
  // A motion interpolant is NOT swept collision / cloth physics clearance.
  for(const quarter of ['blend-25','blend-75']){
   const originalQuarter=await page.evaluate(x=>window.nativeP89Skirt.setPose(x),quarter);
   assert.equal(originalQuarter.originalTriangleIDResolution,
    'BVH_INDIRECT_RESOLVED_ORIGINAL_TRIANGLE_INDICES');
   const enabled=await page.evaluate(()=>
    window.nativeP89Skirt.showOnlySourceRigidRegistration45(true));
   assert.equal(enabled.researchOnlySourceSkirt45mmActive,true);
   const quarterContact=await page.evaluate(x=>window.nativeP89Skirt.setPose(x),quarter);
   assert.equal(quarterContact.realAnatomicalRigBones,163);
   assert.equal(quarterContact.trueOriginalPhotoSkirtFaceIDsStable,true);
   assert.equal(quarterContact.trueOriginalAnatomicalFaceIDsStable,true);
   assert.equal(quarterContact.releaseAuthorized,false);
   const off=await page.evaluate(()=>
    window.nativeP89Skirt.showOnlySourceRigidRegistration45(false));
   assert.equal(off.researchOnlySourceSkirt45mmActive,false);
   const restored=await page.evaluate(x=>window.nativeP89Skirt.setPose(x),quarter);
   assert.equal(restored.strictTransverseSourceBodyTriangleCrossings,
    originalQuarter.strictTransverseSourceBodyTriangleCrossings);
   results.research45OnlyQuarterPoseChecks.push({
    avatar,pose:quarter,
    sourceRig163Bones:true,
    originalSourceStrictCrossingPairs:originalQuarter.strictTransverseSourceBodyTriangleCrossings,
    rigid45OnlyStrictCrossingPairs:quarterContact.strictTransverseSourceBodyTriangleCrossings,
    totalOriginalSourceAndMidpointPoseSamples:5,
    originalPhotoGeometryFullyRestored:true,
    continuouslySweptCollisionCertified:false,
    physicalClothDrapeTested:false,
    humanRealismOrFitApproved:false,
    originalPhoto2DFallbackRequired:true,
    consumer3DAdmitted:false,releaseAuthorized:false
   });
  }
 }
 assert.equal(results.selectedSourceBodyRadialGapAudits.length,10);
 assert.equal(results.selectedSourceWholeBodyClosureAudits.length,10);
 assert.equal(results.selectedOriginalSourceBodySeamAudits.length,10);
 assert.equal(results.selectedOriginalSourceBodyBoundaryRegionAudits.length,10);
 assert.equal(results.selectedResearchPoseChecks.length,10);
 assert.equal(results.selectedResearchNativeScreenshots.length,18);
 assert.equal(results.selectedResearchFrontCoverage.length,6);
 assert.equal(results.selectedResearchFrontCoverage.filter(
  x=>x.status==='ORIGINAL_PHOTOGRAPH_CENTER_FRONT_COVERAGE_IMPROVED_RESEARCH_ONLY'
 ).length,results.selectedResearchFrontCoverage.length,
  'selected source registration fails authentic photographed front visible coverage: 3D remains BLOCKED');
 assert.equal(results.research45OnlyQuarterPoseChecks.length,4);
 assert.equal(results.research45OnlyPreviewScreenshots.length,18);
 assert.equal(results.originalPhoto45FrontVisibilityReports.length,6);
 assert.equal(results.originalPublicUnphotographedRearVisibilityReports.length,18);
 assert.ok(results.originalPublicUnphotographedRearVisibilityReports.filter(x=>
  x.viewAngle===180&&x.unphotographedRearMarkerPixels>2000).length===6);
 const rearProof=summarizeOriginalSkirtUnphotographedRear89({
  rows:results.originalPublicUnphotographedRearVisibilityReports,
  sourceSHA256:required.skirt,sourcePhotoRearObserved:false
 });
 assert.equal(rearProof.schema,'P89-original-photo-source-rear-material-360-evidence/v1');
 assert.equal(rearProof.status,'ORIGINAL_SKIRT_ONLY_FRONT_PHOTOGRAPHED_REAR_NOT_SOURCE_VERIFIED',
  'source-authentic screenshot and original material ID receipt failed: '+JSON.stringify(rearProof));
 assert.equal(rearProof.actualNativeOriginalPhotoViewReports,18);
 assert.equal(rearProof.originalRearPhotoVerified,false);
 assert.equal(rearProof.substantialUnphotographedBackVisibleAtActualSideAndRearAngles,true);
 assert.equal(rearProof.sourcePhoto2DFallbackRequired,true);
 assert.equal(rearProof.consumer3DAdmitted,false);
 assert.equal(rearProof.releaseAuthorized,false);
 results.verifiedOriginalSourceRearEvidenceSummary=rearProof;
 assert.equal(results.research45OnlyPoseBVHChecks.length,6);
 assert.equal(results.waistAnchorLandmarkReports.length,2);
 assert.equal(results.registrationTrials.length,2);
 assert.equal(results.measuredBodyFitTrials.length,2);
 assert.equal(results.neutralRearTrials.length,2);
 assert.equal(results.captures.length,54);
 assert.equal(results.captures.filter(x=>
  x.name?.startsWith('selected-five-pose-source-skirt-')).length,18,
  'selected original source screenshots must not be silently missing');
 assert.equal(results.poseSamples.length,6);
 assert.equal(results.diffs.length,18);
 assert.equal(results.errors.length,0,'real original source shader/crash problem');
 assert.equal(results.offsite.length,0,'outside-or-private-request');
 const strict=results.poseSamples.filter(x=>x.strictTransverseSourceBodyTriangleCrossings>0);
 results.staticSourceBodyCrossingWitnesses=strict.length;
 results.staticSourceBodyCrossingPairSum=results.poseSamples.reduce(
  (n,x)=>n+x.strictTransverseSourceBodyTriangleCrossings,0);
 results.renderedPhotoToActualAnatomicalAvatar=true;
 results.sourceMeshApprovedForConsumer=false;
 results.status=strict.length?
  'REAL_ORIGINAL_SKIRT_RENDERED_BODY_CROSSING_WITNESSED_BLOCKED':
  'REAL_ORIGINAL_SKIRT_RENDERED_NO_STRICT_STATIC_CROSSINGS_NOT_CLEARANCE';
 await page.evaluate(()=>window.nativeP89Skirt.close());
}catch(e){
 results.status='BLOCKED';
 results.failure=String(e?.stack||e?.message||e).slice(0,2800);
 process.exitCode=1;
}finally{
 await browser?.close();
 await new Promise(ok=>server.close(done=>ok(done)));
 await writeFile(join(out,'results.json'),JSON.stringify(results,null,2)+'\n');
 console.log('P89_REAL_SKIRT_NATIVE_WEBGL_BODY_INTERSECTIONS_NOT_RELEASE',
  JSON.stringify({engine,status:results.status,frames:results.captures.length,
   poseSamples:results.poseSamples.length,neutralRearTrialStatus:results.neutralRearTrials.map(x=>x.status),
   provisionalContactReduction:results.neutralRearTrials.map(x=>x.bestProvisional?.originalSourcePoseCrossingSum-x.bestProvisional?.trialSourcePoseCrossingSum||0),
   measuredBodyFitTrialStatus:results.measuredBodyFitTrials.map(x=>x.status),
   photoSkirtRegistrationStatus:results.registrationTrials.map(x=>x.status),
   sourceSelectedOriginalPhotoFrontCoverage:results.selectedResearchFrontCoverage.map(x=>x.status),
   selectedRegistrationTrueFivePoseNativeChecks:results.selectedResearchPoseChecks.length,
   sourceTrueWorldRadialGapCheckCount:results.selectedSourceBodyRadialGapAudits.length,
   sourceOriginalWholeBodyClosureCheckCount:results.selectedSourceWholeBodyClosureAudits.length,
   originalSourceUnresolvedBoneRegionProofCount:results.selectedOriginalSourceBodyBoundaryRegionAudits.length,
   originalSourceUnresolvedByAvatarSourcePose:results.selectedOriginalSourceBodyBoundaryRegionAudits.filter(x=>x.pose==='source').map(x=>({
    avatar:x.avatar,pose:x.pose,
    unmatched:x.sourceAnatomicalRegionEvidence.sourceNoGeometricTwinBoundaryEdges,
    foreign:x.sourceAnatomicalRegionEvidence.sourceForeignMeshCoincidentTwinBoundaryEdges,
    unmatchedSourceMeshes:x.sourceAnatomicalRegionEvidence.unmatchedSourceAnatomicalRegions.originalSourceMeshBreakdown,
    unmatchedSourceBoneLabels:x.sourceAnatomicalRegionEvidence.unmatchedSourceAnatomicalRegions.originalSourceDominantBoneNameBreakdown,
    unmatchedSourceRegion:x.sourceAnatomicalRegionEvidence.unmatchedSourceAnatomicalRegions.originalSourceBoneRegionBreakdown,
    unmatchedHeightBands:x.sourceAnatomicalRegionEvidence.unmatchedSourceAnatomicalRegions.originalBodyRelativeHeightBreakdown,
    foreignSourceMeshPairs:x.sourceAnatomicalRegionEvidence.foreignSourceMeshAnatomicalRegions.sourceMeshPairBreakdown,
    foreignSourceRegions:x.sourceAnatomicalRegionEvidence.foreignSourceMeshAnatomicalRegions.originalSourceBoneRegionBreakdown,
    foreignHeightBands:x.sourceAnatomicalRegionEvidence.foreignSourceMeshAnatomicalRegions.originalBodyRelativeHeightBreakdown
   })),
   originalSourceVirtualSeamProofCount:results.selectedOriginalSourceBodySeamAudits.length,
   originalSourceVirtualSeamStatuses:results.selectedOriginalSourceBodySeamAudits.map(x=>x.status),
   originalSourceVirtualSeamMatchedEdges:results.selectedOriginalSourceBodySeamAudits.map(x=>x.virtualSeamEvidence.compatibleOriginalRestAndSkinBoundaryEdges),
   originalSourceVirtualSeamUnresolvedEdges:results.selectedOriginalSourceBodySeamAudits.map(x=>x.virtualSeamEvidence.unresolvedOriginalBoundaryEdges),
   originalSourceVirtualSeamGeometryTwinPairs:results.selectedOriginalSourceBodySeamAudits.map(x=>x.virtualSeamEvidence.originalSourceGeometryTwinPairs),
   originalSourceVirtualSeamProvenanceConflictEdges:results.selectedOriginalSourceBodySeamAudits.map(x=>x.virtualSeamEvidence.geometryTwinsWithConflictingOriginalProvenanceEdges),
   originalSourceVirtualSeamAmbiguousMultiEdges:results.selectedOriginalSourceBodySeamAudits.map(x=>x.virtualSeamEvidence.geometricAmbiguousMultiCandidateBoundaryEdges),
   originalSourceVirtualSeamUnmatchedEdges:results.selectedOriginalSourceBodySeamAudits.map(x=>x.virtualSeamEvidence.sourceUnmatchedBoundaryEdges),
   originalSourceVirtualSeamDifferentMeshEdges:results.selectedOriginalSourceBodySeamAudits.map(x=>x.virtualSeamEvidence.geometryTwinsDifferentOriginalSourceMeshEdges),
   originalSourceVirtualSeamSharedOneOriginalIndexPairs:results.selectedOriginalSourceBodySeamAudits.map(x=>x.virtualSeamEvidence.compatibleOriginalTwinPairsSharingOneIndexedEndpoint),
   originalSourceVirtualSeamBothSplitIndexPairs:results.selectedOriginalSourceBodySeamAudits.map(x=>x.virtualSeamEvidence.compatibleOriginalTwinPairsWithBothEndpointsSplit),
   originalSourceVirtualSeamDifferentRestEdges:results.selectedOriginalSourceBodySeamAudits.map(x=>x.virtualSeamEvidence.geometryTwinsDifferentOriginalRestPoseEdges),
   originalSourceVirtualSeamDifferentSkinEdges:results.selectedOriginalSourceBodySeamAudits.map(x=>x.virtualSeamEvidence.geometryTwinsDifferentOriginalSkinInfluenceEdges),
   originalSourceVirtualSeamDifferentPosedEdges:results.selectedOriginalSourceBodySeamAudits.map(x=>x.virtualSeamEvidence.geometryTwinsDifferentOriginalSkinnedWorldEdges),
   sourceOriginalBodyTopologyStatuses:results.selectedSourceWholeBodyClosureAudits.map(x=>x.status),
   sourceOriginalBodyTopologyIndexedTriangleCount:results.selectedSourceWholeBodyClosureAudits.map(x=>x.anatomicalSourceTopology.originalIndexedTriangleCount),
   sourceOriginalBodyBoundaryEdges:results.selectedSourceWholeBodyClosureAudits.map(x=>x.anatomicalSourceTopology.sourceOpenBoundaryEdgeCount),
   sourceOriginalBodyNonmanifoldEdges:results.selectedSourceWholeBodyClosureAudits.map(x=>x.anatomicalSourceTopology.sourceNonmanifoldOverTwoFaceEdgeCount),
   sourceOriginalBodyWindingConflicts:results.selectedSourceWholeBodyClosureAudits.map(x=>x.anatomicalSourceTopology.sourceSameDirectionPairEdgeCount),
   sourceOriginalBodyCoincidentSplitVertices:results.selectedSourceWholeBodyClosureAudits.map(x=>x.anatomicalSourceTopology.independentlyCoincidentButIndexSplitVertices),
   sourceWorldRadialGapStatuses:results.selectedSourceBodyRadialGapAudits.map(x=>x.status),
   sourceRadialInwardSectorCounts:results.selectedSourceBodyRadialGapAudits.map(x=>x.sampledInwardBodyGapAngularSectors),
   sourceRadialUnknownSectorCounts:results.selectedSourceBodyRadialGapAudits.map(x=>x.sampledUnknownBodyGapAngularSectors),
   sourceRadialMinimumObservedGaps:results.selectedSourceBodyRadialGapAudits.map(x=>x.minimumObservedRadialGapMeters),
   sourceExactBodyRayDispositions:results.selectedSourceBodyRadialGapAudits.map(x=>x.exactRaySourceFitDisposition),
   sourceExactBodyRayInwardPositions:results.selectedSourceBodyRadialGapAudits.map(x=>x.exactRayInwardSourceSectors),
   sourceExactBodyRayUnknownPositions:results.selectedSourceBodyRadialGapAudits.map(x=>x.exactRayUnknownSourceSectors),
   sourceExactBodyRayGapMeters:results.selectedSourceBodyRadialGapAudits.map(x=>x.exactRayMinimumObservedSkirtMinusBodyMeters),
   exactRayContoursNotSignedClosedBodyOrSizeApproval:true,
   selectedRegistrationRealCameraScreenshots:results.selectedResearchNativeScreenshots.length,
   selectedRegistrationFrontBodyOcclusionFractions:results.selectedResearchFrontCoverage.map(x=>x.rigid45mmCenterFrontalVisibleMannequinFraction),
   sourceWaistBoneAuditStatus:results.waistAnchorLandmarkReports.map(x=>x.status),
   researchOnly45mm3DPoseBVHMatches:results.research45OnlyPoseBVHChecks.length,
   researchOnly45mmQuarterStepStaticPoseBVHChecks:results.research45OnlyQuarterPoseChecks.length,
   researchOnly45mmQuarterStepStrictPairs:results.research45OnlyQuarterPoseChecks.map(x=>x.rigid45OnlyStrictCrossingPairs),
   researchOnly45mmScreenshots:results.research45OnlyPreviewScreenshots.length,
   originalPhotoCreamFrontCoverageWitnesses:results.originalPhoto45FrontVisibilityReports.length,
   originalUnphotographedRearSourceViewAudits:results.originalPublicUnphotographedRearVisibilityReports.length,
   rearActualOriginalPhotoSourceEvidenceStatus:results.verifiedOriginalSourceRearEvidenceSummary?.status||null,
   original180DegreeNeutralOnlyRearPixels:results.originalPublicUnphotographedRearVisibilityReports.filter(x=>x.viewAngle===180).map(x=>x.unphotographedRearMarkerPixels),
   original180DegreeRearLowerBoundShareOfWholeProjectedSkirt:
    results.originalPublicUnphotographedRearVisibilityReports.filter(x=>x.viewAngle===180).map(x=>x.inferredRearLowerBoundShareOfOpaqueProjectedOriginalSkirt),
   originalCenterFrontalVisibleMannequinFractions:results.originalPhoto45FrontVisibilityReports.map(x=>x.originalCenterFrontalVisibleMannequinFraction),
   rigid45mmCenterFrontalVisibleMannequinFractions:results.originalPhoto45FrontVisibilityReports.map(x=>x.rigid45mmCenterFrontalVisibleMannequinFraction),
   sourceSpine04ToSkirtRimVerticalOffsetMeters:results.waistAnchorLandmarkReports.map(x=>x.originalWaistRimAndSpine04HeightMismatchMeters),
   photoSkirtRegistrationCrossingReduction:results.registrationTrials.map(x=>
    x.bestResearchOnly?.originalThreePoseStrictCrossingPairSum-
    x.bestResearchOnly?.trialThreePoseStrictCrossingPairSum||0),
   originalFivePoseRegistrationStrictPairCounts:results.registrationTrials.map(x=>
    x.originalFivePoseStrictCrossingPairSum),
   researchBestFivePoseTrialPairCounts:results.registrationTrials.map(x=>
    x.bestResearchOnly?.trialFivePoseStrictCrossingPairSum??null),
   researchBestFivePoseShiftMillimeters:results.registrationTrials.map(x=>
    x.bestResearchOnly?Math.round(x.bestResearchOnly.displacementMeters*1000):null),
   researchBestFivePoseRegistrationNames:results.registrationTrials.map(x=>
    x.bestResearchOnly?.name??null),
   genuineFivePoseRankedCandidatesPerAvatar:results.registrationTrials.map(x=>x.trials.length),
   fivePoseScoreNotSweptPhysicsOrHumanFit:true,
   measuredBodyFitResearchReduction:results.measuredBodyFitTrials.map(x=>x.bestProvisionalStructuralAB?.originalStrictSkirtBodyCrossingPairSum-x.bestProvisionalStructuralAB?.trialStrictSkirtBodyCrossingPairSum||0),
   sourceBodyCrossingPairs:results.staticSourceBodyCrossingPairSum??null,
   sourceBodyCrossingWitnessSamples:results.staticSourceBodyCrossingWitnesses??null,
   sourceOriginalJPEG:results.originalSHA256,
   actualSourceFrontPhoto:results.renderedPhotoToActualAnatomicalAvatar??false,
   errors:results.errors.length,offsite:results.offsite.length,
   failure:results.failure??null,releaseAuthorized:false,familyAlpha:'HOLD'}));
}
