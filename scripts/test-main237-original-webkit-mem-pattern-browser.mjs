/**
 * M237: Source-locked, original P101-model native acceptance A/B of ONNX
 * session memory pattern planner. Only disposable local research copy edited.
 * No user data, model, original worker, CI, or release code modification.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';

const P101='scripts/test-parallel101-real-p94-model-init-stage-browser.mjs';
const ORIGINAL_P101='ad8ab0eb33322a34f8cc3f45a1fe26feff87b2ab';
const ORIGINAL_WORKER='d66651b616de54c51eb7ef986324b30f1580888f';
const ORIGINAL_BROWSER='4f75a40cf153fa4b4d139d782b202dbe7bc55e41';
const gitBlob=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
const mode=process.env.M237_SESSION_MODE||'baseline';
const engine=process.env.M58_ENGINE||'webkit';
const width=String(process.env.P94_WIDTH||'430');
assert.ok(['baseline','mem_pattern_off'].includes(mode),'Only single-variable M237 original session comparison');
assert.ok(['webkit','chromium'].includes(engine),'Only actual installed engines');
assert.ok(['320','390','430'].includes(width),'Only proven native mobile viewport sizes');

const original=await readFile(P101,'utf8');
assert.equal(gitBlob(Buffer.from(original,'utf8')),ORIGINAL_P101,'P101 inherited source changed');
assert.equal(gitBlob(await readFile('public/outfit-worker-p94.mjs')),ORIGINAL_WORKER,
 'Real P94 worker must remain completely unmodified');
assert.equal(gitBlob(await readFile('scripts/test-parallel94-native-p88-browser.mjs')),
 ORIGINAL_BROWSER,'Original full owner/private 2D/v4 browser assertion changed');
const allow="assert.ok(['baseline','arena_off'].includes(sessionMode),'P101 only documented CPU memory arena A/B modes');";
const upgradedAllow="assert.ok(['baseline','arena_off','mem_pattern_off'].includes(sessionMode),'P101/M237 documented session option A/B modes');";
const session="...(p101SessionMode==='arena_off'?{session_options:{enableCpuMemArena:false}}:{})";
const memPattern="...(p101SessionMode==='mem_pattern_off'?{session_options:{enableMemPattern:false}}:p101SessionMode==='arena_off'?{session_options:{enableCpuMemArena:false}}:{})";
assert.equal(original.split(allow).length,2,'P101 permitted session-mode branch changed');
assert.equal(original.split(session).length,2,'Original P94 from_pretrained session source changed');
assert.ok(original.includes('Genuine P88 browser worker did not produce a bounded actual model proposal'),
 'Original fail-closed original proposal assertion moved');
assert.ok(original.includes('const p101SessionMode='+ ',
 'Session mode no longer forwarded to disposable original Worker');
const derived=mode==='mem_pattern_off'?
 original.replace(allow,upgradedAllow).replace(session,memPattern):original;
assert.equal(derived.includes(memPattern),mode==='mem_pattern_off');
assert.equal(derived.includes(upgradedAllow),mode==='mem_pattern_off');
assert.equal(derived.includes(session),mode==='baseline');
const originalSHA=createHash('sha256').update(original).digest('hex');
const derivedSHA=createHash('sha256').update(derived).digest('hex');
const verified={
 mode,engine,width,originalP101Blob:ORIGINAL_P101,
 originalP94WorkerBlob:ORIGINAL_WORKER,originalFullOwnerBrowserBlob:ORIGINAL_BROWSER,
 originalSourceSha256:originalSHA,
 experimentalFixtureSha256:derivedSHA,
 modifiedSourceOnly:mode==='mem_pattern_off',
 modifiedSetting:mode==='mem_pattern_off'?'session_options.enableMemPattern=false':'none',
 modelUnchanged:true,weightsUnchanged:true,positiveCardAssertionUnchanged:true,
 originalOwnerPrivacyAndV4AssertionsUnchanged:true,productionFixClaim:false,
 releaseAuthorized:false,familyAlpha:'HOLD'
};
console.log('M237_EXACT_SOURCE_OPTION_AUDIT',JSON.stringify(verified));
if(process.env.M237_STATIC_AUDIT_ONLY==='1')process.exit(0);
const temp=resolve('scripts/.m237-original-model-memory-pattern-native.mjs');
try{
 await writeFile(temp,derived,{flag:'wx'});
 const check=spawnSync(process.execPath,['--check',temp],{encoding:'utf8',timeout:30000});
 if(check.error)throw check.error;
 assert.equal(check.status,0,'Original P101 derived browser source syntax error: '+check.stderr.slice(0,1000));
 const run=spawnSync(process.execPath,[temp],{
  env:{...process.env,P101_SESSION_MODE:mode,
   P101_CACHE_MODE:'baseline',P101_TEST_FAULT:'none',
   M58_ENGINE:engine,P94_WIDTH:width,
   M214_ATTEMPT:process.env.M214_ATTEMPT||'M237-'+engine+'-'+width+'-'+mode},
  stdio:'inherit',timeout:19*60*1000
 });
 if(run.error)throw run.error;
 assert.equal(run.status,0,'M237 true original pinned model/owner/browser journey failed; RETAIN RED');
 console.log('M237_ORIGINAL_PINNED_NATIVE_TRUE_POSITIVE_PASS',
  JSON.stringify({mode,engine,width,originalModel:true,
   memoryPatternOffRequested:mode==='mem_pattern_off',
   originalOwnerToPrivate2DV4:true,releaseAuthorized:false}));
}finally{
 await rm(temp,{force:true});
}
 + '{JSON.stringify(sessionMode)};'),
 'Session mode no longer forwarded to disposable original Worker');
const derived=mode==='mem_pattern_off'?
 original.replace(allow,upgradedAllow).replace(session,memPattern):original;
assert.equal(derived.includes(memPattern),mode==='mem_pattern_off');
assert.equal(derived.includes(upgradedAllow),mode==='mem_pattern_off');
assert.equal(derived.includes(session),mode==='baseline');
const originalSHA=createHash('sha256').update(original).digest('hex');
const derivedSHA=createHash('sha256').update(derived).digest('hex');
const verified={
 mode,engine,width,originalP101Blob:ORIGINAL_P101,
 originalP94WorkerBlob:ORIGINAL_WORKER,originalFullOwnerBrowserBlob:ORIGINAL_BROWSER,
 originalSourceSha256:originalSHA,
 experimentalFixtureSha256:derivedSHA,
 modifiedSourceOnly:mode==='mem_pattern_off',
 modifiedSetting:mode==='mem_pattern_off'?'session_options.enableMemPattern=false':'none',
 modelUnchanged:true,weightsUnchanged:true,positiveCardAssertionUnchanged:true,
 originalOwnerPrivacyAndV4AssertionsUnchanged:true,productionFixClaim:false,
 releaseAuthorized:false,familyAlpha:'HOLD'
};
console.log('M237_EXACT_SOURCE_OPTION_AUDIT',JSON.stringify(verified));
if(process.env.M237_STATIC_AUDIT_ONLY==='1')process.exit(0);
const temp=resolve('scripts/.m237-original-model-memory-pattern-native.mjs');
try{
 await writeFile(temp,derived,{flag:'wx'});
 const check=spawnSync(process.execPath,['--check',temp],{encoding:'utf8',timeout:30000});
 if(check.error)throw check.error;
 assert.equal(check.status,0,'Original P101 derived browser source syntax error: '+check.stderr.slice(0,1000));
 const run=spawnSync(process.execPath,[temp],{
  env:{...process.env,P101_SESSION_MODE:mode,
   P101_CACHE_MODE:'baseline',P101_TEST_FAULT:'none',
   M58_ENGINE:engine,P94_WIDTH:width,
   M214_ATTEMPT:process.env.M214_ATTEMPT||'M237-'+engine+'-'+width+'-'+mode},
  stdio:'inherit',timeout:19*60*1000
 });
 if(run.error)throw run.error;
 assert.equal(run.status,0,'M237 true original pinned model/owner/browser journey failed; RETAIN RED');
 console.log('M237_ORIGINAL_PINNED_NATIVE_TRUE_POSITIVE_PASS',
  JSON.stringify({mode,engine,width,originalModel:true,
   memoryPatternOffRequested:mode==='mem_pattern_off',
   originalOwnerToPrivate2DV4:true,releaseAuthorized:false}));
}finally{
 await rm(temp,{force:true});
}
