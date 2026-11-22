import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assessJitOptionDump as check} from '../research/main1054/m1590-pinned-jsc-options.mjs';
test('source-bound JSC baseline and OMG-off options are only configuration receipts',()=>{
 for(const [omg,expected] of [['true','true'],['false','false']]){
  const r=check('All JSC options:\n useBBQJIT=true\n useOMGJIT='+omg+'\n');
  assert.equal(r.observed,true);assert.equal(r.bbq,'true');assert.equal(r.omg,expected);
  assert.equal(r.actualTierProven,false);assert.equal(r.nativeTrapPc,null);
  assert.equal(r.causalFixProven,false);assert.equal(r.releaseAllowed,false);
 }
});
test('missing, duplicate, wrong-class and forged parser inputs fail closed',()=>{
 for(const s of ['',null,'useBBQJIT=true\nuseOMGJIT=false',
  'Modified JSC options:\nuseBBQJIT=true\nuseOMGJIT=false',
  'All JSC options:\nuseBBQJIT=true\nuseOMGJIT=false\nuseOMGJIT=true',
  'All JSC options:\nuseBBQJIT=true\nuseOMGJIT=secret',
  'All JSC options:\nuseBBQJIT=true\nuseOMGJIT=false\n'+'x'.repeat(512001)]){
  const r=check(s);assert.equal(r.observed,false);assert.equal(r.nativeTrapPc,null);
  assert.equal(r.familyAlpha,'HOLD');assert.ok(!JSON.stringify(r).includes('secret'));
 }
});
test('genuine pinned P94 source is preserved and new JIT arm cannot claim repair',()=>{
 const script=readFileSync('research/main1054/m1585-original-p94-standalone-webkit.mjs','utf8');
 assert.match(script,/jscEnv.JSC_useOMGJIT='false'/);
 assert.match(script,/assessJitOptionDump\(jscOptionDump\)/);
 assert.match(script,/jscActualTierProven:false/);
 assert.match(script,/if\(receipt.workerTerminal==='error'\)/);
 assert.match(script,/nativeTrapPc:null,wasmFileOffset:null,originalCxxStatement:null/);
 const flow=readFileSync('.github/workflows/main1054-m1590-original-webkit-omg-tier-HOLD.yml','utf8');
 assert.match(flow,/compiler: \[baseline, no-omg\]/);
 assert.match(flow,/profile: \[instrumented, no-js-proxy\]/);
 assert.match(flow,/ordinal: \[1, 2, 3, 4\]/);
});
