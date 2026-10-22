import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {blankTrial,validateTrial,trialPlatformProgress,nextUnfinishedTrialSlot,slots} from '../scripts/linked-phone-garment-evidence.mjs';
import {linkedPhoneHTML} from '../scripts/build-linked-phone-evidence.mjs';
const complete=(row)=>Object.assign(row,{phase:'recorded',truthCategory:'top',truthColor:'blue',
 modelCategory:'top',modelColor:'blue',savedCategory:'top',savedColor:'blue',savedPhoto:'clear'});
test('both phone progress counts required scenes and four garments from one whole-outfit source',()=>{
 const trial=blankTrial();
 let p=trialPlatformProgress(trial);
 assert.deepEqual(p.map(x=>[x.platform,x.total,x.recorded,x.originalScenes]),[['Android',15,0,0],['iPhone',15,0,0]]);
 assert.ok(p.every(x=>x.physicallyVerified===false&&x.independentAccuracyVerified===false));
 const whole=trial.rows.filter(x=>x.id.startsWith('Android/whole-outfit/'));
 for(let i=0;i<3;i++)complete(whole[i]);
 p=trialPlatformProgress(trial);
 assert.equal(p[0].recorded,3);assert.equal(p[0].originalScenes,0);
 complete(whole[3]);p=trialPlatformProgress(trial);
 assert.equal(p[0].recorded,4);assert.equal(p[0].originalScenes,1);
 assert.equal(p[1].recorded,0);assert.equal(p[1].originalScenes,0);
});
test('next unfinished stays on one phone, wraps around and prioritizes locked but not recorded rows',()=>{
 const trial=blankTrial();
 assert.equal(nextUnfinishedTrialSlot(trial,'Android'),'Android/sneakers/1');
 assert.equal(nextUnfinishedTrialSlot(trial,'iPhone'),'iPhone/sneakers/1');
 complete(trial.rows[0]);assert.equal(nextUnfinishedTrialSlot(trial,'Android','Android/sneakers/1'),'Android/boots/1');
 trial.rows[1].phase='locked';trial.rows[1].truthCategory='boots';trial.rows[1].truthColor='brown';
 assert.equal(nextUnfinishedTrialSlot(trial,'Android','Android/sneakers/1'),'Android/boots/1');
 for(const row of trial.rows.filter(x=>x.id.startsWith('Android/')))if(row.id!=='Android/boots/1')complete(row);
 assert.equal(nextUnfinishedTrialSlot(trial,'Android','Android/whole-outfit/4'),'Android/boots/1');
 assert.equal(nextUnfinishedTrialSlot(trial,'Android','Android/boots/1'),'Android/boots/1');
 complete(trial.rows[1]);assert.equal(nextUnfinishedTrialSlot(trial,'Android','Android/boots/1'),null);
 assert.equal(trialPlatformProgress(trial)[1].unlabeled,15);
 assert.ok(slots.length===30);
});
test('invalid unknown platform/row, forged phone verified flags or extra private identifiers are rejected',()=>{
 const trial=blankTrial();
 assert.throws(()=>nextUnfinishedTrialSlot(trial,'iPad'));
 assert.throws(()=>nextUnfinishedTrialSlot(trial,'Android','iPhone/sneakers/1'));
 const bad=blankTrial();bad.claims.physicalHardwareVerified=true;
 assert.throws(()=>trialPlatformProgress(bad));
 const privateRow=blankTrial();privateRow.rows[0].originalPhoto='secret.jpg';
 assert.throws(()=>nextUnfinishedTrialSlot(privateRow,'Android'));
});
test('guided offline single file contains explicit backup/resume and zero network operations',()=>{
 const html=linkedPhoneHTML(),script=html.match(/<script>([\s\S]*)<\/script>/)?.[1];
 assert.ok(script);new vm.Script(script);
 for(const text of ['Next unfinished garment on this phone','Record garment and next unfinished',
  'nothing saves automatically','import that file','trialPlatformProgress','nextUnfinishedTrialSlot',
  'Verified actual phones: ZERO','Release BLOCKED'])assert.ok(html.toLowerCase().includes(text.toLowerCase()),text);
 assert.match(html,/connect-src &#39;none&#39;/);
 assert.doesNotMatch(html,/<script[^>]+src=|<img[^>]+src=|fetch\(|localStorage|sessionStorage/);
});
