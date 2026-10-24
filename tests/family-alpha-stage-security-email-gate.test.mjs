import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
 SNAPSHOT,STAGING,PRODUCTION,SITE,PILOT,PUBLIC_RESEND,
 assessStagingSecurityAndEmail,runStagingSecurityAndEmail
} from '../scripts/family-alpha-stage-security-email-gate.mjs';
const evidence=JSON.parse(await readFile(SNAPSHOT,'utf8'));
const clone=()=>structuredClone(evidence);

test('actual owner-observed VERIFIED Resend domain is distinct from any SMTP delivery proof',async()=>{
 const r=await runStagingSecurityAndEmail();
 assert.equal(r.domainVerifiedFromOwnerScreenshot,true);
 assert.equal(r.customSmtpLiveConfigurationVerified,false);
 assert.equal(r.liveMailSent,false);
 assert.equal(r.invitationReady,false);
 assert.equal(r.releaseGate,'HOLD');
 assert.equal(r.checks.find(x=>x.id==='smtp_delivery').status,'NOT_CONFIGURED_OR_TESTED');
});
test('live staging backend and publicly known sender are pinned, production untouched',()=>{
 const r=assessStagingSecurityAndEmail(clone());
 assert.equal(r.stageRef,STAGING);
 assert.equal(r.prodRef,PRODUCTION);
 assert.notEqual(STAGING,PRODUCTION);
 assert.equal(evidence.authAndHost.actualProtectedStagingRoot,SITE);
 assert.equal(evidence.authAndHost.lastObservedSiteUrl,PILOT);
 assert.deepEqual(PUBLIC_RESEND,{host:'smtp.resend.com',port:465,username:'resend',
  sender:'accounts@mail.closet-current.com'});
});
test('live RLS catalog has own-row policies and matching-UID allow evidence',()=>{
 const r=assessStagingSecurityAndEmail(clone());
 const p=evidence.security.syntheticPostgresRoleChecks;
 assert.equal(p.matchingBackupOwnerVisible,1);
 assert.equal(p.matchingPhotoFolderOwnerVisible,1);
 assert.equal(r.checks.find(x=>x.id==='row_rls').status,'SIMULATED_SQL_ALLOW_DENY_PASS');
 assert.equal(r.genuineJWTAuthorizationTested,false);
});
test('the two foreign SQL owner roles and anonymous access must stay denied',()=>{
 const r=assessStagingSecurityAndEmail(clone());
 assert.equal(r.anonymousDenied,true);
 for(const key of ['syntheticForeignOwnerAVisibleBackups','syntheticForeignOwnerAVisiblePhotos',
  'syntheticForeignOwnerBVisibleBackups','syntheticForeignOwnerBVisiblePhotos']){
  const x=clone();x.security.syntheticPostgresRoleChecks[key]=1;
  assert.throws(()=>assessStagingSecurityAndEmail(x),/owner allow|foreign denied/);
 }
 const x=clone();x.security.syntheticPostgresRoleChecks.anonymousBackup='VISIBLE';
 assert.throws(()=>assessStagingSecurityAndEmail(x),/owner allow|foreign denied/);
});
test('cannot relabel simulated role checks genuine JWT or live cross-owner writes',()=>{
 for(const field of ['realCrossOwnerJWTTested','liveJwtSignInUsed','realAandBWriteUpdateDeleteTested']){
  const x=clone();x.security[field]=true;
  assert.throws(()=>assessStagingSecurityAndEmail(x),/mislabeled as genuine JWT/);
 }
});
test('no widening private JPEG bucket or UPDATE policy without re-review',()=>{
 for(const field of ['storageBucketPublic','storageUpdatePolicyPresent']){
  const x=clone();x.security[field]=true;
  assert.throws(()=>assessStagingSecurityAndEmail(x),/policies differ|storage update/);
 }
 const x=clone();x.security.storageAppCurrentUploadMethod='upsert';
 assert.throws(()=>assessStagingSecurityAndEmail(x),/storage update/);
});
test('Supabase leaked-password security advisor warning must stay visible',()=>{
 const x=clone();x.security.securityAdvisorWarnings=[];
 assert.throws(()=>assessStagingSecurityAndEmail(x),/security advisor warning/);
 const r=assessStagingSecurityAndEmail(clone());
 assert.equal(r.checks.find(x=>x.id==='leaked_password_protection').status,'ADVISOR_WARN');
});
test('domain verification must not authorize SMTP claims, generated keys or email sent',()=>{
 for(const [field,value] of [
  ['currentCustomSmtpState','ENABLED'],['smtpCredentialKnown',true],
  ['smtpKeyGeneratedObserved',true],['mailDeliveryTested',true],
  ['emailConfirmationReceived',true],['passwordRecoveryReceived',true]
 ]){
  const x=clone();x.mail[field]=value;
  assert.throws(()=>assessStagingSecurityAndEmail(x),/historical SMTP settings/);
 }
});
test('missing protected app callback and direct public signup MUST block invitation',()=>{
 const r=assessStagingSecurityAndEmail(clone());
 assert.equal(r.checks.find(x=>x.id==='callback').status,'BLOCKER');
 assert.equal(r.checks.find(x=>x.id==='public_signup').status,'STILL_NEEDS_LIVE_RECHECK');
 assert.equal(r.readyForFamilyAlpha,false);
 const x=clone();x.authAndHost.actualStagingAppDeployed=true;
 assert.throws(()=>assessStagingSecurityAndEmail(x),/redirected sign-in/);
});
test('source audit contains no family identities, photo bytes or SMTP secrets',()=>{
 const serialized=JSON.stringify(evidence);
 assert.doesNotMatch(serialized,/sb_secret_|service_role|refresh_token|smtp_password|Bearer eyJ|re_[A-Za-z0-9]{24,}/i);
 assert.equal(evidence.evidenceBoundaries.containsPhotoData,false);
 assert.equal(evidence.evidenceBoundaries.containsCredentials,false);
 const x=clone();x.mail.smtpPassword='re_Abcdefghijklmnopqrstuvwxyz0123456789';
 assert.throws(()=>assessStagingSecurityAndEmail(x),/secret-like material/);
});
test('actual compiled stage Auth is empty-key, empty-redirect and nonproduction',async()=>{
 const r=await runStagingSecurityAndEmail();
 assert.equal(r.releaseGate,'HOLD');
 assert.equal(r.evidenceLevels.realSMTP,false);
 assert.equal(r.evidenceLevels.realJWT,false);
 const config=await readFile('dist-family-alpha-staging-auth-hold/alpha-stage-config.js','utf8');
 assert.match(config,/HOLD-NO-CALLBACK-OR-KEY/);
 const auth=await readFile('dist-family-alpha-staging-auth-hold/auth.js','utf8');
 assert.match(auth,new RegExp(STAGING+'\\.supabase\\.co'));
 assert.doesNotMatch(auth,new RegExp(PRODUCTION+'\\.supabase\\.co'));
});
test('removing callback HOLD or adding a publishable key to build is never accepted',()=>{
 const a={config:'{"intent":"active","key":"sb_publishable_test","redirect":"https://evil.example"}',
 auth:'https://'+STAGING+'.supabase.co'};
 assert.throws(()=>assessStagingSecurityAndEmail(clone(),a),/compiled staged Auth/);
 const b={config:'{"intent":"HOLD-NO-CALLBACK-OR-KEY","key":"","redirect":""}',
 auth:'https://'+PRODUCTION+'.supabase.co'};
 assert.throws(()=>assessStagingSecurityAndEmail(clone(),b),/compiled staged Auth/);
});
