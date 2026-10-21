import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import device from '../public/device-check-engine.js';
import {createOfflinePilotCohortHTML,writeOfflinePilotCohort} from '../scripts/offline-pilot-cohort-organizer.mjs';
test('single offline document bundles canonical three-report validators and states BLOCKED',()=>{
 const html=createOfflinePilotCohortHTML();
 assert.ok(html.startsWith('<!doctype html>'));
 assert.ok(html.includes('function reviewPrivatePilotCohort('));
 assert.ok(html.includes('function reviewPrivatePilotEvidence('));
 assert.ok(html.includes('function reviewSavedClosetReports('));
 assert.ok(html.includes('function comparePrivatePhonePilotReports('));
 assert.ok(html.includes('sourcePhotoAccuracyMeasured:false'));
 assert.ok(html.includes("productionPromotion:'BLOCKED'"));
 assert.ok(html.includes("originalPhotosLinkedAcrossReportFamilies:false"));
 assert.ok(html.includes('connect-src &#39;none&#39;')||html.includes("connect-src 'none'"));
 assert.ok(!html.includes('__BUNDLED_SOURCE_AND_UI__'));
 for(const [id]of device.deviceCheckSteps)assert.ok(html.includes("'"+id+"'"));
 assert.ok(!html.includes('navigator.sendBeacon'));
 assert.ok(!html.includes('XMLHttpRequest'));
 assert.ok(!html.includes('localStorage.setItem'));
 assert.ok(!html.includes('fetch('),'Private coordinator must not issue network fetches');
 assert.ok(!html.includes('form action='));
});
test('organizer is generated once, with no images/credentials, and cannot replace a prior audit',()=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'closet-private-organizer-'));
 const output=path.join(folder,'offline');
 try{
  const result=writeOfflinePilotCohort(output);
  assert.equal(result.productionReleaseApproved,false);
  assert.equal(result.actualGenuinePhotos,0);
  assert.deepEqual(fs.readdirSync(output).sort(),['OPEN-PRIVATE-PILOT-REVIEW.html','START-HERE.txt']);
  const first=fs.readFileSync(path.join(output,'OPEN-PRIVATE-PILOT-REVIEW.html'),'utf8');
  assert.throws(()=>writeOfflinePilotCohort(output),/Never overwrite/);
  assert.equal(fs.readFileSync(path.join(output,'OPEN-PRIVATE-PILOT-REVIEW.html'),'utf8'),first);
 }finally{fs.rmSync(folder,{force:true,recursive:true});}
});
