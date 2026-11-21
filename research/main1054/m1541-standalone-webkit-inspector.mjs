/** M1541: isolated single-frontend, synthetic-only WPE Inspector contract. No ONNX or native debugger. */
import {spawn} from 'node:child_process';
import {webkit} from 'playwright';
import {parseLocalInspectorPaths} from './m289-authorized-wpe-inspector-wasm-offset.mjs';

const phase=Number(process.argv[2]); // 0=socket, 1=outer reply, 2=Runtime, 3=Debugger, 4=synthetic WASM exception pause
if(!Number.isInteger(phase)||phase<0||phase>4)throw Error('invalid standalone phase');
const host='127.0.0.1:17652';
const report={
 phase,mode:'standalone-single-frontend',engine:'pinned-webkit',
 launched:false,http:false,websocket:false,target:false,targetEvidence:null,
 outerReply:false,outerErrorCode:null,innerReply:false,innerErrorCode:null,
 outerMessageCount:0,outerMethods:[],innerMethods:[],nestedCommandSent:false,
 processExited:false,exitCode:null,signal:null,stderrBytes:0,
 syntheticOnly:true,originalModelExecuted:false,nativeMachinePcCaptured:false,
 originalOrtTrapByteOffset:null,syntheticTrapCaught:false,
 exceptionPauseObserved:false,exceptionPauseReason:null,pauseTopWasm:false,
 pauseLocationLine:null,pauseLocationColumn:null,debuggerResumeReply:false
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
 const innerReplies=new Map();let resumeSent=false;
 const sendNested=(id,method,params={})=>{
  socket.send(JSON.stringify({id:++outerId,method:'Target.sendMessageToTarget',params:{
   targetId,message:JSON.stringify({id,method,params})
  }}));
 };

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
    if(inner.method==='Debugger.paused'){
     const p=inner.params||{},top=Array.isArray(p.callFrames)?p.callFrames[0]:null;
     report.exceptionPauseObserved=p.reason==='exception';
     report.exceptionPauseReason=typeof p.reason==='string'?p.reason.slice(0,35):null;
     report.pauseTopWasm=/wasm/i.test(String(top?.functionName||top?.url||''));
     report.pauseLocationLine=Number.isSafeInteger(top?.location?.lineNumber)?top.location.lineNumber:null;
     report.pauseLocationColumn=Number.isSafeInteger(top?.location?.columnNumber)?top.location.columnNumber:null;
     // Inspector line/column are NOT native PC or original WASM file offsets.
     if(phase===4&&!resumeSent){resumeSent=true;sendNested(104,'Debugger.resume');}
    }
    if([101,102,103,104].includes(Number(inner.id))&&String(inner.id)===String(Number(inner.id))){
     innerReplies.set(Number(inner.id),inner);
     if(Number(inner.id)===104&&inner.error===undefined)report.debuggerResumeReply=true;
     if(Number(inner.id)===103)report.syntheticTrapCaught=
      inner.result?.result?.value==='EXPECTED_SYNTHETIC_WASM_TRAP';
    }
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
   sendNested(101,method);
   report.nestedCommandSent=true;
   for(let i=0;i<24&&!innerDone&&!report.processExited;i++)await wait(250);
   if(!outerDone)throw Error('nested outer command reply absent');
   if(report.outerErrorCode!==null)throw Error('nested outer command rejected '+report.outerErrorCode);
   if(!innerDone)throw Error('nested inner command reply absent');
   if(report.innerErrorCode!==null)throw Error('nested inner command rejected '+report.innerErrorCode);
   if(phase===4){
    // Pinned JSC Debugger protocol supports pause-on-all exceptions. The
    // M281 tiny module is ONLY synthetic proof; it is not the original ORT.
    const {binary}=await import('./m281-webkit-offset-capability.mjs');
    if(binary.length!==48||binary[44]!==0x28)throw Error('synthetic probe source changed');
    sendNested(102,'Debugger.setPauseOnExceptions',{state:'all'});
    for(let i=0;i<24&&!innerReplies.has(102)&&!report.processExited;i++)await wait(250);
    const pauseConfig=innerReplies.get(102);
    if(!pauseConfig||pauseConfig.error)throw Error('pause-on-exception setup rejected or absent');
    const bytes=JSON.stringify(Array.from(binary));
    const expression=`(()=>{const m=new WebAssembly.Module(Uint8Array.from(${bytes}));try{new WebAssembly.Instance(m).exports.probe();return 'NO_TRAP'}catch(e){return e instanceof WebAssembly.RuntimeError&&/out of bounds|memory access/i.test(String(e.message))?'EXPECTED_SYNTHETIC_WASM_TRAP':'UNEXPECTED_EXCEPTION'}})()`;
    sendNested(103,'Runtime.evaluate',{expression,returnByValue:true});
    for(let i=0;i<40&&(!innerReplies.has(103)||!innerReplies.has(104))&&!report.processExited;i++)await wait(250);
    if(!report.exceptionPauseObserved)throw Error('genuine synthetic exception pause absent');
    if(!report.debuggerResumeReply)throw Error('Debugger.resume reply absent');
    const evalReply=innerReplies.get(103);
    if(!evalReply||evalReply.error||evalReply.result?.wasThrown)throw Error('Runtime.evaluate failed');
    if(!report.syntheticTrapCaught)throw Error('synthetic WASM RuntimeError not independently returned');
   }
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
 // A standalone WPE runner can leave a remote Inspector/undici handle alive
 // after the browser exits. The finite isolated test must end only *after*
 // the genuine protocol receipt has been flushed; preserve any failure code.
 child?.stderr?.destroy();
 child?.unref();
 process.stdout.write('M1541_STANDALONE_SANITIZED '+JSON.stringify(report)+'\\n',()=>{
  process.exit(process.exitCode??0);
 });
}
