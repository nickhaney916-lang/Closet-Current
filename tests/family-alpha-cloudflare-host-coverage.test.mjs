import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
 INVENTORY_PATH,EXPECTED_ROOT,EXPECTED_WILDCARD,
 auditRecordedCloudflareInventory,evaluateSavedAccessCheckpoint,
 evaluateProposedAccessCoverage
} from '../scripts/family-alpha-cloudflare-host-coverage-offline.mjs';
const data=JSON.parse(await readFile(INVENTORY_PATH,'utf8'));
const stub={releaseGate:'HOLD',readyForFamily:false,routeIsolatedFromProduction:true};
const fresh=()=>structuredClone(data);
test('saved original Cloudflare root hostname is not confused with unverified wildcard protection',()=>{
 const report=auditRecordedCloudflareInventory(fresh(),stub);
 assert.equal(EXPECTED_ROOT,'closet-current-staging.pages.dev');
 assert.equal(EXPECTED_WILDCARD,'*.closet-current-staging.pages.dev');
 assert.equal(report.proposedRootOrigin,'https://closet-current-staging.pages.dev/');
 assert.equal(report.anonymousHostProbePerformed,false);
 assert.equal(report.readyForFamily,false);
 assert.equal(report.releaseGate,'HOLD');
 assert.equal(report.checks.find(x=>x.id==='staging.preview-wildcard').status,'NOT VERIFIED');
 assert.equal(report.checks.find(x=>x.id==='staging.root-host').status,'KNOWN_UNVERIFIED');
 assert.equal(report.requiredReviewHosts.length,3);
});
test('rechecking the previously saved checkpoint does not perform any live Cloudflare call',async()=>{
 const report=await evaluateSavedAccessCheckpoint();
 assert.equal(report.liveCloudflareRead,false);
 assert.equal(report.hostnameSourceDate,'2026-10-21');
 assert.equal(report.summary.includes('UNVERIFIED')===false,true); // explicit full text uses 'verified'
 assert.equal(report.checks.length,8);
});
test('an observed Cloudflare 522 cannot count as a challenge or live access check',()=>{
 const report=auditRecordedCloudflareInventory(fresh(),stub);
 assert.equal(data.observedRootHttp522,true);
 assert.equal(report.checks.find(x=>x.id==='staging.root-522').status,'INCONCLUSIVE');
 assert.equal(report.anonymousHostProbePerformed,false);
});
test('malicious or misleading historical checkpoint cannot be elevated to verified after the fact',()=>{
 for(const prop of [
  'rootEnforcementVerified','previewWildcardApplicationVerified',
  'policyIncludeRulesVerified','policyRequireRulesVerified',
  'policyExcludeRulesVerified','ownerAuthorizedStagingDeployment'
 ]){
  const copy=fresh();copy[prop]=true;
  assert.throws(()=>auditRecordedCloudflareInventory(copy,stub),/Historical evidence/);
 }
 const altered=fresh();altered.confirmedRootHostname='evil.example.com';
 assert.throws(()=>auditRecordedCloudflareInventory(altered,stub),/Invalid or overstated/);
});
test('a mocked root-only Cloudflare Access application is insufficient',()=>{
 const proposed=evaluateProposedAccessCoverage({
  applications:[{hostnames:[EXPECTED_ROOT],policies:[{
   action:'allow',include:[{type:'email',id:'redacted-unique-tester-1'}]
  }]}],approvedTesterRulesRecorded:true
 });
 assert.equal(proposed.rootDeclared,true);
 assert.equal(proposed.previewWildcardDeclared,false);
 assert.equal(proposed.ruleChecklistComplete,false);
 assert.ok(proposed.riskFlags.includes('preview-wildcard-not-listed'));
 assert.equal(proposed.allowedToDeploy,false);
});
test('a wildcard-only application must not be treated as root coverage',()=>{
 const proposed=evaluateProposedAccessCoverage({
  applications:[{hostnames:[EXPECTED_WILDCARD],policies:[{
   action:'allow',include:[{type:'email',id:'redacted-unique-tester-1'}]
  }]}],approvedTesterRulesRecorded:true
 });
 assert.equal(proposed.rootDeclared,false);
 assert.ok(proposed.riskFlags.includes('root-not-listed'));
});
test('Everyone, broad domains and bypass rules remain risky despite both hostnames',()=>{
 for(const unsafe of [
  {action:'allow',include:[{type:'everyone'}]},
  {action:'allow',include:[{type:'email_domain',id:'example.org'}]},
  {action:'bypass',include:[{type:'everyone'}]},
  {action:'allow',include:[{type:'email_wildcard',id:'*@example.org'}]}
 ]){
  const proposed=evaluateProposedAccessCoverage({
   applications:[{hostnames:[EXPECTED_ROOT,EXPECTED_WILDCARD],policies:[unsafe]}],
   approvedTesterRulesRecorded:true
  });
  assert.ok(proposed.riskFlags.includes('broad-or-bypass-policy'));
  assert.equal(proposed.allowedToDeploy,false);
 }
});
test('even a hypothetical complete root/wildcard allowlist is NOT live proof or deployment authorization',()=>{
 const proposed=evaluateProposedAccessCoverage({
  applications:[{hostnames:[EXPECTED_ROOT,EXPECTED_WILDCARD],policies:[{
   action:'allow',include:[{type:'email',id:'synthetic-approved-tester'}]
  }]}],approvedTesterRulesRecorded:true
 });
 assert.equal(proposed.rootDeclared,true);
 assert.equal(proposed.previewWildcardDeclared,true);
 assert.equal(proposed.ruleChecklistComplete,true);
 assert.equal(proposed.liveEnforcementVerified,false);
 assert.equal(proposed.allowedToDeploy,false);
 assert.equal(proposed.verdict,'PROPOSED_COVERAGE_ONLY_NOT_VERIFIED');
});
test('unknown additional public staging aliases reopen coverage review',()=>{
 const proposed=evaluateProposedAccessCoverage({
  applications:[{hostnames:[EXPECTED_ROOT,EXPECTED_WILDCARD],policies:[{
   action:'allow',include:[{type:'email',id:'synthetic-approved-tester'}]
  }]}],approvedTesterRulesRecorded:true,allowAnyOtherHostname:true
 });
 assert.ok(proposed.riskFlags.includes('unreviewed-alternate-host'));
 assert.equal(proposed.ruleChecklistComplete,false);
});
test('misconfigured proposed rules are rejected, rather than considered verified',()=>{
 assert.throws(()=>evaluateProposedAccessCoverage({applications:[{hostnames:['https://evil.test/'],policies:[]}]}),/Bad hypothetical/);
 assert.throws(()=>evaluateProposedAccessCoverage({applications:[{hostnames:[EXPECTED_ROOT],policies:[{}]}]}),/Malformed hypothetical policy/);
 assert.throws(()=>evaluateProposedAccessCoverage({applications:null}),/Explicit reviewed/);
});
