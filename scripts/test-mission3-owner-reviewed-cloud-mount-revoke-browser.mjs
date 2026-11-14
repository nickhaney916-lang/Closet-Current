// Executes the exact owner-reviewed cloud admission code with a synthetic
// delayed local-only P146 UI in real Chromium + WebKit at mobile widths.
// No private data, real cloud, auth service, or deployment is accessed.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve} from 'node:path';
import {chromium,webkit} from 'playwright';
const out=resolve(process.argv[2]||'benchmark/mission3-owner-reviewed-cloud-mount-revoke-browser');
await mkdir(out,{recursive:true});
const s=await readFile('public/cloud-backup-bridge.js','utf8');
const i=s.indexOf('   const bridge=await mountOwnerReviewedCloud146({');
const j=s.indexOf('   return;',i);
assert.ok(i>=0&&j>i,'P146 source admission not located');
const actual=s.slice(i,j);
async function scenario(mode){
 document.body.innerHTML='<main id="appShell"><p id="status">owner A screen</p></main>';
 const initialAuth={user:{id:'owner-a'}},ownerDB={name:'closet-current-user-owner-a'};
 let auth=initialAuth,db=ownerDB,epoch=1,revoked=false,forceExpired=false;
 let begin,finish;const started=new Promise(ok=>begin=ok),pending=new Promise(ok=>finish=ok);
 let count=0,panel=null;
 const assertLease=()=>{
  if(forceExpired||auth!==initialAuth||db!==ownerDB||
      epoch!==1||initialAuth.user.id!=='owner-a')
   throw Error('STALE_AUTH_OWNER_LEASE');
 };
 const mountOwnerReviewedCloud146=()=>{
  panel=document.createElement('section');panel.id='owner146PrivatePanel';
  panel.textContent='PRIVATE OLD ORIGINAL PHOTO-A';document.body.append(panel);
  begin();return pending;
 };
 const bridge={revoke(){
  count++;panel?.remove();revoked=true;
  if(mode==='throw-revoke')throw Error('PRIVATE old owner JPEG');
 }};
 const fn=new Function('mountOwnerReviewedCloud146','assertLease',
  'initialAuth','ownerDB','restored','window',
  'return async function(){'+ACTUAL_P146+' return true;}')(
   mountOwnerReviewedCloud146,assertLease,initialAuth,ownerDB,()=>{},window);
 window.ownerReviewedCloud146=null;
 const work=fn().then(()=>({accepted:true})).catch(error=>({accepted:false,error:String(error.message)}));
 await started;
 if(mode==='account-switch'||mode==='relogin-return-original'){
  auth={user:{id:'owner-b'}};db={name:'closet-current-user-owner-b'};epoch++;
  document.getElementById('status').textContent='owner B screen';
 }
 if(mode==='same-id-relogin')auth={user:{id:'owner-a'}};
 if(mode==='auth-ref-rotate')auth={user:{id:'owner-a'}};
 if(mode==='db-ref-rotate')db={name:'closet-current-user-owner-a'};
 if(mode==='epoch-rotate')epoch++;
 if(mode==='mutate-old-owner')initialAuth.user.id='owner-b';
 if(mode==='auth-revoked'||mode==='throw-revoke')forceExpired=true;
 if(mode==='relogin-return-original'){auth=initialAuth;db=ownerDB;}
 finish(bridge);
 const result=await work;
 const answer={mode,...result,revokeCount:count,revoked,
  privatePanelVisible:!!document.getElementById('owner146PrivatePanel'),
  published:window.ownerReviewedCloud146===bridge,
  status:document.getElementById('status').textContent};
 return answer;
}
const executable=[
 "'use strict';",
 'const ACTUAL_P146='+JSON.stringify(actual)+';',
 'window.__scenario=('+scenario.toString()+');'
].join('\n');
const server=createServer((_,res)=>{
 res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});
 res.end('<!doctype html><html><body>synthetic owner review</body></html>');
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const url='http://127.0.0.1:'+server.address().port+'/';
const modes=['valid','account-switch','same-id-relogin','auth-ref-rotate',
 'db-ref-rotate','epoch-rotate','mutate-old-owner','auth-revoked',
 'throw-revoke','relogin-return-original'];
const results=[];
try{
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true,args:name==='chromium'?['--no-sandbox']:[]});
  try{
   for(const width of [320,390,430]){
    const context=await browser.newContext({viewport:{width,height:844},isMobile:true,
     hasTouch:true,serviceWorkers:'block'});
    try{
     const page=await context.newPage(),errors=[];
     page.on('pageerror',e=>errors.push(String(e)));
     await page.goto(url);
     await page.addScriptTag({content:executable});
     for(const mode of modes){
      const row=await page.evaluate(m=>window.__scenario(m),mode);
      assert.equal(row.status.includes('PRIVATE'),false,'private info in status');
      if(mode==='valid'){
       assert.equal(row.accepted,true);assert.equal(row.published,true);
       assert.equal(row.privatePanelVisible,true);assert.equal(row.revokeCount,0);
      }else{
       assert.equal(row.accepted,false,name+' '+width+' '+mode+' stale review mount');
       assert.match(row.error,/STALE_AUTH_OWNER_LEASE/);
       assert.equal(row.published,false);
       assert.equal(row.privatePanelVisible,false);
       assert.equal(row.revokeCount,1);
      }
      if(mode==='account-switch')assert.equal(row.status,'owner B screen');
      results.push({engine:name,width,mode,passed:true});
     }
     assert.deepEqual(errors,[],name+' '+width+' browser JS errors');
    }finally{await context.close();}
   }
  }finally{await browser.close();}
 }
}finally{await new Promise(ok=>server.close(ok));}
assert.equal(results.length,60);
await writeFile(resolve(out,'results.json'),JSON.stringify({
 source:'actual public/cloud-backup-bridge.js reviewed cloud P146 admission',
 syntheticAccountOnly:true,hostedCloud:false,physicalPhones:false,
 familyAlpha:'HOLD',passed:results.length,results
},null,2));
console.log('Mission 3 P146 reviewed cloud mount: 60 Chromium/WebKit synthetic cases PASS. NO DEPLOY.');
