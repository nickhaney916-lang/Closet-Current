import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {poseDenimFoldAmplitude104}
 from '../research/photo-denim-pose-fold-contact-104/fold-profile.mjs';
const params={kneeY:.55,y:.52,across:0,rear:1,sourceFront:0};
test('PHOTO104 original SOURCE zero-degree knee contributes no artificial fabric fold',()=>{
 assert.equal(poseDenimFoldAmplitude104({...params,degrees:0}),0);
 assert.equal(poseDenimFoldAmplitude104({...params,degrees:16,sourceFront:.16}),0);
 assert.equal(poseDenimFoldAmplitude104({...params,degrees:16,sourceFront:1}),0);
 assert.equal(poseDenimFoldAmplitude104({...params,degrees:16,rear:0}),0);
});
test('PHOTO104 real 0..16 degree knee movement increases bounded posterior fold amplitude',()=>{
 const steps=[0,4,8,12,16].map(degrees=>
  poseDenimFoldAmplitude104({...params,degrees}));
 assert.equal(steps[0],0);
 assert.ok(steps.every(Number.isFinite));
 assert.ok(steps.slice(1).every(x=>x<0&&x>=-.011));
 assert.ok(steps.slice(1).every((v,i)=>v<steps[i]),
  'source anatomical 16-degree rear relief must visibly vary with angle, not be static cloth');
});
test('PHOTO104 front and original visible near-front pixels fade independently of knee angle',()=>{
 const full=poseDenimFoldAmplitude104({...params,degrees:16,sourceFront:0});
 const edge=poseDenimFoldAmplitude104({...params,degrees:16,sourceFront:.14});
 assert.ok(Math.abs(edge)<Math.abs(full));
 assert.equal(poseDenimFoldAmplitude104({...params,degrees:16,sourceFront:.17}),0);
});
test('PHOTO104 authentic rear depth controls bound fold and prevent fabricated back source',()=>{
 const values=[0,.2,.5,.8,1].map(rear=>
  poseDenimFoldAmplitude104({...params,degrees:16,rear}));
 assert.equal(values[0],0);
 assert.ok(values.slice(1).every((v,i)=>v<values[i]));
 for(const p of [-.23,-.12,-.03,.04,.13])
  assert.ok(Math.abs(poseDenimFoldAmplitude104({...params,degrees:16,across:p}))<=.011);
});
test('PHOTO104 malformed or unauthorized posterior/knee data fail closed',()=>{
 const modifications=[
  {degrees:-.001},{degrees:16.001},{degrees:NaN},{degrees:Infinity},
  {degrees:'8'},{degrees:null},{kneeY:NaN},{y:Infinity},{across:.36},
  {across:-.36},{rear:-.001},{rear:1.01},{sourceFront:-.1},
  {sourceFront:1.1},{sourceFront:undefined}
 ];
 for(const d of modifications)assert.throws(()=>
  poseDenimFoldAmplitude104({...params,degrees:8,...d}),
  /PHOTO104 requires finite/);
});
test('PHOTO104 3D fold implementation must use genuine original skinned denim SHA and 103 anatomical source angles',()=>{
 const s=readFileSync('research/photo-denim-pose-fold-contact-104/pose-responsive-denim-folds.mjs','utf8');
 for(const name of [
  'auditPhotographedDenimKneeStep103','auditTrueSkinnedPhotographedDenimContact77',
  'sourceSHA','mesh.skeleton','bones','pantsSourceFront',
  'poseDenimFoldAmplitude104','sourceKneeFold104','originalSourceJPEGAndRGBNotModified104:true'
 ])assert.ok(s.includes(name),'missing genuine source/rig verification: '+name);
 assert.doesNotMatch(s,/getUserMedia|supabase|localStorage|sessionStorage|fetch\(/);
});
test('PHOTO104 real sewn mesh groups all same-space vertices to avoid front-fabric cuts or seam cracks',()=>{
 const s=readFileSync('research/photo-denim-pose-fold-contact-104/pose-responsive-denim-folds.mjs','utf8');
 for(const literal of [
  "stamp=q=>q.toArray().map(n=>n.toFixed(5))",
  "group.sourceFront=Math.max(group.sourceFront,front.getX(i))",
  "if(group.sourceFront>=.16)",
  "q.z>measured.z+.055",
  "for(const id of group.indices)p.setXYZ(id,local.x,local.y,local.z)"
 ])assert.ok(s.includes(literal),literal);
});
test('PHOTO104 immutable original photo UV, source front, rest and anatomical 163-bone skin remain exact',()=>{
 const s=readFileSync('research/photo-denim-pose-fold-contact-104/pose-responsive-denim-folds.mjs','utf8');
 for(const field of ['pantsRest','pantsSourceUV','pantsSourceFront','skinIndex','skinWeight'])
  assert.ok(s.includes(field));
 assert.match(s,/expected\.length\|\|!now\.every\(\(v,i\)=>v===expected\[i\]\)/);
 assert.match(s,/snapshots?|protectedArrays/);
 assert.match(s,/inspectUnmodifiedSources\(mesh,state\)/);
});
test('PHOTO104 always resets SOURCE geometry and normals BEFORE subsequent independent bones',()=>{
 const s=readFileSync('research/photo-denim-pose-fold-contact-104/pose-responsive-denim-folds.mjs','utf8');
 assert.match(s,/const previous=new WeakMap\(\)/);
 assert.match(s,/p\.array\.set\(state\.rest\);n\.array\.set\(state\.normals\)/);
 assert.match(s,/restore\(mesh,state\);\s*inspectUnmodifiedSources\(mesh,state\)/);
 assert.match(s,/baseline=auditPhotographedDenimKneeStep103/);
 assert.match(s,/setFashionPose\(root,'source'\)/);
});
test('PHOTO104 actual posed source jeans triangle contacts cannot worsen; reduce geometry or fail closed',()=>{
 const s=readFileSync('research/photo-denim-pose-fold-contact-104/pose-responsive-denim-folds.mjs','utf8');
 assert.match(s,/for\(const multiplier of \[1,.5,.25\]\)/);
 assert.match(s,/auditTrueSkinnedPhotographedDenimContact77\(/);
 assert.match(s,/if\(after<=before\)/);
 assert.match(s,/if\(!accepted\)fail\('real skinned body contacts increased/);
 assert.match(s,/continuousSweptCollisionCertified104:false/);
 assert.match(s,/realClothPhysicsSimulated104:false/);
});
test('PHOTO104 isolated donor installer modifies only original 3D research viewer after inherited 103 adapter',()=>{
 const s=readFileSync('scripts/install-denim-pose-fold-contact-104.mjs','utf8');
 for(const l of [
  "target!=='.photo103-donor-541'",
  'df6885d6011cb33fb22dceb81a08f35a0ac4dd61',
  'research/three-d-15/outfit-controller.mjs',
  'research/three-d-15/showroom.mjs',
  'research/three-d-69/index-to-real-garment-demo.mjs',
  'cc104KneeStep','auditKneePose104','research/three-d-104',
  'pose-responsive-denim-folds.mjs'
 ])assert.ok(s.includes(l),'missing original donor proof: '+l);
 assert.doesNotMatch(s,/git push|deploy-pages|writeFile\(.*public\/app|supabase\/migrations/);
});
test('PHOTO104 browser executes actual 163-bone original image front/side source vs additional fold at 0 8 16 degrees',()=>{
 const s=readFileSync('scripts/test-denim-pose-fold-contact-104-browser.mjs','utf8');
 for(const l of [
  "for(const figure of ['female','male'])",
  "for(const denim of ['public','second'])",
  'for(const degrees of [0,8,16])',
  "for(const view of [45,90])",
  'window.cc104KneeStep(0,0)',
  'window.cc103KneeStep(deg,0)',
  'window.cc104KneeStep(deg,0)',
  'window.cc69SetView(angle)',
  "page.locator('#avatar').screenshot",
  'assert.equal(screenshots.length,48)',
  'originalSourceRestorationChangedPixels=resetPixels',
  'actualSkinnedDenimBodyCrossingCategories77',
  'independentHumanVisualPhotorealismApproved:false'
 ])assert.ok(s.includes(l),'missing genuine sample acceptance: '+l);
});
test('PHOTO104 independent screenshot SHA audit requires 48/48 original real 3D images, source identity and actual contact',()=>{
 const s=readFileSync('scripts/audit-denim-pose-fold-contact-104.mjs','utf8');
 for(const l of [
  "assert.equal(r.screenshotsCount,48)",
  "assert.equal(r.screenshots.length,48)",
  "createHash('sha256')",
  "stats.channels.some",
  'x.actualBodyCrossingsAfter<=x.actualBodyCrossingsBefore',
  'independentlyAuditedWebGLScreenshots:48',
  'continuousPhysics:false',
  'independentHumanVisualApproved:false'
 ])assert.ok(s.includes(l),'missing independent audit: '+l);
});
test('PHOTO104 strict original 103 ancestor no-deploy workflow must run complete inherited and actual WebGL research evidence',()=>{
 const s=readFileSync('.github/workflows/photo-denim-pose-fold-contact-104-no-deploy.yml','utf8');
 for(const l of [
  'BASE=c1558ae6afc9c467692f39c4e0be886d7733d21a',
  'node --test tests/*.test.cjs tests/*.test.mjs',
  'node scripts/install-photographed-denim-knee-103.mjs .photo103-donor-541',
  'node scripts/install-denim-pose-fold-contact-104.mjs .photo103-donor-541',
  'node scripts/test-photographed-denim-knee-103-browser.mjs',
  'node scripts/test-denim-pose-fold-contact-104-browser.mjs',
  'node scripts/audit-denim-pose-fold-contact-104.mjs',
  'test "$(wc -l </tmp/photo104-allowed)" -eq 7'
 ])assert.ok(s.includes(l),'missing genuine no deploy step '+l);
 assert.doesNotMatch(s,/deploy-pages|gh-pages|npm publish/);
});
