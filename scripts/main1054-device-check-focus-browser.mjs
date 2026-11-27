import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';

// Built device checklist, native keyboard and DOM, actual local IndexedDB.
// Synthetic local owner database; no network or hosted authentication.
const files=new Map(await Promise.all(['device-check-engine.js','device-check.js'].map(async name=>['/'+name,await readFile('dist/'+name)])));
const html='<!doctype html><meta name="viewport" content="width=device-width"><style>button{min-height:44px}button:focus{outline:2px solid blue}</style><div id="deviceCheckSteps"></div>'+['deviceCheckSummary','deviceScanSummary','deviceCheckStatus'].map(id=>'<p id="'+id+'"></p>').join('')+['startDeviceCheck','stopDeviceCheck','downloadDeviceCheck','deviceCheckAddClothes'].map(id=>'<button id="'+id+'">'+id+'</button>').join('')+'<script src="/device-check-engine.js"></script><script src="/fixture.js"></script><script src="/device-check.js"></script>';
files.set('/fixture.js',`
const $=id=>document.getElementById(id);
function node(tag,text,cls){const el=document.createElement(tag);if(text!=null)el.textContent=text;if(cls)el.className=cls;return el;}
let db;
const recognitionAssetVersion='123456789abc';
function switchView(){}
const queued=work=>Promise.resolve().then(work);
const closetReady=new Promise((resolve,reject)=>{
 const request=indexedDB.open('device-focus-owner-fixture',1);
 request.onupgradeneeded=()=>request.result.createObjectStore('state',{keyPath:'id'});
 request.onerror=()=>reject(request.error);
 request.onsuccess=()=>{db=request.result;resolve();};
});
window.savedChoice=()=>new Promise((resolve,reject)=>{
 const r=db.transaction('state').objectStore('state').get('device-check');
 r.onsuccess=()=>resolve(r.result?.steps?.login||null);
 r.onerror=()=>reject(r.error);
});
`);
const server=createServer((req,res)=>{
 if(req.url==='/'){res.writeHead(200,{'content-type':'text/html'}).end(html);return;}
 if(files.has(req.url)){res.writeHead(200,{'content-type':'text/javascript'}).end(files.get(req.url));return;}
 res.writeHead(404).end();
});
async function exercise(browser,engine,width,origin){
 const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 try{
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin);
  await page.waitForFunction(()=>deviceCheckInitialized);
  const pass=page.getByRole('button',{name:'Log in: Works',exact:true}),fail=page.getByRole('button',{name:'Log in: Needs help',exact:true});
  await page.evaluate(()=>{window.originalControls=[...document.querySelectorAll('#deviceCheckSteps button')];});
  await pass.focus();
  await pass.press('Enter');
  await page.waitForFunction(async()=>await savedChoice()==='pass');
  assert.equal(await pass.getAttribute('aria-pressed'),'true');
  assert.equal(await fail.getAttribute('aria-pressed'),'false');
  assert.equal(await page.evaluate(()=>document.activeElement===originalControls[0]),true);
  assert.equal(await page.evaluate(()=>originalControls.every((el,i)=>el===document.querySelectorAll('#deviceCheckSteps button')[i])),true);
  assert.match(await page.locator('#deviceCheckSummary').textContent(),/1 of/);
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement===originalControls[1]),true);
  await page.keyboard.press('Space');
  await page.waitForFunction(async()=>await savedChoice()==='fail');
  assert.equal(await pass.getAttribute('aria-pressed'),'false');
  assert.equal(await fail.getAttribute('aria-pressed'),'true');
  assert.equal(await page.evaluate(()=>document.activeElement===originalControls[1]),true);
  assert.match(await page.locator('#deviceCheckSummary').textContent(),/1 need attention/);
  await page.reload();
  await page.waitForFunction(()=>deviceCheckInitialized);
  assert.equal(await fail.getAttribute('aria-pressed'),'true');
  assert.equal(await pass.getAttribute('aria-pressed'),'false');
  assert.equal(await page.evaluate(()=>savedChoice()),'fail');
  assert.deepEqual(errors,[]);
  console.log(engine,width,'PASS device checklist focus and persistent choice');
 }finally{await context.close();}
}
try{
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const origin='http://127.0.0.1:'+server.address().port;
 for(const [engine,type] of Object.entries({chromium,webkit})){
  if(process.env.CC_DEVICE_FOCUS_ENGINE&&process.env.CC_DEVICE_FOCUS_ENGINE!==engine)continue;
  const browser=await type.launch();
  try{for(const width of [320,390,430])await exercise(browser,engine,width,origin);}
  finally{await browser.close();}
 }
}finally{server.close();}
