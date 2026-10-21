import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import engine from '../public/device-check-engine.js';
import {comparePrivatePhonePilotReports} from '../benchmark/review-phone-pilot-reports.mjs';
import {privatePhonePilotHTML,writePrivatePhonePilotCoordinator} from '../scripts/offline-private-phone-coordinator.mjs';
const {deviceCheckSteps,deviceCheckReport}=engine;
test('offline pilot coordinator embeds exactly authoritative source and all 17 fixed phone checks',()=>{
 const page=privatePhonePilotHTML();
 assert.ok(page.startsWith('<!doctype html>'));
 assert.ok(page.includes('function comparePrivatePhonePilotReports('));
 assert.equal(page.includes('__COMPARE_AND_UI__'),false);
 assert.ok(page.includes('independentPhysicalDevicesConfirmed:false'));
 for(const [id] of deviceCheckSteps)assert.ok(page.includes('"'+id+'"'),'Missing fixed device checklist '+id);
 assert.ok(!page.includes('XMLHttpRequest')&&!page.includes('navigator.sendBeacon'));
 assert.ok(!page.includes("localStorage.")&&!page.includes("sessionStorage."));
 assert.ok(page.includes("readInput('android')")&&page.includes("readInput('iphone')"));
 assert.ok(page.includes("return JSON.parse(raw)"));
});
test('coordinator artifact never overwrites previously exported private pilot organizer files',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cc-private-phone-'));
 try{
  const output=path.join(root,'organizer'),result=writePrivatePhonePilotCoordinator(output);
  assert.equal(result.realPhysicalPhonesVerified,false);
  assert.equal(result.sourceAccuracy,null);
  assert.equal(result.productionApproval,false);
  assert.deepEqual(fs.readdirSync(output).sort(),['OPEN-PHONE-COORDINATOR.html','START-HERE.txt']);
  const original=fs.readFileSync(path.join(output,'OPEN-PHONE-COORDINATOR.html'),'utf8');
  assert.throws(()=>writePrivatePhonePilotCoordinator(output),/Never overwrite/);
  assert.equal(fs.readFileSync(path.join(output,'OPEN-PHONE-COORDINATOR.html'),'utf8'),original);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('authoritative two-phone reconciliation never treats successful synthetic checklists as verified hardware',()=>{
 const steps=Object.fromEntries(deviceCheckSteps.map(([id])=>[id,'pass']));
 const a=deviceCheckReport({enabled:false,steps,events:[]},'123456abcdef','Android');
 const b=deviceCheckReport({enabled:false,steps,events:[]},'123456abcdef','iPhone/iPad');
 const r=comparePrivatePhonePilotReports(a,b);
 assert.equal(r.status,'manual-human-evidence-review-required');
 assert.equal(r.independentPhysicalDevicesConfirmed,false);
 assert.equal(r.actualHardwareCameraVerified,null);
 assert.equal(r.actualOriginalPhotoFormAccuracy,null);
 assert.equal(r.productionReleaseApproved,false);
});
