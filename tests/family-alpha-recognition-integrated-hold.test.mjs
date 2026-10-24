import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {
 combineStageAndRecognitionMarkup,
 buildDisabledIntegratedCandidate,
 applyPinnedWorkerRecovery,WORKER_RECOVERY_REF,
 assertDisabledIntegratedCandidate,
 listedRecognitionAssets,OUTPUT
} from '../scripts/build-family-alpha-recognition-integrated-hold.mjs';
import {
 STAGING_REF,RECOGNITION_REF
} from '../scripts/audit-family-alpha-recognition-bridge.mjs';

const staged=execFileSync('git',['show',STAGING_REF+':public/index.html'],{encoding:'utf8'});
const modern=execFileSync('git',['show',RECOGNITION_REF+':public/index.html'],{encoding:'utf8'});
test('modern recognition UI plus original-JPEG reviewed avatar are both present in held HTML',()=>{
 const result=combineStageAndRecognitionMarkup(modern,staged);
 assert.equal(result.split('id="familyAlphaLocalPreview"').length,2);
 assert.equal(result.split('id="familyAlphaPreviewStart"').length,2);
 assert.equal(result.split('id="reusableFigureStage"').length,2);
 assert.equal(result.split('src="family-alpha-preview-boot.js"').length,2);
 assert.equal(result.split('src="alpha-stage-config.js"').length,2);
 assert.ok(result.indexOf('src="alpha-stage-config.js"')<result.indexOf('src="auth.js"'));
 assert.ok(result.indexOf('family-alpha-preview-boot.js')>result.indexOf('cloud-backup-bridge.js'));
 assert.ok(result.includes('id="authGate"'));
 assert.ok(result.includes('id="appShell"'));
});
test('HTML merge fails closed for repeated or unexpectedly changed boot, preview or Auth script',()=>{
 for(const input of [modern.replace('<script src="auth.js"></script>',''),
  modern+modern.slice(modern.indexOf('<script src="auth.js"></script>'),modern.indexOf('<script src="auth.js"></script>')+31),
  modern.replace('<aside class="board-context">',''),
  modern.replace('</body>','<script src="family-alpha-preview-boot.js"></script></body>')]){
  assert.throws(()=>combineStageAndRecognitionMarkup(input,staged));
 }
});
test('staged exact source must supply the original confirmed photo and stage-only preview form',()=>{
 const without=staged.replace('id="familyAlphaPreviewReview"','id="otherElement"');
 assert.throws(()=>combineStageAndRecognitionMarkup(modern,without),/reviewed-original/);
});
test('source model and UI feature overlay is pinned, not a moving recognition branch',()=>{
 const list=listedRecognitionAssets();
 assert.ok(list.length>=55);
 assert.ok(list.includes('public/recognition-engine.mjs'));
 assert.ok(list.includes('public/local-worker.mjs'));
 assert.ok(list.includes('public/app.js'));
 assert.ok(list.includes('public/recognition-vectors.bin'));
});
test('built integration artifact remains Auth-HOLD, has modern source, stage avatar and protected cloud',async()=>{
 const x=await assertDisabledIntegratedCandidate();
 assert.equal(x.releaseGate,'HOLD');
 assert.equal(x.stageAuthBlocked,true);
 assert.equal(x.originalJPEGRecognitionFromPinnedModernSource,true);
 assert.equal(x.modernHumanColorProofRetained,true);
 assert.equal(x.stagedReviewed2DAvatarPresent,true);
 assert.equal(x.stagingProjectRef,'fbnplztkbsteuzrmbgib');
 assert.equal(x.customerDataRead,false);
 assert.equal(x.realPhotoAccuracyTested,false);
 assert.equal(x.cloudAuthorizationsTested,false);
 assert.equal(x.nativePhonesTested,false);
 assert.ok(x.recognitionOverlayFiles.length>=45);
});
test('staged production Auth/config must differ from raw recognition project',async()=>{
 const x=await assertDisabledIntegratedCandidate();
 const auth=await readFile(join(OUTPUT,'auth.js'),'utf8');
 const cloud=await readFile(join(OUTPUT,'cloud-backup.js'),'utf8');
 const modernAuth=execFileSync('git',['show',RECOGNITION_REF+':public/auth.js'],{encoding:'utf8'});
 assert.notEqual(auth,modernAuth);
 assert.ok(modernAuth.includes('hlkgymugtfbirlpunsra'));
 assert.ok(auth.includes('fbnplztkbsteuzrmbgib'));
 assert.ok(cloud.includes('fbnplztkbsteuzrmbgib'));
 assert.ok(!auth.includes('hlkgymugtfbirlpunsra'));
 assert.ok(!cloud.includes('hlkgymugtfbirlpunsra'));
 assert.ok(x.stagePrivateAuthTransformationPreserved);
});
test('compiled modern app bytes match EXACT locked recognition head',async()=>{
 const app=await readFile(join(OUTPUT,'app.js'),'utf8');
 const original=execFileSync('git',['show',RECOGNITION_REF+':public/app.js'],{encoding:'utf8'});
 const recovery=execFileSync('git',['show',WORKER_RECOVERY_REF+':public/app.js'],{encoding:'utf8'});
 assert.equal(app,applyPinnedWorkerRecovery(original,recovery));
 assert.ok(app.includes('worker_response_invalid'));
 assert.ok(app.includes("const recoverable=job.type!=='load'&&data.code==='image';"));
 const worker=await readFile(join(OUTPUT,'local-worker.mjs'));
 const modernWorker=execFileSync('git',['show',RECOGNITION_REF+':public/local-worker.mjs']);
 assert.ok(worker.equals(modernWorker));
});
test('integrated candidate cannot be promoted to release with falsified HOLD metadata',async()=>{
 const path=join(OUTPUT,'alpha-recognition-integration-hold-manifest.json');
 const original=await readFile(path,'utf8'),obj=JSON.parse(original);
 try{
  obj.releaseGate='READY';
  await writeFile(path,JSON.stringify(obj));
  await assert.rejects(()=>assertDisabledIntegratedCandidate(),/Unsupported integrated candidate release claim/);
 }finally{await writeFile(path,original);}
});
