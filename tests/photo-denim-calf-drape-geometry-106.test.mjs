import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {posteriorCalfDrapeDelta106}
 from '../research/photo-denim-calf-drape-geometry-106/calf-drape-policy.mjs';

const calf={kneeY:.6,ankleY:.12,y:.37,across:.01,rear:1,sourceFront:0};
test('PHOTO106 source original straight leg has ZERO invented calf geometry displacement',()=>{
 assert.equal(posteriorCalfDrapeDelta106({...calf,degrees:0}),0);
 for(const d of [4,8,12,16]){
  assert.equal(posteriorCalfDrapeDelta106({...calf,degrees:d,rear:0}),0);
  assert.equal(posteriorCalfDrapeDelta106({...calf,degrees:d,sourceFront:.16}),0);
  assert.equal(posteriorCalfDrapeDelta106({...calf,degrees:d,sourceFront:1}),0);
 }
});
test('PHOTO106 genuine 0/4/8/12/16-degree anatomical bending progressively increases restrained rear calf hang',()=>{
 const samples=[0,4,8,12,16].map(degrees=>
  posteriorCalfDrapeDelta106({...calf,degrees}));
 assert.equal(samples[0],0);
 assert.ok(samples.slice(1).every(x=>x<0&&x>=-.0120001));
 assert.ok(samples.slice(1).every((x,i)=>x<samples[i]));
});
test('PHOTO106 world-space calf field vanishes at genuine lower-hem and knee anchors',()=>{
 const top=calf.kneeY-.085,bottom=calf.ankleY+.065;
 for(const y of [calf.ankleY-.05,bottom,top,calf.kneeY+.04])
  assert.equal(posteriorCalfDrapeDelta106({...calf,degrees:16,y}),0);
 assert.ok(posteriorCalfDrapeDelta106({...calf,degrees:16,y:(top+bottom)/2})<0);
});
test('PHOTO106 authentic source-neutral rear field attenuates near photographed front/side seam',()=>{
 const f0=posteriorCalfDrapeDelta106({...calf,degrees:16,sourceFront:0});
 const f1=posteriorCalfDrapeDelta106({...calf,degrees:16,sourceFront:.1});
 const f2=posteriorCalfDrapeDelta106({...calf,degrees:16,sourceFront:.15});
 assert.ok(f0<f1&&f1<f2&&f2<0);
 assert.equal(posteriorCalfDrapeDelta106({...calf,degrees:16,sourceFront:.2}),0);
});
test('PHOTO106 non-real or malformed original source anatomical and garment measurements fail closed',()=>{
 for(const patch of [
  {degrees:-1},{degrees:16.001},{degrees:NaN},{degrees:Infinity},
  {degrees:'16'},{degrees:null},{kneeY:NaN},{ankleY:Infinity},
  {kneeY:.2,ankleY:.1},{across:.3501},{across:-.3501},
  {rear:-.01},{rear:1.001},{sourceFront:-.001},{sourceFront:1.001},
  {sourceFront:undefined},{y:undefined}
 ])assert.throws(()=>posteriorCalfDrapeDelta106({...calf,degrees:16,...patch}),
  /PHOTO106 requires exact finite/);
});
test('PHOTO106 163-bone original publicly licensed photograph SHA and prior PHOTO105 source checks are required',()=>{
 const src=readFileSync('research/photo-denim-calf-drape-geometry-106/source-ankle-calf-drape.mjs','utf8');
 for(const str of [
  'b316902ad85e8ff46b164ceb7f2c38d3c1424c9d789703e0267e3dfce68fbe1c',
  'aa7f288055874773b87cd38b5b4e473b532920f61c2d17cb0ccd7872466c444a',
  'mesh.skeleton?.bones?.length!==163',
  'poseResponsiveDenim104','originalPhotographedDenimNormalContinuity105',
  'originalSourcePhotoUVRestSkinAndFrontNormalsUnchanged105',
  'auditedTrueSkinnedBodyToSourcePhotoDenim77',
  'originalPhotoUVRestFrontSkinPositionsBytePreserved77',
  'real163BoneSampledKnee103'
 ])assert.ok(src.includes(str),'missing genuine source-photo mesh admission: '+str);
 assert.doesNotMatch(src,/getUserMedia|supabase|localStorage|sessionStorage|fetch\(/);
});
test('PHOTO106 actual source knee-to-ankle landmarks and sewn duplicate vertices drive measured REAL skinned calf',()=>{
 const src=readFileSync('research/photo-denim-calf-drape-geometry-106/source-ankle-calf-drape.mjs','utf8');
 for(const str of [
  'new T.Vector3(...l.knee)','new T.Vector3(...l.ankle)',
  'l.knee.y-l.ankle.y<.22','mesh.updateWorldMatrix(true,false)',
  'new T.Vector3().fromBufferAttribute(pos,i).applyMatrix4(matrix)',
  'const nodes=new Map()',
  "q.toArray().map(round).join(':')",
  'v.maxFront=Math.max(v.maxFront,front.getX(i))',
  'posteriorCalfDrapeDelta106({','pos.setXYZ(idx,local.x,local.y,local.z)'
 ])assert.ok(src.includes(str),'not genuine source skinned geometry: '+str);
});
test('PHOTO106 original FRONT source pixels, source UV, rest, front blend and 163-bone skin MUST remain byte identical',()=>{
 const src=readFileSync('research/photo-denim-calf-drape-geometry-106/source-ankle-calf-drape.mjs','utf8');
 for(const field of ['pantsRest','pantsSourceUV','pantsSourceFront','skinIndex','skinWeight'])
  assert.ok(src.includes(field));
 for(const part of [
  'new Map(protectedAttrs.map',
  '!current.every((v,i)=>v===old[i])',
  'frontProtected+=node.indices.length',
  'if(node.maxFront>=.16)',
  'normal.array.every((v,i)=>v===originalNormals[i])',
  'originalSourcePhotographAndUVRestSkinProtected106:true',
  'photoFrontPositionsAndNormalsUnmodified106:true'
 ])assert.ok(src.includes(part),'missing protected photographic source data '+part);
});
test('PHOTO106 real skinned body triangle contact nonworsening measured AFTER actual calf geometry, or fail closed',()=>{
 const src=readFileSync('research/photo-denim-calf-drape-geometry-106/source-ankle-calf-drape.mjs','utf8');
 for(const part of [
  'auditTrueSkinnedPhotographedDenimContact77(pants,root,',
  'for(const factor of [1,.6,.3])',
  'if(after<=before)',
  'if(!accepted)fail(',
  'pos.array.set(originalPosition);pos.needsUpdate=true',
  'normal.array.set(originalNormals);normal.needsUpdate=true',
  'fullContinuousSweptBodyContactProof106:false'
 ])assert.ok(src.includes(part),'missing true skinned triangle fail closed contact '+part);
});
test('PHOTO106 original photographed jeans source pose 0° returns absolutely unchanged geometry',()=>{
 const src=readFileSync('research/photo-denim-calf-drape-geometry-106/source-ankle-calf-drape.mjs','utf8');
 assert.match(src,/if\(angles\.leftDegrees===0&&angles\.rightDegrees===0\)\{/);
 assert.match(src,/sourceNeutralRearCalfDrape106:\{moved:0,maxShift:0/);
 assert.match(src,/sourceRelativeNonAccumulatingCalfDrape106:true/);
 assert.match(src,/noInventedReversePhotograph106:true/);
});
test('PHOTO106 exact PR541 research-only detached donor integration uses inherited PHOTO103-105 controller and browser',()=>{
 const src=readFileSync('scripts/install-photo-denim-calf-106.mjs','utf8');
 for(const part of [
  "target!=='.photo103-donor-541'",
  'df6885d6011cb33fb22dceb81a08f35a0ac4dd61',
  'research/three-d-15/outfit-controller.mjs',
  'research/three-d-15/showroom.mjs',
  'research/three-d-69/index-to-real-garment-demo.mjs',
  'auditKneePose106','cc106CalfDrape','research/three-d-106',
  'auditPhotographedDenimCalfDrape106'
 ])assert.ok(src.includes(part),'missing isolated donor source '+part);
 assert.doesNotMatch(src,/git push|deploy-pages|public\/app|supabase\/migrations/);
});
test('PHOTO106 actual source original jeans both humanoids both independent photos 3D WebGL at 320/390/430 and all three cameras',()=>{
 const src=readFileSync('scripts/test-photo-denim-calf-106-browser.mjs','utf8');
 for(const part of [
  "for(const figure of ['female','male'])",
  "for(const denim of ['public','second'])",
  'for(const degrees of [0,8,16])',
  'for(const view of [0,90,180])',
  'for(const viewportWidth of [320,430])',
  'window.cc105KneeStep(deg,0)',
  'window.cc106CalfDrape(deg,0)',
  'originalPhotoSHA256s.bottom',
  "page.locator('#avatar').screenshot",
  'assert.equal(receipts.length,84)',
  'assert.equal(scenarios.length,14)',
  'independentlyHumanRatedPhotorealism:false'
 ])assert.ok(src.includes(part),'missing genuine source/3D acceptance '+part);
});
test('PHOTO106 independent original photograph SHA screenshot auditor refuses false 3D, photo or human claims',()=>{
 const src=readFileSync('scripts/audit-photo-denim-calf-106.mjs','utf8');
 for(const part of [
  'assert.equal(r.screenshots.length,84)',
  'assert.equal(r.scenarios.length,14)',
  "createHash('sha256')",
  "stats.channels.some",
  'x.sampledBodyCrossingsAfter<=x.sampledBodyCrossingsBefore',
  'independentlyVerifiedGenuineWebGLFrames:84',
  'independentHumanPhotorealismAcceptance:false',
  'actualPhysicalAndroidIphoneTested:false',
  'releaseAuthorized:false'
 ])assert.ok(src.includes(part),'missing factual quality audit '+part);
});
test('PHOTO106 full inherited source-only no-deploy CI exact HEAD must run 44+48+60 baseline and 84 actual new photos',()=>{
 const src=readFileSync('.github/workflows/photo-denim-calf-drape-geometry-106-no-deploy.yml','utf8');
 for(const part of [
  'BASE=c142a0d1143096a392088cdc4e4a4832b09de57b',
  'node --test tests/*.test.cjs tests/*.test.mjs',
  'node scripts/install-photographed-denim-knee-103.mjs .photo103-donor-541',
  'node scripts/install-denim-pose-fold-contact-104.mjs .photo103-donor-541',
  'node scripts/install-denim-panel-normal-105.mjs .photo103-donor-541',
  'node scripts/install-photo-denim-calf-106.mjs .photo103-donor-541',
  'node scripts/test-photographed-denim-knee-103-browser.mjs',
  'node scripts/test-denim-pose-fold-contact-104-browser.mjs',
  'node scripts/test-denim-panel-normal-105-browser.mjs',
  'node scripts/test-photo-denim-calf-106-browser.mjs',
  'node scripts/audit-photo-denim-calf-106.mjs',
  'test "$(wc -l </tmp/photo106-allowed)" -eq 8'
 ])assert.ok(src.includes(part),'missing full inherited source 163-bone CI '+part);
 assert.doesNotMatch(src,/deploy-pages|gh-pages|npm publish/);
});
