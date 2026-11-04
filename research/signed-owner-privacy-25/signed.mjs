import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {randomUUID,randomBytes,createHash} from 'node:crypto';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
import {setTimeout as delay} from 'node:timers/promises';

const config=Object.fromEntries((await readFile(process.env.SUPABASE_TEST_ENV,'utf8')).split('\n')
 .filter(line=>/^[A-Z_]+=/.test(line)).map(line=>{const i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1).replace(/^"|"$/g,'')];}));
const endpoint=new URL(config.API_URL);
assert.ok(['127.0.0.1','localhost'].includes(endpoint.hostname)&&endpoint.protocol==='http:'&&endpoint.port,'Disposable loopback only');
const key=config.ANON_KEY||config.PUBLISHABLE_KEY;
assert.ok(key,'Missing local public key');
const bucket='/storage/v1/object/closet-private/';
const table='/rest/v1/closet_backups';
const rpc='/rest/v1/rpc/save_closet_backup';
const checks=[];
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
async function request(path,token,method='GET',body){
 const headers={apikey:key,...(token?{authorization:'Bearer '+token}:{})};
 if(path.startsWith(table)&&['PATCH','DELETE'].includes(method))headers.prefer='return=representation';
 if(body!==undefined)headers['content-type']=Buffer.isBuffer(body)?'image/jpeg':'application/json';
 const response=await fetch(new URL(path,endpoint),{headers,method,body:body===undefined?undefined:Buffer.isBuffer(body)?body:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(20000)});
 return {status:response.status,ok:response.ok,bytes:Buffer.from(await response.arrayBuffer())};
}
const json=r=>JSON.parse(r.bytes);
function check(name,condition,status){assert.ok(condition,name+' (HTTP '+status+')');checks.push({name,status});}
const fixture=async marker=>sharp(Buffer.from('<svg width="80" height="80"><rect width="80" height="80" fill="'+(marker==='A'?'red':'blue')+'"/><text x="24" y="52" font-size="40" fill="white">'+marker+'</text></svg>')).jpeg().toBuffer();
async function account(marker){
 const email='owner-'+marker.toLowerCase()+'-'+randomUUID()+'@example.test',password=randomBytes(22).toString('hex');
 const signup=await request('/auth/v1/signup',null,'POST',{email,password});
 check(marker+' signup',signup.ok,signup.status);
 const login=await request('/auth/v1/token?grant_type=password',null,'POST',{email,password});
 check(marker+' password login',login.ok,login.status);
 const session=json(login),id=session.user.id,token=session.access_token;
 assert.match(token,/^[\w-]+\.[\w-]+\.[\w-]+$/);
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
 return {id,token,refresh:session.refresh_token,document,path,jpeg,sha,marker};
}
const a=await account('A'),b=await account('B');
assert.notEqual(a.id,b.id);
async function own(x){
 const row=await request(table+'?owner_id=eq.'+x.id,x.token);
 const entry=json(row)[0];
 check(x.marker+' owns unchanged original, outfit and backup',row.ok&&entry?.revision===1&&
  entry.document.state.outfits[0].id===x.document.state.outfits[0].id&&
  digest(Buffer.from(entry.document.items[0].original,'base64'))===x.sha,row.status);
 const image=await request(bucket+x.path,x.token);
 check(x.marker+' private JPEG hash',image.ok&&digest(image.bytes)===x.sha,image.status);
 const list=await request('/storage/v1/object/list/closet-private',x.token,'POST',{prefix:x.id});
 check(x.marker+' owner can list photo',list.ok&&json(list).some(p=>p.name==='fixture.jpg'),list.status);
}
await own(a);await own(b);
for(const [actor,victim] of [[a,b],[b,a]]){
 const label=actor.marker+' against '+victim.marker;
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
for(const victim of [a,b]){
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
const logout=await request('/auth/v1/logout?scope=local',current.access_token,'POST',{});
check('Signed logout succeeds',logout.ok,logout.status);
const revoked=await request('/auth/v1/token?grant_type=refresh_token',null,'POST',{refresh_token:current.refresh_token});
check('Signed logout revokes refresh credential',[400,401,403].includes(revoked.status),revoked.status);
const residual=await request(table,current.access_token);
const expiry=JSON.parse(Buffer.from(b.token.split('.')[1],'base64url')).exp;
assert.ok(Number.isSafeInteger(expiry));
const remaining=expiry*1000-Date.now();
assert.ok(remaining<=65_000,'Disposable Auth must issue short-lived access tokens');
await delay(Math.max(0,remaining+35_000));
const expired=await request(table,b.token);
check('Naturally expired signed credential denied',expired.status===401,expired.status);
const recovered=await request('/auth/v1/token?grant_type=refresh_token',null,'POST',{refresh_token:b.refresh});
check('Refresh after access expiry retains owner',recovered.ok&&json(recovered).user.id===b.id,recovered.status);
const report={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),signedLocalSupabase:true,distinctAuthenticatedOwners:true,checks,
 logoutAccessTokenRemainsUsable:residual.ok&&json(residual).length===1,
 scope:'Disposable loopback; synthetic JPEGs; no hosted access'};
await mkdir('benchmark/signed-owner-privacy-25',{recursive:true});
await writeFile('benchmark/signed-owner-privacy-25/signed.json',JSON.stringify(report,null,2));
console.log('Disposable signed HTTP checks:',checks.length,'residual bearer access:',report.logoutAccessTokenRemainsUsable);
