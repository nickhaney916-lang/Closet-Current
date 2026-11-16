// P93: verified latest-M4 executable combination and proposed EXPORT-ONLY v3 fix on M98 native importer.
// FULLY DISPOSABLE git worktree. The current branch, main PR, donor branches,
// original photos and hosted storage are never modified.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFile,writeFile,mkdir,symlink,rm,mkdtemp} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash} from 'node:crypto';
import {proposeP93SourceOnlyPatch,P93_PINS} from '../research/parallel93-convergence/proposed-v3-pair-adapter.mjs';
const M98='c387be237600bb93ce86f7955c2bb86692f80a26';
const M98_IMPORT_BLOB='085abb27e83ca21504b3408ee6f276479384295a';
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
assert.equal(must('git',['merge-base',BASE,M98]),BASE);
const stagingRoot=await mkdtemp(join(tmpdir(),'closet-p93-m98-'));
const staged=join(stagingRoot,'m98');
const results={schema:'P93-M98-combined-source-with-test-only-backup-pair/v1',
 p93ExactHead:current,m4ExactHead:M98,originalM4Base:BASE,
 realNativeApp:true,normalM4Adopted:false,exportOnlyPatchTestOnly:true,
 originalPhotoSourceUnchanged:true,hostedRLS:false,physicalPhones:false,
 fitted3D:false,independentGarmentLabels:false,familyAlpha:'HOLD',
 safeNoDeploy:true,diffFiles:[],stagedDonors:[],checks:{}};
try{
 must('git',['worktree','add','--detach',staged,M98]);
 await symlink(resolve('node_modules'),join(staged,'node_modules'),'dir');
 // The dedicated P93 browser harness is isolated test-only code. It is
 // copied verbatim into scratch so Node can load it alongside real M98 app.
 const browserHarness=await readFile('scripts/test-parallel93-native-large-v3-browser.mjs','utf8');
 await writeFile(join(staged,'scripts/test-parallel93-native-large-v3-browser.mjs'),browserHarness);
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
 assert.equal(must('git',['rev-parse',M98+':public/outfit-segmentation.mjs']),
  'd357955dd8fdab7c0cb727ea597c270edd9309ac',
  'M1 review dependency must be exactly available in latest M4');
 // M98 already has the main-owned linear/8MiB native importer.
 // Freeze its exact blob and patch ONLY the exporter in disposable scratch.
 assert.equal(must('git',['rev-parse',M98+':public/native-default-atomic-import-m3.mjs']),
  M98_IMPORT_BLOB,'Main-owned M98 importer changed; do not overwrite it');
 const exportPath='public/native-default-verified-backup-export-m3.mjs';
 const original=await readFile(join(staged,exportPath),'utf8');
 const patch=proposeP93SourceOnlyPatch(exportPath,original);
 await writeFile(join(staged,exportPath),patch.proposedSource);
 const syntax=run('node',['--check',exportPath],staged);
 assert.equal(syntax.status,0,'Export-only candidate parser failure: '+syntax.stderr);
 results.checks[exportPath]={sourceSha:patch.originalGitBlob,
  candidateSyntax:'PASS',sourceLength:original.length,
  candidateLength:patch.proposedSource.length};
 assert.equal(must('git',['hash-object',join(staged,'public/native-default-atomic-import-m3.mjs')]),
  M98_IMPORT_BLOB,'P93 must never replace the main M98 importer');
 results.diffFiles=must('git',['diff','--name-only'],staged).split('\n').filter(Boolean);
 assert(results.diffFiles.every(path=>path==='public/native-default-verified-backup-export-m3.mjs'||
  path==='research/mission3-legacy-atomic-import/legacy-atomic-merge.mjs'),
  'Latest app, board or other protected path modified: '+results.diffFiles);
 for(const path of ['public/app.js','public/outfit-board.js','public/outfit-board-engine.js',
    'public/native-lossless-v4-owner-acceptance-m3.mjs',
    'public/native-default-atomic-import-m3.mjs']){
  assert.equal(must('git',['hash-object',join(staged,path)]),
   must('git',['rev-parse',M98+':'+path]),
   'DISALLOWED native app/board/owner/backup change: '+path);
 }
 must('node',['scripts/build.mjs'],staged);
 results.checks.nativeBuild='PASS';
 const node=run('node',['--test',
  'tests/mission3-default-atomic-backup-source-guard.test.mjs',
  'tests/mission3-default-export-snapshot-cas.test.mjs',
  'tests/main54-unresolved-multi-mask-owner-veto.test.mjs',
  'tests/main55-p88-source-key-lease.test.mjs'],staged);
 assert.equal(node.status,0,'M98 export-only exact-source tests: '+node.stdout.slice(-4000)+node.stderr.slice(-2000));
 const counts=node.stdout.match(/# tests (\d+)[\s\S]*?# pass (\d+)[\s\S]*?# fail (\d+)/);
 assert(counts,'Missing real Node TAP summary');
 assert.equal(counts[1],counts[2]);assert.equal(counts[3],'0');
 results.checks.latestM4ProtectedNode={status:'PASS',tests:Number(counts[1])};
 const native=run('node',['scripts/test-mission3-default-atomic-import-browser.mjs',
  'benchmark/parallel93-m98-native-browser'],staged);
 assert.equal(native.status,0,'M98 importer-existing chromium + WebKit failures: '+native.stdout.slice(-4000)+native.stderr.slice(-4000));
 const evidence=JSON.parse(await readFile(join(staged,
  'benchmark/parallel93-m98-native-browser/results.json'),'utf8'));
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
 // P93's own separate full-size source browser case: real native unflagged
 // v3 export API and ACTUAL app UI import on the test-patched-export M98 tree.
 const large=run('node',['scripts/test-parallel93-native-large-v3-browser.mjs',
  'benchmark/parallel93-m98-large-original-browser'],staged);
 assert.equal(large.status,0,'M98 native LARGE original browser: '+
  large.stdout.slice(-4000)+large.stderr.slice(-4000));
 const received=JSON.parse(await readFile(join(staged,
  'benchmark/parallel93-m98-large-original-browser/results.json'),'utf8'));
 assert.equal(received.familyAlpha,'HOLD');
 assert.deepEqual(received.realBrowserEngines,['chromium','webkit']);
 assert.equal(received.cases.length,6);
 assert.equal(received.errors.length,0);
 assert(received.cases.every(c=>c.actualNativeApp===true&&
  c.exportImportLargeOriginalUI===true&&c.losslessOriginal===true&&
  c.ownerOriginalOutfitRecovered===true&&c.sourceTo3DAllowed===false));
 results.checks.largeOriginalActualBrowser={
  status:'PASS',engines:['chromium','webkit'],widths:[320,390,430],
  journeys:6,sourceEncodedOver3MB:true,
  realUnflaggedUIImport:true,syntheticAccounts:true,
  fullPhotoStillPrivate:true,consumer3DAdmission:false
 };
}finally{
 run('git',['worktree','remove','--force',staged]);
 await rm(stagingRoot,{recursive:true,force:true});
}
await mkdir('benchmark/parallel93-convergence',{recursive:true});
const dest='benchmark/parallel93-convergence/M98-DISPOSABLE-BROWSER-RESULT.json';
await writeFile(dest,JSON.stringify(results,null,2)+'\n');
console.log(JSON.stringify(results,null,2));
