import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {decideLegacyRun176,LEGACY_KINDS_176}
 from '../scripts/legacy-scope-applicability-176.mjs';
const stacked=['research/native-3d-05/native-preview-bridge.mjs',
 'scripts/test-native-3d-05-browser.mjs',
 'research/native-original-dress-drape-175/admission.mjs',
 'research/source-shoulder-seam-174/seam-ease.mjs',
 '.github/workflows/native-index-live-07-no-deploy.yml',
 '.github/workflows/native-restore-3d-06-no-deploy.yml',
 '.github/workflows/native-photo-readiness-08-no-deploy.yml',
 '.github/workflows/cross-stream-integration-176-no-deploy.yml',
 'scripts/legacy-scope-applicability-176.mjs',
 'tests/cross-stream-applicability-176.test.mjs'];
test('P176 all three immutable narrow older legacy checks do NOT misclassify stacked P173-P176 source bridges',()=>{
 for(const kind of LEGACY_KINDS_176){
  const r=decideLegacyRun176(kind,stacked);
  assert.equal(r.run,false,kind+' legacy original SHA pin not applicable to stacked current main');
  assert.equal(r.reason,'stacked-research-bridge-changes-tested-by-current-cross-stream-integration');
 }
});
test('P176 original legacy index gate still runs when actual original capture/index files change',()=>{
 for(const path of ['public/app.js','research/native-consumer-board-04/consumer-board-controller.mjs',
  'research/native-index-live-07/contract.mjs','scripts/test-native-index-live-07-browser.mjs']){
  const r=decideLegacyRun176('index',[...stacked,path]);
  assert.equal(r.run,true,path);assert.deepEqual(r.relevantFiles,[path]);
 }
});
test('P176 original restore gate still runs for owner photos, cloud rollback, and atomic recovery file changes',()=>{
 for(const path of ['public/outfit-board.js','public/cloud-backup-bridge.js',
  'public/cloud-backup.js','research/restore-atomic-01/native-restore-bridge.mjs',
  'research/native-restore-3d-06/fail-closed.mjs',
  'scripts/test-native-restore-3d-06-browser.mjs']){
  const r=decideLegacyRun176('restore',[...stacked,path]);
  assert.equal(r.run,true,path);
 }
});
test('P176 original photo-readiness gate still runs for actual signed owner photo readiness classifier or photo UX changes',()=>{
 for(const path of ['public/outfit-board.js','research/native-photo-readiness-08/contract.mjs',
 'research/user-photo-3d-01/photo-readiness.mjs',
 'scripts/test-user-photo-3d-01-browser.mjs','scripts/audit-native-photo-readiness-08.mjs']){
  assert.equal(decideLegacyRun176('readiness',[...stacked,path]).run,true,path);
 }
});
test('P176 manual on-demand historic benchmark never skipped even on empty files',()=>{
 for(const kind of LEGACY_KINDS_176)
  assert.equal(decideLegacyRun176(kind,[],{event:'workflow_dispatch'}).run,true);
});
test('P176 unfamiliar, malicious or missing GitHub PR input fails closed',()=>{
 for(const kind of ['other',''])
  assert.throws(()=>decideLegacyRun176(kind,[]),/Unknown/);
 for(const value of [null,undefined,{},['../../secrets'],['/tmp/evil'],['.\\\\git'],['abc\0def']])
  assert.throws(()=>decideLegacyRun176('index',value),/safely/);
 assert.throws(()=>decideLegacyRun176('index',[],{event:'push'}),/safely/);
});
test('P176 always retains old blocked file lists, original SHA pins, signed source boundaries and no-deploy jobs',()=>{
 for(const [name,sha,blocked,label] of [
  ['native-index-live-07-no-deploy.yml','e060d033b1a05f1d8a990c0ae1b6864cb5d7fd72','public/auth.js','index'],
  ['native-restore-3d-06-no-deploy.yml','56c9a814d6ecce5beae5d95043213faa2d8bb6f0','public/auth.js','restore'],
  ['native-photo-readiness-08-no-deploy.yml','21189b56d9f9f6ce57ad9dc795b9fe222544862e','public/auth.js','readiness']
 ]){
  const yaml=readFileSync('.github/workflows/'+name,'utf8');
  assert.ok(yaml.includes(sha),name+' historic source pin altered');
  assert.ok(yaml.includes(blocked),name+' original privacy rejection removed');
  assert.ok(yaml.includes('legacy-delta-scope:'),name+' scoped relevance omitted');
  assert.ok(yaml.includes('node scripts/legacy-scope-applicability-176.mjs --ci '+label),
   name+' original actual-feature scope not enforced');
  assert.ok(yaml.includes("needs.legacy-delta-scope.outputs.run_legacy == 'true'"),
   name+' old broad history diff not scoped');
  assert.ok(yaml.includes('if: always()'),name+' must retain evidence artifact upon test failure');
  assert.ok(yaml.includes('Family Alpha hold')||yaml.includes('familyAlpha'),name+' safe original acceptance removed');
 }
});
test('P176 all actual consumer 3D index/restore/readiness scripts and SHA audit scripts remain unchanged from original P175',()=>{
 const workflow=readFileSync('.github/workflows/cross-stream-integration-176-no-deploy.yml','utf8');
 for(const name of ['test-native-index-live-07-browser.mjs','audit-native-index-live-07.mjs',
  'test-native-restore-3d-06-browser.mjs','audit-native-restore-3d-06.mjs',
  'test-native-photo-readiness-08-browser.mjs','audit-native-photo-readiness-08.mjs',
  'test-user-photo-3d-01-browser.mjs','audit-user-photo-3d-01.mjs',
  'test-native-3d-05-browser.mjs','audit-native-3d-05.mjs'])
  assert.ok(workflow.includes(name),'actual browser workflow missing '+name);
 assert.ok(workflow.includes('ed37811efd44c9920c5c67bc743e34911a57b578'),
 'exact P175 source no deploy ancestry required');
 assert.ok(workflow.includes('df6885d6011cb33fb22dceb81a08f35a0ac4dd61'),
 'pinned real 163-bone P541 donor required');
 assert.ok(workflow.includes('realSignedRLS'), 'synthetic owner fixture must remain labeled');
});
