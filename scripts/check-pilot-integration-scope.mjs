import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:20000000}).trim();
const BASE='46f9c521466976b4ec238d24b1eb1d7871e3bffb';
const IMPORT='5bc60e05dea12d62b97bbcdaf55b4999a3ba695a';
const CAMERA='623eb4af070b6caece11247e79eb3494d8450f98';
const COMMON='61e4a87672ec603e29d9f10763d25d803ecbb801';
const RECOGNITION='5aa60d5e0d4be1e36bf694971385a6e3c340d120';
assert.equal(git('merge-base',BASE,'HEAD'),BASE);
assert.equal(git('merge-base',IMPORT,BASE),COMMON,'Unexpected branch dependency');
assert.equal(git('merge-base',RECOGNITION,'HEAD'),CAMERA,'Do not integrate independent recognition assignment');
const imported=['public/photo-import.js','tests/photo-import-untyped-and-timeout.test.cjs',
 'scripts/test-import-detail-budget-browsers.mjs','docs/IMPORTED-PHOTO-DETAIL-FIRST-20261021.md'];
const added=['scripts/check-pilot-integration-scope.mjs','scripts/test-integrated-pilot-journeys-mobile.mjs',
 '.github/workflows/pilot-integration-qa.yml','docs/PILOT-INTEGRATION-AUDIT-20261021.md'];
const allowed=new Set([...imported,...added,'docs/PROGRESS-CHECKPOINT.md']);
for(const p of git('diff','--name-only',BASE,'HEAD').split('\n').filter(Boolean))
 assert.ok(allowed.has(p),'Unverified customer/recognition/evidence edit: '+p);
for(const p of imported){
 assert.equal(git('rev-parse','HEAD:'+p),git('rev-parse',IMPORT+':'+p),'Transplant differs from verified PR124: '+p);
 assert.equal(fs.readFileSync(p,'utf8'),execFileSync('git',['show',IMPORT+':'+p],{encoding:'utf8'}),'Working copy differs: '+p);
}
for(const p of added)assert.throws(()=>execFileSync('git',['cat-file','-e',BASE+':'+p],{stdio:'pipe'}));
for(const p of ['public/app.js','public/auth.js','public/cloud-backup.js','public/closet-stylist.js',
 'public/outfit-board.js','public/recognition-engine.mjs','public/recognition-photo.mjs',
 'scripts/offline-private-phone-coordinator.mjs','benchmark/independent-source-holdout/locked.json',
 'supabase/cloud-backup.sql'])
 assert.equal(git('rev-parse','HEAD:'+p),git('rev-parse',BASE+':'+p),'Protected existing source edited: '+p);
const prior=execFileSync('git',['show',BASE+':docs/PROGRESS-CHECKPOINT.md'],{encoding:'utf8'});
assert.ok(fs.readFileSync('docs/PROGRESS-CHECKPOINT.md','utf8').endsWith(prior),'Historical checkpoint rewritten');
console.log(JSON.stringify({state:'INTEGRATED_DRAFT_ONLY',base:BASE,camera:CAMERA,import:IMPORT,
 exactImportedFiles:imported.length,recognition126Excluded:true,otherCustomerAndHumanFilesUnchanged:true,
 physicalPhoneValidated:false,productionReleaseApproved:false,merged:false,deployed:false}));
