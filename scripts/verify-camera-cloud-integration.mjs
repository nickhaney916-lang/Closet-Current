// Historical, byte-exact proof that this release-candidate combines both
// independent reviewed feature branches without silently modifying user photos.
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
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
const allowed=new Set([
 'scripts/verify-camera-cloud-integration.mjs',
 '.github/workflows/integrated-camera-cloud-release-qa.yml',
 'docs/INTEGRATED-CAMERA-CLOUD-PILOT-20261020.md'
]);
for(const p of new Set([...m.keys(),...head.keys()])){
 if(m.get(p)!==head.get(p))assert.ok(allowed.has(p)&&!m.has(p),'Unreviewed change after merge: '+p);
}
for(const p of ['public/recognition-photo.mjs','public/photo-color.js',
 'public/reusable-figure-preview.js','benchmark/reference-mask-evidence/registry.json']){
 assert.equal(head.get(p),prev.get(p),'Original photo recognition/review lineage changed: '+p);
}
console.log(JSON.stringify({sourceParentCount:parents.length-1,
 cameraFilesExact:cameraOnly.size,cloudFilesExact:cloudOnly.size,
 mergedSourceFilesExact:m.size,noFeatureCollision:true,
 sourceRecognitionAndReviewUnchanged:true,mergeIntoMain:false,productionAuthorized:false}));
