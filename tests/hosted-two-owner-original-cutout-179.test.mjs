import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {generateKeyPairSync,randomUUID,createSign,createVerify,createHash} from 'node:crypto';
import {runHostedOriginalCutout179,prepareSource179,ACCEPTANCE_179}
 from '../research/hosted-two-owner-original-cutout-179/hosted-acceptance.mjs';
import {validateHostedConfig169,ISOLATED_CONSENT_169,FORBIDDEN_PROJECTS_169}
 from '../research/hosted-two-owner-cloud-169/hosted-acceptance.mjs';
const REF='isolatedclosettestab',BASE='https://'+REF+'.supabase.co',KEY='sb_publishable_'+'z'.repeat(25);
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
const people=[{id:A,email:'ownerA@local.invalid',password:'test-strong-owner-A'},
 {id:B,email:'ownerB@local.invalid',password:'test-strong-owner-B'}];
const config=()=>({enabled:ISOLATED_CONSENT_169,projectRef:REF,url:BASE,
 publishableKey:KEY,a:{email:people[0].email,password:people[0].password},
 b:{email:people[1].email,password:people[1].password}});
const sha=x=>createHash('sha256').update(x).digest('hex');
const json=(res,status,x)=>{res.writeHead(status,{'content-type':'application/json'});res.end(JSON.stringify(x));};
async function localProvider(options={}){
 const key=generateKeyPairSync('rsa',{modulusLength:2048}),db=new Map(),objects=new Map(),refresh=new Map();
 const tokens=new Map(),calls=[];
 function sign(id){
  const header=Buffer.from(JSON.stringify({typ:'JWT',alg:'RS256',kid:'local-p179'})).toString('base64url');
  const now=Math.floor(Date.now()/1000);
  const claims=Buffer.from(JSON.stringify({iss:BASE+'/auth/v1',aud:'authenticated',role:'authenticated',
   sub:id,session_id:randomUUID(),iat:now,exp:now+3600})).toString('base64url');
  const msg=header+'.'+claims,signer=createSign('RSA-SHA256');signer.update(msg);signer.end();
  const access=msg+'.'+signer.sign(key.privateKey).toString('base64url'),rt='local-refresh-'+randomUUID();
  tokens.set(access,id);refresh.set(rt,id);return {access_token:access,refresh_token:rt,user:{id}};
 }
 function identity(req){
  const token=req.headers.authorization?.replace(/^Bearer /,'')||'',parts=token.split('.');
  if(parts.length!==3||!tokens.has(token))return null;
  try{
   const v=createVerify('RSA-SHA256');v.update(parts[0]+'.'+parts[1]);v.end();
   if(!v.verify(key.publicKey,Buffer.from(parts[2],'base64url')))return null;
   const c=JSON.parse(Buffer.from(parts[1],'base64url').toString());
   return c.aud==='authenticated'&&c.role==='authenticated'&&c.iss===BASE+'/auth/v1'&&
    c.exp>Date.now()/1000&&tokens.get(token)===c.sub?c.sub:null;
  }catch{return null;}
 }
 const server=createServer(async(req,res)=>{
  const url=new URL(req.url,'http://127.0.0.1'),p=url.pathname;
  const buffers=[];for await(const chunk of req)buffers.push(chunk);
  const data=Buffer.concat(buffers);
  calls.push({path:p,method:req.method,bytes:data.length});
  if(req.headers.apikey!==KEY){json(res,401,{error:'bad key'});return;}
  if(p==='/auth/v1/token'){
   let x={};try{x=JSON.parse(data.toString());}catch{}
   if(url.searchParams.get('grant_type')==='refresh_token'){
    json(res,refresh.has(x.refresh_token)?200:401,refresh.has(x.refresh_token)?
     {access_token:'not-revoked'}:{error:'revoked'});return;
   }
   const person=people.find(o=>o.email===x.email&&o.password===x.password);
   json(res,person?200:401,person?sign(person.id):{error:'bad credentials'});return;
  }
  const who=identity(req);
  if(!who){json(res,401,{error:'unsigned bearer'});return;}
  if(p==='/auth/v1/user'){json(res,200,{id:options.wrongAuth&&who===B?A:who});return;}
  if(p==='/auth/v1/logout'){
   if(!options.failedLogout)for(const [token,id] of refresh)if(id===who)refresh.delete(token);
   json(res,200,{});return;
  }
  if(p==='/rest/v1/closet_backups'&&req.method==='GET'){
   const owner=url.searchParams.get('owner_id')?.slice(3),row=db.get(owner);
   json(res,200,row&&(who===owner||options.leakDocument)?[
    {owner_id:owner,revision:row.revision,document:row.document}]:[]);return;
  }
  if(p==='/rest/v1/rpc/save_closet_backup'&&req.method==='POST'){
   let x={};try{x=JSON.parse(data.toString());}catch{}
   const previous=db.get(who);
   if(x.p_expected_revision===0&&!previous){
    db.set(who,{revision:1,document:x.p_document});json(res,200,1);return;
   }
   if(previous&&x.p_expected_revision===previous.revision){
    db.set(who,{revision:previous.revision+1,document:x.p_document});
    json(res,200,previous.revision+1);return;
   }
   json(res,200,null);return;
  }
  if(p.startsWith('/storage/v1/object/closet-private/')){
   const path=p.slice('/storage/v1/object/closet-private/'.length);
   const m=/^([a-f0-9-]{36})\/([a-f0-9]{64})\.jpg$/.exec(path);
   if(!m){json(res,400,{error:'path'});return;}
   if(m[1]!==who&&!(options.leakStorage&&req.method==='GET')&&
      !(options.allowForeignUpload&&req.method==='POST')){json(res,403,{error:'denied'});return;}
   if(req.method==='POST'){
    if(sha(data)!==m[2]){json(res,400,{error:'source tampered'});return;}
    if(objects.has(path)){json(res,409,{error:'pre-existing'});return;}
    objects.set(path,Buffer.from(data));json(res,201,{key:path});return;
   }
   if(req.method==='GET'){
    const b=objects.get(path);
    if(!b){json(res,404,{error:'missing'});return;}
    res.writeHead(200,{'content-type':'image/jpeg'});res.end(b);return;
   }
  }
  json(res,404,{error:'not found'});
 });
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 const port=server.address().port;
 const fetchImpl=(url,opts)=>{const u=new URL(url);
  assert.equal(u.origin,BASE,'hosted runner cannot leave explicit isolated ref');
  return fetch('http://127.0.0.1:'+port+u.pathname+u.search,opts);
 };
 return {fetchImpl,db,objects,refresh,calls,close:()=>new Promise(ok=>server.close(ok))};
}
test('P179 forbids production, existing staging and missing explicit disposable permission before network',async()=>{
 const good=config();assert.equal(validateHostedConfig169(good).ref,REF);
 assert.deepEqual(ACCEPTANCE_179.forbiddenProjectRefs,FORBIDDEN_PROJECTS_169);
 for(const id of FORBIDDEN_PROJECTS_169){
  await assert.rejects(runHostedOriginalCutout179({...good,projectRef:id,url:'https://'+id+'.supabase.co'},
   {fetchImpl:()=>{throw Error('network must never be reached');}}),/protected/);
 }
 for(const change of [
  {...good,enabled:undefined},{...good,enabled:'please'},
  {...good,publishableKey:'sb_secret_private'},
  {...good,url:'http://'+REF+'.supabase.co'},
  {...good,url:'https://'+REF+'.supabase.co.evil.example'},
  {...good,b:{...good.a}}
 ])await assert.rejects(runHostedOriginalCutout179(change,{
  fetchImpl:()=>{throw Error('network must never be reached');}
 }));
});
test('P179 actual licensed source plus separate human-reviewed cutout yields TWO independent protected JPEG objects',async()=>{
 const x=await prepareSource179(A,randomUUID());
 assert.equal(x.packed.jpgObjectCount,2);
 assert.equal(x.backup.items[0].threeDReady,false);
 assert.equal(x.packed.document.items[0].sourceSHA256,x.pair.originalHash);
 assert.equal(x.packed.document.items[0].segmentHint.cutoutSHA256,x.pair.cutoutHash);
 assert.equal(x.packed.document.state['outfit-board'].saved.length,1);
 assert.equal(JSON.stringify(x.packed.document).includes('data:image/jpeg;base64,'),false);
});
test('P179 real RS256-signed local HTTP double accepts source/cutout and FULL two-owner RLS/CAS/Storage contract (NOT hosted)',async()=>{
 const s=await localProvider();
 try{
  const r=await runHostedOriginalCutout179(config(),{fetchImpl:s.fetchImpl,nonce:randomUUID()});
  assert.equal(r.verdict,'HOSTED_PASS'); // simulated 179 issuer only, not a hosted result
  assert.equal(r.ownerSourceAndCropJPEGs,4);assert.equal(r.distinctOwners,2);
  assert.equal(r.checks.length,11);
  assert.equal(r.productionAndExistingStagingUntouched,true);
  assert.equal(r.realPhysicalPhoneTested,false);assert.equal(r.familyAlpha,'HOLD');
  assert.equal(s.db.size,2);assert.equal(s.objects.size,4);
  assert.equal(s.refresh.size,0);
  assert.ok(s.calls.filter(x=>x.path==='/auth/v1/user').length===2);
  assert.equal(s.calls.filter(x=>x.path.startsWith('/storage/')&&x.method==='POST').length,6);
 }finally{await s.close();}
});
test('P179 fails closed when real Auth user endpoint reports a different owner than token subject',async()=>{
 const s=await localProvider({wrongAuth:true});
 try{
  await assert.rejects(runHostedOriginalCutout179(config(),{fetchImpl:s.fetchImpl}),/validated different owner/);
  assert.equal(s.db.size,0);assert.equal(s.objects.size,0);
 }finally{await s.close();}
});
test('P179 detects an RLS backup document leak even after both owners created private records',async()=>{
 const s=await localProvider({leakDocument:true});
 try{await assert.rejects(runHostedOriginalCutout179(config(),{fetchImpl:s.fetchImpl}),/RLS mismatch/);}
 finally{await s.close();}
});
test('P179 detects foreign-owner Storage photo or crop read',async()=>{
 const s=await localProvider({leakStorage:true});
 try{await assert.rejects(runHostedOriginalCutout179(config(),{fetchImpl:s.fetchImpl}),/foreign-owner original or cutout JPEG exposed/);}
 finally{await s.close();}
});
test('P179 detects foreign-owner original/cutout upload write even with otherwise valid RLS',async()=>{
 const s=await localProvider({allowForeignUpload:true});
 try{await assert.rejects(runHostedOriginalCutout179(config(),{fetchImpl:s.fetchImpl}),/cross-owner Storage original\/cutout upload permitted/);}
 finally{await s.close();}
});
test('P179 refuses simulated Auth refresh-token revocation failure',async()=>{
 const s=await localProvider({failedLogout:true});
 try{await assert.rejects(runHostedOriginalCutout179(config(),{fetchImpl:s.fetchImpl}),/revoked refresh token/);}
 finally{await s.close();}
});
test('P179 never uses service-role, user metadata, production or real user photos in its live acceptance runner',()=>{
 const code=readFileSync('research/hosted-two-owner-original-cutout-179/hosted-acceptance.mjs','utf8');
 for(const s of ['prepareSource179','validateRestore01','packageOwnerCloudCutouts128',
  'reopenOwnerCloudCutouts128',"readFileSync('benchmark/locked-photo-sources.json'",
  "safe(verified,'actual Supabase Auth bearer identity',[200])",
  "familyAlpha:'HOLD'","if(a.id===b.id)"])
  assert.ok(code.includes(s),s);
 for(const s of ['service_role','createUser','deleteUser','raw_user_meta_data'])
  assert.equal(code.includes(s),false);
});
