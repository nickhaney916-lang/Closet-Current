// Actual local GoTrue -> Mailpit email -> one-time verification -> recovery.
// Never connects to hosted Supabase, never follows email links to a public app.
// All email accounts, credentials and links are disposable and never logged.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {github,cloudflare} from './configure-disposable-auth-email.mjs';

const api=(process.env.API_URL||'').replace(/\/$/,'');
const mail='http://127.0.0.1:54324';
if(process.env.CI!=='true'||
 !/^http:\/\/(127\.0\.0\.1|localhost):54321$/.test(api)||
 !process.env.ANON_KEY||process.env.ANON_KEY.length<10)
 throw Error('Refusing any non-local Supabase authentication test');
const headers={apikey:process.env.ANON_KEY,'Content-Type':'application/json'};
async function jsonFetch(url,{method='GET',body,auth}={}) {
 const parsed=new URL(url);
 if(!['http://127.0.0.1:54321','http://localhost:54321',mail].includes(parsed.origin))
  throw Error('Test attempted to leave disposable loopback network');
 const response=await fetch(url,{method,redirect:'manual',
  signal:AbortSignal.timeout(12000),headers:{
   ...(parsed.origin===mail?{}:headers),
   ...(auth?{Authorization:'Bearer '+auth}:{})
  },...(body===undefined?{}:{body:JSON.stringify(body)})});
 let json=null;
 const text=await response.text();
 if(text){try{json=JSON.parse(text)}catch{/* link responses can be empty */}}
 return {response,json};
}
function requireOk(result,label) {
 assert.ok(result.response.ok,label+' returned '+result.response.status);
 assert.ok(result.json&&typeof result.json==='object',label+' returned an invalid body');
 return result.json;
}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function emailFor(address,kind,previous=new Set()){
 for(let attempt=0;attempt<25;attempt++){
  const list=requireOk(await jsonFetch(mail+'/api/v1/messages'),'local Mailpit inbox');
  const messages=Array.isArray(list.messages)?list.messages:
   Array.isArray(list.Messages)?list.Messages:[];
  const found=messages.find(m=>!previous.has(m.ID)&&Array.isArray(m.To)&&
   m.To.some(t=>t.Address?.toLowerCase()===address.toLowerCase())&&
   new RegExp(kind,'i').test(m.Subject||''));
  if(found){
   const msg=requireOk(await jsonFetch(mail+'/api/v1/message/'+encodeURIComponent(found.ID)),
    'local '+kind+' email');
   const body=[msg.HTML,msg.Text].filter(x=>typeof x==='string').join('\n');
   const links=[...body.matchAll(/(?:href=["']([^"']+)["']|https?:\/\/[^\s<>"']+)/g)]
    .map(m=>m[1]||m[0]).map(x=>x.replaceAll('&amp;','&').replaceAll('&#38;','&'));
   const chosen=links.map(x=>{try{return new URL(x)}catch{return null}})
    .find(u=>u&&u.pathname==='/auth/v1/verify'&&
     (u.hostname==='127.0.0.1'||u.hostname==='localhost')&&u.port==='54321');
   assert.ok(chosen,'local '+kind+' email has no local verification link');
   assert.ok(chosen.searchParams.get('token')||
    chosen.searchParams.get('token_hash'),'local verification link token missing');
   return {url:chosen,seen:new Set([...previous,found.ID])};
  }
  await sleep(400);
 }
 throw Error('Local '+kind+' mail not captured within bounded attempts');
}
async function callback(link,expectedBase,label){
 const u=link.url;
 if(u.searchParams.has('redirect_to'))
  assert.equal(u.searchParams.get('redirect_to'),expectedBase,
   label+' link lost its allowlisted destination');
 const res=await fetch(u.href,{redirect:'manual',signal:AbortSignal.timeout(12000)});
 assert.ok([301,302,303,307,308].includes(res.status),
  label+' verification was not an HTTP redirect');
 const location=res.headers.get('location')||'';
 const destination=new URL(location,u);
 assert.equal(destination.origin+destination.pathname,expectedBase,
  label+' verification redirected to wrong host');
 const params=new URLSearchParams(destination.hash.replace(/^#/,''));
 const token=params.get('access_token');
 assert.ok(token&&token.length>20,label+' produced no implicit session access token');
 assert.ok(params.get('refresh_token'),label+' produced no refresh token');
 return {access:token,refresh:params.get('refresh_token')};
}
async function login(email,password) {
 const result=await jsonFetch(api+'/auth/v1/token?grant_type=password',{method:'POST',
  body:{email,password}});
 return result;
}
function summarizeFlags(value) {
 // Never include tokens, user IDs, email addresses, secrets or email contents.
 return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,!!v]));
}
export async function run() {
 const id=randomUUID().replaceAll('-','').slice(0,16);
 const a='local-auth-'+id+'-a@example.invalid';
 const b='local-auth-'+id+'-b@example.invalid';
 const firstPassword='SyntheticOnly!2026-First-Secret';
 const secondPassword='SyntheticOnly!2026-Second-Secret';
 const changedPassword='SyntheticOnly!2026-Recovered-Secret';
 const flags={realAuth:false,localMailCaptured:false,
  githubConfirmation:false,cloudflareConfirmation:false,
  unconfirmedLoginRejected:false,confirmedLogin:true,
  ownerIdentityVerified:false,usedLinkRejected:false,
  recoveryMailCaptured:false,recoveryCallback:false,
  passwordUpdated:false,oldPasswordRejected:false,
  newPasswordLogin:false,hostedAccess:false};
 const signup=async(email,password,redirect)=>{
  const result=await jsonFetch(api+'/auth/v1/signup?redirect_to='+
   encodeURIComponent(redirect),{method:'POST',body:{email,password}});
  const data=requireOk(result,'local signup');
  // Raw GoTrue /signup returns a user directly when email confirmation is
  // required; SDK wrappers can nest it under `user`. Accept either shape.
  const ownerId=data.user?.id||data.id;
  assert.ok(typeof ownerId==='string'&&ownerId.length>10,
   'real Auth user missing');
  assert.ok(!data.access_token,'unconfirmed account received active session');
  return ownerId;
 };
 const alice=await signup(a,firstPassword,github);
 const blocked=await login(a,firstPassword);
 assert.ok([400,401,403,422].includes(blocked.response.status),
  'Unconfirmed user could sign in before email verification');
 flags.unconfirmedLoginRejected=true;
 const signupMail=await emailFor(a,'confirm');
 flags.realAuth=true;flags.localMailCaptured=true;
 const aToken=await callback(signupMail,github,'signup');
 flags.githubConfirmation=true;
 const userA=requireOk(await jsonFetch(api+'/auth/v1/user',{auth:aToken.access}),
  'authenticated owner after email confirmation');
 assert.equal(userA.id,alice);flags.ownerIdentityVerified=true;
 const firstLogin=requireOk(await login(a,firstPassword),'verified signup login');
 assert.equal(firstLogin.user?.id,alice);flags.confirmedLogin=true;
 // A used link must not create another session; don't follow its redirect.
 const replay=await fetch(signupMail.url.href,{redirect:'manual',
  signal:AbortSignal.timeout(12000)});
 assert.ok([301,302,303,307,308,400,401,403].includes(replay.status));
 const replayTarget=new URL(replay.headers.get('location')||api,api);
 assert.ok(replay.status>=400||
  !new URLSearchParams(replayTarget.hash.replace(/^#/,'')).get('access_token'),
  'Used confirmation link minted a new token');
 flags.usedLinkRejected=true;

 const bob=await signup(b,secondPassword,cloudflare);
 const secondMail=await emailFor(b,'confirm');
 const bToken=await callback(secondMail,cloudflare,'second signup');
 const userB=requireOk(await jsonFetch(api+'/auth/v1/user',{auth:bToken.access}),
  'Cloudflare callback authenticated owner');
 assert.equal(userB.id,bob);assert.notEqual(bob,alice);
 flags.cloudflareConfirmation=true;

 const recoveryResponse=await jsonFetch(api+'/auth/v1/recover?redirect_to='+
  encodeURIComponent(cloudflare),{method:'POST',body:{email:a}});
 requireOk(recoveryResponse,'local recovery mail request');
 const recoveryMail=await emailFor(a,'reset|recover',signupMail.seen);
 flags.recoveryMailCaptured=true;
 const resetSession=await callback(recoveryMail,cloudflare,'password recovery');
 flags.recoveryCallback=true;
 const changed=requireOk(await jsonFetch(api+'/auth/v1/user',{
  method:'PUT',auth:resetSession.access,body:{password:changedPassword}
 }),'reset password');
 assert.equal(changed.id,alice);flags.passwordUpdated=true;
 const old=await login(a,firstPassword);
 assert.ok([400,401,403,422].includes(old.response.status),
  'Old password accepted after reset');
 flags.oldPasswordRejected=true;
 const newSession=requireOk(await login(a,changedPassword),'updated password login');
 assert.equal(newSession.user?.id,alice);flags.newPasswordLogin=true;
 console.log('LOCAL_SUPABASE_MAILPIT_AUTH '+JSON.stringify(summarizeFlags(flags)));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 run().catch(e=>{
  // Never print dynamic provider response, raw link, local tokens or emails.
  console.error('LOCAL_AUTH_EMAIL_QA_FAILED '+String(e?.message||'unknown')
   .replaceAll(/https?:\/\/\S+/g,'[local-link]').slice(0,180));
  process.exitCode=1;
 });
}
