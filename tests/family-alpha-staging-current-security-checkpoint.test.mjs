import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const history=JSON.parse(await readFile('research/family-alpha-email/staging-resend-observed-20261023.json','utf8'));
const current=JSON.parse(await readFile('research/family-alpha-email/staging-live-security-resend-20261024.json','utf8'));
test('historic Resend pending screenshot and subsequent verified owner evidence stay distinct',()=>{
 assert.equal(history.domain.resendVerification,'PENDING');
 assert.equal(history.domain.dnsLiveVerifiedByResend,false);
 assert.equal(current.email.resendDashboardStatus,'VERIFIED');
 assert.equal(current.email.actualDeliveryTested,false);
 assert.equal(current.email.customSmtpEnabledNow,'NOT_REVERIFIED_AFTER_ORIGINAL_OFF_OBSERVATION');
 assert.equal(current.email.smtpCredentialExistsNow,'NOT_VERIFIED');
});
test('actual staging read-only metadata claims cannot imply live A/B private account authorization',()=>{
 assert.equal(current.reviewedProject.id,'fbnplztkbsteuzrmbgib');
 assert.equal(current.reviewedProject.productionProjectMustNotChange,'hlkgymugtfbirlpunsra');
 assert.equal(current.security.completedLiveJwtCrossOwnerTests,false);
 assert.equal(current.security.completedLiveHostedSignupRecoveryTests,false);
 assert.equal(current.security.photoBucket.public,false);
 assert.deepEqual(current.security.photoBucket.allowedMimeTypes,['image/jpeg']);
 assert.equal(current.security.photoBucket.fileSizeLimitBytes,8388608);
 assert.equal(current.security.advisor.includes('Leaked Password Protection Disabled'),true);
});
test('current staged email and security readiness remains HOLD, no secrets or family photos claimed',()=>{
 assert.equal(current.releaseGate,'HOLD');
 assert.equal(current.readyToInvite,false);
 assert.equal(current.mutationsMade,false);
 assert.equal(current.keysReadOrStored,false);
 assert.equal(current.realFamilyDataRead,false);
 const text=JSON.stringify(current);
 assert.ok(!/sb_secret_|sk-proj-|-----BEGIN PRIVATE KEY-----|Bearer\\s+eyJ/i.test(text));
 assert.ok(!/smtpPass(word)?\\\":\\\"[^\\\"]+/i.test(text));
});
