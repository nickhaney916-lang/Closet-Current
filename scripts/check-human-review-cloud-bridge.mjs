// Exact-blob bridge of two reviewed draft feature branches. Not a release gate approval.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {packetFromLock,reconcile,LOCK} from './source-holdout-human-review.mjs';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:15_000_000}).trim();
const CLOUD='f16fce2956688e576edde6ecfdc390d3f46158a3',HUMAN='218ac1ea98333e72b7ccc090a13a46f581015dc3',CUSTOMER='6ebcf6d9dcfd18611c3248242b62208eb9923385';
const originals={
  ".github/workflows/human-original-review-readiness.yml": "04acdb3cbf2a4a769a0656186cf92621dd7f6151",
  "docs/HUMAN-ORIGINAL-REVIEW-READINESS.md": "ba7c2ff8e25d4ee5db5612867ca2a4666add743d",
  "scripts/human-original-review-readiness.mjs": "d079cdafde4298c18f27afc3074eda5201a25265",
  "scripts/test-human-original-review-readiness.mjs": "e216538640ceeaf149e61ffa5d1e2c1e2b07b5d1",
  "tests/human-original-review-readiness.test.mjs": "5035b08879425d2ea3be3eb03aaccf484892eba5"
};
assert.equal(git('merge-base','HEAD',CLOUD),CLOUD,'Branch must descend from verified PR #118 cloud recovery');
assert.equal(git('merge-base',HUMAN,CUSTOMER),CUSTOMER,'Human readiness source must descend from PR #115');
const allowed=new Set([...Object.keys(originals),
 'scripts/check-blind-photo-cloud-integration.mjs',
 'scripts/verify-camera-cloud-integration.mjs',
 'scripts/check-human-review-cloud-bridge.mjs',
 '.github/workflows/integrated-cloud-human-review-qa.yml',
 'docs/INTEGRATED-CLOUD-HUMAN-REVIEW-20261020.md',
 'scripts/one-click-human-review.mjs',
 'tests/one-click-human-review.test.mjs',
 'scripts/test-one-click-human-review-browsers.mjs',
 '.github/workflows/one-click-human-review-qa.yml',
 'docs/ONE-CLICK-HUMAN-REVIEW-20261021.md',
 'scripts/check-one-click-review-source.mjs',
 'scripts/offline-review-coordinator.mjs',
 'tests/offline-review-coordinator.test.mjs',
 'scripts/test-offline-review-coordinator-browsers.mjs',
 'scripts/check-offline-review-coordinator-source.mjs',
 '.github/workflows/offline-review-coordinator-qa.yml',
 'docs/OFFLINE-TWO-REVIEWER-INTAKE-20261021.md',
 'docs/PROGRESS-CHECKPOINT.md']);
for(const path of Object.keys(originals)){
 assert.equal(git('rev-parse','HEAD:'+path),originals[path],'Altered reviewed readiness file: '+path);
 assert.equal(git('rev-parse',HUMAN+':'+path),originals[path],'Human source changed since review: '+path);
 assert.equal(git('ls-tree',CLOUD,'--',path),'','Human file already existed in cloud base: '+path);
}
const changed=git('diff','--name-only',CLOUD,'HEAD').split('\n').filter(Boolean);
for(const p of changed)assert.ok(allowed.has(p),'Unexpected combined-branch file: '+p);
for(const p of Object.keys(originals))assert.ok(changed.includes(p),'Missing original human readiness file: '+p);
for(const p of ['public/cloud-backup.js','public/app.js','public/auth.js','public/recognition-engine.mjs',
 'public/recognition-photo.mjs','public/photo-color.js','public/closet-stylist.js','public/outfit-board.js',
 'public/cloud-backup-engine.js','supabase/cloud-backup.sql'])
 assert.equal(git('rev-parse','HEAD:'+p),git('rev-parse',CLOUD+':'+p),'Reviewed customer runtime changed: '+p);
const old=execFileSync('git',['show',CLOUD+':docs/PROGRESS-CHECKPOINT.md'],{encoding:'utf8'});
assert.ok(fs.readFileSync('docs/PROGRESS-CHECKPOINT.md','utf8').endsWith(old),'Historic development checkpoint altered');
const packet=packetFromLock(fs.readFileSync(LOCK)),review=reconcile(packet,[]);
assert.equal(packet.photos.length,13);
assert.equal(review.suppliedSubmissions,0);
assert.equal(review.independentHumanGoldLabels,false);
assert.equal(review.approvedModelAccuracy,null);
assert.equal(review.productionPromotion,'BLOCKED');
console.log(JSON.stringify({status:'VERIFIED_ISOLATED_INTEGRATION',cloudBase:CLOUD,humanSource:HUMAN,
 exactHumanFiles:Object.keys(originals).length,originalPhotos:13,humanReviews:0,
 measurableHumanAccuracy:null,customerRuntimeUnchanged:true,productionPromotion:'BLOCKED',
 physicalPhoneValidated:false,merged:false,deployed:false,paidAI:false}));
