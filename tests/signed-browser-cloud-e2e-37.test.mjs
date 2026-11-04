import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(path,'utf8');

test('SIGNED37 transport enforces local-only Supabase and real backend responses',()=>{
 const code=read('research/signed-browser-cloud-e2e-37/browser-cloud.mjs');
 assert.match(code,/\['localhost','127\.0\.0\.1'\]\.includes\(api\.hostname\)/);
 assert.match(code,/route\.fetch\(\{url:target\.href,headers/);
 assert.match(code,/maxRedirects:0/);
 assert.match(code,/req\.method\(\)!=='GET'/);
 assert.match(code,/actual\.status\(\)/);
 assert.doesNotMatch(code,/fixtureAuth/);
 assert.doesNotMatch(code,/route\.fulfill\(\{status:200,json:/);
});

test('SIGNED37 exercises real native capture and built-in cloud adapter',()=>{
 const code=read('research/signed-browser-cloud-e2e-37/browser-cloud.mjs');
 assert.match(code,/Save confirmed pieces together/);
 assert.match(code,/Adjust crop\/mask/);
 assert.match(code,/serverBackup\(account/);
 assert.match(code,/freshRecoveryA:3/);
 assert.doesNotMatch(code,/cloud-backup\.js'\)return route\.fulfill/);
 const html=read('public/index.html');
 assert.match(html,/src="cloud-backup\.js"/);
 assert.match(html,/src="auth\.js"/);
});

test('SIGNED37 preserves existing private RLS and security invoker SQL',()=>{
 const sql=read('supabase/cloud-backup.sql');
 assert.match(sql,/alter table public\.closet_backups enable row level security/i);
 assert.match(sql,/owner_id\) with check/i);
 assert.match(sql,/security invoker/i);
 assert.match(sql,/bucket_id='closet-private' and \(storage\.foldername\(name\)\)\[1\]=\(select auth\.uid\(\)\)::text/i);
 assert.match(sql,/values\('closet-private','closet-private',false/);
 const code=read('research/signed-browser-cloud-e2e-37/browser-cloud.mjs');
 for(const phrase of ['foreign backup SELECT','foreign backup UPDATE','foreign backup DELETE',
 'foreign photo LIST','foreign photo ','foreign signed URL','foreign prefix upload','forged owner INSERT']){
  assert.ok(code.includes(phrase),phrase);
 }
});

test('SIGNED37 CI pins ancestor, isolates Docker stack and blocks deployment',()=>{
 const flow=read('.github/workflows/signed-browser-cloud-e2e-37-no-deploy.yml');
 assert.match(flow,/BASE=77d5c760c847d6e2f544512e80fd8598fd610dad/);
 assert.match(flow,/git merge-base --is-ancestor/);
 assert.match(flow,/runs-on: ubuntu-24\.04/);
 assert.match(flow,/supabase start/);
 assert.match(flow,/supabase stop --no-backup/);
 assert.match(flow,/cloud-backup\.sql/);
 assert.match(flow,/node --test tests\/\*\.test\.cjs tests\/\*\.test\.mjs/);
 assert.match(flow,/playwright install --with-deps chromium webkit/);
 assert.doesNotMatch(flow,/(?:firebase deploy|pages deploy|supabase db push|npm run deploy|gh pr merge)/i);
});

test('SIGNED37 keeps native/cloud legacy synchronous fail-closed safety contract',()=>{
 const cloud=read('public/cloud-backup.js');
 assert.equal(cloud.split('if(callbacks.canRestore&&!callbacks.canRestore())return false;').length-1,2,
  'Unchanged sync owner lease guard both before and after photo decode');
 const bridge=read('public/cloud-backup-bridge.js');
 assert.match(bridge,/canRestore:\(\)=>/);
 assert.match(bridge,/nativeLossless04RestoreSafe\(\)/);
 assert.match(bridge,/await board\.load\(\)/);
 assert.match(bridge,/db\.name!=='closet-current-user-'\+owner/);
 assert.match(bridge,/state\?\.active===true&&state\.dirty===false/);
});

test('SIGNED37 real sync bridge safely re-attests same owner after token refresh',async()=>{
 const {runInNewContext}=await import('node:vm');
 const source=read('public/cloud-backup-bridge.js');
 const board={
  active:false,dirty:false,loadCount:0,
  status(){return {active:this.active,dirty:this.dirty};},
  async load(){this.loadCount++;this.active=true;}
 };
 const auth={user:{id:'auth-owner-a'},assertCurrent(){if(!this.user?.id)throw Error('Owner expired');}};
 let captured=null;
 const sandbox={
  window:{closetAuth:auth,nativeLossless04Bridge:board,closetCloud:{async start(_db,c){captured=c;}}},
  db:{name:'closet-current-user-auth-owner-a'},
  document:{getElementById:()=>({hidden:false}),querySelector:()=>null},
  location:{search:'?nativeLossless04=research'},URLSearchParams,
  closetReady:Promise.resolve(),outfitBoardReady:Promise.resolve(),inspirationReady:Promise.resolve(),
  busy:false,automaticRunning:false,memoryReviewRunning:false
 };
 runInNewContext(source,sandbox);
 assert.equal(sandbox.nativeLossless04RestoreSafe(),false,'Return false until owner re-attest finishes');
 await new Promise(r=>setImmediate(r));
 assert.equal(board.loadCount,1);
 assert.equal(sandbox.nativeLossless04RestoreSafe(),true,'Same verified owner allowed after re-attest');
 assert.equal(board.loadCount,1,'No repeat admission for valid lease');
 board.dirty=true;
 assert.equal(sandbox.nativeLossless04RestoreSafe(),false,'Dirty unsaved outfit never overwritten');
 board.dirty=false;board.active=false;
 sandbox.db.name='closet-current-user-auth-owner-b';
 assert.equal(sandbox.nativeLossless04RestoreSafe(),false,'Cross-owner DB name mismatch fails closed');
 sandbox.db.name='closet-current-user-auth-owner-a';
 board.load=async()=>{board.loadCount++;throw Error('Lease denied');};
 assert.equal(sandbox.nativeLossless04RestoreSafe(),false);
 await new Promise(r=>setImmediate(r));
 assert.equal(sandbox.nativeLossless04RestoreSafe(),false,'Rejected attestation remains closed');
 await new Promise(r=>setImmediate(r));
 board.load=async()=>{board.loadCount++;auth.user={id:'auth-owner-b'};board.active=true;};
 assert.equal(sandbox.nativeLossless04RestoreSafe(),false);
 await new Promise(r=>setImmediate(r));
 assert.equal(sandbox.nativeLossless04RestoreSafe(),false,'Asynchronous owner transition must remain closed');
 sandbox.location.search='';
 assert.equal(sandbox.nativeLossless04RestoreSafe(),true,'No behavior change to ordinary nonresearch app');
 assert.equal(typeof captured?.canRestore,'function');
});
