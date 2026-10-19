// Disposable PostgreSQL concurrency regression — no live Supabase access.
// Verifies the SQL lock blocks *in-flight* uploads before committing a
// durable tombstone, not just subsequent single-statement write attempts.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';

const B='b2222222-2222-4222-8222-222222222222';
const C='c3333333-3333-4333-8333-333333333333';

function psql(sql,{interactive=false}={}){
 const args=['-X','-q','-A','-t','-v','ON_ERROR_STOP=1'];
 if(!interactive)args.push('-c',sql);
 const proc=spawn('psql',args,{env:process.env,stdio:['pipe','pipe','pipe']});
 let stdout='',stderr='';
 proc.stdout.on('data',data=>{stdout+=data;});
 proc.stderr.on('data',data=>{stderr+=data;});
 const done=new Promise((resolve,reject)=>{
  proc.on('error',reject);
  proc.on('close',code=>resolve({code,stdout,stderr}));
 });
 if(!interactive)proc.stdin.end();
 return {proc,done,output:()=>stdout,errors:()=>stderr};
}
const deadline=(p,ms)=>Promise.race([p,new Promise((_,reject)=>setTimeout(()=>reject(Error('Postgres concurrency test timeout')),ms))]);
let writer;
try{
 // Owner B is deliberately unlocked after the smoke test.
 writer=psql('',{interactive:true});
 writer.proc.stdin.write(
  `begin;
insert into storage.objects(bucket_id,name)
values ('closet-private','${B}/inflight.jpg');
select 'UPLOAD_TRANSACTION_HAS_LOCK';
`);
 await deadline(new Promise((resolve,reject)=>{
  const started=Date.now();
  const poll=()=>{
   if(writer.output().includes('UPLOAD_TRANSACTION_HAS_LOCK'))return resolve();
   if(Date.now()-started>5000)return reject(Error('Writer never acquired transaction lock: '+writer.errors()));
   setTimeout(poll,20);
  };
  poll();
 }),7000);
 const deleting=psql(`set role service_role;select closet_internal.begin_account_deletion('${B}'::uuid)`);
 let ended=false;
 deleting.done.then(()=>ended=true);
 await new Promise(r=>setTimeout(r,350));
 assert.equal(ended,false,'Deletion must wait for in-flight Storage write to finish');
 writer.proc.stdin.write('commit;\n');
 writer.proc.stdin.end();
 const original=await deadline(writer.done,7000);
 assert.equal(original.code,0,original.stderr);
 const locked=await deadline(deleting.done,7000);
 assert.equal(locked.code,0,locked.stderr);
 assert.match(locked.stdout,/t/,'Deletion lock successfully committed');
 const blocked=await deadline(psql(`insert into storage.objects(bucket_id,name)
values ('closet-private','${B}/after-lock.jpg')`).done,7000);
 assert.notEqual(blocked.code,0,'Late upload to locked account must fail');
 assert.match(blocked.stderr,/Closet account deletion in progress/);
 const other=await deadline(psql(`insert into storage.objects(bucket_id,name)
values ('closet-private','${C}/unrelated.jpg')`).done,7000);
 assert.equal(other.code,0,'Unrelated account must remain writable: '+other.stderr);
 console.log('ACCOUNT_DELETION_WRITE_RACE '+JSON.stringify({
  inFlightUploadSerialized:true,lateWriteRejected:true,
  otherOwnerUnaffected:true,realUserDataAccessed:false,liveSupabaseModified:false
 }));
}finally{
 if(writer&&!writer.proc.killed){writer.proc.stdin.end();writer.proc.kill();}
}
