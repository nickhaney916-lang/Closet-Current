// Read-only Git/source audit. Never resolves conflicts, updates refs, or deploys.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const BASE='55bd2fac37d45409473485b84e555ebab07d9630';
export const MAIN='54c9e29ede069a05d1268e003f80cbda043c7d6a';
export const SNAPSHOT='docs/integration-audit/sources-20261021.json';
export const ADDITIONS=new Set([SNAPSHOT,'docs/INTEGRATION-CANDIDATE-AUDIT-20261020.md',
 'scripts/audit-integration-candidate.mjs','tests/integration-candidate-audit.test.mjs',
 '.github/workflows/integration-candidate-audit.yml']);
const CHECKPOINT='docs/PROGRESS-CHECKPOINT.md';
const HARNESS='scripts/test-style-my-new-item-mobile.mjs';
export function expectedHarness(prior){
 const old=" assert.equal(await page.locator('#reusableFigureGarments img').count(),0);\n await page.locator('#reusableFigureRetry').click();\n try{await page.waitForFunction";
 const next=" assert.equal(await page.locator('#reusableFigureGarments img').count(),0);\n // A background board refresh may already have started the current preview.\n // Observe and activate Retry in one browser turn instead of waiting forever\n // for a control that correctly becomes hidden during/successful recovery.\n await page.evaluate(()=>{\n  const retry=document.querySelector('#reusableFigureRetry');\n  if(!retry.hidden)retry.click();\n });\n try{await page.waitForFunction";
 assert.equal(prior.split(old).length,2,'Missing/ambiguous historical race assertion');
 return prior.replace(old,next);
}
function git(root,...args){return execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:30_000_000}).trim();}
function ancestor(root,a,b){
 const r=spawnSync('git',['merge-base','--is-ancestor',a,b],{cwd:root});
 assert.ok(r.status===0||r.status===1,'Missing/incomplete Git history');return r.status===0;
}
function tree(root,ref){return new Map(git(root,'ls-tree','-r',ref).split('\n').filter(Boolean).map(s=>{
 const i=s.indexOf('\t');return [s.slice(i+1),s.slice(0,i)];
}));}
export function validateSnapshot(s){
 assert.equal(s.schemaVersion,1);assert.equal(s.repository,'nickhaney916-lang/Closet-Current');
 assert.equal(s.candidateBase,BASE);assert.equal(s.main,MAIN);
 assert.equal(s.pulls.length,100,'Snapshot must contain all 100 observed open PRs');
 const ids=new Set(),heads=new Set();
 for(const p of s.pulls){
  assert.ok(Number.isInteger(p.number)&&!ids.has(p.number),'Duplicate/malformed PR');ids.add(p.number);
  for(const sha of [p.headSha,p.baseSha])assert.match(sha,/^[a-f0-9]{40}$/);
  assert.ok(!heads.has(p.head),'Duplicate branch');heads.add(p.head);
  assert.equal(p.url,`https://github.com/${s.repository}/pull/${p.number}`);
  for(const run of p.ci||[]){
   assert.equal(run.headSha,p.headSha,'CI evidence is not for this exact PR head');
   assert.equal(run.url,`https://github.com/${s.repository}/actions/runs/${run.id}`);
  }
 }
 assert.equal(s.pulls.find(p=>p.number===106)?.headSha,BASE);
 return s;
}
export function verifyScope(root,base=BASE,revision='HEAD',additions=ADDITIONS){
 assert.ok(ancestor(root,base,revision),'Candidate must descend from frozen source');
 const prior=tree(root,base),now=tree(root,revision);
 for(const p of new Set([...prior.keys(),...now.keys()])){
  if(prior.get(p)===now.get(p))continue;
  if(p===CHECKPOINT||p===HARNESS){
   assert.ok(now.has(p),'Reviewed existing file deleted');
   assert.equal(now.get(p).split(' ')[0],prior.get(p).split(' ')[0],'Existing file mode changed');
   continue;
  }
  assert.ok(!prior.has(p)&&additions.has(p),'Unreviewed candidate tree change: '+p);
  assert.ok(now.get(p)?.startsWith('100644 blob '),'Audit additions must be regular files');
 }
 const original=execFileSync('git',['show',base+':'+CHECKPOINT],{cwd:root,encoding:'utf8'});
 const frozenCheckpoint=execFileSync('git',['show',revision+':'+CHECKPOINT],{cwd:root,encoding:'utf8'});
 assert.ok(frozenCheckpoint.endsWith(original),'Committed checkpoint rewrites historical evidence');
 assert.ok(fs.readFileSync(path.join(root,CHECKPOINT),'utf8').endsWith(original),'Working checkpoint rewrites history');
 if(prior.has(HARNESS)){
  const oldHarness=execFileSync('git',['show',base+':'+HARNESS],{cwd:root,encoding:'utf8'});
  const committed=execFileSync('git',['show',revision+':'+HARNESS],{cwd:root,encoding:'utf8'});
  const expected=expectedHarness(oldHarness);
  assert.ok(committed===oldHarness||committed===expected,'Unreviewed committed browser harness change');
  assert.equal(fs.readFileSync(path.join(root,HARNESS),'utf8'),expected,'Browser harness differs outside exact recovery-race adjustment');
 }
 // Check working bytes and mode as well as committed trees; uncommitted model
 // edits must not pass merely because HEAD still names the approved version.
 const dirty=git(root,'diff','--name-only',base,'--').split('\n').filter(Boolean);
 for(const p of dirty)assert.ok(p===CHECKPOINT||p===HARNESS||(!prior.has(p)&&additions.has(p)),'Unreviewed working change: '+p);
 const extra=git(root,'ls-files','--others','--exclude-standard').split('\n').filter(Boolean);
 for(const p of extra)assert.ok(additions.has(p),'Unreviewed untracked file: '+p);
 return {existingSourceFilesUnchanged:prior.size-1-(prior.has(HARNESS)?1:0),
  checkpointHistoryPreserved:true,browserHarnessScope:'exact retry scheduling adjustment only'};
}
export function inventory(root,snapshot){
 validateSnapshot(snapshot);
 const rcTree=tree(root,BASE),pulls=[];
 for(const p of snapshot.pulls){
  const included=ancestor(root,p.headSha,BASE);
  const common=git(root,'merge-base',BASE,p.headSha);
  const changed=git(root,'diff','--name-only',common,p.headSha).split('\n').filter(Boolean);
  const sourceTree=tree(root,p.headSha);
  const matching=changed.filter(f=>rcTree.get(f)===sourceTree.get(f));
  let conflicts=[];
  if(!included){
   const r=spawnSync('git',['merge-tree','--write-tree','--name-only',BASE,p.headSha],{cwd:root,encoding:'utf8',maxBuffer:10_000_000});
   assert.ok(r.status===0||r.status===1,'merge-tree failed for PR '+p.number);
   if(r.status===1)conflicts=r.stdout.split('\n\n')[0].split('\n').slice(1).filter(Boolean);
  }
  pulls.push({...p,ancestorIncluded:included,commonAncestor:common,changedPaths:changed,
   exactMatchingPaths:matching,divergentPaths:changed.filter(f=>!matching.includes(f)),mergeConflicts:conflicts});
 }
 const mainMerge=spawnSync('git',['merge-tree','--write-tree',BASE,MAIN],{cwd:root,encoding:'utf8'});
 assert.equal(mainMerge.status,0,'Frozen main no longer merges cleanly');
 const sourceTree=git(root,'rev-parse',BASE+'^{tree}');
 assert.equal(mainMerge.stdout.trim(),sourceTree,'Unique main content is missing');
 return {schemaVersion:1,sourceBase:BASE,sourceTree,main:MAIN,mainUniqueCommitContentAlreadyPresent:true,
  snapshotOnly:true,productionReleaseApproved:false,
  summary:{open:pulls.length,ancestorIncluded:pulls.filter(p=>p.ancestorIncluded).length,
   divergentHeads:pulls.filter(p=>!p.ancestorIncluded).length,
   conflictingHeads:pulls.filter(p=>p.mergeConflicts.length).length},pulls};
}
export function historicalChecks(root){
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'closet-historical-'));
 const checkout=path.join(temp,'source');let added=false;
 try{
  execFileSync('git',['worktree','add','--detach',checkout,BASE],{cwd:root,stdio:'pipe'});added=true;
  for(const script of ['verify-camera-cloud-integration.mjs','check-dual-parent-review-integration.mjs','check-customer-pilot-release-gates.mjs'])
   execFileSync(process.execPath,['scripts/'+script],{cwd:checkout,stdio:'inherit'});
 }finally{
  if(added)execFileSync('git',['worktree','remove','--force',checkout],{cwd:root,stdio:'pipe'});
  fs.rmSync(temp,{recursive:true,force:true});
 }
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 assert.ok(process.argv.slice(2).every(x=>x==='--historical'),'Unknown argument');
 const root=git(process.cwd(),'rev-parse','--show-toplevel');
 const scope=verifyScope(root);
 const report=inventory(root,JSON.parse(fs.readFileSync(path.join(root,SNAPSHOT),'utf8')));
 if(process.argv.includes('--historical'))historicalChecks(root);
 console.log(JSON.stringify({...report,scope},null,2));
}
