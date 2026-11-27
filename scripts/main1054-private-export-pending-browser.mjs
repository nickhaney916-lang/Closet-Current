import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';
const [engine='chromium',appPath='public/app.js',mode='candidate']=process.argv.slice(2);
const app=await readFile(appPath,'utf8');
function span(a,b){const i=app.indexOf(a),j=app.indexOf(b,i+1);assert.ok(i>=0&&j>i);return app.slice(i,j);}
const source=[
 span("window.addEventListener('closet:session-locked',()=>{","function message(t){"),
 span('function ownerWardrobeMutationLease(){','function writeAll(values){'),
 span("$('export').onclick=async()=>{","$('import').onchange=async")
].join('\n');
const browser=await ({chromium,webkit}[engine]).launch();
try{
 for(const width of [320,390,430]) for(const research of [false,true]){
  const page=await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true});
  await page.route('http://fixture.invalid/**',route=>{
   const url=new URL(route.request().url());
   if(url.pathname==='/native-default-verified-backup-export-m3.mjs')
    return route.fulfill({contentType:'text/javascript',body:'export async function exportDurableOwnerBackupM3(){const data=await window.deferExport();return {json:JSON.stringify(data)};}'});
   return route.fulfill({contentType:'text/html',body:'<div id="authGate" hidden></div><main id="appShell"><button id="export">Export backup</button><video id="fixtureVideo"></video></main>'});
  });
  await page.goto('http://fixture.invalid/index.html'+(research?'?restoreAtomic01=research':''));
  await page.evaluate(()=>{
   const auth=id=>({user:{id},assertCurrent(){}});
   const database=id=>({name:'closet-current-user-'+id,close(){}});
   Object.assign(window,{captureOperationEpoch:0,writes:Promise.resolve(),videoImportSerial:0,videoImportActive:false,photoImportSerial:0,photoImportActive:false,busy:false,saving:false,cameraOpening:false,captureProofTaking:false,stream:null,localWorker:null,automaticRunning:false,localBatch:false,localLoadPromise:null,localReady:false,recognitionUnavailable:false,memoryReviewTimer:null,memoryReviewRunning:false,db:database('A'),closetAuth:auth('A'),items:[],batch:[],startupWardrobeRecoveryCount:0,localJobs:new Map(),automaticQueue:[],localPending:new Map(),recognitionState:{},sessionCapturedIds:new Set(),failedDraftCaptures:new Set(),video:document.getElementById('fixtureVideo'),calls:[],notices:[],downloads:[]});
   window.$=id=>document.getElementById(id);
   window.stopCamera=()=>{};window.controls=()=>{};window.assertCompleteWardrobe=()=>{};
   window.message=t=>notices.push(t);
   window.node=tag=>{const a=document.createElement(tag);a.click=()=>downloads.push(a.download);return a;};
   window.deferExport=()=>new Promise((resolve,reject)=>calls.push({resolve,reject}));
   window.restoreAtomic01Bridge={exportJSON:async()=>({data:await deferExport()})};
   window.loginFixture=id=>{window.closetAuth=auth(id);window.db=database(id);};
  });
  await page.addScriptTag({content:source});
  const button=page.locator('#export');
  await button.click();
  await page.waitForFunction(()=>calls.length===1);
  await page.evaluate(()=>{void $('export').onclick();});
  if(mode==='baseline'){
   assert.equal(await button.isEnabled(),true);
   await page.waitForFunction(()=>calls.length===2);
   await page.evaluate(()=>calls.forEach(c=>c.resolve({fixture:true})));
   await page.waitForFunction(()=>downloads.length===2);
   console.log('PRIVATE_EXPORT_PENDING_RED',engine,width,research?'research':'default');
   await page.close();continue;
  }
  assert.equal(await button.isDisabled(),true);
  assert.equal(await page.evaluate(()=>calls.length),1);
  await page.evaluate(()=>calls[0].reject(Error('fixture failure')));
  await page.waitForFunction(()=>!$('export').disabled);
  assert.equal(await page.evaluate(()=>downloads.length),0);
  await button.click();
  await page.waitForFunction(()=>calls.length===2);
  await page.evaluate(()=>{window.dispatchEvent(new Event('closet:session-locked'));loginFixture('B');});
  assert.equal(await button.isEnabled(),true);
  await button.click();
  await page.waitForFunction(()=>calls.length===3);
  await page.evaluate(()=>calls[1].resolve({fixture:'old'}));
  await page.evaluate(()=>true);
  assert.equal(await button.isDisabled(),true);
  assert.equal(await page.evaluate(()=>downloads.length),0);
  await page.evaluate(()=>calls[2].resolve({fixture:'current'}));
  await page.waitForFunction(()=>!$('export').disabled&&downloads.length===1);
  assert.equal(await page.evaluate(()=>closetAuth.user.id),'B');
  console.log('PRIVATE_EXPORT_PENDING_GREEN',engine,width,research?'research':'default');
  await page.close();
 }
}finally{await browser.close();}
