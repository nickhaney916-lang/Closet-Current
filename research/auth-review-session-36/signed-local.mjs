import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {randomUUID,randomBytes,createHash} from 'node:crypto';
import {mkdir,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
import {setTimeout as delay} from 'node:timers/promises';
import {isDeepStrictEqual} from 'node:util';

import {request,json} from './local-http.mjs';

const bucket='/storage/v1/object/closet-private/';
const table='/rest/v1/closet_backups';
const rpc='/rest/v1/rpc/save_closet_backup';
const checks=[];
const four=process.env.CLOSET_FOUR_OWNER==='1';
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
function check(name,condition,status){assert.ok(condition,name+' (HTTP '+status+')');checks.push({name,status});}
const fixture=async marker=>sharp(Buffer.from('<svg width="80" height="80"><rect width="80" height="80" fill="'+({A:'red',B:'blue',C:'purple',D:'green'}[marker])+'"/><text x="24" y="52" font-size="40" fill="white">'+marker+'</text></svg>')).jpeg().toBuffer();
async function account(marker){
 const email='owner-'+marker.toLowerCase()+'-'+randomUUID()+'@example.test',password=randomBytes(22).toString('hex');
 const signup=await request('/auth/v1/signup',null,'POST',{email,password});
 check(marker+' signup',signup.ok,signup.status);
 const login=await request('/auth/v1/token?grant_type=password',null,'POST',{email,password});
 check(marker+' password login',login.ok,login.status);
 const session=json(login),id=session.user.id,token=session.access_token;
 assert.ok(typeof token==='string'&&/^[\w-]+\.[\w-]+\.[\w-]+$/.test(token),'Expected a signed credential');
 const user=await request('/auth/v1/user',token);
 check(marker+' server-authenticated identity',user.ok&&json(user).id===id,user.status);
 const jpeg=await fixture(marker),sha=digest(jpeg);
 const document={schemaVersion:1,items:[{id:'synthetic-'+marker,photo:sha,original:jpeg.toString('base64')}],
  state:{outfits:[{id:'outfit-'+marker,items:['synthetic-'+marker]}]}};
 const path=id+'/fixture.jpg';
 const photo=await request(bucket+path,token,'POST',jpeg);
 check(marker+' owner creates private JPEG',photo.ok,photo.status);
 const backup=await request(rpc,token,'POST',{p_expected_revision:0,p_document:document});
 check(marker+' owner creates backup',backup.ok&&json(backup)===1,backup.status);
 if(four){
  const next=await request(rpc,token,'POST',{p_expected_revision:1,p_document:document});
  check(marker+' owner advances backup revision',next.ok&&json(next)===2,next.status);
  const stale=await request(rpc,token,'POST',{p_expected_revision:1,p_document:{...document,items:[]}});
  check(marker+' stale revision cannot replace backup',stale.ok&&json(stale)===null,stale.status);
  const malformed=await request(rpc,token,'POST',{p_expected_revision:2,p_document:{...document,state:[]}});
  check(marker+' malformed backup rejected atomically',!malformed.ok,malformed.status);
 }
 return {id,token,refresh:session.refresh_token,email,password,document,path,jpeg,sha,marker};
}
const owners=await Promise.all((four?['A','B','C','D']:['A','B']).map(account));
const [a,b]=owners;
assert.equal(new Set(owners.map(x=>x.id)).size,owners.length);
assert.equal(new Set(owners.map(x=>x.sha)).size,owners.length);
async function own(x){
 const row=await request(table+'?owner_id=eq.'+x.id,x.token);
 const entry=json(row)[0];
 if(four) assert.ok(isDeepStrictEqual(entry?.document,x.document),'Signed owner document changed');
 check(x.marker+' owns unchanged original, outfit and backup',row.ok&&entry?.revision===(four?2:1)&&
  entry.document.state.outfits[0].id===x.document.state.outfits[0].id&&
  digest(Buffer.from(entry.document.items[0].original,'base64'))===x.sha,row.status);
 const image=await request(bucket+x.path,x.token);
 check(x.marker+' private JPEG hash',image.ok&&digest(image.bytes)===x.sha,image.status);
 const list=await request('/storage/v1/object/list/closet-private',x.token,'POST',{prefix:x.id});
 check(x.marker+' owner can list photo',list.ok&&json(list).some(p=>p.name==='fixture.jpg'),list.status);
 if(four) assert.deepEqual(json(list).map(p=>p.name),['fixture.jpg'],'Unexpected extra object');
}
for(const owner of owners) await own(owner);
for(const actor of owners) for(const victim of owners){
 if(actor===victim) continue;
 const label=actor.marker+' against '+victim.marker;
 if(four){
  const before=await request(table,actor.token);
  check(label+' unfiltered list scoped to actor',before.ok&&json(before).length===1&&json(before)[0].owner_id===actor.id,before.status);
  const metadata=await request('/auth/v1/user',actor.token,'PUT',{data:{owner_id:victim.id,role:'service_role'}});
  check(label+' synthetic user metadata update',metadata.ok,metadata.status);
  const signed=await request('/auth/v1/token?grant_type=password',null,'POST',{email:actor.email,password:actor.password});
  check(label+' renewed credential stays bound to actor',signed.ok&&json(signed).user.id===actor.id,signed.status);
  actor.token=json(signed).access_token;actor.refresh=json(signed).refresh_token;
  const upsert=await request(table,actor.token,'POST',{owner_id:victim.id,document:actor.document},{prefer:'resolution=merge-duplicates,return=representation'});
  check(label+' foreign backup upsert denied',[401,403].includes(upsert.status),upsert.status);
  const upsertPhoto=await request(bucket+victim.path,actor.token,'POST',actor.jpeg,{'x-upsert':'true'});
  check(label+' foreign photo upsert denied',[400,401,403,404].includes(upsertPhoto.status),upsertPhoto.status);
 }
 const filter=table+'?owner_id=eq.'+victim.id;
 const read=await request(filter,actor.token);
 check(label+' backup and outfit hidden',read.ok&&json(read).length===0,read.status);
 const overwrite=await request(filter,actor.token,'PATCH',{document:actor.document});
 check(label+' direct overwrite cannot target foreign row',
  [401,403].includes(overwrite.status)||overwrite.ok&&overwrite.bytes.length>0&&json(overwrite).length===0,overwrite.status);
 const deletion=await request(filter,actor.token,'DELETE');
 check(label+' direct delete cannot target foreign row',
  [401,403].includes(deletion.status)||deletion.ok&&deletion.bytes.length>0&&json(deletion).length===0,deletion.status);
 const spoof=await request(table,actor.token,'POST',{owner_id:victim.id,document:actor.document});
 check(label+' forged owner insertion denied',[401,403].includes(spoof.status),spoof.status);
 const conflict=await request(rpc,actor.token,'POST',{p_expected_revision:99,p_document:actor.document});
 check(label+' wrong backup revision cannot commit',conflict.ok&&json(conflict)===null,conflict.status);
 const list=await request('/storage/v1/object/list/closet-private',actor.token,'POST',{prefix:victim.id});
 check(label+' foreign photo listing empty',list.ok&&json(list).length===0,list.status);
 for(const method of ['GET','PUT','DELETE']){
  const r=await request(bucket+victim.path,actor.token,method,method==='PUT'?actor.jpeg:undefined);
  check(label+' foreign photo '+method,[400,401,403,404].includes(r.status)||method==='DELETE'&&r.ok&&Array.isArray(json(r))&&!json(r).length,r.status);
 }
 const signed=await request('/storage/v1/object/sign/closet-private/'+victim.path,actor.token,'POST',{expiresIn:60});
 check(label+' cannot issue a foreign signed photo URL',[400,401,403,404].includes(signed.status),signed.status);
 const upload=await request(bucket+victim.id+'/spoof.jpg',actor.token,'POST',actor.jpeg);
 check(label+' foreign photo upload denied',[400,401,403,404].includes(upload.status),upload.status);
}
for(const victim of owners){
 for(const path of [table+'?owner_id=eq.'+victim.id,bucket+victim.path,'/storage/v1/object/public/closet-private/'+victim.path]){
  const result=await request(path,null);
  check('Anonymous '+victim.marker+' backup or photo denied',[400,401,403,404].includes(result.status),result.status);
 }
 await own(victim);
}
const invalid=await request(table,a.token.slice(0,-8)+'invalid');
check('Tampered signed credential denied',invalid.status===401,invalid.status);
const refresh=await request('/auth/v1/token?grant_type=refresh_token',null,'POST',{refresh_token:a.refresh});
check('Refresh preserves signed owner',refresh.ok&&json(refresh).user.id===a.id,refresh.status);
const current=json(refresh);
const strictSession=process.env.CLOSET_REQUIRE_ACTIVE_SESSION==='1';
const sessionRevocationReceipts=[];
const probePath=a.id+'/revoked-probe.jpg';
async function activeStorageControls(label,session){
 const token=session.access_token;
 const sign=await request('/storage/v1/object/sign/closet-private/'+a.path,token,'POST',{expiresIn:60});
 check(label+' active session can sign existing original',sign.ok&&typeof json(sign).signedURL==='string'&&json(sign).signedURL.length>0,sign.status);
 const upload=await request(bucket+probePath,token,'POST',a.jpeg);
 check(label+' active session can upload disposable probe',upload.ok,upload.status);
 const read=await request(bucket+probePath,token);
 check(label+' active session can read disposable probe',read.ok&&digest(read.bytes)===a.sha,read.status);
 const remove=await request(bucket+probePath,token,'DELETE');
 check(label+' active session can delete disposable probe',remove.ok,remove.status);
 const gone=await request(bucket+probePath,token);
 check(label+' disposable probe actually removed',[400,404].includes(gone.status),gone.status);
}
if(strictSession) await activeStorageControls('initial local logout',current);
const logout=await request('/auth/v1/logout?scope=local',current.access_token,'POST',{});
check('Signed logout succeeds',logout.ok,logout.status);
const localLogoutAt=performance.now();
const revoked=await request('/auth/v1/token?grant_type=refresh_token',null,'POST',{refresh_token:current.refresh_token});
check('Signed logout revokes refresh credential',[400,401,403].includes(revoked.status),revoked.status);
const residual=await request(table,current.access_token);
const residualObservedAt=performance.now();
if(strictSession){
 const denied=r=>[400,401,403,404].includes(r.status);
 const empty=r=>r.ok&&Array.isArray(json(r))&&json(r).length===0;
 const login=async()=>{const r=await request('/auth/v1/token?grant_type=password',null,'POST',{email:a.email,password:a.password});
  check('Active-session control sign-in',r.ok,r.status);return json(r);};
 const claims=token=>JSON.parse(Buffer.from(token.split('.')[1],'base64url'));
 const stillValid=token=>Number.isSafeInteger(claims(token).exp)&&claims(token).exp*1000>Date.now();
 let revision=four?2:1;
 async function preserved(session){
  const row=await request(table+'?owner_id=eq.'+a.id,session.access_token);
  check('Active-session control preserves exact document and revision',row.ok&&json(row).length===1&&json(row)[0].revision===revision&&isDeepStrictEqual(json(row)[0].document,a.document),row.status);
  const image=await request(bucket+a.path,session.access_token);
  check('Active-session control preserves original JPEG',image.ok&&digest(image.bytes)===a.sha,image.status);
  const list=await request('/storage/v1/object/list/closet-private',session.access_token,'POST',{prefix:a.id});
  check('Active-session control preserves exact object inventory',list.ok&&isDeepStrictEqual(json(list).map(p=>p.name),['fixture.jpg']),list.status);
 }
 async function verifyRevoked(label,session,logoutAt,priorReadAt=null){
  const token=session.access_token;
  assert.ok(stillValid(token),'Must exercise a still-unexpired, server-issued access token');
  const read=await request(table+'?owner_id=eq.'+a.id,token);
  check(label+' cannot read own backup document',denied(read)||empty(read),read.status);
  const firstDeniedAt=priorReadAt??performance.now();
  const image=await request(bucket+a.path,token);
  check(label+' cannot newly download own original',denied(image),image.status);
  const list=await request('/storage/v1/object/list/closet-private',token,'POST',{prefix:a.id});
  check(label+' cannot list own originals',denied(list)||empty(list),list.status);
  const sign=await request('/storage/v1/object/sign/closet-private/'+a.path,token,'POST',{expiresIn:60});
  check(label+' cannot issue a new signed photo URL',denied(sign),sign.status);
  const patch=await request(table+'?owner_id=eq.'+a.id,token,'PATCH',{document:{...a.document,items:[]}});
  check(label+' cannot patch own backup',[401,403].includes(patch.status)||empty(patch),patch.status);
  const write=await request(rpc,token,'POST',{p_expected_revision:revision,p_document:{...a.document,items:[]}});
  check(label+' cannot advance own backup revision',[401,403].includes(write.status)||write.ok&&json(write)===null,write.status);
  const upload=await request(bucket+probePath,token,'POST',a.jpeg);
  check(label+' cannot upload own private photo',denied(upload),upload.status);
  const remove=await request(bucket+a.path,token,'DELETE');
  check(label+' cannot delete own original',denied(remove)||empty(remove),remove.status);
  assert.ok(stillValid(token),'All denial observations must precede token expiration');
  sessionRevocationReceipts.push({scope:label,confirmedLogoutToFirstDeniedResponseMs:firstDeniedAt-logoutAt,confirmedLogoutToLastDeniedResponseMs:performance.now()-logoutAt,unexpiredThroughout:true,activeStorageControlsPassed:true});
 }
 check('Local logout blocks previously accepted residual access',denied(residual)||empty(residual),residual.status);
 await verifyRevoked('local logout',current,localLogoutAt,residualObservedAt);
 // Fresh login supplies a separate active device for a controlled local logout.
 const first=await login(),second=await login();
 assert.notEqual(claims(first.access_token).session_id,claims(second.access_token).session_id);
 await preserved(first);await preserved(second);
 await activeStorageControls('controlled local logout',first);
 const local=await request('/auth/v1/logout?scope=local',first.access_token,'POST',{});
 const controlledLocalAt=performance.now();
 check('Controlled local logout succeeds',local.ok,local.status);
 await verifyRevoked('local logout with second device',first,controlledLocalAt);
 await preserved(second);
 const validWrite=await request(rpc,second.access_token,'POST',{p_expected_revision:revision,p_document:a.document});
 check('Unaffected second device can advance backup revision',validWrite.ok&&json(validWrite)===revision+1,validWrite.status);
 revision++;
 const third=await login();await preserved(third);
 await activeStorageControls('global logout device one',second);
 await activeStorageControls('global logout device two',third);
 const global=await request('/auth/v1/logout?scope=global',second.access_token,'POST',{});
 const globalAt=performance.now();
 check('Global logout succeeds',global.ok,global.status);
 await verifyRevoked('global logout device one',second,globalAt);
 await verifyRevoked('global logout device two',third,globalAt);
 const fresh=await login();await preserved(fresh);
}
const expiry=JSON.parse(Buffer.from(b.token.split('.')[1],'base64url')).exp;
assert.ok(Number.isSafeInteger(expiry));
const remaining=expiry*1000-Date.now();
assert.ok(remaining<=(four?125_000:65_000),'Disposable Auth must issue short-lived access tokens');
await delay(Math.max(0,remaining+35_000));
const expired=await request(table,b.token);
check('Naturally expired signed credential denied',expired.status===401,expired.status);
const recovered=await request('/auth/v1/token?grant_type=refresh_token',null,'POST',{refresh_token:b.refresh});
check('Refresh after access expiry retains owner',recovered.ok&&json(recovered).user.id===b.id,recovered.status);
const report={owners:owners.length,orderedPairs:owners.length*(owners.length-1),head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),signedLocalSupabase:true,distinctAuthenticatedOwners:true,checks,
 logoutAccessTokenRemainsUsable:residual.ok&&json(residual).length===1,
 activeSessionPolicyRequired:strictSession,sessionRevocationReceipts,
 scope:'Disposable loopback; synthetic JPEGs; no hosted access'};
await mkdir('benchmark/auth-review-session-36',{recursive:true});
await writeFile('benchmark/auth-review-session-36/signed.json',JSON.stringify(report,null,2));
console.log('AUTH36 verified disposable signed HTTP checks:',checks.length,'residual bearer access:',report.logoutAccessTokenRemainsUsable);
