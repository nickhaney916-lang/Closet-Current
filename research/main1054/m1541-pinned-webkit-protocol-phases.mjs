/** M1541 synthetic-only pinned WebKit Inspector phase isolation. No original ONNX or native debugging. */
import {webkit} from 'playwright';
import {parseLocalInspectorPaths} from './m289-authorized-wpe-inspector-wasm-offset.mjs';
const phase=Number(process.argv[2]);
if(!Number.isInteger(phase)||phase<0||phase>4)throw Error('invalid phase');
const host='127.0.0.1:17651';
const report={phase,http:false,websocket:false,target:false,nestedCommandSent:false,debuggerEnableSent:false,outerMethods:[],innerMethods:[],outerErrors:[],discoveryCommandSent:false,discoveryResponse:false,discoveryErrorCode:null,innerResponse:false,innerErrorCode:null,socketClosed:false};
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let browser,socket;
try{
 browser=await webkit.launch({headless:true,env:{...process.env,WEBKIT_INSPECTOR_HTTP_SERVER:host}});
 if(browser.version()!=='26.0')throw Error('WebKit pin mismatch '+browser.version());
 const context=await browser.newContext({serviceWorkers:'block'});
 const page=await context.newPage();
 await page.goto('data:text/html,<title>M1541 synthetic phase</title>');
 const response=await fetch('http://'+host+'/',{signal:AbortSignal.timeout(5000),redirect:'error'});
 if(!response.ok)throw Error('HTTP discovery status '+response.status);
 const paths=parseLocalInspectorPaths(await response.text());
 report.http=paths.length>0;
 if(!report.http)throw Error('HTTP discovery yielded no local WebPage socket');
 if(phase===0)process.exitCode=0;
 else {
  const path=paths.find(p=>p.endsWith('/WebPage'))||paths[0];
  if(!/^\/socket\/[0-9]{1,18}\/[0-9]{1,18}\/[A-Za-z][A-Za-z0-9_-]{0,47}$/.test(path))throw Error('invalid local path');
  socket=new WebSocket('ws://'+host+path);
  const handshake=new Promise((resolve,reject)=>{
   const t=setTimeout(()=>reject(Error('WebSocket handshake timeout')),5000);
   socket.addEventListener('open',()=>{clearTimeout(t);resolve()},{once:true});
   socket.addEventListener('error',()=>{clearTimeout(t);reject(Error('WebSocket handshake failed'))},{once:true});
  });
  if(phase<=1){
   await handshake;
   report.websocket=true;
  } else {
   let id=0,targetId=null,innerDone=false;
   const send=(method,params={})=>socket.send(JSON.stringify({id:++id,method,params}));
   socket.addEventListener('message',e=>{
    let msg;try{msg=JSON.parse(String(e.data).slice(0,16384))}catch{return}
    if(typeof msg.method==='string'&&report.outerMethods.length<10)report.outerMethods.push(msg.method.slice(0,80));
    if(msg.error&&report.outerErrors.length<5)report.outerErrors.push({code:Number.isInteger(msg.error.code)?msg.error.code:null});
    if(msg.id===1){report.discoveryResponse=true;report.discoveryErrorCode=Number.isInteger(msg.error?.code)?msg.error.code:null;}
    const candidate=msg.params?.targetInfo?.targetId||msg.params?.targetId;
    if(typeof candidate==='string'&&/^[A-Za-z0-9_:-]{1,128}$/.test(candidate)){
     targetId=candidate;report.target=true;
    }
    if(msg.method==='Target.dispatchMessageFromTarget'&&typeof msg.params?.message==='string'){
     try{const inner=JSON.parse(msg.params.message);if(typeof inner.method==='string'&&report.innerMethods.length<10)report.innerMethods.push(inner.method.slice(0,80));if(inner.id===101){innerDone=true;report.innerResponse=true;report.innerErrorCode=Number.isInteger(inner.error?.code)?inner.error.code:null}}catch{}
    }
   });
   await handshake;
   report.websocket=true;
   // Passive discovery yielded zero outer events in the verified baseline.
   // Request discovery explicitly; record protocol support without fabricating a target.
   send('Target.setDiscoverTargets',{discover:true});
   report.discoveryCommandSent=true;
   for(let n=0;n<20&&!targetId;n++)await wait(250);
   if(phase>=2&&!targetId)throw Error('Target discovery absent after explicit request; reply='+report.discoveryResponse+' code='+report.discoveryErrorCode);
   if(phase>=3){
    const method=phase===3?'Runtime.enable':'Debugger.enable';
    send('Target.sendMessageToTarget',{targetId,message:JSON.stringify({id:101,method,params:{}})});
    report.nestedCommandSent=true;report.debuggerEnableSent=phase===4;
    for(let n=0;n<16&&!innerDone;n++)await wait(250);
    if(!innerDone)throw Error('nested command response absent');
    if(report.innerErrorCode!==null)throw Error('nested command rejected '+report.innerErrorCode);
   }
  }
 }
} catch(e){
 report.error=String(e?.message||e).slice(0,200);
 process.exitCode=1;
} finally {
 if(socket){try{socket.close()}catch{}}
 if(browser){try{await browser.close()}catch(e){report.closeError=String(e?.message||e).slice(0,120);process.exitCode=1}}
 console.log('M1541_SANITIZED_PHASE '+JSON.stringify(report));
}
