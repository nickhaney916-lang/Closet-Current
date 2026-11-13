import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { fixture } from '../scripts/p79-synthetic-fixtures.mjs';
import { loadSession, reviewHandoff, DECLARATION } from '../scripts/p79-workstation-core.mjs';
import { SCHEMA, evaluateMission1Evidence } from '../scripts/m1-release-evidence-851.mjs';

const require = createRequire(import.meta.url);
const device = require('../public/device-acceptance-78.js');
const P852 = '3f918e7cb4fffcbb10e455126b5d92a484c0b7c6';

test('P853 includes unchanged P79 offline operator components, not live application code', async () => {
  const [operator, report, page] = await Promise.all([
    readFile(new URL('../research/parallel79/OPERATOR.md', import.meta.url),'utf8'),
    readFile(new URL('../research/parallel79/REPORT.md', import.meta.url),'utf8'),
    readFile(new URL('../research/parallel79/workstation/index.html', import.meta.url),'utf8')
  ]);
  assert.match(operator, /P75/i);
  assert.match(report, /HOLD #255 OPEN/);
  assert.match(page, /html/i);
  assert.match(DECLARATION, /personally inspected/);
});

test('P853 unsigned synthetic offline sessions cannot be accepted as human or sealed blind evidence', async () => {
  const f = await fixture(1);
  try {
    const loaded = await loadSession(f.bundle);
    assert.equal(loaded.records.length,1);
    assert.equal(loaded.session.reviewerId,f.bundle.authorization.reviewerId);
    const source = loaded.records[0].source;
    const handoff = reviewHandoff(source,[],f.bundle.registry,f.bundle.approvedFingerprint);
    assert.equal(handoff.status,'DISPUTED / BLOCKED');
    assert.equal(handoff.acceptedHumanLabels,0);
    const release=evaluateMission1Evidence({
      schema:SCHEMA,roles:{
        independentBlind:{
          role:'independentBlind',
          payload:{schema:SCHEMA, sourceSha256:source.sha256, humanLabels:1},
          signature:'FAKE', publicKey:'FAKE'
        }
      }
    });
    assert.equal(release.status,'BLOCKED');
    assert.equal(release.shouldLiftFamilyAlphaHold,false);
    assert.equal(release.countOfIndependentHumanBlindSources,0);
  } finally {
    await f.cleanup();
  }
});

test('P853 all operator-declared device PASS rows still fail the independent release gate', () => {
  const reports=[];
  for (const platform of ['ANDROID_CHROME','IPHONE_SAFARI']) {
    const session=device.create({sourceCommit:P852,platform,operatorDeclaredPhysical:true});
    for (const [caseId] of device.CASES) {
      device.record(session,{caseId,status:'PASS',severity:'NONE',
        evidenceSha256:'a'.repeat(64),originalSha256:'b'.repeat(64),
        ownerGate:true,sourcePreserved:true});
    }
    const shareable=device.publicReport(session);
    assert.equal(device.validatePublic(shareable),true);
    assert.equal(shareable.independentlyVerifiedPhysicalRuns,0);
    reports.push(shareable);
  }
  assert.equal(device.releaseGate(reports).status,'BLOCKED');
  assert.equal(evaluateMission1Evidence(null).status,'BLOCKED');
});

test('P853 does not promote fixture-generated workstation or device operator claims to release', () => {
  const release=evaluateMission1Evidence({
    schema:SCHEMA,fixture:true,roles:{
      ownerPolicy:{},independentBlind:{},physicalDevices:{},signedCloud:{}
    }
  });
  assert.equal(release.status,'BLOCKED');
  assert.equal(release.shouldLiftFamilyAlphaHold,false);
  assert.equal(release.countOfPhysicalDevicePlatforms,0);
  assert.equal(release.countOfIndependentHumanBlindSources,0);
});