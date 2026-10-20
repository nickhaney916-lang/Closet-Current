// This test is run ONLY under Actions with git fetch-depth=0.
// Verify the actual dual-parent merge, not a PR description claiming files merged.
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
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
  assert.equal(now.get(p)?.sha,cv?.sha,'Customer file accidentally replaced with older review version: '+p);
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
assert.equal(now.get('public/app.js')?.sha,c.get('public/app.js')?.sha);
assert.equal(now.get('public/reusable-figure-preview.js')?.sha,c.get('public/reusable-figure-preview.js')?.sha);
console.log(JSON.stringify({actualDualParentMerge:true,transplantedReviewFiles:transplanted.length,
 preservedCustomerConflictFiles:conflicts.length,identicalSharedFiles:identical.length,
 allReviewBlobsByteIdentical:true,customerProductionLogicUnchanged:true,
 mergedMain:false,productionAuthorized:false}));
