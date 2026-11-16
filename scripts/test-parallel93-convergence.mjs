// Parallel #93: source-pinned, READ-ONLY git branch-convergence rehearsal.
// Runs in a CI checkout; may write ONLY disposable .parallel93 scratch and numeric receipts.
// Does not merge, push, update refs, deploy, read private accounts or fetch models.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
const BASE='93696bfa890f573fbbb23da3530da27c45d4b890';
const donor={
 mission1:'bec1ae8eba2a3979ec0581cb93a91b1ec3ad231c',
 mission2:'569a1b90780ab25651b6c9adf98cc1b078b501c0',
 mission3:'4d9a28bba60c7f17f934848fc36d4bd478ffea55',
 parallel92:'5f8ce4240c69fc3847d7922c44da20fa15a9d768'
};
const expected={
 'public/app.js':'991c00457799f8e2b8ae958d5ace85cc9914aece',
 'public/outfit-board.js':'153455379b0b6d777eff8c1c508c129208c7fadc',
 'public/outfit-board-engine.js':'787df8a770d900b56aee25bb2987c420a5e11778',
 'public/native-default-atomic-import-m3.mjs':'3a83e3336ce36334a49708d1c7b90cc27194c7b9',
 'public/outfit-segmentation.mjs':'d357955dd8fdab7c0cb727ea597c270edd9309ac'
};
function run(cmd,args=[],cwd=process.cwd()){
 const p=spawnSync(cmd,args,{cwd,encoding:'utf8',maxBuffer:16*1024*1024});
 if(p.error)throw p.error;
 return {status:p.status,stdout:p.stdout||'',stderr:p.stderr||''};
}
function must(cmd,args=[],cwd=process.cwd()){
 const p=run(cmd,args,cwd);
 assert.equal(p.status,0,cmd+' '+args.join(' ')+' failed: '+p.stderr.slice(0,800));
 return p.stdout.trim();
}
const head=must('git',['rev-parse','HEAD']);
assert.equal(must('git',['merge-base',BASE,head]),BASE,'#93 must descend from frozen M4');
for(const [path,sha] of Object.entries(expected)){
 assert.equal(must('git',['rev-parse',BASE+':'+path]),sha,'Unexpected frozen M4 source: '+path);
 assert.equal(must('git',['rev-parse','HEAD:'+path]),sha,'#93 must not edit consumer: '+path);
}
const modified=must('git',['diff','--name-only',BASE,head]).split('\n').filter(Boolean);
assert(modified.every(p=>p.startsWith('research/parallel93-convergence/')||
 p.startsWith('scripts/test-parallel93-')||p.startsWith('tests/parallel93-')||
 p.startsWith('.github/workflows/parallel93-')),
 'Parallel93 branch changed a path owned by another mission: '+modified.join(', '));
const receipts={schema:'P93-source-convergence/v1',head,base:BASE,donors:donor,
 mainSourceBlobs:expected,modifiedByP93:modified,mergeRehearsals:{},
 selectiveOverlay:{},status:'HOLD',releaseAuthorized:false,deploy:false};
const worktrees=[];
const root=await mkdtemp(join(tmpdir(),'closet-parallel93-'));
try{
 for(const [name,sha] of Object.entries(donor)){
  must('git',['cat-file','-e',sha+'^{commit}']);
  const mergeBase=must('git',['merge-base',BASE,sha]);
  const tree=run('git',['merge-tree','--write-tree',BASE,sha]);
  // merge-tree 0=clean, 1=merge conflicts; statuses 2+ are infrastructure errors.
  assert([0,1].includes(tree.status),
   name+' merge-tree failed unexpectedly: '+tree.stderr.slice(0,800));
  const conflicts=tree.stdout.split('\n').filter(x=>/^CONFLICT\b/.test(x)).slice(0,50);
  const dest=join(root,name);
  must('git',['worktree','add','--detach',dest,BASE]);
  worktrees.push(dest);
  const pick=run('git',['cherry-pick','--no-commit',sha],dest);
  let pickConflicts=[];
  if(pick.status!==0){
   const unresolved=run('git',['diff','--name-only','--diff-filter=U'],dest);
   pickConflicts=unresolved.stdout.split('\n').filter(Boolean).slice(0,60);
   run('git',['cherry-pick','--abort'],dest);
  }
  must('git',['reset','--hard',BASE],dest);
  receipts.mergeRehearsals[name]={
   sourceSha:sha,mergeBase,fullBranchMerge:tree.status===0?'CLEAN_TREE_ONLY_NOT_ADOPTED':'CONFLICT',
   conflicts:conflicts.length?conflicts:tree.stdout.split('\n').filter(x=>/Auto-merging|changed in both|CONFLICT/.test(x)).slice(0,20),
   tipCherryPick:pick.status===0?'APPLIES_NO_COMMIT':'CONFLICT_OR_REQUIRES_PREREQUISITES',
   tipCherryPickConflicts:pickConflicts,
   noBranchesModified:true
  };
 }
 // Minimal genuinely assembled combined-source tree, never the deployed app.
 // M1 segmentation is already EXACTLY identical in M4, so transplant just its
 // instance-review export. M3 research importer is staged side-by-side with
 // native M4 (never substitutes for it). M2 contact geometry stays research-only.
 const overlay=join(root,'mission1');
 const paths=[
  {name:'M1_review',sha:donor.mission1,path:'public/outfit-instance-review-840.mjs'},
  {name:'M3_research_import',sha:donor.mission3,path:'research/mission3-legacy-atomic-import/legacy-atomic-merge.mjs'},
  {name:'M2_skirt_research',sha:donor.mission2,path:'research/parallel89/skirt-rigid-registration89.mjs'}
 ];
 for(const {name,sha,path} of paths){
  const src=must('git',['show',sha+':'+path]);
  const target=join(overlay,path);
  await mkdir(resolve(target,'..'),{recursive:true});
  await writeFile(target,src);
  const blob=must('git',['hash-object',target]);
  assert.equal(blob,must('git',['rev-parse',sha+':'+path]));
  receipts.selectiveOverlay[name]={path,sourceSha:sha,blobSha:blob,
   mode:'DISPOSABLE_SOURCE_ONLY_NOT_CONSUMER_ADMISSION'};
 }
 const seg=must('git',['rev-parse',donor.mission1+':public/outfit-segmentation.mjs']);
 assert.equal(seg,expected['public/outfit-segmentation.mjs'],
  'M1 imported segmentation dependency differs from M4; NO blind transplant');
 const stagedM1=await import('file://'+join(overlay,'public/outfit-instance-review-840.mjs'));
 assert.equal(typeof stagedM1.clothingReviewInstances840,'function');
 const width=40,height=40;
 const labels=new Uint8Array(width*height),confidence=new Float32Array(width*height).fill(.99);
 for(let y=4;y<12;y++)for(let x=4;x<13;x++)labels[y*width+x]=4;
 for(let y=22;y<30;y++)for(let x=23;x<32;x++)labels[y*width+x]=4;
 const originalCount=labels.reduce((n,x)=>n+(x===4),0);
 const native=stagedM1.clothingReviewInstances840({width,height,labels,confidence,personDetected:true});
 assert.equal(native.length,1);
 assert.equal(native[0].componentReviewStatus,'unresolved_fragments_keep_source_mask');
 assert.equal(native[0].selected.reduce((n,x)=>n+x,0),originalCount,
  'M1 must not silently discard separated same-class garment mask pixels');
 const candidate=stagedM1.clothingReviewInstances840({width,height,labels,confidence,personDetected:true},
  {splitNonFootwear:true});
 assert.equal(candidate.length,2);
 assert(candidate.every(x=>x.requiresReview===true&&
  x.componentReviewStatus==='owner_must_confirm_garment_units'));
 assert.equal(candidate.reduce((n,g)=>n+g.count,0),originalCount);
 receipts.selectiveOverlay.m1MaskReview={
  status:'PASS',syntheticMask:true,semanticProposals:2,canonicalMaskPixels:originalCount,
  automaticNativeSave:false,independentHumanLabels:false
 };
 const built=run('node',['scripts/build.mjs'],overlay);
 assert.equal(built.status,0,'Disposable combined source build: '+built.stderr.slice(0,800));
 receipts.selectiveOverlay.build='PASS_DISPOSABLE_COMBINED_SOURCE';
 const nodeTests=run('node',['--test','tests/mission3-default-atomic-backup-source-guard.test.mjs',
  'tests/main54-unresolved-multi-mask-owner-veto.test.mjs',
  'tests/main55-p88-source-key-lease.test.mjs'],overlay);
 assert.equal(nodeTests.status,0,'Disposable combined source targeted tests: '+nodeTests.stderr.slice(0,1500)+nodeTests.stdout.slice(-1500));
 receipts.selectiveOverlay.sourceTests='PASS_DISPOSABLE_COMBINED_SOURCE_TARGETED';
}finally{
 for(const path of worktrees.reverse())run('git',['worktree','remove','--force',path]);
 await rm(root,{recursive:true,force:true});
}
await mkdir('benchmark/parallel93-convergence',{recursive:true});
await writeFile('benchmark/parallel93-convergence/SOURCE-REHEARSAL.json',
 JSON.stringify(receipts,null,2)+'\n');
console.log(JSON.stringify({base:BASE,head,mergeRehearsals:receipts.mergeRehearsals,
 selectiveOverlay:receipts.selectiveOverlay,status:'PASS_RESEARCH_ONLY_RELEASE_HOLD'},null,2));
