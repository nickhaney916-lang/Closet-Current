import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {packetFromLock,reconcile,LOCK} from './source-holdout-human-review.mjs';
// This branch is NOT a release. Pin every independently verified proof-of-work
// branch in the merge history, and the exact 3 deliberately resolved source files.
const ancestors={
 'PR126 human-confirmed recognition':'5aa60d5e0d4be1e36bf694971385a6e3c340d120',
 'PR128 native camera import integration':'ca72cb571f8076fc0910c9707b38eff8364a5052',
 'PR130 onboarding and auth':'42ee4f29ae32130c23f03270cefaa6dd692a2880',
 'PR132 owned styling and save recovery':'53083b39ba6e26a6d2e16c530d92edd732aded1a',
 'PR134 wardrobe backup':'f387eb621c80ce8fa2200959972c260e7fb84a19',
 'PR137 storage safety':'eac7deaad84d558436807ef190d748e57c761292',
 'PR139 atomic PWA':'38a365df28663586dc12ba7e1b460e934c2758ec'
};
const git=(...a)=>execFileSync('git',a,{encoding:'utf8',maxBuffer:20000000}).trim();
for(const [label,sha] of Object.entries(ancestors)){
 execFileSync('git',['merge-base','--is-ancestor',sha,'HEAD']);
 assert.ok(git('rev-parse','HEAD').length===40,'Git provenance invalid: '+label);
}
const pinned={
 'public/app.js':'fafa9b27b2325fd4c89be64af188e265ff2cd700',
 'public/index.html':'c8c8910a7283c06f2b925248f41bf289a7711aaa',
 'public/photo-import.js':'f4eb21d3ca8d9dea13915caf59e534e2b8f7cde4',
 'public/sw.js':'708907d2688242f7eb80eb363f85b437ab2bd712',
 'public/wardrobe-backup-engine.js':'7ad27f2732bc9da6fff5d6289c9dcd40f898c30b',
 'public/wardrobe-backup.js':'e95ca5ae45a76ba0feef3baebb124d1f285daa81',
 'public/cloud-backup-bridge.js':'1fdbc7994021f308d7fa597f398d9bd54be16290'
};
for(const [path,sha]of Object.entries(pinned))
 assert.equal(git('rev-parse','HEAD:'+path),sha,
  'Previously reconciled full-source contract changed: '+path);
const app=readFileSync('public/app.js','utf8');
const html=readFileSync('public/index.html','utf8');
const source=readFileSync('public/photo-import.js','utf8');
for(const x of [
 "function queued(work){","function draftMetadataSnapshot(value)",
 "$('retryDraftSave').onclick","recognitionReviewRequired=true",
 'Account-bound file backup and atomic restore',
 "if(!isCurrent()){cancelled=true;break;}"
])assert.ok(app.includes(x)||source.includes(x),'Required integrated safety guard not present: '+x);
for(const x of [
 'id="authHelp"','aria-labelledby="boardPickerTitle"',
 'wardrobe-backup.js','wardrobe-backup-engine.js',
 'id="backupStatus"','id="draftSaveStatus"','id="retryDraftSave"',
 'aria-label="Choose a category for unfinished photos"'
])assert.ok(html.includes(x),'Required integrated accessible user workflow is absent: '+x);
const human=reconcile(packetFromLock(readFileSync(LOCK)),[]);
assert.equal(human.suppliedSubmissions,0);
assert.equal(human.approvedModelAccuracy,null);
assert.equal(human.productionPromotion,'BLOCKED');
for(const path of ['supabase/cloud-backup.sql','benchmark/independent-source-holdout/locked.json',
 'public/recognition-engine.mjs','public/recognition-photo.mjs',
 '.github/workflows/pages.yml','.github/workflows/cloudflare-pages.yml'])
 assert.equal(git('rev-parse','HEAD:'+path),
 git('rev-parse','38a365df28663586dc12ba7e1b460e934c2758ec:'+path),
 'Sensitive source changed without authorized review: '+path);
console.log(JSON.stringify({status:'INTEGRATION_SOURCE_PINNED',sourceBranches:Object.keys(ancestors),
 fullFrameRecognitionBeforeMaskPreserved:true,accountSwitchGuardsPreserved:true,
 customerBackupPreserved:true,atomicPWAReleasePreserved:true,
 realPhoneTests:0,approvedRecognitionAccuracy:null,productionPromotion:'BLOCKED',
 userApprovalForMergeOrDeployment:false}));
