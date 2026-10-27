import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assess,gates} from '../scripts/check-family-alpha-27.mjs';
const report=()=>({environment:'staging',gates:gates.map(id=>({id,status:'PASS',evidence:'operator private record reference',build:'synthetic-test-sha',testedAt:'2026-10-26',method:['android','iphone'].includes(id)?'physical-device':'live-staging'}))});
test('complete evidence only permits review, never deployment',()=>assert.equal(assess(report()).decision,'READY FOR MAIN-THREAD REVIEW'));
test('each missing, failed or untested gate blocks',()=>{for(const id of gates)for(const status of ['FAIL','NOT TESTED',undefined]){const r=report();r.gates.find(x=>x.id===id).status=status;assert.equal(assess(r).decision,'HOLD');}});
test('synthetic and emulated phones cannot certify physical checks',()=>{for(const id of ['android','iphone','adult-isolation','four-accounts','cloud-restore','access']){const r=report();r.gates.find(x=>x.id===id).method='synthetic';assert.equal(assess(r).decision,'HOLD');}});
test('evidence, build, date and staging are mandatory',()=>{for(const key of ['evidence','build','testedAt']){const r=report();r.gates[0][key]='';assert.equal(assess(r).decision,'HOLD');}const r=report();r.environment='production';assert.equal(assess(r).decision,'HOLD');});
test('duplicate and unknown gates rejected',()=>{const r=report();r.gates.push({...r.gates[0]});assert.equal(assess(r).decision,'HOLD');r.gates.push({id:'invented'});assert.equal(assess(r).decision,'HOLD');});
