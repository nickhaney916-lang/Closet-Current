/**
 * MAIN1054 M53 — exact source consumer integration merge feasibility.
 * git merge-tree computes three-way conflict outcomes without touching refs,
 * branches, checked-out files, production, hosted Supabase, or private photos.
 * A clean merge is NOT a verified working native consumer; all are DRAFT/HOLD.
 */
import {execFileSync,spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const REPO='nickhaney916-lang/Closet-Current';
const M51='22f3db9f9d5dd34ff2d1323e59d3848935e65f4f';
const DONORS=Object.freeze({
 mission1_owner_recognition88:'85d92141717d7131c5d724a15e26df3b6d734678',
 mission2_garment89:'a0bb1eaf872394dc9e9f19e218aecb4af292c1c5',
 mission90_avatar_viewer:'1b6fb1a2019e9b1e8e5ed55cc1f847809460ced9'
});
const expectedMergeBases=Object.freeze({
 mission1_owner_recognition88:'39deed987afe2e5668d64e145835ad43ad14c7be',
 mission2_garment89:'faac51857d57356fb5568f035566a171cadaa418',
 mission90_avatar_viewer:'271f25b4435f74c753df705490d2bf6b538aaee2'
});
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:16*1024*1024}).trim();
const sha=x=>createHash('sha256').update(x).digest('hex');
assert.equal(git('rev-parse','HEAD').length,40);
assert.equal(git('merge-base','--is-ancestor',M51,'HEAD'),'');
const pristineTracked=git('diff','--name-only');
assert.equal(pristineTracked,'','a source-only audit may not start from modified consumer files');
for(const name of [
 'public/app.js','public/outfit-capture.js','public/outfit-board.js',
 'public/native-reviewed-private-save-167.mjs','public/outfit-board-engine.js'
]){
 const actual=git('rev-parse','HEAD:'+name),expected=git('rev-parse',M51+':'+name);
 assert.equal(actual,expected,'M53 parent must retain exact original M51 consumer '+name);
}
const summaries={};
const relevant=['public/app.js','public/outfit-capture.js',
 'public/outfit-board.js','public/outfit-instance-review-840.mjs',
 'public/index.html','public/auth.js','research/native-3d-05/'];
for(const [mission,donor] of Object.entries(DONORS)){
 git('cat-file','-e',donor+'^{commit}');
 const actualBase=git('merge-base',M51,donor);
 assert.equal(actualBase,expectedMergeBases[mission],
  'donor ancestry changed: investigate before inferring compatibility '+mission);
 const merge=spawnSync('git',['merge-tree','--write-tree',
  '--name-only','--no-messages',M51,donor],{
   encoding:'utf8',maxBuffer:16*1024*1024
  });
 assert.ok([0,1].includes(merge.status),
  mission+' merge computation errored: '+String(merge.stderr).slice(0,300));
 const lines=(merge.stdout||'').trim().split('\n').filter(Boolean);
 assert.ok(/^[a-f0-9]{40}$/.test(lines[0]),
  mission+' merge-tree did not give a real computed tree OID');
 const conflicts=lines.slice(1);
 assert.equal(new Set(conflicts).size,conflicts.length,
  'duplicate unresolved conflicted source path');
 for(const p of conflicts){
  assert.ok(!p.includes('..')&&!p.startsWith('/'),'invalid merge conflict path');
 }
 assert.equal(merge.status===0,conflicts.length===0,
  'Git merge result must agree with unresolved conflict list');
 const mainConsumerBlobs={};
 for(const p of ['public/app.js','public/outfit-capture.js','public/outfit-board.js']){
  const main=git('rev-parse',M51+':'+p);
  const donorVersion=spawnSync('git',['rev-parse',donor+':'+p],{encoding:'utf8'});
  if(donorVersion.status===0){
   const donorBlob=donorVersion.stdout.trim();
   mainConsumerBlobs[p]={
    sameExactSourceBlob:main===donorBlob,
    originalMainSourcePreserved:true,
    // Raw file sizes alone are NOT conflicts or proof of semantic compatibility.
    mainBlobSize:Number(git('cat-file','-s',main)),
    donorBlobSize:Number(git('cat-file','-s',donorBlob))
   };
  }else mainConsumerBlobs[p]={donorPathAbsent:true,originalMainSourcePreserved:true};
 }
 summaries[mission]={
  immutableHead:donor,originalMain:M51,mergeBase:actualBase,
  gitMergeTreeStatus:merge.status===0?'noTextualMergeConflicts':'UNRESOLVED_SOURCE_CONFLICTS',
  conflictCount:conflicts.length,conflictPaths:conflicts,
  consumerTouchpoints:conflicts.filter(p=>relevant.some(x=>p===x||p.startsWith(x))),
  mainConsumerBlobs,
  noMergePerformed:true,notAWorkingIntegratedApp:true,
  releaseAuthorized:false
 };
 console.log('MAIN53_GENUINE_MERGE_FEASIBILITY',JSON.stringify({
  mission,donor,conflicts:conflicts.length,consumerTouchpoints:summaries[mission].consumerTouchpoints,
  trueGitMergeTree:merge.status,noMerge:true,familyAlpha:'HOLD'
 }));
}
assert.equal(git('diff','--name-only'),'',
 'git merge-tree must not modify even one tracked consumer file');
assert.equal(git('rev-parse','HEAD').length,40);
const output={
 schema:'MAIN1054_M53_IMMUTABLE_CONSUMER_MERGE_TREE_READ_ONLY/v1',
 repository:REPO,mainVerifiedNativeAppHead:M51,
 donorResearchHeads:DONORS,comparisons:summaries,
 allDonorsVerifiedMerged:false,actualMergedAppAcceptance:false,
 productionUpdated:false,realOwnerJWTorRLSVerified:false,
 physical3DPhotorealisticClothAccepted:false,sourceDisjointHumanRecognitionVerified:false,
 noLiveConsumerSourceMutation:true,releaseAuthorized:false,
 familyAlpha:'HOLD'
};
const dst='benchmark/main53-source-merge-audit';
mkdirSync(dst,{recursive:true});
writeFileSync(dst+'/M53-READONLY-CONSUMER-CONFLICT-REPORT-NOT-RELEASE.json',
 JSON.stringify(output,null,2)+'\n');
console.log('MAIN53_READONLY_CONSUMER_CONFLICT_AUDIT_HOLD',
 JSON.stringify({missionCount:Object.keys(DONORS).length,
  conflictsByDonor:Object.fromEntries(Object.entries(summaries).map(([k,v])=>[k,v.conflictCount])),
  reportSha256:sha(JSON.stringify(output)),appChanged:false,familyAlpha:'HOLD'}));
