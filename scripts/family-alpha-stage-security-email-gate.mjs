/**
 * Family Alpha live-staging metadata and email readiness evidence gate.
 *
 * Reads only a SANITIZED record of a connected, read-only Supabase audit
 * and the owner's Resend dashboard screenshot. No Auth Management API,
 * SMTP password, user email/JWT, photo object, login, cloud call or network.
 * This is an evidence check, NOT a live account penetration test.
 */
import {readFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';

export const SNAPSHOT='research/family-alpha-security/staging-live-readonly-20261024.json';
export const STAGING='fbnplztkbsteuzrmbgib';
export const PRODUCTION='hlkgymugtfbirlpunsra';
export const SITE='https://closet-current-staging.pages.dev/';
export const PILOT='https://pilot-access-check.closet-current-staging.pages.dev/';
export const RESEND_DOMAIN='mail.closet-current.com';
export const PUBLIC_RESEND=Object.freeze({host:'smtp.resend.com',port:465,username:'resend',
 sender:'accounts@mail.closet-current.com'});
const insist=(condition,msg)=>{if(!condition)throw Error('Family Alpha security/email gate: '+msg);};

export function assessStagingSecurityAndEmail(evidence,heldBuild=null){
 insist(evidence?.schemaVersion===1&&evidence.observedDate==='2026-10-24'&&
   evidence.releaseGate==='HOLD'&&evidence.snapshotType?.startsWith('sanitized connected Supabase read-only'),
   'unexpected provenance, snapshot or release status');
 const {project:p,security:s,mail:m,authAndHost:a,evidenceBoundaries:b}=evidence;
 insist(p?.stagingRef===STAGING&&p?.productionRef===PRODUCTION&&p.stagingActive&&
  p.productionReadOrChanged===false&&p.dataMutations===false&&
  p.liveBackendWritesAttempted===false,'staging-production boundary must remain read-only');
 insist(s?.publicBackupTable==='closet_backups'&&s.backupRlsEnabled&&
  s.backupPolicies.includes('authenticated_owner_using_and_check')&&
  s.privateBucket==='closet-private'&&s.storageBucketPublic===false&&
  s.objectRlsEnabled&&
  ['INSERT_OWN_FOLDER','SELECT_OWN_FOLDER','DELETE_OWN_FOLDER'].every(x=>s.authenticatedStorageActions.includes(x)),
  'public database and Storage owners/policies differ from inspected live scope');
 insist(s.storageUpdatePolicyPresent===false&&
  s.storageAppCurrentUploadMethod==='immutable_photo_hash_POST_no_upsert',
  'storage update/use model changed; reevaluate policy before enabling clients');
 const checks=s.syntheticPostgresRoleChecks;
 insist(checks?.method.includes('BEGIN READ ONLY')&&
  checks.method.includes('ROLLBACK')&&
  checks.method.includes('NO JWT ISSUED')&&
  checks.matchingBackupOwnerVisible===1&&checks.matchingPhotoFolderOwnerVisible===1&&
  checks.syntheticForeignOwnerAVisibleBackups===0&&
  checks.syntheticForeignOwnerAVisiblePhotos===0&&
  checks.syntheticForeignOwnerBVisibleBackups===0&&
  checks.syntheticForeignOwnerBVisiblePhotos===0&&
  checks.anonymousBackup==='PERMISSION_DENIED'&&checks.anonymousVisiblePrivatePhotos===0,
  'read-only owner allow / simulated foreign denied / anon denied evidence incomplete');
 insist(s.realCrossOwnerJWTTested===false&&s.liveJwtSignInUsed===false&&
  s.realAandBWriteUpdateDeleteTested===false,
  'role impersonation must never be mislabeled as genuine JWT/storage verification');
 insist(s.securityAdvisorWarnings?.some(x=>x.code==='auth_leaked_password_protection'&&
  x.enabled===false&&x.level==='WARN'&&x.remediation.startsWith('https://supabase.com/')),
  'security advisor warning must remain visible, not silently discarded');
 insist(m?.resendVerifiedOwnerScreenshot===true&&
  m.resendVerifiedObservedOn==='2026-10-24'&&m.sendingDomain===RESEND_DOMAIN&&
  m.senderProposal===PUBLIC_RESEND.sender&&
  m.publicHost===PUBLIC_RESEND.host&&m.publicPort===PUBLIC_RESEND.port&&
  m.publicUsername===PUBLIC_RESEND.username,
  'observed Resend domain-verified milestone / nonsecret SMTP fields changed');
 insist(m.currentCustomSmtpState==='NOT_LIVE_RECHECKED'&&
  m.lastObservedStagingCustomSmtpEnabled===false&&
  m.smtpCredentialKnown===false&&m.smtpKeyGeneratedObserved===false&&
  m.mailDeliveryTested===false&&m.emailConfirmationReceived===false&&
  m.passwordRecoveryReceived===false,
  'historical SMTP settings cannot prove current provider configuration or delivery');
 insist(a?.stagingAuthBuildDefault==='HOLD-NO-CALLBACK-OR-KEY'&&
  a.stagingPublishableKeyInArtifact===false&&a.actualStagingAppDeployed===false&&
  a.outboundEmailSent===false&&a.actualProtectedStagingRoot===SITE&&
  a.lastObservedSiteUrl===PILOT&&
  a.rootAuthCallbackPresentInLastObservedAllowlist===false&&
  a.liveRedirectRechecked===false&&a.protectedRootAccessEnforcementRechecked===false,
  'no approved live redirected sign-in/Access verification or deployment');
 insist(a.signupAllowedLastObserved===true&&a.liveSignupRestrictionRechecked===false&&
  a.anonymousSignInEnabledLastObserved===false,
  'public sign-up exposure must be rechecked before enabling SMTP/invites');
 insist(b?.containsCredentials===false&&b.containsJWTs===false&&
  b.containsEmailAddressesOfPeople===false&&b.containsPhotoData===false&&
  b.containsWardrobeJson===false&&b.providerDashboardReadOnlyAccessAvailable===false&&
  b.productionSourceUnmodified===true,
  'sensitive personal data, secrets or unsupported live-provider access claim');
 const serialized=JSON.stringify(evidence);
 insist(!/sb_secret_|service_role|refresh_token|smtp_password|Bearer eyJ|re_[A-Za-z0-9]{24,}/i.test(serialized),
  'secret-like material must never appear in audit source');
 if(heldBuild!==null){
  const {config,auth}=heldBuild;
  insist(typeof config==='string'&&typeof auth==='string'&&
    config.includes('HOLD-NO-CALLBACK-OR-KEY')&&
    config.includes('"key":""')&&config.includes('"redirect":""')&&
    auth.includes('https://'+STAGING+'.supabase.co')&&
    !auth.includes('https://'+PRODUCTION+'.supabase.co'),
    'current compiled staged Auth unexpectedly has a key, callback or production route');
 }
 const checksOut=[
  {id:'domain',status:'OWNER_SCREENSHOT_VERIFIED',evidence:'Resend domain dashboard only; no SMTP transaction'},
  {id:'row_rls',status:'SIMULATED_SQL_ALLOW_DENY_PASS',evidence:'Read-only Postgres role/UID emulation; no genuine JWT'},
  {id:'private_storage',status:'SIMULATED_SQL_ALLOW_DENY_PASS',evidence:'Private bucket; read-only RLS folder gates; no authenticated upload'},
  {id:'leaked_password_protection',status:'ADVISOR_WARN',evidence:'Provider security advisor says disabled'},
  {id:'public_signup',status:'STILL_NEEDS_LIVE_RECHECK',evidence:'Last owner screenshot showed signup allowed'},
  {id:'smtp_delivery',status:'NOT_CONFIGURED_OR_TESTED',evidence:'Previous staging SMTP off; current setting not accessible through connector'},
  {id:'callback',status:'BLOCKER',evidence:'Previously observed Site URL still pilot-only, not actual app root'},
  {id:'access_host',status:'NOT_VERIFIED',evidence:'Dashboard host and preview wildcard policy need fresh enforcement check'},
  {id:'real_authenticated_owner_isolation',status:'NOT_TESTED',evidence:'No actual distinct authorized JWT A/B, writes or Storage download/denial'},
  {id:'family_alpha',status:'HOLD',evidence:'No deployment, consented family images or physical phone test'}
 ];
 return Object.freeze({
  observedDate:evidence.observedDate,stageRef:STAGING,prodRef:PRODUCTION,
  domainVerifiedFromOwnerScreenshot:true,customSmtpLiveConfigurationVerified:false,
  ownerOnlyReadPoliciesSimulated:true,genuineJWTAuthorizationTested:false,
  anonymousDenied:true,invitationReady:false,readyForFamilyAlpha:false,
  releaseGate:'HOLD',productionUnchanged:true,secretsCollected:false,liveMailSent:false,
  evidenceLevels:{providerReadOnlySQL:true,ownerResendScreenshot:true,realSMTP:false,realJWT:false,realHost:false},
  checks:checksOut,
  nextAllowedSteps:[
   'Confirm staging signup gating at the Supabase Auth provider, independent of Cloudflare Access',
   'Verify Access protection of exact staging root and every preview alias before redirect changes',
   'Approve staging root URL and configure staging-only Site URL + strict redirect allowlist',
   'Create restricted Resend sending-only key privately; stage SMTP configuration and test email without posting secret',
   'Test confirmation, password reset, expiry/resend to disposable email at protected staging root',
   'Test true 2-user JWT own/foreign backup+photo SELECT/INSERT/UPDATE/DELETE and expiring signed URLs',
   'Only then get explicit release consent and physical phone test'
  ]
 });
}

export async function runStagingSecurityAndEmail({
 evidencePath=SNAPSHOT,artifactDir='dist-family-alpha-staging-auth-hold'
}={}){
 const record=JSON.parse(await readFile(evidencePath,'utf8'));
 const config=await readFile(join(artifactDir,'alpha-stage-config.js'),'utf8');
 const auth=await readFile(join(artifactDir,'auth.js'),'utf8');
 return assessStagingSecurityAndEmail(record,{config,auth});
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length!==2)throw Error('No SMTP/Resend/Supabase secrets, URLs or CLI arguments accepted');
 const report=await runStagingSecurityAndEmail();
 if(report.releaseGate!=='HOLD'||report.invitationReady||report.liveMailSent||
    report.customSmtpLiveConfigurationVerified||report.genuineJWTAuthorizationTested)
  throw Error('Cannot promote provider screenshot or simulated role check to staging release evidence');
 console.log('FAMILY_ALPHA_LIVE_SECURITY_EMAIL_READONLY_HOLD '+JSON.stringify(report,null,2));
}
