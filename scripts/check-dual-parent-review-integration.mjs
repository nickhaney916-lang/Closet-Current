// This test is run ONLY under Actions with git fetch-depth=0.
// Verify the actual dual-parent merge, not a PR description claiming files merged.
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const git=(...a)=>execFileSync('git',a,{encoding:'utf8',maxBuffer:5_000_000}).trim();
const merge='b8adbe5beb1a31593b61af8a4fdd5d0028b3665b';
const customer='36d55cccb782d012885d7fd970804826b9262208';
const human='4acc449a5292f8254fdc1d4edf90520ca053c079';
const ancestor='8d009ec056f8b7178185efb422beb94cd085a07c';
const parents=git('rev-list','--parents','-n','1',merge).split(' ');
assert.deepEqual(parents,[merge,customer,human],'Do not substitute a fake or unrelated history merge');
assert.equal(git('merge-base',customer,human),ancestor,'Git ancestor must be independently inspected');
const tree=(sha)=>new Map(execFileSync('git',['ls-tree','-r','-z',sha])
 .toString('utf8').split('\0').filter(Boolean).map(line=>{
 const [prefix,path]=line.split('\t'),[mode,type,object]=prefix.split(' ');
 return [path,{mode,type,sha:object}];
 }));
const c=tree(customer),h=tree(human),a=tree(ancestor),now=tree('HEAD');
// Follow-on camera work may change capture/encoding only, while every other
// app byte (including recognition, indexing and source selection) remains bound
// to the customer parent. Checkpoint additions must retain all prior history.
function assertCustomerPreserved(p){
 if(p==='docs/PROGRESS-CHECKPOINT.md'){
  assert.ok(fs.readFileSync(p,'utf8').endsWith(execFileSync('git',['show',customer+':'+p],{encoding:'utf8',maxBuffer:5_000_000})),
   'Checkpoint history must remain intact');
  return;
 }
 if(p==='public/app.js'){
  const normalize=s=>{
   for(const [begin,end] of [['function snap(','function beep('],['function takePhoto(){','async function startCamera(']]){
    const a=s.indexOf(begin),b=s.indexOf(end,a);
    assert.ok(a>=0&&b>a,'Missing camera section boundary');
    s=s.slice(0,a)+'/* bounded native camera section */\n'+s.slice(b);
   }
   return s;
  };
  assert.equal(normalize(fs.readFileSync(p,'utf8')),
   normalize(execFileSync('git',['show',customer+':'+p],{encoding:'utf8',maxBuffer:5_000_000})),
   'Non-camera app bytes changed, including original-photo recognition/indexing');
  return;
 }
 assert.equal(now.get(p)?.sha,c.get(p)?.sha,'Customer file accidentally replaced with older review version: '+p);
}
const transplanted=[],conflicts=[],identical=[];
for(const [p,hv] of h){
 if(hv.sha===a.get(p)?.sha)continue;
 const cv=c.get(p),av=a.get(p);
 if(cv?.sha===av?.sha){
  assert.equal(now.get(p)?.sha,hv.sha,'Review file source bytes were changed: '+p);
  transplanted.push(p);
 }else if(cv?.sha===hv.sha){
  assert.equal(now.get(p)?.sha,hv.sha,'Already matching shared file was rewritten: '+p);
  identical.push(p);
 }else{
  assertCustomerPreserved(p);
  conflicts.push(p);
 }
}
assert.equal(transplanted.length,50);
assert.equal(conflicts.length,8);
assert.equal(identical.length,5);
for(const file of ['public/index.html','scripts/test-reusable-figure-phone-browsers.mjs',
 'tests/source-guided-mask-refinement.test.cjs']){
 assert.ok(conflicts.includes(file));
}
for(const file of ['benchmark/annotate-garment-native.html',
 'benchmark/approve-garment-mask-native.html','benchmark/reference-mask-evidence/registry.json',
 'benchmark/verified-mask-quality.mjs','scripts/preflight-human-review-handoff.mjs']){
 assert.ok(transplanted.includes(file));
}
assert.equal(tree(merge).get('public/app.js')?.sha,c.get('public/app.js')?.sha);
assertCustomerPreserved('public/app.js');
const originalMerge=tree(merge);
// Check the byte-exact original human/customer integration BEFORE approved
// follow-on feature commits. A later isolated local fitting safety fix is
// permitted, but not allowed to rewrite the PR #83 merge history or humans.
assert.equal(originalMerge.get('public/reusable-figure-preview.js')?.sha,
 c.get('public/reusable-figure-preview.js')?.sha);
const localPreviewSource=fs.readFileSync('public/reusable-figure-preview.js','utf8');
const previewModified=now.get('public/reusable-figure-preview.js')?.sha!==
 c.get('public/reusable-figure-preview.js')?.sha;
if(previewModified){
 assert.match(localPreviewSource,/function guardWatchdog\(state\)/);
 assert.match(localPreviewSource,/sameRequest\(stalledState/);
 assert.match(localPreviewSource,/Preview took too long/);
 assert.match(localPreviewSource,/clearWatchdog\(\);stalledState=null/);
}
console.log(JSON.stringify({actualDualParentMerge:true,transplantedReviewFiles:transplanted.length,
 preservedCustomerConflictFiles:conflicts.length,identicalSharedFiles:identical.length,
 allReviewBlobsByteIdentical:true,customerPhotoClassificationUnchanged:true,
 originalMergedFittingBlobIntact:true,subsequentPreviewWatchdogAudited:previewModified,
 mergedMain:false,productionAuthorized:false}));
