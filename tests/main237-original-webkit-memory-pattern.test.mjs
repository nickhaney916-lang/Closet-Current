import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

const script='scripts/test-main237-original-webkit-mem-pattern-browser.mjs';
function audit(mode,extra={}){
 const p=spawnSync(process.execPath,[script],{
  env:{...process.env,M237_STATIC_AUDIT_ONLY:'1',
   M237_SESSION_MODE:mode,M58_ENGINE:'webkit',P94_WIDTH:'430',...extra},
  encoding:'utf8',timeout:30000
 });
 return {status:p.status,error:p.error,lines:p.stdout.split(/\r?\n/),
   stdout:p.stdout,stderr:p.stderr};
}
function extract(mode){
 const x=audit(mode);
 assert.equal(x.error,undefined);
 assert.equal(x.status,0,'original source static verification failed: '+x.stderr);
 const entries=x.lines.filter(s=>s.startsWith('M237_EXACT_SOURCE_OPTION_AUDIT '));
 assert.equal(entries.length,1);
 return JSON.parse(entries[0].slice('M237_EXACT_SOURCE_OPTION_AUDIT '.length));
}
test('M237 original P101 model plus owner 2D/v4 source SHA locked',()=>{
 const p=extract('baseline');
 assert.equal(p.originalP101Blob,'ad8ab0eb33322a34f8cc3f45a1fe26feff87b2ab');
 assert.equal(p.originalP94WorkerBlob,'d66651b616de54c51eb7ef986324b30f1580888f');
 assert.equal(p.originalFullOwnerBrowserBlob,'4f75a40cf153fa4b4d139d782b202dbe7bc55e41');
 assert.equal(p.modelUnchanged,true);
 assert.equal(p.originalOwnerPrivacyAndV4AssertionsUnchanged,true);
 assert.equal(p.positiveCardAssertionUnchanged,true);
});
test('M237 pure baseline source is EXACT unchanged original, no injection',()=>{
 const p=extract('baseline');
 assert.equal(p.originalSourceSha256,p.experimentalFixtureSha256);
 assert.equal(p.modifiedSourceOnly,false);
 assert.equal(p.modifiedSetting,'none');
});
test('M237 experimental memory-pattern off is ONLY source-derived setting',()=>{
 const p=extract('mem_pattern_off');
 assert.equal(p.modifiedSourceOnly,true);
 assert.equal(p.modifiedSetting,'session_options.enableMemPattern=false');
 assert.notEqual(p.originalSourceSha256,p.experimentalFixtureSha256);
 assert.equal(p.modelUnchanged,true);
 assert.equal(p.weightsUnchanged,true);
});
test('M237 mutually exclusive knobs and source share exact parent',()=>{
 const a=extract('baseline'),b=extract('mem_pattern_off');
 assert.equal(a.originalSourceSha256,b.originalSourceSha256);
 assert.equal(a.originalP101Blob,b.originalP101Blob);
 assert.equal(a.originalP94WorkerBlob,b.originalP94WorkerBlob);
 assert.equal(a.originalFullOwnerBrowserBlob,b.originalFullOwnerBrowserBlob);
});
test('M237 rejects unapproved standalone arena-off and novel knobs',()=>{
 for(const v of ['arena_off','memory32','disable-graph','unknown']){
  const x=audit(v);assert.notEqual(x.status,0,v);
  assert.ok(!x.stdout.includes('M237_ORIGINAL_PINNED_NATIVE_TRUE_POSITIVE_PASS'));
 }
});
test('M237 rejects non-native engines and arbitrary viewports',()=>{
 assert.notEqual(audit('baseline',{M58_ENGINE:'mock-chromium'}).status,0);
 assert.notEqual(audit('mem_pattern_off',{P94_WIDTH:'768'}).status,0);
});
test('M237 no static mode can falsely mark real model acceptance',()=>{
 for(const m of ['baseline','mem_pattern_off']){
  const x=audit(m);
  assert.equal(x.status,0);
  assert.ok(!x.stdout.includes('M237_ORIGINAL_PINNED_NATIVE_TRUE_POSITIVE_PASS'));
 }
});
test('M237 never authorizes release by static source checks',()=>{
 for(const m of ['baseline','mem_pattern_off']){
  const x=extract(m);
  assert.equal(x.productionFixClaim,false);
  assert.equal(x.releaseAuthorized,false);
  assert.equal(x.familyAlpha,'HOLD');
 }
});
