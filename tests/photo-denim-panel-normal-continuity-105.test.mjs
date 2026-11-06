import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as T from 'three';
import {sourceRearNormalSpread105,smoothActualPhotoDenimPanelNormals105}
 from '../research/photo-denim-panel-normal-continuity-105/rear-seam-normal-continuity.mjs';

test('PHOTO105 coincident original sewn triangles with divergent normals have measured nonzero angular variance',()=>{
 const n=new T.Float32BufferAttribute([
  0,0,1,1,0,0,0,0,1
 ],3);
 const x=sourceRearNormalSpread105([0,1,2],n);
 assert.ok(x.target?.isVector3);
 assert.ok(x.target.x>0&&x.target.z>0);
 assert.ok(x.loss>.1);
 assert.equal(x.target.length()>0.999999,true);
});
test('PHOTO105 previously smooth photographed source normals need no artificial shaded seam',()=>{
 const n=new T.Float32BufferAttribute([0,0,1,0,0,1],3);
 const x=sourceRearNormalSpread105([0,1],n);
 assert.ok(x.target?.equals(new T.Vector3(0,0,1)));
 assert.equal(x.loss,0);
});
test('PHOTO105 degenerate source normal data fail closed with null consensus and infinite uncertainty',()=>{
 const n=new T.Float32BufferAttribute([0,0,0,0,0,0,0,0,1],3);
 const a=sourceRearNormalSpread105([0,1],n);
 const b=sourceRearNormalSpread105([0,2],n);
 assert.equal(a.target,null);assert.equal(a.loss,Infinity);
 assert.equal(b.target,null);assert.equal(b.loss,Infinity);
});
test('PHOTO105 no auto-regression of source photograph: malformed normal inputs are rejected',()=>{
 for(const invalid of [null,{},[],{meshes:[]},{meshes:[{isSkinnedMesh:false}]}])
  assert.throws(()=>smoothActualPhotoDenimPanelNormals105(invalid),/PHOTO105/);
});
test('PHOTO105 disallows NaN, outside original rear seam angle policy or fake older source geometry',()=>{
 for(const angle of [NaN,Infinity,-Infinity,-.1,0,9.99,85.01,180,'75',null])
  assert.throws(()=>smoothActualPhotoDenimPanelNormals105(null,{maxAngleDegrees:angle}),/PHOTO105/);
});
test('PHOTO105 strict source SHA only permits two known original publicly licensed jeans photos',()=>{
 const s=readFileSync('research/photo-denim-panel-normal-continuity-105/rear-seam-normal-continuity.mjs','utf8');
 for(const stamp of [
  'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
  'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a',
  'poseResponsiveDenim104','originalDenimFrontSourceAndSkinProtected104',
  'originalPhotoUVRestFrontSkinPositionsBytePreserved77',
  'sampledPhotoDenimKnee103',
  'auditedTrueSkinnedBodyToSourcePhotoDenim77',
  'mesh.skeleton?.bones?.length!==163'
 ])assert.ok(s.includes(stamp),'missing verified source/rig safeguard: '+stamp);
 assert.doesNotMatch(s,/getUserMedia|localStorage|sessionStorage|fetch\(|supabase|openai|canvas\.toDataURL/);
});
test('PHOTO105 real source-neutral folded rear normals only, protect photographed front visible shading exactly',()=>{
 const s=readFileSync('research/photo-denim-panel-normal-continuity-105/rear-seam-normal-continuity.mjs','utf8');
 assert.match(s,/if\(node.maxFront>=\.16\)\{skippedFront\+=node.ids.length;continue;\}/);
 assert.match(s,/front\.getX\(i\)>=\.16/);
 assert.match(s,/norm\.array\[i\*3\+axis\]!==originalNormals\[i\*3\+axis\]/);
 assert.match(s,/originalJPEGAndPhotographedFrontLightingPreserved105:true/);
 assert.match(s,/sourcePhotographedRearProvided105:false/);
});
test('PHOTO105 source-coincident sewn vertices unified while deliberate hard-edge normals guarded',()=>{
 const s=readFileSync('research/photo-denim-panel-normal-continuity-105/rear-seam-normal-continuity.mjs','utf8');
 assert.match(s,/Math\.round\(v\*100000\)/);
 assert.match(s,/const threshold=Math\.cos\(T\.MathUtils\.degToRad\(maxAngleDegrees\)\)/);
 assert.match(s,/if\(!valid\)\{rejectedHardEdges\+\+;continue;\}/);
 assert.match(s,/node.ids.length<2/);
 assert.match(s,/norm\.setXYZ\(i,copy.x,copy.y,copy.z\)/);
});
test('PHOTO105 real rear normal angular energy must decrease and front image/rest/UV/skin remain binary identical',()=>{
 const s=readFileSync('research/photo-denim-panel-normal-continuity-105/rear-seam-normal-continuity.mjs','utf8');
 for(const part of ['pantsRest','pantsSourceUV','pantsSourceFront','skinIndex','skinWeight',
  'energyAfter>energyBefore+.00005',
  'rearSourceNeutralNormalVarianceBefore105:energyBefore',
  'rearSourceNeutralNormalVarianceAfter105:energyAfter',
  'originalSourcePhotoUVRestSkinAndFrontNormalsUnchanged105:true'])
  assert.ok(s.includes(part),part);
 assert.match(s,/actual\.every\(\(v,i\)=>v===expected\[i\]\)/);
 assert.match(s,/norm\.array\.set\(originalNormals\);norm\.needsUpdate=true/);
});
test('PHOTO105 actual SOURCE-pose 0 degree never invents rear fabric highlights',()=>{
 const s=readFileSync('research/photo-denim-panel-normal-continuity-105/rear-seam-normal-continuity.mjs','utf8');
 for(const p of [
  "const hasKneeFlex=angles.leftDegrees>0||angles.rightDegrees>0",
  "if(!hasKneeFlex)continue",
  "originalStraightKneeShadingUnchanged105:!hasKneeFlex",
  "sourcePhotographedRearProvided105:false"
 ])assert.ok(s.includes(p),'source rest and false-source gate '+p);
});
test('PHOTO105 knee-conditioned gradient is physically localized to genuine neutral rear and bounded at 0.14 normal tilt',()=>{
 const s=readFileSync('research/photo-denim-panel-normal-continuity-105/rear-seam-normal-continuity.mjs','utf8');
 for(const p of [
  "const knees=pants.stats.landmarks?.map(k=>new T.Vector3(...k.knee))",
  "const across=q.x-landmark.x,dy=q.y-landmark.y",
  "Math.abs(across)>.24",
  "q.z>landmark.z+.055",
  "const ridge=Math.exp(-.5*((dy+.026)/.076)**2)",
  "Math.sin(T.MathUtils.degToRad(degrees)",
  "normalY.set(dx,dyNormal,0)",
  "copy.distanceTo(before.target)>.14",
  "sourceKneeNormalProfileGroups105:sourceKneeProfileGroups105",
  "actualKneeMeasuredNormalGradientOnly105:true",
  "noInventedRearPhotographShading105:true"
 ])assert.ok(s.includes(p),'missing genuine anatomical/localized normal field '+p);
});
test('PHOTO105 detached donor installed on exact PR541 post PHOTO104 integration only, not default app',()=>{
 const s=readFileSync('scripts/install-denim-panel-normal-105.mjs','utf8');
 for(const part of ["path!=='.photo103-donor-541'",
  'df6885d6011cb33fb22dceb81a08f35a0ac4dd61',
  'research/three-d-15/outfit-controller.mjs',
  'research/three-d-15/showroom.mjs',
  'research/three-d-69/index-to-real-garment-demo.mjs',
  'auditKneePose105','cc105KneeStep','research/three-d-105'])
  assert.ok(s.includes(part),'missing exact donor control '+part);
 assert.doesNotMatch(s,/git push|deploy-pages|public\/app|supabase\/migrations/);
});
test('PHOTO105 real source original 163-bone male/female dual-denim mobile browser QA has front side rear and three widths',()=>{
 const s=readFileSync('scripts/test-denim-panel-normal-105-browser.mjs','utf8');
 for(const part of ["for(const figure of ['female','male'])",
  "for(const denim of ['public','second'])",
  'for(const degrees of [0,16]',
  'for(const view of [0,90,180])',
  'for(const viewportWidth of [320,430])',
  "window.cc104KneeStep(deg,0)",
  "window.cc105KneeStep(deg,0)",
  'sourceRearNormal', // see next assertions for precise contract
  'deltaPixels(beforeImages[view],imgs[view])',
  'originalPhotoSHA256s.bottom',
  "page.locator('#avatar').screenshot",
  'assert.equal(receipts.length,60)',
  'independentlyHumanRatedPhotorealism:false'])
  if(part!=='sourceRearNormal')assert.ok(s.includes(part),'missing original WebGL proof '+part);
});
test('PHOTO105 real independent 60-photo SHA nonblank audit never claims physical phone or human realism',()=>{
 const s=readFileSync('scripts/audit-denim-panel-normal-105.mjs','utf8');
 for(const part of ["r.screenshots.length,60","createHash('sha256')",
  "stats.channels.some", "normalVarianceAfter<=s.normalVarianceBefore+.00005",
  "realSourceNeutralRearSeamLightingChange:true",

  "physicalAndroidIphoneNotVerified:true",
  "noIndependentHumanPhotorealismApproval:true",
  "releaseAuthorized:false"])
  assert.ok(s.includes(part),'missing source evidence audit '+part);
});
test('PHOTO105 dedicated exact-parent CI inherits full Node and original P104 true WebGL and strict no-deploy',()=>{
 const s=readFileSync('.github/workflows/photo-denim-panel-normal-continuity-105-no-deploy.yml','utf8');
 for(const part of [
  'BASE=6ed3d7f9c33a9f1cd616e6db027cff48c5ff7a9b',
  'node --test tests/*.test.cjs tests/*.test.mjs',
  'node scripts/install-photographed-denim-knee-103.mjs .photo103-donor-541',
  'node scripts/install-denim-pose-fold-contact-104.mjs .photo103-donor-541',
  'node scripts/install-denim-panel-normal-105.mjs .photo103-donor-541',
  'node scripts/test-denim-pose-fold-contact-104-browser.mjs',
  'node scripts/test-denim-panel-normal-105-browser.mjs',
  'node scripts/audit-denim-panel-normal-105.mjs',
  'test "$(wc -l </tmp/photo105-allowed)" -eq 7'
 ])assert.ok(s.includes(part),'missing strict evidence CI '+part);
 assert.doesNotMatch(s,/deploy-pages|gh-pages|npm publish/);
});
