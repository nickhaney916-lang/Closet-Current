// Conservative, READ-ONLY external email/domain readiness audit.
// Never requests a sign-in, sends an email, changes Supabase settings or reports keys.
import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

export const DEPLOYMENTS=Object.freeze([
 {name:'cloudflare',origin:'https://closet-current.pages.dev',base:'/'},
 {name:'githubPages',origin:'https://nickhaney916-lang.github.io',base:'/Closet-Current/'}
]);
const EXPECTED_SUPABASE='https://hlkgymugtfbirlpunsra.supabase.co';
const origin = value => {
 try {return new URL(value).origin;} catch {return null;}
};
const onlyString=(source,label)=>{
 const found=source.match(new RegExp("const "+label+"='([^']+)'"));
 if(!found)throw Error('Expected '+label+' not present in inspected source');
 return found[1];
};
function publicSettings(payload){
 // GoTrue's public settings may differ across versions. Never infer missing
 // flags or disclose unexpected fields, tokens or operator email addresses.
 const data=payload&&typeof payload==='object'&&!Array.isArray(payload)?payload:{};
 const enabled=data.external&&typeof data.external==='object'?
  data.external.email:undefined;
 return {
  emailProviderEnabled:typeof enabled==='boolean'?enabled:null,
  signupEnabled:typeof data.disable_signup==='boolean'?!data.disable_signup:null,
  autoConfirmEmail:typeof data.mailer_autoconfirm==='boolean'?
   data.mailer_autoconfirm:null
 };
}
export async function auditLiveEmailDomains({fetchImpl,source,deployments=DEPLOYMENTS}){
 if(typeof fetchImpl!=='function')throw Error('A GET-only fetch implementation is required');
 const auth=onlyString(source,'URL');
 const key=onlyString(source,'KEY');
 const configuredRedirect=onlyString(source,'APP_URL');
 if(origin(auth)!==EXPECTED_SUPABASE)throw Error('Source uses an unexpected Auth project');
 const output={audit:'read-only-public-http',deployments:{},
  configuredRedirect,documentedSharedApp:deployments[0].origin+deployments[0].base,
  redirectMatchesSharedApp:configuredRedirect===deployments[0].origin+deployments[0].base,
  publicAuth:{reachable:false,httpStatus:null,emailProviderEnabled:null,
   signupEnabled:null,autoConfirmEmail:null},
  adminRedirectAllowlistVerified:false,customSmtpVerified:false,
  externalInboxDeliveryVerified:false,productionReleaseApproved:false};
 const get=async(url,headers={})=>{
  try{
   const res=await fetchImpl(url,{method:'GET',redirect:'manual',cache:'no-store',
    signal:AbortSignal.timeout(12000),headers});
   const status=Number(res.status)||null;
   if(status!==200)return {status,ok:false,text:''};
   // Discard unexpected or oversized data, do not echo remote response bodies.
   const text=await res.text();
   if(typeof text!=='string'||text.length>240000)return {status,ok:false,text:''};
   return {status,ok:true,text};
  }catch{return {status:null,ok:false,text:''};}
 };
 for(const deployment of deployments){
  const landing=await get(deployment.origin+deployment.base);
  const script=await get(deployment.origin+deployment.base+'auth.js');
  const sourcePresent=script.ok&&script.text.includes('closetAuth')&&
   script.text.includes(EXPECTED_SUPABASE);
  const match=script.ok?script.text.match(/const APP_URL='([^']+)'/):null;
  const destination=match?.[1]||null;
  output.deployments[deployment.name]={
   landingHttpStatus:landing.status,scriptHttpStatus:script.status,
   landingIsClosetCurrent:landing.ok&&/Closet Current/i.test(landing.text)&&
     landing.text.includes('id="authGate"'),
   authClientPresent:!!sourcePresent,
   clientEmailRedirect:sourcePresent?destination:null,
   redirectsToSameDeployment:sourcePresent?
    destination===deployment.origin+deployment.base:null
  };
 }
 const settings=await get(auth+'/auth/v1/settings',{apikey:key});
 output.publicAuth.httpStatus=settings.status;
 if(settings.ok){
  try{
   const filtered=publicSettings(JSON.parse(settings.text));
   Object.assign(output.publicAuth,filtered);
   output.publicAuth.reachable=true;
  }catch{/* malformed public response; leave flags unknown */}
 }
 output.liveHttpEvidenceComplete=Object.values(output.deployments).every(d=>
  d.landingIsClosetCurrent&&d.authClientPresent)&&output.publicAuth.reachable;
 // Public settings cannot prove Auth dashboard allowlists, SMTP secrets,
 // sender reputation or real external inbox delivery.
 output.releaseDecision='BLOCKED';
 output.releaseBlockers=[
  ...(!output.redirectMatchesSharedApp?['source-redirect-differs-from-shared-app']:[]),
  ...(!output.liveHttpEvidenceComplete?['external-http-proof-incomplete']:[]),
  'auth-dashboard-allowlist-not-verified',
  'smtp-and-external-inbox-not-verified',
  'owner-approval-and-real-device-tests-outstanding'
 ];
 return output;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if(process.env.CI!=='true'||process.argv[2]!=='--live-readonly')
  throw Error('Only an explicit GitHub CI read-only probe is supported');
 const source=await readFile('public/auth.js','utf8');
 const result=await auditLiveEmailDomains({fetchImpl:fetch,source});
 // Diagnostic never contains the fetched Auth response body, API key, user
 // identifier, customer data, JWT, password, SMTP setting or email address.
 console.log('CLOSET_EMAIL_DOMAIN_READONLY '+JSON.stringify(result));
 if(result.releaseDecision!=='BLOCKED')throw Error('Release veto unexpectedly missing');
}
