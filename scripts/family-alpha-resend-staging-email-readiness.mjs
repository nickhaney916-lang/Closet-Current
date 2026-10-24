/**
 * Family Alpha v0.1 Resend/Supabase SMTP readiness checkpoint.
 *
 * Historical, owner-observed UI evidence only. Zero outbound requests.
 * Does not open Supabase settings or handle Resend SMTP API keys.
 * Never mark delivery / authorization / release as verified from a screenshot.
 */
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

export const SNAPSHOT='research/family-alpha-email/staging-resend-observed-20261023.json';
export const STAGE_REF='fbnplztkbsteuzrmbgib';
export const PROD_REF='hlkgymugtfbirlpunsra';
export const ROOT_CALLBACK='https://closet-current-staging.pages.dev/';
export const PILOT_CALLBACK='https://pilot-access-check.closet-current-staging.pages.dev/';
export const EXPECTED_PUBLIC_SMTP=Object.freeze({
 host:'smtp.resend.com',port:465,username:'resend',
 senderName:'Closet Current',senderEmail:'accounts@mail.closet-current.com'
});
const out=(id,status,description)=>Object.freeze({id,status,description});

export function assessRecordedEmailReadiness(record,code){
 if(!record||record.schemaVersion!==1||record.snapshotType!==
  'owner-supplied screenshots; no live settings API or DNS queries'||
  record.releaseGate!=='HOLD'||record.authorizedMutations!==false)
  throw Error('Refusing unsupported live SMTP/security verification claim');
 const {domain,email,staging,production}=record;
 if(!domain||!email||!staging||!production||
    staging.projectRef!==STAGE_REF||production.projectRef!==PROD_REF||
    production.mustRemainUnchanged!==true)
  throw Error('Incorrect staging/production project boundary');
 if(domain.registeredDomain!=='closet-current.com'||
   domain.sendingDomain!=='mail.closet-current.com'||
   domain.mailFromProposed!==EXPECTED_PUBLIC_SMTP.senderEmail)
  throw Error('Unexpected sending domain or sender');
 if(domain.resendVerification!=='PENDING'||domain.dnsLiveVerifiedByResend!==false||
    domain.dnsAuthoritativePubliclyQueried!==false)
  throw Error('Historical evidence cannot certify live DNS or Resend verification');
 if(!Array.isArray(domain.dnsRecordsScreenshotObserved)||
   domain.dnsRecordsScreenshotObserved.length!==3)
  throw Error('Three public DNS records must be evidenced');
 const types=domain.dnsRecordsScreenshotObserved.map(x=>x.type+':'+x.name);
 for(const item of ['TXT:resend._domainkey.mail','CNAME:rsend.mail','CNAME:send.mail']){
  if(types.filter(x=>x===item).length!==1)throw Error('Missing or duplicated observed DNS name: '+item);
 }
 const dk=domain.dnsRecordsScreenshotObserved.find(x=>x.type==='TXT');
 if(dk.value!=='NOT_STORED_PUBLIC_DKIM_VALUE')throw Error('No full DKIM material stored in this historical report');
 for(const [name,target] of [['rsend.mail','rsend.forge.rmta.net'],['send.mail','send.forge.rmta.net']]){
  const hit=domain.dnsRecordsScreenshotObserved.find(x=>x.name===name);
  if(hit.target!==target||hit.cloudflareProxy!=='DNS only')
   throw Error('Public CNAMEs do not match observed Resend record instructions');
 }
 const allowed=email.resendSmtpPublicConfig;
 if(!allowed||allowed.host!==EXPECTED_PUBLIC_SMTP.host||allowed.port!==465||
   allowed.username!=='resend'||allowed.senderName!==EXPECTED_PUBLIC_SMTP.senderName)
  throw Error('Unexpected public Resend SMTP integration settings');
 if(email.customSmtpCurrentlyEnabled!==false||email.smtpKeyConfigured!==false||
    email.smtpKeyGenerated!==false||email.testEmailSent!==false||
    email.mailDeliveryTested!==false||email.apiKeyInRepo!==false)
  throw Error('No private SMTP credentials or live delivery tests were authorized');
 if(staging.currentSiteUrlObserved!==PILOT_CALLBACK||
   staging.currentRedirectAllowlistObserved?.length!==1||
   staging.currentRedirectAllowlistObserved[0]!==PILOT_CALLBACK||
   staging.rootRedirectAbsentFromObservedList!==true)
  throw Error('Observed redirect allowlist changed: refresh evidence, do not guess');
 if(staging.actualStagedAppDeployed!==false||
    staging.actualSignedInSupabaseTest!==false||
    staging.accountSignupAllowed!==true||
    staging.confirmEmailEnabled!==true||
    staging.anonymousSignInsEnabled!==false)
  throw Error('Observed Auth policies or staged deployment must be reverified');
 if(typeof code!=='string'||!code.includes('const EMAIL_REDIRECT=')||
    !code.includes("const STORE='closet-current-auth-v1';")||
    !code.includes("const APP_URL='https://nickhaney916-lang.github.io/Closet-Current/';"))
  throw Error('Production Auth source changed: review routing before staged SMTP setup');
 const checks=[
  out('resend.domain-verification','PENDING',
   'Resend has not marked mail.closet-current.com Verified; DNS propagation/status unconfirmed'),
  out('resend.smtp-auth','NOT CONFIGURED',
   'No Resend SMTP API key created/installed; do not put SMTP keys in frontend or repository'),
  out('staging.smtp','DISABLED',
   'Staging Supabase still uses limited built-in Auth mail; never edit production SMTP'),
  out('staging.auth-redirect','BLOCKER',
   'Supabase Site URL and only observed redirect point to harmless pilot-access-check preview, NOT the actual root staging app'),
  out('staging.app-activation','BLOCKER',
   'Staging Auth build is default HOLD with no approved publishable key or matching callback; live app not deployed'),
  out('staging.account-registration','REVIEW',
   'Email signup is enabled and a public Supabase Auth endpoint may be reachable even behind Cloudflare Access'),
  out('staging.email-end-to-end','NOT VERIFIED',
   'Confirmation, recovery, expired-link/resend and email deliverability on synthetic identities not tested'),
  out('staging.private-account-permissions','NOT VERIFIED',
   'Live A/B JWT backup/private JPEG Storage owner isolation not verified'),
  out('physical-family-alpha','NOT VERIFIED',
   'No actual family accounts/phones or original personal garment photos tested')
 ];
 return Object.freeze({
  releaseGate:'HOLD',reusablePublicSmtpConfig:EXPECTED_PUBLIC_SMTP,
  domainVerification:'PENDING',stageRef:STAGE_REF,
  stageRedirectObserved:PILOT_CALLBACK,proposedRootRedirect:ROOT_CALLBACK,
  actualEmailSent:false,realBackendAuthorizationTested:false,readyToInvite:false,
  readOnly:true,privacyNoKeysStored:true,
  checks:Object.freeze(checks),
  nextActions:Object.freeze([
   'Wait for Resend to report Verified; if DNS fails, review exact DKIM and two Resend CNAME records',
   'Approve the real protected staging application hostname and callback; keep pilot-only page separate',
   'Create narrowly scoped Resend sending SMTP credential in provider dashboard; never paste into chat/GitHub/frontend',
   'Configure sender and SMTP fields in separate staging Supabase Auth ONLY, after domain verification',
   'Perform disposable user confirmation, resend and recovery tests and check callback/Access behavior',
   'Restrict public direct signup abuse and verify account-level RLS/storage with synthetic users before Family Alpha'
  ])
 });
}
export async function runRecordedEmailReadiness({
 snapshotPath=SNAPSHOT,authSourcePath='public/auth.js'
}={}){
 const [input,code]=await Promise.all([
  readFile(snapshotPath,'utf8'),readFile(authSourcePath,'utf8')
 ]);
 return assessRecordedEmailReadiness(JSON.parse(input),code);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length!==2)throw Error('Only offline evidence; no credentials/URLs/SMTP keys accepted');
 const report=await runRecordedEmailReadiness();
 if(report.releaseGate!=='HOLD'||report.readyToInvite!==false||
    report.domainVerification!=='PENDING'||report.actualEmailSent!==false)
  throw Error('Never promote historical screenshots to verified SMTP delivery');
 console.log('FAMILY_ALPHA_RESEND_STAGING_EMAIL_HOLD '+JSON.stringify(report,null,2));
 console.log('No DNS/API/SMTP network requests made; no secrets; no staging/production changes.');
}
