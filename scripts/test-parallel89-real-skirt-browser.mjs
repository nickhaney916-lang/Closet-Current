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
 screenCaptureCountExpected:18,figurePoseSamplesExpected:6,
 captures:[],poseSamples:[],diffs:[],neutralRearTrials:[],measuredBodyFitTrials:[],registrationTrials:[],errors:[],offsite:[],
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
  assert.equal(registration.trials.length,7);
  assert.deepEqual(registration.trials.map(t=>t.name),
   ['front-15mm','front-30mm','front-45mm','front-60mm','back-15mm','up-20mm','down-20mm']);
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
    assert.ok(t.trialThreePoseStrictCrossingPairSum<before);
   }
  }
  const restoredAfterRegistration=await page.evaluate(()=>window.nativeP89Skirt.getState());
  assert.equal(restoredAfterRegistration.originalSourceSHA256,required.skirt);
  assert.equal(restoredAfterRegistration.bones,163);
  assert.equal(restoredAfterRegistration.releaseAuthorized,false);
  results.registrationTrials.push(registration);
 }
 assert.equal(results.registrationTrials.length,2);
 assert.equal(results.measuredBodyFitTrials.length,2);
 assert.equal(results.neutralRearTrials.length,2);
 assert.equal(results.captures.length,18);
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
   photoSkirtRegistrationCrossingReduction:results.registrationTrials.map(x=>x.bestResearchOnly?.originalThreePoseStrictCrossingPairSum-x.bestResearchOnly?.trialThreePoseStrictCrossingPairSum||0),
   measuredBodyFitResearchReduction:results.measuredBodyFitTrials.map(x=>x.bestProvisionalStructuralAB?.originalStrictSkirtBodyCrossingPairSum-x.bestProvisionalStructuralAB?.trialStrictSkirtBodyCrossingPairSum||0),
   sourceBodyCrossingPairs:results.staticSourceBodyCrossingPairSum??null,
   sourceBodyCrossingWitnessSamples:results.staticSourceBodyCrossingWitnesses??null,
   sourceOriginalJPEG:results.originalSHA256,
   actualSourceFrontPhoto:results.renderedPhotoToActualAnatomicalAvatar??false,
   errors:results.errors.length,offsite:results.offsite.length,
   failure:results.failure??null,releaseAuthorized:false,familyAlpha:'HOLD'}));
}
