import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';

// Built controller, native DOM and native IndexedDB. Session lock and delayed
// delivery are controlled fixture events, not signed backend authentication.
const names=['device-check-engine.js','device-check.js'];
const files=new Map(await Promise.all(names.map(async name=>['/'+name,await readFile('dist/'+name)])));
const html='<!doctype html><meta name="viewport" content="width=device-width"><div id="deviceCheckSteps"></div>'+['deviceCheckSummary','deviceScanSummary','deviceCheckStatus'].map(id=>'<p id="'+id+'"></p>').join('')+['startDeviceCheck','stopDeviceCheck','downloadDeviceCheck','deviceCheckAddClothes'].map(id=>'<button id="'+id+'">'+id+'</button>').join('')+'<script src="/device-check-engine.js"></script><script src="/fixture.js"></script><script src="/device-check.js"></script>';
const fixture=`
const $=id=>document.getElementById(id);
function node(tag,text,cls){const el=document.createElement(tag);if(text!=null)el.textContent=text;if(cls)el.className=cls;return el;}
let db,fixtureReadReady=false,fixtureReadDelivery,fixtureDownloads=0,fixtureScans=0;
const recognitionAssetVersion='123456789abc';
function switchView(){fixtureScans++;}
const queued=work=>Promise.resolve().then(work);
HTMLAnchorElement.prototype.click=function(){fixtureDownloads++;};
const closetReady=new Promise((resolve,reject)=>{
 const request=indexedDB.open('device-qa-owner-fixture',1);
 request.onupgradeneeded=()=>request.result.createObjectStore('state',{keyPath:'id'});
 request.onerror=()=>reject(request.error);
 request.onsuccess=()=>{
  const native=request.result;
  const tx=native.transaction('state','readwrite');
  tx.objectStore('state').put({id:'device-check',enabled:true,steps:{login:'pass'},events:[{type:'scanner_error'}]});
  tx.onerror=()=>reject(tx.error);
  tx.oncomplete=()=>{
   db={transaction(){
    const store=native.transaction('state').objectStore('state');
    const wrapper={get(key){
     const actual=store.get(key),held={};
     actual.onsuccess=()=>{held.result=actual.result;fixtureReadDelivery=()=>held.onsuccess();fixtureReadReady=true;};
     actual.onerror=()=>{held.error=actual.error;held.onerror();};
     return held;
    }};
    return {objectStore:()=>wrapper};
   }};
   resolve();
  };
 };
});
`;
files.set('/fixture.js',fixture);
const server=createServer((req,res)=>{
 if(req.url==='/'){res.writeHead(200,{'content-type':'text/html'}).end(html);return;}
 if(files.has(req.url)){res.writeHead(200,{'content-type':'text/javascript'}).end(files.get(req.url));return;}
 res.writeHead(404).end();
});
async function exercise(browser,engine,width,origin){
 for(const when of ['before-read','after-read']){
  const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  try{
   const page=await context.newPage(),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.goto(origin);
   await page.waitForFunction(()=>fixtureReadReady);
   if(when==='before-read')await page.evaluate(()=>window.dispatchEvent(new Event('closet:session-locked')));
   await page.evaluate(()=>fixtureReadDelivery());
   if(when==='after-read'){
    await page.waitForFunction(()=>deviceCheckInitialized);
    assert.equal(await page.evaluate(()=>deviceCheckState.events[0].type),'scanner_error');
    assert.equal(await page.evaluate(()=>deviceCheckState.steps.login),'pass');
    await page.evaluate(()=>window.dispatchEvent(new Event('closet:session-locked')));
   }
   await page.evaluate(async()=>{
    $('downloadDeviceCheck').onclick();$('deviceCheckAddClothes').onclick();
    await $('startDeviceCheck').onclick();recordDeviceEvent('scanner_error');
   });
   const state=await page.evaluate(()=>({initialized:deviceCheckInitialized,enabled:deviceCheckState.enabled,
    steps:Object.keys(deviceCheckState.steps),events:deviceCheckState.events,
    controls:['startDeviceCheck','stopDeviceCheck','downloadDeviceCheck','deviceCheckAddClothes'].every(id=>$(id).disabled),
    summary:$('deviceCheckSummary').textContent,scanSummary:$('deviceScanSummary').textContent,status:$('deviceCheckStatus').textContent,
    rows:$('deviceCheckSteps').children.length,downloads:fixtureDownloads,scans:fixtureScans}));
   assert.deepEqual(state,{initialized:false,enabled:false,steps:[],events:[],controls:true,summary:'',scanSummary:'',status:'',rows:0,downloads:0,scans:0});
   assert.deepEqual(errors,[]);
   console.log(engine,width,when,'PASS device diagnostic session lock');
  }finally{await context.close();}
 }
}
try{
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const origin='http://127.0.0.1:'+server.address().port;
 for(const [engine,type] of Object.entries({chromium,webkit})){
  if(process.env.CC_DEVICE_ENGINE&&process.env.CC_DEVICE_ENGINE!==engine)continue;
  const browser=await type.launch();
  try{for(const width of [320,390,430])await exercise(browser,engine,width,origin);}
  finally{await browser.close();}
 }
}finally{server.close();}
