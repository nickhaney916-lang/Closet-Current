import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {packetFromLock,reconcile,LOCK} from './source-holdout-human-review.mjs';
const BASE='623eb4af070b6caece11247e79eb3494d8450f98';
const APP='0bde8c464dbda746d521a9a7b095d2d87e8bdbd2';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:20000000}).trim();
assert.equal(git('merge-base',BASE,'HEAD'),BASE);
assert.equal(git('rev-parse','HEAD:public/app.js'),APP,'Unreviewed app source');
const allowed=new Set(['public/app.js','tests/original-first-recognition.test.cjs',
 'tests/recognition-confirmation-reliability.test.cjs','scripts/test-recognition-confirmation-mobile.mjs',
 'scripts/check-recognition-confirmation-scope.mjs','.github/workflows/recognition-confirmation-qa.yml',
 'docs/RECOGNITION-CONFIRMATION-RELIABILITY-20261021.md','docs/PROGRESS-CHECKPOINT.md']);
for(const path of git('diff','--name-only',BASE,'HEAD').split('\n').filter(Boolean))
 assert.ok(allowed.has(path),'Unexpected model, evidence, account or runtime edit: '+path);
const before=execFileSync('git',['show',BASE+':public/app.js'],{encoding:'utf8',maxBuffer:20000000}),now=fs.readFileSync('public/app.js','utf8');
for(const [start,end] of [['function recognitionSourcePhoto(','function clothingFields('],
 ['function snap(','function beep(']]){
 const a=before.indexOf(start),b=before.indexOf(end,a);
 if(start.includes('captureCameraStill')&&a<0)continue;
 assert.ok(a>=0&&b>a,'Missing preservation boundary '+start);
 assert.equal(now.slice(now.indexOf(start),now.indexOf(end,now.indexOf(start))),before.slice(a,b),start+' changed');
}
const prior=execFileSync('git',['show',BASE+':docs/PROGRESS-CHECKPOINT.md'],{encoding:'utf8'});
assert.ok(fs.readFileSync('docs/PROGRESS-CHECKPOINT.md','utf8').endsWith(prior));
const review=reconcile(packetFromLock(fs.readFileSync(LOCK)),[]);
assert.equal(review.approvedModelAccuracy,null);assert.equal(review.productionPromotion,'BLOCKED');
console.log(JSON.stringify({scope:'RECOGNITION_CONFIRMATION_AND_OWNER_QUEUE',app:APP,modelUnchanged:true,
 originalSourceUnchanged:true,reviewEvidenceUnchanged:true,humanAccuracy:null,physicalPhoneValidated:false,merged:false,deployed:false}));
