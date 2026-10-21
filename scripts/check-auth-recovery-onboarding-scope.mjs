import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const BASE='df6dfa071838c054ac8f3f26a64985252e1050e0';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:20000000}).trim();
assert.equal(git('merge-base',BASE,'HEAD'),BASE);
const allowed=new Set(['public/auth.js','public/index.html','public/style.css',
 'tests/auth-recovery-onboarding.test.cjs','scripts/test-auth-recovery-onboarding-mobile.mjs',
 'scripts/check-auth-recovery-onboarding-scope.mjs','.github/workflows/auth-recovery-onboarding-qa.yml',
 'docs/AUTH-RECOVERY-ONBOARDING-AUDIT-20261021.md','docs/PROGRESS-CHECKPOINT.md']);
for(const p of git('diff','--name-only',BASE,'HEAD').split('\n').filter(Boolean))
 assert.ok(allowed.has(p),'Unrelated app/cloud/model/evidence/deletion change: '+p);
for(const [p,sha] of Object.entries({'public/auth.js':'36f20c3c1cd27f99adcb69bcbc0a6f94843a66b1',
 'public/index.html':'205a5ec5552d1d6e5a603dfc19ebacf7ed7a875e','public/style.css':'69a74f21a5bd2c05e9179923a7f3f3f98ad1e0b0'}))
 assert.equal(git('rev-parse','HEAD:'+p),sha,'Unreviewed auth/UI bytes: '+p);
const oldIndex=execFileSync('git',['show',BASE+':public/index.html'],{encoding:'utf8'});
assert.equal(fs.readFileSync('public/index.html','utf8'),oldIndex.replace('<details class="login-help">','<details id="authHelp" class="login-help">')
 .replace('type="button">Resend email</button>','type="button">Resend confirmation email</button>'));
const oldStyle=execFileSync('git',['show',BASE+':public/style.css'],{encoding:'utf8'});
assert.ok(fs.readFileSync('public/style.css','utf8').startsWith(oldStyle),'Existing layout rewritten');
for(const p of ['public/app.js','public/outfit-board.js','public/cloud-backup.js','public/recognition-engine.mjs',
 'public/recognition-photo.mjs','public/photo-import.js','public/pilot-data-notice.html',
 'scripts/offline-private-phone-coordinator.mjs','supabase/functions/account-delete/index.ts',
 'supabase/functions/account-delete/deletion-coordinator.mjs','supabase/functions/account-delete/supabase-adapters.mjs',
 'supabase/cloud-backup.sql','benchmark/independent-source-holdout/locked.json'])
 assert.equal(git('rev-parse','HEAD:'+p),git('rev-parse',BASE+':'+p),'Frozen trend/customer/deletion/evidence edited: '+p);
const previous=execFileSync('git',['show',BASE+':docs/PROGRESS-CHECKPOINT.md'],{encoding:'utf8'});
assert.ok(fs.readFileSync('docs/PROGRESS-CHECKPOINT.md','utf8').endsWith(previous));
console.log(JSON.stringify({scope:'AUTH_RECOVERY_AND_SCOPED_MOBILE_ONBOARDING',base:BASE,trend129Preserved:true,
 hostedSettingsChanged:false,deletionEnabled:false,modelsEvidenceUnchanged:true,liveEmailsVerified:false,
 physicalPhoneTested:false,merged:false,deployed:false}));
