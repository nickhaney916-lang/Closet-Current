// P93: verified latest-M4 executable combination and proposed paired v3 fix.
// FULLY DISPOSABLE git worktree. The current branch, main PR, donor branches,
// original photos and hosted storage are never modified.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile,writeFile,mkdir,symlink,rm,mkdtemp} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {P93_M97,proposeP93SourceOnlyPatch,P93_PINS} from '../research/parallel93-convergence/proposed-v3-pair-adapter.mjs';
const BASE='93696bfa890f573fbbb23da3530da27c45d4b890';
const donors=[
 {name:'M1',head:'bec1ae8eba2a3979ec0581cb93a91b1ec3ad231c',
  path:'public/outfit-instance-review-840.mjs',blob:'6324d8eda33024f166311f424392ed83363e4942'},
 {name:'M2',head:'569a1b90780ab25651b6c9adf98cc1b078b501c0',
  path:'research/parallel89/skirt-rigid-registration89.mjs',blob:'73177ed4645633ca060e7185eab881fa75d3a2bf'},
 {name:'M3',head:'4d9a28bba60c7f17f934848fc36d4bd478ffea55',
  path:'research/mission3-legacy-atomic-import/legacy-atomic-merge.mjs',
  blob:'2d9ad8a5309a2f2392bd35ccfd1b0b2ad0ce7491'}
];
function run(command,args,cwd=process.cwd()){
 const out=spawnSync(command,args,{cwd,encoding:'utf8',maxBuffer:12*1024*1024,
  env:{...process.env,PLAYWRIGHT_BROWSERS_PATH:process.env.PLAYWRIGHT_BROWSERS_PATH||'/ms-playwright'}});
 if(out.error)throw out.error;
 return {status:out.status,stdout:out.stdout||'',stderr:out.stderr||''};
}
function must(command,args,cwd){
 const out=run(command,args,cwd);
 assert.equal(out.status,0,command+' '+args.join(' ')+' failed: '+(out.stderr||out.stdout).slice(-3000));
 return out.stdout.trim();
}
const current=must('git',['rev-parse','HEAD']);
assert.equal(must('git',['merge-base',BASE,current]),BASE);
assert.equal(must('git',['merge-base',BASE,P93_M97]),BASE);
const stagingRoot=await mkdtemp(join(tmpdir(),'closet-p93-m97-'));
const staged=join(stagingRoot,'m97');
const results={schema:'P93-M97-combined-source-with-test-only-backup-pair/v1',
 p93ExactHead:current,m4ExactHead:P93_M97,originalM4Base:BASE,
 realNativeApp:true,normalM4Adopted:false,sourceBoundsPatchTestOnly:true,
 originalPhotoSourceUnchanged:true,hostedRLS:false,physicalPhones:false,
 fitted3D:false,independentGarmentLabels:false,familyAlpha:'HOLD',
 safeNoDeploy:true,diffFiles:[],stagedDonors:[],checks:{}};
try{
 must('git',['worktree','add','--detach',staged,P93_M97]);
 await symlink(resolve('node_modules'),join(staged,'node_modules'),'dir');
 for(const d of donors){
  must('git',['cat-file','-e',d.head+'^{commit}']);
  assert.equal(must('git',['rev-parse',d.head+':'+d.path]),d.blob);
  const sourceResult=run('git',['show',d.head+':'+d.path]);
  assert.equal(sourceResult.status,0,'Missing immutable donor '+d.head+':'+d.path);
  const source=sourceResult.stdout;
  const destination=join(staged,d.path);
  await mkdir(dirname(destination),{recursive:true});
  await writeFile(destination,source);
  assert.equal(must('git',['hash-object',destination]),d.blob);
  results.stagedDonors.push({mission:d.name,head:d.head,path:d.path,blob:d.blob,
   mountedIntoNormalNativeConsumer:false});
 }
 assert.equal(must('git',['rev-parse',P93_M97+':public/outfit-segmentation.mjs']),
  'd357955dd8fdab7c0cb727ea597c270edd9309ac',
  'M1 review dependency must be exactly available in latest M4');
 // Apply ONLY the source-pinned isolated M3 v3 export/import pair in this
 // temporary worktree, preserving all app/capture/board/session sources.
 for(const path of Object.keys(P93_PINS)){
  const original=await readFile(join(staged,path),'utf8');
  const patch=proposeP93SourceOnlyPatch(path,original);
  await writeFile(join(staged,path),patch.proposedSource);
  const syntax=run('node',['--check',path],staged);
  assert.equal(syntax.status,0,'Candidate parser failure: '+syntax.stderr);
  results.checks[path]={sourceSha:patch.originalGitBlob,
   candidateSyntax:'PASS',protectedOriginalSourceLength:original.length,
   candidateLength:patch.proposedSource.length};
 }
 results.diffFiles=must('git',['diff','--name-only'],staged).split('\n').filter(Boolean);
 assert(results.diffFiles.every(path=>Object.hasOwn(P93_PINS,path)||
  path==='research/mission3-legacy-atomic-import/legacy-atomic-merge.mjs'),
  'Latest app, board or other protected path modified: '+results.diffFiles);
 for(const path of ['public/app.js','public/outfit-board.js','public/outfit-board-engine.js',
    'public/native-lossless-v4-owner-acceptance-m3.mjs']){
  assert.equal(must('git',['hash-object',join(staged,path)]),
   must('git',['rev-parse',P93_M97+':'+path]),
   'DISALLOWED native app/board/owner/backup change: '+path);
 }
 must('node',['scripts/build.mjs'],staged);
 results.checks.nativeBuild='PASS';
 const node=run('node',['--test',
  'tests/mission3-default-atomic-backup-source-guard.test.mjs',
  'tests/mission3-default-export-snapshot-cas.test.mjs',
  'tests/main54-unresolved-multi-mask-owner-veto.test.mjs',
  'tests/main55-p88-source-key-lease.test.mjs'],staged);
 assert.equal(node.status,0,'M97 selected actual-source tests: '+node.stdout.slice(-4000)+node.stderr.slice(-2000));
 const counts=node.stdout.match(/# tests (\d+)[\s\S]*?# pass (\d+)[\s\S]*?# fail (\d+)/);
 assert(counts,'Missing real Node TAP summary');
 assert.equal(counts[1],counts[2]);assert.equal(counts[3],'0');
 results.checks.latestM4ProtectedNode={status:'PASS',tests:Number(counts[1])};
 const native=run('node',['scripts/test-mission3-default-atomic-import-browser.mjs',
  'benchmark/parallel93-m97-native-browser'],staged);
 assert.equal(native.status,0,'M97 native chromium + WebKit failures: '+native.stdout.slice(-4000)+native.stderr.slice(-4000));
 const evidence=JSON.parse(await readFile(join(staged,
  'benchmark/parallel93-m97-native-browser/results.json'),'utf8'));
 assert.equal(evidence.familyAlpha,'HOLD');
 assert.equal(evidence.cases.length,6);
 assert.equal(evidence.errors.length,0);
 for(const engine of ['chromium','webkit'])for(const width of [320,390,430]){
  const c=evidence.cases.find(x=>x.engine===engine&&x.width===width);
  assert(c&&c.nativeIndexedDB&&c.defaultV3NativeAtomic&&
   c.originalIdCollisionBlocked&&c.unverifiedLegacyJPEGAliasBlocked&&
   c.originalAliasSourceBlocked&&c.ownerFacingDuplicateRecoveryVerified&&
   c.foreignOwnerBlocked&&c.duplicateIdsBlocked&&c.unsavedCaptureBlocked&&
   c.syntheticStageRollback&&c.looksOutfitsOneCommit&&
   c.cloudRevisionAtomic&&c.badRefRollback&&c.oldOwnerReject,
   'Actual owner/JPEG/rollback strict browser evidence failed '+engine+':'+width);
 }
 results.checks.actualAppBrowser={status:'PASS',engines:['chromium','webkit'],
  widths:[320,390,430],journeys:6,
  sourceChecks:'all inherited ordinary native v3 duplicate/rollback/owner fences',
  syntheticOwners:true,physicalPhone:false};
}finally{
 run('git',['worktree','remove','--force',staged]);
 await rm(stagingRoot,{recursive:true,force:true});
}
await mkdir('benchmark/parallel93-convergence',{recursive:true});
const dest='benchmark/parallel93-convergence/M97-DISPOSABLE-BROWSER-RESULT.json';
await writeFile(dest,JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify(results,null,2));
