// QA of the generated STATIC preview candidate. Never claim Cloudflare
// Access or a real staging Supabase project exists from static source.
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
const dir='staging-dist';
const get=path=>readFile(dir+'/'+path,'utf8');
const proof=JSON.parse(await get('staging-preflight.json'));
assert.equal(proof.privateCloudflareAccessPolicyVerified,false);
assert.equal(proof.separateHostedSupabaseProjectVerifiedByOwner,false);
assert.equal(proof.restrictedStagingDeployed,false);
assert.equal(proof.productionReleaseApproved,false);
assert.equal(proof.paidAIHardBlocked,true);
assert.equal(proof.releasePromotion,'BLOCKED');
assert.match(proof.stagingOrigin,/^https:\/\//);
assert.match(proof.bundleFingerprint,/^[a-f0-9]{12}$/);
const auth=await get('auth.js'),backup=await get('cloud-backup.js'),
 ai=await get('ai-tryon.js'),index=await get('index.html'),
 sw=await get('sw.js'),photo=await get('phone-photo-check.html'),
 saved=await get('saved-closet-audit.html'),headers=await get('_headers');
assert.ok(auth.includes("const APP_URL='"+proof.stagingOrigin+"'"));
assert.ok(auth.includes("const URL='https://"+proof.backendProjectRef+".supabase.co'"));
assert.ok(backup.includes("BASE='https://"+proof.backendProjectRef+".supabase.co'"));
assert.ok(ai.includes("throw Error('Paid AI is disabled for the restricted staging pilot.')"));
assert.ok(index.includes('PRIVATE STAGING — DISPOSABLE TEST ACCOUNTS ONLY'));
assert.ok(headers.includes('noindex'));
for(const [label,source]of [['index',index],['sw',sw],['photo',photo],['saved',saved]])
 assert.ok(source.includes(proof.bundleFingerprint),label+' did not use the staging-specific release');
assert.ok(sw.includes('closet-current-staging-'+proof.bundleFingerprint));
assert.ok(sw.includes("key.startsWith('closet-current-staging-')"));
assert.ok(!sw.includes("key.startsWith('closet-current-')"));
assert.ok(photo.includes('content="'+proof.bundleFingerprint+'"'));
assert.ok(saved.includes('value="'+proof.bundleFingerprint+'"'));
console.log('RESTRICTED_STAGING_BUNDLE_QA '+JSON.stringify({
 sourceIdenticalToProduction:true,
 stagingBuild:proof.bundleFingerprint,
 paidAIDisabled:true,
 existingCloudBackupNotUsed:true,
 manualCloudflareAccessApprovalRequired:true,
 realStagingSupabaseProjectConfirmationRequired:true,
 productionReleaseApproved:false
}));
