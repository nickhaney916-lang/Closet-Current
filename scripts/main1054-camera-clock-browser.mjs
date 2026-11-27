import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {chromium,webkit} from 'playwright';

// Exercise the built cadence and actual application tick in real browser DOM.
// Clock, camera readiness and candidate callbacks are controlled fixtures.
const cadence=await readFile('dist/capture.js','utf8');
const app=await readFile('public/app.js','utf8');
const start=app.indexOf('function captureTick('),end=app.indexOf('async function captureProofPhoto(',start);
assert.ok(start>=0&&end>start);
const fixture=`
let stream={},cameraMode='auto',session=0,clock=100000;
const video={readyState:2,videoWidth:1280};
const $=id=>document.getElementById(id);
const cadence=new CaptureCadence(5000,clock);
function snap(){return 'fixture-frame';}
function candidate(){session++;}
function beep(){}
function finishScan(){stream=null;}
function message(){}
`+app.slice(start,end)+`
window.tick=(now,ready=true)=>{
 video.readyState=ready?2:0;
 captureTick(now);
 return {session,status:$('captureState').textContent,last:cadence.last};
};
`;
const html='<!doctype html><meta name="viewport" content="width=device-width"><p id="captureState"></p><script src="/capture.js"></script><script src="/fixture.js"></script>';
const server=createServer((req,res)=>{
 const body=req.url==='/'?html:req.url==='/capture.js'?cadence:req.url==='/fixture.js'?fixture:null;
 if(body===null){res.writeHead(404).end();return;}
 res.writeHead(200,{'content-type':req.url==='/'?'text/html':'text/javascript'}).end(body);
});
async function exercise(browser,engine,width,origin){
 const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 try{
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin);
  const tick=(now,ready=true)=>page.evaluate(([n,r])=>window.tick(n,r),[now,ready]);
  assert.equal((await tick(104999)).session,0);
  assert.equal((await tick(105000)).session,1);
  const rollback=await tick(10000);
  assert.equal(rollback.session,1);
  assert.equal(rollback.last,10000);
  assert.match(rollback.status,/5 seconds/);
  assert.equal((await tick(14999)).session,1);
  assert.equal((await tick(15000)).session,2);
  const delayed=await tick(1000,false);
  assert.equal(delayed.session,2);
  assert.equal(delayed.last,1000);
  assert.match(delayed.status,/Waiting for camera images/);
  assert.equal((await tick(5999)).session,2);
  assert.equal((await tick(6000)).session,3);
  assert.equal((await tick(10999)).session,3);
  assert.equal((await tick(11000)).session,4);
  assert.deepEqual(errors,[]);
  console.log(engine,width,'PASS camera clock rollback recovery');
 }finally{await context.close();}
}
try{
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const origin='http://127.0.0.1:'+server.address().port;
 for(const [engine,type] of Object.entries({chromium,webkit})){
  if(process.env.CC_CAMERA_ENGINE&&process.env.CC_CAMERA_ENGINE!==engine)continue;
  const browser=await type.launch();
  try{for(const width of [320,390,430])await exercise(browser,engine,width,origin);}
  finally{await browser.close();}
 }
}finally{server.close();}
