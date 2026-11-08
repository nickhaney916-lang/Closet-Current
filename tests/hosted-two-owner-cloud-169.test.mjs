import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {generateKeyPairSync,randomUUID,createSign,createVerify,createHash} from 'node:crypto';
import {
 validateHostedConfig169,runHostedTwoOwner169,decodeUntrustedJWTClaims169,
 FORBIDDEN_PROJECTS_169,ISOLATED_CONSENT_169
} from '../research/hosted-two-owner-cloud-169/hosted-acceptance.mjs';

const REF='isolatedclosettestab';
const ORIGIN='https://'+REF+'.supabase.co';
const PUB='sb_publishable_'+'a'.repeat(25);
const A='11111111-1111-4111-8111-111111111111';
const B='22222222-2222-4222-8222-222222222222';
const users=[{id:A,email:'owner-a@p169.invalid',password:'password-owner-A-p169'},
 {id:B,email:'owner-b@p169.invalid',password:'password-owner-B-p169'}];
const config=()=>({enabled:ISOLATED_CONSENT_169,url:ORIGIN,projectRef:REF,
 publishableKey:PUB,a:{email:users[0].email,password:users[0].password},
 b:{email:users[1].email,password:users[1].password}});
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
const uuid=/^[\da-f]{8}-[\da-f]{4}-[1-8][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;
const sha=data=>createHash('sha256').update(data).digest('hex');

async function launch({exposeOthers=false,permitForeignStorage=false,denySecondAuth=false}={}){
 const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
 const state={privateKey,publicKey,backups:new Map(),objects:new Map(),
  activeRefresh:new Map(),requests:[],bypasses:0,failedSignature:0,loginCount:0};
 const sign=owner=>{
  const h=Buffer.from(JSON.stringify({alg:'RS256',typ:'JWT',kid:'local-p169-only'})).toString('base64url');
  const now=Math.floor(Date.now()/1000),claims={iss:ORIGIN+'/auth/v1',aud:'authenticated',
   role:'authenticated',sub:owner.id,session_id:randomUUID(),iat:now,exp:now+1800};
  const b=Buffer.from(JSON.stringify(claims)).toString('base64url');
  const input=h+'.'+b,signer=createSign('RSA-SHA256');signer.update(input);signer.end();
  const access=input+'.'+signer.sign(privateKey).toString('base64url');
  const refresh='local-refresh-'+randomUUID();
  state.activeRefresh.set(refresh,owner.id);
  return {access_token:access,refresh_token:refresh,user:{id:owner.id}};
 };
 const verify=(authorization)=>{
  const match=/^Bearer ([^. ]+)\.([^. ]+)\.([^. ]+)$/.exec(authorization||'');
  if(!match)return null;
  const input=match[1]+'.'+match[2],v=createVerify('RSA-SHA256');
  v.update(input);v.end();
  if(!v.verify(publicKey,Buffer.from(match[3],'base64url'))){state.failedSignature++;return null;}
  const claims=JSON.parse(Buffer.from(match[2],'base64url').toString('utf8'));
  if(claims.iss!==ORIGIN+'/auth/v1'||claims.aud!=='authenticated'||claims.role!=='authenticated'||
     claims.exp<=Date.now()/1000||!uuid.test(claims.sub))return null;
  return claims.sub;
 };
 const server=createServer(async(req,res)=>{
  let raw=[];
  for await(const chunk of req)raw.push(chunk);
  const bytes=Buffer.concat(raw);
  const url=new URL(req.url,'http://localhost');
  state.requests.push({path:url.pathname,method:req.method,bytes:bytes.length});
  if(req.headers.apikey!==PUB){json(res,401,{error:'invalid API key'});return;}
  if(url.pathname==='/auth/v1/token'&&url.searchParams.get('grant_type')==='password'){
   let body;try{body=JSON.parse(bytes.toString());}catch{json(res,400,{error:'bad JSON'});return;}
   const who=users.find(x=>x.email===body.email&&x.password===body.password);
   if(!who||(denySecondAuth&&who.id===B)){json(res,401,{error:'invalid credentials'});return;}
   state.loginCount++;json(res,200,sign(who));return;
  }
  if(url.pathname==='/auth/v1/token'&&url.searchParams.get('grant_type')==='refresh_token'){
   let body;try{body=JSON.parse(bytes.toString());}catch{json(res,400,{error:'bad JSON'});return;}
   if(!state.activeRefresh.has(body.refresh_token)){json(res,401,{error:'revoked refresh'});return;}
   json(res,200,{access_token:'unexpected'});return;
  }
  const owner=verify(req.headers.authorization);
  if(!owner){json(res,401,{message:'unauthenticated'});return;}
  if(url.pathname==='/auth/v1/logout'){
   for(const [token,id] of state.activeRefresh)if(id===owner)state.activeRefresh.delete(token);
   json(res,200,{});return;
  }
  if(url.pathname==='/rest/v1/closet_backups'&&req.method==='GET'){
   const target=url.searchParams.get('owner_id')?.slice(3)||'';
   const doc=state.backups.get(target);
   json(res,200,doc&&(exposeOthers||target===owner)?[{owner_id:target,revision:doc.revision,document:doc.document}]:[]);return;
  }
  if(url.pathname==='/rest/v1/rpc/save_closet_backup'&&req.method==='POST'){
   let payload;try{payload=JSON.parse(bytes.toString());}catch{json(res,400,{error:'invalid JSON'});return;}
   const existing=state.backups.get(owner),revision=payload.p_expected_revision;
   if(revision===0&&!existing){state.backups.set(owner,{revision:1,document:payload.p_document});json(res,200,1);return;}
   if(existing&&revision===existing.revision){
    state.backups.set(owner,{revision:revision+1,document:payload.p_document});json(res,200,revision+1);return;
   }
   json(res,200,null);return;
  }
  if(url.pathname.startsWith('/storage/v1/object/closet-private/')){
   const relative=url.pathname.slice('/storage/v1/object/closet-private/'.length);
   const [target,filename,extra]=relative.split('/');
   if(extra||!uuid.test(target)||!/^([a-f0-9]{64})\.jpg$/.test(filename||'')){
    json(res,400,{error:'bad key'});return;
   }
   if(target!==owner&&!(permitForeignStorage&&req.method==='POST')){json(res,403,{error:'object not found'});return;}
   const key=target+'/'+filename;
   if(req.method==='POST'){
    if(sha(bytes)!==filename.slice(0,-4)){json(res,400,{error:'invalid source bytes'});return;}
    if(state.objects.has(key)){json(res,409,{error:'existing'});return;}
    state.objects.set(key,bytes);json(res,201,{Key:key});return;
   }
   if(req.method==='GET'){
    const stored=state.objects.get(key);
    if(!stored){json(res,404,{error:'not found'});return;}
    res.writeHead(200,{'Content-Type':'image/jpeg'});res.end(stored);return;
   }
  }
  json(res,404,{error:'route not implemented'});
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const port=server.address().port;
 // Every HTTP call is real localhost TCP. URL maps strictly from a syntactically
 // valid isolated HTTPS hostname. This is NOT Supabase-hosted acceptance.
 const localFetch=(url,options={})=>{
  const expected=new URL(url);
  assert.equal(expected.origin,ORIGIN);
  return fetch('http://127.0.0.1:'+port+expected.pathname+expected.search,options);
 };
 return {localFetch,state,close:()=>new Promise(resolve=>server.close(resolve)),sign};
}
test('P169 blocks current production, existing staging, service-role and absent write consent before any network',()=>{
 const good=config();
 assert.equal(validateHostedConfig169(good).ref,REF);
 for(const ref of FORBIDDEN_PROJECTS_169)
  assert.throws(()=>validateHostedConfig169({...good,projectRef:ref,url:'https://'+ref+'.supabase.co'}),/protected/);
 for(const variant of [
  {...good,enabled:'YES'}, {...good,enabled:undefined},
  {...good,url:'https://'+REF+'.supabase.co.evil.example'},
  {...good,url:'http://'+REF+'.supabase.co'},
  {...good,url:'https://'+REF+'.supabase.co/auth/v1'},
  {...good,url:'https://'+REF+'.supabase.co/?key=abc'},
  {...good,publishableKey:'sb_secret_NOT_FOR_THE_BROWSER'},
  {...good,publishableKey:'eyJhbGciOiJIUzI1NiJ9.fake.jwt'},
  {...good,b:good.a}
 ])assert.throws(()=>validateHostedConfig169(variant));
});
test('P169 full HTTP signed isolated mock proves two owner JWT, CAS, RLS, original JPEG and refresh revocation contract',async()=>{
 const s=await launch();
 try{
  const result=await runHostedTwoOwner169(config(),{fetchImpl:s.localFetch});
  assert.equal(result.verdict,'PASS');
  assert.equal(result.privateOwners,2);
  assert.equal(result.genuineHostedAuthIssuer,true); // issuer format in local synthetic fixture, NOT hosted acceptance
  assert.equal(result.realPostgrestStorage,true); // API contract is emulated at local TCP, NOT remote Supabase
  assert.equal(result.steps.length,10);
  assert.equal(s.state.backups.size,2);
  assert.equal(s.state.objects.size,2);
  assert.equal(s.state.activeRefresh.size,0);
  assert.ok(s.state.requests.some(x=>x.path.includes('/rpc/save_closet_backup')));
  assert.ok(s.state.requests.some(x=>x.path.startsWith('/storage/v1/object/closet-private/')));
  assert.equal(result.familyAlpha,'HOLD');
  assert.equal(result.fullHostedAlphaRelease,false);
 }finally{await s.close();}
});
test('P169 aborts and does not claim success if HTTP RLS exposes other owner backup',async()=>{
 const s=await launch({exposeOthers:true});
 try{await assert.rejects(runHostedTwoOwner169(config(),{fetchImpl:s.localFetch}),/cross-owner backup SELECT exposed/);}
 finally{await s.close();}
});
test('P169 aborts and does not claim success if Storage permits cross-owner writes',async()=>{
 const s=await launch({permitForeignStorage:true});
 try{await assert.rejects(runHostedTwoOwner169(config(),{fetchImpl:s.localFetch}),/cross-owner Storage INSERT unexpectedly succeeded/);}
 finally{await s.close();}
});
test('P169 aborts incomplete hosted access when second owner cannot authenticate',async()=>{
 const s=await launch({denySecondAuth:true});
 try{
  await assert.rejects(runHostedTwoOwner169(config(),{fetchImpl:s.localFetch}),/auth login HTTP policy violation/);
  assert.equal(s.state.backups.size,0);
  assert.equal(s.state.objects.size,0);
 }finally{await s.close();}
});
test('P169 rejects unsigned/forged bearer syntax, no trust in user-controlled JWT claims',async()=>{
 const s=await launch();
 try{
  const fake='fake.header.payload',response=await s.localFetch(ORIGIN+'/rest/v1/closet_backups?owner_id=eq.'+B,{
   headers:{apikey:PUB,Authorization:'Bearer '+fake}
  });assert.equal(response.status,401);
  const t=s.sign(users[0]);
  const parts=t.access_token.split('.');
  const payload=JSON.parse(Buffer.from(parts[1],'base64url').toString());payload.sub=B;
  const tampered=parts[0]+'.'+Buffer.from(JSON.stringify(payload)).toString('base64url')+'.'+parts[2];
  const rejected=await s.localFetch(ORIGIN+'/rest/v1/closet_backups?owner_id=eq.'+B,{
   headers:{apikey:PUB,Authorization:'Bearer '+tampered}});
  assert.equal(rejected.status,401);
  assert.ok(s.state.failedSignature>=1);
  assert.equal(decodeUntrustedJWTClaims169(t.access_token).subject,A);
 }finally{await s.close();}
});
