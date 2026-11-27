import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';

// Built navigation controller, real DOM details/summary, actual view switch
// source. Minimal local shell with rendering and camera callbacks stubbed.
const navigation=await readFile('dist/navigation.js','utf8');
const app=await readFile('public/app.js','utf8');
const start=app.indexOf('function switchView('),end=app.indexOf('function openDB(',start);
assert.ok(start>=0&&end>start);
const fixture=`
const $=id=>document.getElementById(id);
let stream=null,cameraOpening=false,startupWardrobeRecoveryCount=0;
function stopCamera(){throw Error('unexpected camera');}
function render(){}
function renderStarterWardrobe(){}
`+app.slice(start,end);
const html='<!doctype html><html><head><meta name="viewport" content="width=device-width"><style>[hidden]{display:none!important}button,summary{min-height:44px}details{margin:8px}</style></head><body><a data-go-view="home" href="#home" id="brand">Home shortcut</a><details class="account-menu"><summary>My account</summary><button data-go-view="devicecheck" id="deviceHelp">Device help</button></details><details id="moreMenu"><summary>More</summary><button class="tab" data-view="devicecheck">Device check</button></details><select id="stylistOccasion"><option>Casual</option></select><section class="view" id="home"><h1>Home</h1></section><section class="view" id="devicecheck" hidden><h2>Device check</h2></section><script src="/fixture.js"></script><script src="/navigation.js"></script></body></html>';
const server=createServer((req,res)=>{
 const body=req.url==='/'?html:req.url==='/fixture.js'?fixture:req.url==='/navigation.js'?navigation:null;
 if(body===null){res.writeHead(404).end();return;}
 res.writeHead(200,{'content-type':req.url==='/'?'text/html':'text/javascript'}).end(body);
});
async function exercise(browser,engine,width,origin){
 const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 try{
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin);
  const state=()=>page.evaluate(()=>({account:document.querySelector('.account-menu').open,more:document.getElementById('moreMenu').open,home:document.getElementById('home').hidden,device:document.getElementById('devicecheck').hidden,focus:document.activeElement?.textContent}));
  await page.locator('.account-menu summary').click();
  assert.equal((await state()).account,true);
  await page.evaluate(()=>document.getElementById('moreMenu').open=true);
  await page.locator('#deviceHelp').click();
  assert.deepEqual(await state(),{account:false,more:false,home:true,device:false,focus:'Device check'});
  await page.locator('.account-menu summary').click();
  await page.locator('#brand').click();
  assert.deepEqual(await state(),{account:false,more:false,home:false,device:true,focus:'Home'});
  await page.locator('.account-menu summary').click();
  await page.locator('.account-menu summary').press('Escape');
  const escaped=await state();
  assert.equal(escaped.account,false);
  assert.equal(escaped.focus,'My account');
  await page.locator('.account-menu summary').click();
  await page.locator('#deviceHelp').click();
  assert.deepEqual(await state(),{account:false,more:false,home:true,device:false,focus:'Device check'});
  assert.deepEqual(errors,[]);
  console.log(engine,width,'PASS navigation menu dismissal and focus');
 }finally{await context.close();}
}
try{
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const origin='http://127.0.0.1:'+server.address().port;
 for(const [engine,type] of Object.entries({chromium,webkit})){
  if(process.env.CC_NAV_ENGINE&&process.env.CC_NAV_ENGINE!==engine)continue;
  const browser=await type.launch();
  try{for(const width of [320,390,430])await exercise(browser,engine,width,origin);}
  finally{await browser.close();}
 }
}finally{server.close();}
