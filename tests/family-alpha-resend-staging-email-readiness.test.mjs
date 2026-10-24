import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {
 assessRecordedEmailReadiness,runRecordedEmailReadiness,EXPECTED_PUBLIC_SMTP,
 STAGE_REF,PROD_REF,ROOT_CALLBACK,PILOT_CALLBACK,SNAPSHOT
} from '../scripts/family-alpha-resend-staging-email-readiness.mjs';
const data=JSON.parse(await readFile(SNAPSHOT,'utf8'));
const code=await readFile('public/auth.js','utf8');
const make=()=>structuredClone(data);
test('owner-screenshot email checkpoint: 3 public DNS records saved but Resend remains PENDING',async()=>{
 const r=await runRecordedEmailReadiness();
 assert.equal(r.releaseGate,'HOLD');
 assert.equal(r.domainVerification,'PENDING');
 assert.equal(r.actualEmailSent,false);
 assert.equal(r.readyToInvite,false);
 assert.equal(r.readOnly,true);
 assert.equal(r.privacyNoKeysStored,true);
 assert.equal(r.checks.find(x=>x.id==='resend.domain-verification').status,'PENDING');
 assert.equal(r.checks.find(x=>x.id==='staging.email-end-to-end').status,'NOT VERIFIED');
});
test('public Resend SMTP host/port/user and nonsecret From address are documentation-backed',()=>{
 assert.deepEqual(EXPECTED_PUBLIC_SMTP,{
  host:'smtp.resend.com',port:465,username:'resend',
  senderName:'Closet Current',senderEmail:'accounts@mail.closet-current.com'
 });
});
test('do not confuse production/staging ref, callbacks, or existing live Auth source',()=>{
 const r=assessRecordedEmailReadiness(make(),code);
 assert.notEqual(STAGE_REF,PROD_REF);
 assert.equal(r.stageRef,STAGE_REF);
 assert.equal(r.stageRedirectObserved,PILOT_CALLBACK);
 assert.equal(r.proposedRootRedirect,ROOT_CALLBACK);
 assert.ok(r.checks.some(x=>x.id==='staging.auth-redirect'&&x.status==='BLOCKER'));
 assert.equal(r.realBackendAuthorizationTested,false);
});
test('CNAME send.mail must have DIFFERENT target from rsend.mail',()=>{
 const snapshot=make();
 snapshot.domain.dnsRecordsScreenshotObserved.find(x=>x.name==='send.mail').target='rsend.forge.rmta.net';
 assert.throws(()=>assessRecordedEmailReadiness(snapshot,code),/Public CNAMEs/);
});
test('duplicate/omitted Resend public records must fail closed',()=>{
 const a=make();a.domain.dnsRecordsScreenshotObserved[1].name='send.mail';
 assert.throws(()=>assessRecordedEmailReadiness(a,code),/Missing or duplicated/);
 const b=make();b.domain.dnsRecordsScreenshotObserved.pop();
 assert.throws(()=>assessRecordedEmailReadiness(b,code),/Three public DNS records/);
});
test('staged SMTP cannot be marked active by editing a historical screenshot checkpoint',()=>{
 const a=make();a.email.customSmtpCurrentlyEnabled=true;
 assert.throws(()=>assessRecordedEmailReadiness(a,code),/No private SMTP credentials/);
 const b=make();b.email.smtpKeyConfigured=true;
 assert.throws(()=>assessRecordedEmailReadiness(b,code),/No private SMTP credentials/);
});
test('historical Resend Pending observation cannot be relabeled Verified without independent live evidence',()=>{
 const a=make();a.domain.resendVerification='VERIFIED';
 assert.throws(()=>assessRecordedEmailReadiness(a,code),/Historical evidence cannot certify/);
 const b=make();b.domain.dnsAuthoritativePubliclyQueried=true;
 assert.throws(()=>assessRecordedEmailReadiness(b,code),/Historical evidence cannot certify/);
});
test('production project changes and live app claims are rejected',()=>{
 const a=make();a.production.mustRemainUnchanged=false;
 assert.throws(()=>assessRecordedEmailReadiness(a,code),/Incorrect staging\/production/);
 const b=make();b.staging.actualStagedAppDeployed=true;
 assert.throws(()=>assessRecordedEmailReadiness(b,code),/Auth policies or staged deployment/);
 const c=make();c.staging.accountSignupAllowed=false;
 assert.throws(()=>assessRecordedEmailReadiness(c,code),/Auth policies or staged deployment/);
});
test('do not leak SMTP secrets, JWT, account email, or DKIM public key into audit snapshot',()=>{
 const src=JSON.stringify(data);
 assert.doesNotMatch(src,/re_[A-Za-z0-9]{24,}/);
 assert.doesNotMatch(src,/sb_secret_|service_role|Bearer eyJ|refresh_token|smtp_password/i);
 assert.doesNotMatch(src,/Nickhaney916@gmail/i);
 assert.ok(src.includes('NOT_STORED_PUBLIC_DKIM_VALUE'));
});
test('changing or removing previous Auth email redirect implementation reopens review',()=>{
 assert.throws(()=>assessRecordedEmailReadiness(make(),''),/Production Auth source changed/);
 assert.throws(()=>assessRecordedEmailReadiness(make(),code.replace("const EMAIL_REDIRECT=","const NO_EMAIL_REDIRECT=")),/Production Auth source changed/);
});
test('release approval is always HOLD until real DNS, SMTP, callback and account tests are complete',()=>{
 const r=assessRecordedEmailReadiness(make(),code);
 const ids=r.checks.map(x=>x.id);
 for(const id of ['resend.smtp-auth','staging.app-activation','staging.account-registration',
  'staging.private-account-permissions','physical-family-alpha']){
  assert.ok(ids.includes(id),id);
 }
 assert.equal(r.nextActions.length,6);
 assert.equal(r.releaseGate,'HOLD');
 assert.equal(r.readyToInvite,false);
});
