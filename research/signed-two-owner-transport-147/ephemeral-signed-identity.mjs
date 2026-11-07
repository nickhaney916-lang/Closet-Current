/**
 * P147 — ephemeral, cryptographically signed local two-owner research identity.
 *
 * This is NOT Supabase Auth, not a hosted JWT issuing key and not a change to
 * an existing account. RSA private keys exist only in the disposable Node
 * test process, never in a repository, client, fixture or GitHub artifact.
 * A p146-specific prefix remains required by the research-only browser
 * adapter; the compact JWT inside the envelope is RS256-verifiable.
 */
import {createSign,createVerify,generateKeyPairSync,randomUUID} from 'node:crypto';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PREFIX='p146-synthetic-local-only-';
const b64=x=>Buffer.from(typeof x==='string'?x:JSON.stringify(x)).toString('base64url');
const json=x=>JSON.parse(Buffer.from(x,'base64url').toString('utf8'));
const invalid=()=>{const e=Error('P147 cryptographic identity denied');e.code='signed-auth-denied';throw e;};
export function createEphemeralSignedIdentity147({
 issuer='https://local-research.invalid/closet-current-p147',
 audience='authenticated',now=()=>Math.floor(Date.now()/1000)
}={}){
 const keys=generateKeyPairSync('rsa',{modulusLength:2048,
  publicKeyEncoding:{type:'spki',format:'pem'},
  privateKeyEncoding:{type:'pkcs8',format:'pem'}});
 const sessions=new Map();
 let verified=0,denied=0;
 const issue=(sub,{expiresIn=600,notBefore=0,role='authenticated',aud=audience,
  issuerOverride=issuer,userMetadata={},sessionId=randomUUID()}={})=>{
  if(!UUID.test(sub)||!UUID.test(sessionId))invalid();
  const nowSec=now(),claims={iss:issuerOverride,aud,sub,role,iat:nowSec,
   nbf:nowSec+notBefore,exp:nowSec+expiresIn,session_id:sessionId,
   jti:randomUUID(),user_metadata:userMetadata};
  const h=b64({alg:'RS256',typ:'JWT',kid:'p147-ephemeral-only'});
  const p=b64(claims),data=h+'.'+p;
  const signature=createSign('RSA-SHA256').update(data).end().sign(keys.privateKey).toString('base64url');
  if(expiresIn>0&&notBefore<=0&&role==='authenticated'&&aud===audience&&issuerOverride===issuer)
   sessions.set(sessionId,sub);
  return PREFIX+data+'.'+signature;
 };
 function verify(token){
  try{
   if(typeof token!=='string'||!token.startsWith(PREFIX)||token.length>7000)invalid();
   const parts=token.slice(PREFIX.length).split('.');
   if(parts.length!==3||parts.some(p=>!p||!/^[A-Za-z0-9_-]+$/.test(p)))invalid();
   const [h,p,s]=parts,header=json(h),body=json(p);
   if(header.alg!=='RS256'||header.typ!=='JWT'||header.kid!=='p147-ephemeral-only')invalid();
   const ok=createVerify('RSA-SHA256').update(h+'.'+p).end().verify(keys.publicKey,Buffer.from(s,'base64url'));
   if(!ok||body.iss!==issuer||body.aud!==audience||body.role!=='authenticated'||
      !UUID.test(body.sub||'')||!UUID.test(body.session_id||'')||
      !Number.isSafeInteger(body.iat)||!Number.isSafeInteger(body.nbf)||
      !Number.isSafeInteger(body.exp)||body.iat>now()+30||
      body.nbf>now()||body.exp<=now()||body.exp<=body.iat||
      sessions.get(body.session_id)!==body.sub)invalid();
   verified++;
   // The owner is derived from the verified sub ONLY. User-editable
   // user_metadata, e-mail and HTTP query inputs are never authorization.
   return Object.freeze({ownerId:body.sub,sessionId:body.session_id});
  }catch(e){
   denied++;
   invalid();
  }
 }
 function authenticate(req){
  const h=req?.headers?.authorization;
  if(typeof h!=='string'||!h.startsWith('Bearer '))return reject();
  try{return verify(h.slice(7));}catch{return null;}
 }
 function reject(){denied++;return null;}
 function revoke(sessionId){sessions.delete(sessionId);}
 return Object.freeze({issue,verify,authenticate,revoke,
  stats:()=>Object.freeze({verified,denied,activeSessions:sessions.size,
   keyAlgorithm:'RSA-2048 / RS256',privateKeyExported:false,
   hostedSupabaseSignedJWT:false,localResearchOnly:true,familyAlpha:'HOLD'})});
}
