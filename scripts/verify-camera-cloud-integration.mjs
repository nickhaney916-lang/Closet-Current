// Historical, byte-exact proof that this release-candidate combines both
// independent reviewed feature branches without silently modifying user photos.
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const root='31c9931536f2b79f7586abac1ea14d0a303cfa86';
const cloud='e61a7c9f6ee0fe1f7d11d18c83483aa5c675c872';
const camera='7fe867fdd392759e0b5106d529e60a37c6438ef7';
const base='ccf308b3807bc5f2b321699a306d7157daf4a845';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:15_000_000}).trim();
const parents=git('rev-list','--parents','-n','1',root).split(' ');
assert.deepEqual(parents,[root,cloud,camera],'Integration must retain both independent verified parents');
assert.equal(git('merge-base',cloud,camera),base,'Feature branches must share the verified photo-import base');
git('merge-base','--is-ancestor',root,'HEAD');
const files=ref=>new Map(git('ls-tree','-r',ref).split('\n').filter(Boolean).map(line=>{
 const [record,path]=line.split('\t');
 assert.ok(record&&path,'Malformed tree row');
 return [path,record.split(' ')[2]];
}));
const prev=files(base),a=files(cloud),b=files(camera),m=files(root),head=files('HEAD');
const changed=(src)=>new Set([...new Set([...prev.keys(),...src.keys()])].filter(path=>prev.get(path)!==src.get(path)));
const cloudOnly=changed(a),cameraOnly=changed(b);
assert.equal(cloudOnly.size,5,'Unexpected changes in source account branch');
assert.equal(cameraOnly.size,7,'Unexpected changes in source camera branch');
assert.equal([...cloudOnly].filter(path=>cameraOnly.has(path)).length,0,'Do not automatically merge overlapping source edits');
for(const p of new Set([...a.keys(),...b.keys()])){
 const want=cameraOnly.has(p)?b.get(p):a.get(p);
 assert.equal(m.get(p),want,'Merged blob differs from verified source: '+p);
}
for(const p of m.keys())assert.ok(a.has(p)||b.has(p),'Unexpected extra source in integration');
// Follow-on saved-garment audit introduces only a manual, no-cloud worksheet.
// Historically verify every older app/source byte remains identical; the
// existing customer app may gain only its precisely defined help-page link.
const oldFile=path=>execFileSync('git',['show',root+':'+path],{encoding:'utf8',maxBuffer:15_000_000});
const originalIndex=oldFile('public/index.html'),currentIndex=fs.readFileSync('public/index.html','utf8');
const insertedLink='<p><a href="saved-closet-audit.html" target="_blank" rel="noopener">Check what was actually saved in My closet</a> (optional private phone audit)</p>';
assert.ok(currentIndex.includes(insertedLink),'Missing operator-only saved-closet help entry');
assert.equal(currentIndex.replace(insertedLink,''),originalIndex,
 'Non-help app HTML changed after approved integration');
const originalBuilder=oldFile('scripts/build.mjs'),currentBuilder=fs.readFileSync('scripts/build.mjs','utf8');
const start='// Pin the private, self-reported saved-closet worksheet to this exact build.';
const end="await writeFile('dist/saved-closet-audit.html',";
const indexStart=currentBuilder.indexOf(start),indexEnd=currentBuilder.indexOf('\n',currentBuilder.indexOf(end,indexStart));
assert.ok(indexStart>=0&&indexEnd>indexStart,'Missing exact-version audit build declaration');
assert.equal(currentBuilder.slice(0,indexStart)+currentBuilder.slice(indexEnd+1),originalBuilder,
 'Non-audit build logic changed after approved integration');
const reviewScript='scripts/check-dual-parent-review-integration.mjs';
const originalReviewScript=oldFile(reviewScript);
const currentReviewScript=fs.readFileSync(reviewScript,'utf8');
const reviewAddedBegin=" if(p==='public/index.html'){";
const reviewAddedEnd=" if(p==='public/app.js'){";
const reviewStart=currentReviewScript.indexOf(reviewAddedBegin),reviewEnd=currentReviewScript.indexOf(reviewAddedEnd,reviewStart);
assert.ok(reviewStart>=0&&reviewEnd>reviewStart,'Missing independently bounded original-review link gate');
const expectedReview=originalReviewScript.replace(
 "['function snap(','function beep('],['function takePhoto(){','async function startCamera(']",
 "['function snap(','function beep('],['let manualStillShot=null;','function controls('],['function finishScan(', 'function takePhoto('],['function takePhoto(){','function waitEvent(']");
assert.notEqual(expectedReview,originalReviewScript,'Camera lifecycle review extension not found');
assert.equal(currentReviewScript.slice(0,reviewStart)+currentReviewScript.slice(reviewEnd),expectedReview,
 'Original human review gate changed outside approved Work camera bounds and byte-exact pilot link');
const work='2d364a8537dc0e5be8ac7495d64bb78abad9b208';
const handoff='6b85dfd61428f5bfd656dd6a4b702ad1c791ac7b';
assert.deepEqual(git('rev-list','--parents','-n','1',handoff).split(' '),
 [handoff,'cd99b47dce2ccd3fc2efa5c25c51d8b4f8837458',work],
 'Work handoff must preserve original main audit and Work camera histories');
git('merge-base','--is-ancestor',handoff,'HEAD');
const workApp=execFileSync('git',['show',work+':public/app.js'],{encoding:'utf8',maxBuffer:15_000_000});
const normalizedCamera=s=>{
 const start=s.indexOf('let manualStillShot=null;'),finish=s.indexOf('function waitEvent(',start);
 assert.ok(start>=0&&finish>start,'Camera reliability boundary changed');
 return s.slice(0,start)+'/* isolated camera lifecycle and frame-delivery fixes */'+s.slice(finish);
};
assert.equal(normalizedCamera(fs.readFileSync('public/app.js','utf8')),normalizedCamera(workApp),
 'Noncamera code diverged from the completed Work PR #91 after handoff');
assert.equal(git('rev-parse',handoff+':public/app.js'),git('rev-parse',work+':public/app.js'),
 'Merged startup recovery must have original Work app bytes before frozen-preview extension');
// Security hardening adds design-only SQL, an isolated local Postgres test,
 // a review document and its dedicated no-hosted-writes CI. No app files.
const allowedSecurity=new Set([
 '.github/workflows/closet-least-privilege-security.yml',
 'supabase/design/closet-backup-least-privilege.DRAFT.sql',
 'tests/closet-least-privilege-postgres.sql',
 'docs/LIVE-CLOSET-SUPABASE-SECURITY-20261020.md'
]);
const allowedWork=new Set([
 'public/app.js',
 'docs/PROGRESS-CHECKPOINT.md',
 '.github/workflows/camera-startup-recovery.yml',
 'scripts/test-camera-startup-recovery-mobile.mjs',
 'tests/capture.test.cjs',
 'tests/photo-native-still.test.cjs',
 '.github/workflows/work-camera-handoff-integration.yml',
 'scripts/test-camera-frozen-preview-mobile.mjs',
 'docs/WORK-CAMERA-HANDOFF-20261020.md'
]);
const allowedNew=new Set([
 'scripts/verify-camera-cloud-integration.mjs',
 '.github/workflows/integrated-camera-cloud-release-qa.yml',
 'docs/INTEGRATED-CAMERA-CLOUD-PILOT-20261020.md',
 '.github/workflows/private-saved-closet-phone-audit.yml',
 'docs/PRIVATE-SAVED-CLOSET-REAL-PHONE-AUDIT-20261020.md',
 'public/saved-closet-audit-engine.js',
 'public/saved-closet-audit.html',
 'public/saved-closet-audit.js',
 'benchmark/private-saved-closet-review.mjs',
 'scripts/review-private-saved-closet.mjs',
 'scripts/test-saved-closet-phone-browsers.mjs',
 'tests/saved-closet-audit.test.cjs',
 'tests/saved-closet-audit-cli.test.mjs'
]);
for(const p of new Set([...m.keys(),...head.keys()])){
 if(m.get(p)!==head.get(p)){
  if(p==='public/index.html'||p==='scripts/build.mjs'||p===reviewScript)continue;
  assert.ok(allowedWork.has(p)||(allowedNew.has(p)&&!m.has(p))||(allowedSecurity.has(p)&&!m.has(p)),
   'Unreviewed change after merge: '+p);
 }
}
for(const p of ['public/recognition-photo.mjs','public/photo-color.js',
 'public/reusable-figure-preview.js','benchmark/reference-mask-evidence/registry.json']){
 assert.equal(head.get(p),prev.get(p),'Original photo recognition/review lineage changed: '+p);
}
console.log(JSON.stringify({sourceParentCount:parents.length-1,
 cameraFilesExact:cameraOnly.size,cloudFilesExact:cloudOnly.size,
 mergedSourceFilesExact:m.size,noFeatureCollision:true,
 sourceRecognitionAndReviewUnchanged:true,mergeIntoMain:false,productionAuthorized:false}));
