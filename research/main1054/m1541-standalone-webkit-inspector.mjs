/** M1541: isolated single-frontend, synthetic-only WPE Inspector contract. No ONNX or native debugger. */
import {spawn} from 'node:child_process';
import {webkit} from 'playwright';
import {parseLocalInspectorPaths} from './m289-authorized-wpe-inspector-wasm-offset.mjs';

const phase=Number(process.argv[2]); // 0=socket, 1=outer reply, 2=Runtime, 3=Debugger
if(!Number.isInteger(phase)||phase<0||phase>3)throw Error('invalid standalone phase');
const host='127.0.0.1:17652';
const report={
 phase,mode:'standalone-single-frontend',engine:'pinned-webkit',
 launched:false,http:false,websocket:false,target:false,targetEvidence:null,
 outerReply:false,outerErrorCode:null,innerReply:false,innerErrorCode:null,
 outerMessageCount:0,outerMethods:[],innerMethods:[],nestedCommandSent:false,
 processExited:false,exitCode:null,signal:null,stderrBytes:0
};
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let child,socket,spawnError=null;
try {
 // The patched WPE MiniBrowser supports --headless without --inspector-pipe.
 // Playwright is used for locating the exact pinned binary, NOT for launching
 // or owning a second Inspector frontend on this browser process.
 const executable=webkit.executablePath();
 if(!executable||!executable.startsWith('/'))throw Error('pinned executable unavailable');
 child=spawn(executable,['--headless','data:text/html,%3Ctitle%3EM1541%20synthetic%3C%2Ftitle%3E'],{
  env:{...process.env,WEBKIT_INSPECTOR_HTTP_SERVER:host},
  stdio:['ignore','ignore','pipe']
 });
 child.once('error',e=>{spawnError=e?.code||'spawn error'});
 child.on('exit',(code,signal)=>{report.processExited=true;report.exitCode=code;report.signal=signal});
 child.stderr?.on('data',chunk=>{report.stderrBytes+=chunk.length}); // do not print browser/host details
 report.launched=true;
 let paths=[];
 for(let attempt=0;attempt<40;attempt++){
  if(spawnError||report.processExited)break;
  try{
   const response=await fetch('http://'+host+'/',{signal:AbortSignal.timeout(350),redirect:'error'});
   if(response.ok){paths=parseLocalInspectorPaths(await response.text());if(paths.some(p=>p.endsWith('/WebPage')))break;}
  }catch{}
  await wait(250);
 }
 if(spawnError)throw Error('standalone browser spawn failure');
 if(report.processExited)throw Error('standalone browser exited before discovery');
 const path=paths.find(p=>p.endsWith('/WebPage'));
 if(!path)throw Error('standalone WebPage HTTP discovery absent');
 if(!/^\/socket\/[0-9]{1,18}\/[0-9]{1,18}\/WebPage$/.test(path))throw Error('invalid local WebPage endpoint');
 report.http=true;
 socket=new WebSocket('ws://'+host+path);
 let targetId=null,outerId=0,outerDone=false,innerDone=false;
 const handshake=new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>reject(Error('standalone WebSocket timeout')),5000);
  socket.addEventListener('open',()=>{clearTimeout(timeout);resolve()},{once:true});
  socket.addEventListener('error',()=>{clearTimeout(timeout);reject(Error('standalone WebSocket failed'))},{once:true});
 });
 socket.addEventListener('message',e=>{
  let msg;
  try{msg=JSON.parse(String(e.data).slice(0,16384))}catch{return}
  report.outerMessageCount++;
  if(typeof msg.method==='string'&&report.outerMethods.length<12)report.outerMethods.push(msg.method.slice(0,80));
  if(msg.id===1||msg.id==='1'){
   outerDone=true;report.outerReply=true;
   report.outerErrorCode=Number.isInteger(msg.error?.code)?msg.error.code:null;
  }
  if(msg.method==='Target.targetCreated'&&msg.params?.targetInfo?.type==='page'){
   const candidate=msg.params.targetInfo.targetId;
   if(typeof candidate==='string'&&/^[A-Za-z0-9_:-]{1,128}$/.test(candidate)){
    targetId=candidate;report.target=true;report.targetEvidence='Target.targetCreated';
   }
  }
  if(msg.method==='Target.dispatchMessageFromTarget'&&typeof msg.params?.message==='string'){
   try{
    const inner=JSON.parse(msg.params.message);
    const forwardedId=msg.params.targetId;
    if(inner.method==='Page.frameNavigated'&&typeof forwardedId==='string'&&/^[A-Za-z0-9_:-]{1,128}$/.test(forwardedId)){
     targetId=forwardedId;report.target=true;report.targetEvidence='Page.frameNavigated';
    }
    if(typeof inner.method==='string'&&report.innerMethods.length<12)report.innerMethods.push(inner.method.slice(0,80));
    if(inner.id===101||inner.id==='101'){
     innerDone=true;report.innerReply=true;
     report.innerErrorCode=Number.isInteger(inner.error?.code)?inner.error.code:null;
    }
   }catch{}
  }
 });
 await handshake;report.websocket=true;
 if(phase>=1){
  if(phase===1){
   socket.send(JSON.stringify({id:1,method:'Target.setPauseOnStart',params:{pauseOnStart:false}}));
   for(let i=0;i<20&&!outerDone;i++)await wait(250);
   if(!outerDone)throw Error('outer command reply absent');
   if(report.outerErrorCode!==null)throw Error('outer command rejected '+report.outerErrorCode);
  }else{
   for(let i=0;i<20&&!targetId;i++)await wait(250);
   if(!targetId)throw Error('standalone tracked page target absent');
   const method=phase===2?'Runtime.enable':'Debugger.enable';
   socket.send(JSON.stringify({id:1,method:'Target.sendMessageToTarget',params:{
    targetId,message:JSON.stringify({id:101,method,params:{}})
   }}));
   report.nestedCommandSent=true;
   for(let i=0;i<24&&!innerDone&&!report.processExited;i++)await wait(250);
   if(!outerDone)throw Error('nested outer command reply absent');
   if(report.outerErrorCode!==null)throw Error('nested outer command rejected '+report.outerErrorCode);
   if(!innerDone)throw Error('nested inner command reply absent');
   if(report.innerErrorCode!==null)throw Error('nested inner command rejected '+report.innerErrorCode);
  }
 }
} catch(e) {
 report.error=String(e?.message||e).slice(0,180);
 process.exitCode=1;
} finally {
 if(socket){try{socket.close()}catch{}}
 if(child&&!report.processExited){
  try{child.kill('SIGTERM')}catch{}
  for(let i=0;i<8&&!report.processExited;i++)await wait(250);
  if(!report.processExited){try{child.kill('SIGKILL')}catch{}}
 }
 console.log('M1541_STANDALONE_SANITIZED '+JSON.stringify(report));
}
