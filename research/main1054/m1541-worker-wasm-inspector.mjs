/**
 * M1541 independent Worker Inspector WASM probe.
 * Synthetic-only; original ONNX/JSEP/model and native debugger are untouched.
 * Usage: node research/main1054/m1541-worker-wasm-inspector.mjs trap|control
 */
import {spawn} from 'node:child_process';
import {webkit} from 'playwright';
import {parseLocalInspectorPaths} from './m289-authorized-wpe-inspector-wasm-offset.mjs';
import {binary} from './m281-webkit-offset-capability.mjs';

const mode=process.argv[2];
if(!['trap','control'].includes(mode))throw Error('expected trap or control');
if(binary.length!==48||binary[44]!==0x28)throw Error('synthetic M281 opcode changed');
const host='127.0.0.1:17652',wait=ms=>new Promise(r=>setTimeout(r,ms));
const receipt={
 mode,syntheticOnly:true,originalModelExecuted:false,originalTrapInstructionOffset:null,
 nativeMachinePcCaptured:false,workerSourceIsOriginalP94:false,
 http:false,websocket:false,pageTarget:false,workerDomainEnabled:false,
 workerCreated:false,workerIdType:null,workerIdLength:null,workerIdValid:false,
 workerDebuggerEnabled:false,workerRuntimeEnabled:false,workerPauseOnExceptions:false,
 workerBreakpointsActive:false,workerInitialized:false,workerReady:false,
 workerPausedCount:0,workerPauseReason:null,workerResumedCount:0,
 workerResumeAcknowledged:false,workerRuntimeResult:null,
 positiveVerified:false,negativeVerified:false,workerTerminated:false,
 outerProtocolErrors:[],browserExited:false
};
let child,socket,pageTarget=null,workerId=null,seq=0,workerResumeSent=false;
const pageReplies=new Map(),workerReplies=new Map();
const outgoingOuterReplies=new Map();
const waitFor=async(fn,label,tries=32)=>{
 for(let i=0;i<tries;i++){
  if(fn())return;
  if(receipt.browserExited)break;
  await wait(250);
 }
 throw Error(label);
};
try{
 const exe=webkit.executablePath();
 if(!exe||!exe.startsWith('/'))throw Error('pinned WPE executable missing');
 child=spawn(exe,['--headless','data:text/html,%3Ctitle%3EM1541%20Worker%20probe%3C%2Ftitle%3E'],{
  env:{...process.env,WEBKIT_INSPECTOR_HTTP_SERVER:host},
  stdio:['ignore','ignore','pipe']
 });
 child.on('exit',()=>{receipt.browserExited=true});
 child.stderr?.on('data',()=>{}); // never log browser/private host output
 let path=null;
 for(let i=0;i<40&&!path&&!receipt.browserExited;i++){
  try{
   const r=await fetch('http://'+host+'/',{signal:AbortSignal.timeout(350),redirect:'error'});
   if(r.ok)path=parseLocalInspectorPaths(await r.text()).find(p=>p.endsWith('/WebPage'));
  }catch{}
  if(!path)await wait(250);
 }
 if(!path||!/^\/socket\/[0-9]{1,18}\/[0-9]{1,18}\/WebPage$/.test(path))
  throw Error('bounded WebPage Inspector endpoint absent');
 receipt.http=true;
 socket=new WebSocket('ws://'+host+path);
 const sendPage=(id,method,params={})=>{
  if(!pageTarget)throw Error('untracked Page Inspector target');
  socket.send(JSON.stringify({id:++seq,method:'Target.sendMessageToTarget',params:{
   targetId:pageTarget,message:JSON.stringify({id,method,params})
  }}));
 };
 const sendWorker=(id,method,params={})=>{
  if(!workerId)throw Error('untracked Worker Inspector identity');
  sendPage(id+100,'Worker.sendMessageToWorker',{
   workerId,message:JSON.stringify({id,method,params})
  });
 };
 const onMsg=e=>{
  try{
   const msg=JSON.parse(String(e.data).slice(0,32768));
   if(msg.id!==undefined){
    outgoingOuterReplies.set(Number(msg.id),msg);
    if(Number.isInteger(msg.error?.code)&&receipt.outerProtocolErrors.length<8)
     receipt.outerProtocolErrors.push(msg.error.code);
   }
   if(msg.method==='Target.targetCreated'&&msg.params?.targetInfo?.type==='page'){
    const candidate=msg.params.targetInfo.targetId;
    if(typeof candidate==='string'&&/^[A-Za-z0-9_:-]{1,128}$/.test(candidate)){
     pageTarget=candidate;receipt.pageTarget=true;
    }
   }
   if(msg.method!=='Target.dispatchMessageFromTarget'||typeof msg.params?.message!=='string')return;
   const page=JSON.parse(msg.params.message);
   if(Number.isInteger(page.id))pageReplies.set(page.id,page);
   if(page.method==='Worker.workerCreated'){
    const candidate=page.params?.workerId;
    receipt.workerCreated=true;
    receipt.workerIdType=typeof candidate;
    receipt.workerIdLength=typeof candidate==='string'?candidate.length:null;
    receipt.workerIdValid=typeof candidate==='string'&&candidate.length>0&&candidate.length<=256&&
     ![...candidate].some(ch=>ch.charCodeAt(0)<32||ch.charCodeAt(0)===127);
    if(receipt.workerIdValid)workerId=candidate;
   }
   if(page.method==='Worker.workerTerminated'&&page.params?.workerId===workerId)
    receipt.workerTerminated=true;
   if(page.method==='Worker.dispatchMessageFromWorker'&&page.params?.workerId===workerId&&
      typeof page.params.message==='string'){
    const worker=JSON.parse(page.params.message.slice(0,32768));
    if(Number.isInteger(worker.id)){
     workerReplies.set(worker.id,worker);
     if(worker.id===301&&!worker.error)receipt.workerDebuggerEnabled=true;
     if(worker.id===302&&!worker.error)receipt.workerRuntimeEnabled=true;
     if(worker.id===303&&!worker.error)receipt.workerPauseOnExceptions=true;
     if(worker.id===304&&!worker.error)receipt.workerBreakpointsActive=true;
     if(worker.id===305&&!worker.error)receipt.workerResumeAcknowledged=true;
    }
    if(worker.method==='Debugger.paused'){
     receipt.workerPausedCount++;
     receipt.workerPauseReason=typeof worker.params?.reason==='string'?
      worker.params.reason.slice(0,32):null;
     if(mode==='trap'&&!workerResumeSent){
      workerResumeSent=true;
      sendWorker(305,'Debugger.resume');
     }
    }
    if(worker.method==='Debugger.resumed')receipt.workerResumedCount++;
   }
  }catch{} // Sanitized events; the phase assertions below remain fail-closed.
 };
 socket.addEventListener('message',onMsg);
 await new Promise((resolve,reject)=>{
  const t=setTimeout(()=>reject(Error('Inspector WebSocket handshake timed out')),5000);
  socket.addEventListener('open',()=>{clearTimeout(t);resolve()},{once:true});
  socket.addEventListener('error',()=>{clearTimeout(t);reject(Error('Inspector WebSocket handshake failed'))},{once:true});
 });
 receipt.websocket=true;
 await waitFor(()=>receipt.pageTarget,'tracked Page target absent');
 const reqPage=async(id,method,params={})=>{
  sendPage(id,method,params);
  await waitFor(()=>pageReplies.has(id),'Page '+method+' reply absent');
  if(pageReplies.get(id).error)throw Error('Page '+method+' rejected');
  return pageReplies.get(id).result;
 };
 await reqPage(101,'Runtime.enable');
 await reqPage(111,'Worker.enable');
 receipt.workerDomainEnabled=true;

 const work=mode==='trap'?
  "try{const m=new WebAssembly.Module(Uint8Array.from("+JSON.stringify([...binary])+"));new WebAssembly.Instance(m).exports.probe();postMessage('NO_TRAP')}catch(e){postMessage(e instanceof WebAssembly.RuntimeError&&/out of bounds|memory access/i.test(String(e.message))?'EXPECTED_TRAP':'WRONG_ERROR')}":
  "postMessage(3*7===21?'EXPECTED_NO_EXCEPTION':'WRONG_CALC')";
 const workerSource="self.postMessage('READY');self.onmessage=()=>setTimeout(()=>{"+work+"},350);";
 const startPage="(()=>{const u=URL.createObjectURL(new Blob(["+
  JSON.stringify(workerSource)+"],{type:'application/javascript'}));const w=new Worker(u);"+
  "window.__probeWorker=w;window.__probeUrl=u;window.__probeState='PENDING';"+
  "w.onmessage=e=>{window.__probeState=e.data};return 'ARMED'})()";
 const started=await reqPage(108,'Runtime.evaluate',{expression:startPage,returnByValue:true});
 if(started?.result?.value!=='ARMED')throw Error('synthetic Worker not armed');
 await waitFor(()=>receipt.workerCreated&&receipt.workerIdValid,'Worker.workerCreated with valid opaque ID absent');
 const reqWorker=async(id,method,params={})=>{
  sendWorker(id,method,params);
  await waitFor(()=>pageReplies.has(id+100)&&workerReplies.has(id),'Worker '+method+' dual reply absent');
  if(pageReplies.get(id+100).error||workerReplies.get(id).error)
   throw Error('Worker '+method+' rejected');
 };
 await reqWorker(301,'Debugger.enable');
 await reqWorker(302,'Runtime.enable');
 await reqWorker(303,'Debugger.setPauseOnExceptions',{state:'all'});
 await reqWorker(304,'Debugger.setBreakpointsActive',{active:true});
 await reqPage(112,'Worker.initialized',{workerId});
 receipt.workerInitialized=true;

 let poll=500;
 const getState=async()=>{const r=await reqPage(poll++,'Runtime.evaluate',{
  expression:"window.__probeState",returnByValue:true
 });return r?.result?.value;};
 let ready=false;
 for(let i=0;i<25;i++){
  if(await getState()==='READY'){ready=true;break;}
  await wait(200);
 }
 if(!ready)throw Error('Worker ready after Inspector initialize absent');
 receipt.workerReady=true;
 const ran=await reqPage(211,'Runtime.evaluate',{
  expression:"(()=>{window.__probeWorker.postMessage('RUN');return 'SENT'})()",returnByValue:true
 });
 if(ran?.result?.value!=='SENT')throw Error('Worker RUN not scheduled');
 const want=mode==='trap'?'EXPECTED_TRAP':'EXPECTED_NO_EXCEPTION';
 for(let i=0;i<35;i++){
  const state=await getState();
  if(state===want){receipt.workerRuntimeResult=want;break;}
  if(state==='WRONG_ERROR'||state==='NO_TRAP'||state==='WRONG_CALC')
   throw Error('Worker produced unexpected result');
  await wait(200);
 }
 receipt.positiveVerified=mode==='trap'&&receipt.workerRuntimeResult===want&&
  receipt.workerPausedCount===1&&receipt.workerPauseReason==='exception'&&
  receipt.workerResumedCount>=1&&receipt.workerResumeAcknowledged;
 receipt.negativeVerified=mode==='control'&&receipt.workerRuntimeResult===want&&
  receipt.workerPausedCount===0;
 if(mode==='trap'&&!receipt.positiveVerified)
  throw Error('genuine Worker synthetic WASM pause/resume proof absent');
 if(mode==='control'&&!receipt.negativeVerified)
  throw Error('Worker no-exception control failed');
 const stop=await reqPage(110,'Runtime.evaluate',{
  expression:"(()=>{window.__probeWorker.terminate();URL.revokeObjectURL(window.__probeUrl);return 'TERMINATED'})()",
  returnByValue:true
 });
 if(stop?.result?.value!=='TERMINATED')throw Error('Worker termination unacknowledged');
 await waitFor(()=>receipt.workerTerminated,'Worker termination event absent',16);
 if(receipt.outerProtocolErrors.length)throw Error('remote Inspector protocol outer error');
} catch(e){
 receipt.error=String(e?.message||e).slice(0,170);
 process.exitCode=1;
} finally {
 if(socket){try{socket.close()}catch{}}
 if(child&&!receipt.browserExited){
  try{child.kill('SIGTERM')}catch{}
  for(let i=0;i<8&&!receipt.browserExited;i++)await wait(250);
  if(!receipt.browserExited){try{child.kill('SIGKILL')}catch{}}
 }
 child?.stderr?.destroy();child?.unref();
 process.stdout.write('M1541_WORKER_WASM_SANITIZED '+JSON.stringify(receipt)+'\n',()=>{
  process.exit(process.exitCode??0);
 });
}
