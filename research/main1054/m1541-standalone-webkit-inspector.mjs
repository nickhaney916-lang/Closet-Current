/** M1541: isolated single-frontend, synthetic-only WPE Inspector contract. No ONNX or native debugger. */
import {spawn} from 'node:child_process';
import {webkit} from 'playwright';
import {parseLocalInspectorPaths} from './m289-authorized-wpe-inspector-wasm-offset.mjs';

const phase=Number(process.argv[2]); // 0=socket, 1=outer reply, 2=Runtime, 3=Debugger, 4=WASM exception, 5=JS debugger statement, 6=two distinct WASM opcodes/one JS callsite, 7=dedicated Worker Inspector target
if(!Number.isInteger(phase)||phase<0||phase>7)throw Error('invalid standalone phase');
const host='127.0.0.1:17652';
const report={
 phase,mode:'standalone-single-frontend',engine:'pinned-webkit',
 launched:false,http:false,websocket:false,target:false,targetEvidence:null,
 outerReply:false,outerErrorCode:null,innerReply:false,innerErrorCode:null,
 outerMessageCount:0,outerMethods:[],innerMethods:[],nestedCommandSent:false,
 processExited:false,exitCode:null,signal:null,stderrBytes:0,
 syntheticOnly:true,originalModelExecuted:false,nativeMachinePcCaptured:false,
 originalOrtTrapByteOffset:null,syntheticTrapCaught:false,syntheticDebuggerStatementCompleted:false,
 exceptionPauseObserved:false,exceptionPauseReason:null,debuggerPauseObserved:false,debuggerPauseReason:null,pauseTopWasm:false,
 pauseLocationLine:null,pauseLocationColumn:null,debuggerResumeReply:false,
 dualSyntheticOpcodeOffsets:null,dualSyntheticTrapCaught:false,dualPauseReceipts:[],
 dualResumeAckCount:0,sameJavascriptPauseLocation:null,wasmBytecodeAttributionVerified:false,
 workerCreated:false,workerReady:false,workerTargetCreated:false,
 workerTargetScope:null,workerTargetDestroyed:false,workerScriptEvaluation:false
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
 let targetId=null,outerId=0,outerDone=false,innerDone=false;let workerTargetId=null;
 const innerReplies=new Map();let resumeSent=false;const pauseScriptIds=[];
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
  if(msg.method==='Target.targetCreated'&&msg.params?.targetInfo?.type==='worker'){
   const id=msg.params.targetInfo.targetId;
   if(typeof id==='string'&&/^[A-Za-z0-9_:-]{1,128}$/.test(id)){
    workerTargetId=id;report.workerTargetCreated=true;report.workerTargetScope='outer';
   }
  }
  if(msg.method==='Target.targetDestroyed'&&msg.params?.targetId===workerTargetId)
   report.workerTargetDestroyed=true;
  if(msg.method==='Target.targetCreated'&&msg.params?.targetInfo?.type==='page'){
   const candidate=msg.params.targetInfo.targetId;
   if(typeof candidate==='string'&&/^[A-Za-z0-9_:-]{1,128}$/.test(candidate)){
    targetId=candidate;report.target=true;report.targetEvidence='Target.targetCreated';
   }
  }
  if(msg.method==='Target.dispatchMessageFromTarget'&&typeof msg.params?.message==='string'){
   try{
    const inner=JSON.parse(msg.params.message);
    if(inner.method==='Target.targetCreated'&&inner.params?.targetInfo?.type==='worker'){
     const id=inner.params.targetInfo.targetId;
     if(typeof id==='string'&&/^[A-Za-z0-9_:-]{1,128}$/.test(id)){
      workerTargetId=id;report.workerTargetCreated=true;report.workerTargetScope='nested';
     }
    }
    if(inner.method==='Target.targetDestroyed'&&inner.params?.targetId===workerTargetId)
     report.workerTargetDestroyed=true;
    if(inner.method==='Debugger.paused'){
     const p=inner.params||{},top=Array.isArray(p.callFrames)?p.callFrames[0]:null;
     report.debuggerPauseObserved=true;
     report.debuggerPauseReason=typeof p.reason==='string'?p.reason.slice(0,35):null;
     report.exceptionPauseObserved=p.reason==='exception';
     report.exceptionPauseReason=typeof p.reason==='string'?p.reason.slice(0,35):null;
     report.pauseTopWasm=/wasm/i.test(String(top?.functionName||top?.url||''));
     report.pauseLocationLine=Number.isSafeInteger(top?.location?.lineNumber)?top.location.lineNumber:null;
     report.pauseLocationColumn=Number.isSafeInteger(top?.location?.columnNumber)?top.location.columnNumber:null;
     // Inspector line/column are NOT native PC or original WASM file offsets.
     if(phase===6){
      // Bounded synthesized experiment: two separate verified WASM opcodes,
      // each called at ONE JS callsite. Never label JS coordinates WASM offsets.
      if(report.dualPauseReceipts.length<2){
       const index=report.dualPauseReceipts.length;
       report.dualPauseReceipts.push({
        reason:typeof p.reason==='string'?p.reason.slice(0,30):null,
        topWasm:/wasm/i.test(String(top?.functionName||top?.url||'')),
        line:Number.isSafeInteger(top?.location?.lineNumber)?top.location.lineNumber:null,
        column:Number.isSafeInteger(top?.location?.columnNumber)?top.location.columnNumber:null
       });
       pauseScriptIds.push(typeof top?.location?.scriptId==='string'?top.location.scriptId:null);
       sendNested(index===0?104:114,'Debugger.resume');
      }
     }else if((phase===4||phase===5)&&!resumeSent){resumeSent=true;sendNested(104,'Debugger.resume');}
    }
    if([101,102,103,104,105,106,107,108,109,110,114].includes(Number(inner.id))&&String(inner.id)===String(Number(inner.id))){
     innerReplies.set(Number(inner.id),inner);
     if(Number(inner.id)===104&&inner.error===undefined)report.debuggerResumeReply=true;
     if(phase===6&&[104,114].includes(Number(inner.id))&&inner.error===undefined)report.dualResumeAckCount++;
     if(Number(inner.id)===108&&inner.error===undefined&&
        inner.result?.result?.value==='WORKER_ARMED')report.workerCreated=true;
     if(Number(inner.id)===109&&inner.error===undefined&&
        inner.result?.result?.value==='READY')report.workerReady=true;
     if(Number(inner.id)===110&&inner.error===undefined&&
        inner.result?.result?.value==='TERMINATED')report.workerScriptEvaluation=true;
     if(Number(inner.id)===105){
      report.syntheticTrapCaught=phase===4&&
       inner.result?.result?.value==='EXPECTED_SYNTHETIC_WASM_TRAP';
      report.dualSyntheticTrapCaught=phase===6&&
       inner.result?.result?.value==='EXPECTED_DUAL_SYNTHETIC_WASM_TRAPS';
      report.syntheticDebuggerStatementCompleted=phase===5&&
       inner.result?.result?.value==='EXPECTED_SYNTHETIC_DEBUGGER_STATEMENT';
     }
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
   if(phase===7){
    // Pinned WebKit TargetInfo includes dedicated worker. Synthetic-only
    // lifecycle to validate access to the same target KIND as original P94.
    const expression=`(()=>{const u=URL.createObjectURL(new Blob(["self.postMessage('READY');self.onmessage=()=>self.postMessage('ECHO');"],{type:'application/javascript'}));const w=new Worker(u);window.__m1541Worker=w;window.__m1541WorkerUrl=u;window.__m1541WorkerState='PENDING';w.onmessage=(e)=>{if(e.data==='READY')window.__m1541WorkerState='READY'};return 'WORKER_ARMED'})()`;
    sendNested(108,'Runtime.evaluate',{expression,returnByValue:true});
    for(let i=0;i<32&&(!innerReplies.has(108)||!report.workerTargetCreated)&&!report.processExited;i++)await wait(250);
    if(!report.workerCreated)throw Error('synthetic Worker creation was not acknowledged');
    sendNested(109,'Runtime.evaluate',{expression:"window.__m1541WorkerState",returnByValue:true});
    for(let i=0;i<24&&!innerReplies.has(109)&&!report.processExited;i++)await wait(250);
    if(!report.workerReady)throw Error('synthetic Worker did not post ready message');
    if(!report.workerTargetCreated)throw Error('dedicated Worker Inspector target not discovered');
    sendNested(110,'Runtime.evaluate',{expression:"(()=>{window.__m1541Worker.terminate();URL.revokeObjectURL(window.__m1541WorkerUrl);return 'TERMINATED'})()",returnByValue:true});
    for(let i=0;i<24&&!innerReplies.has(110)&&!report.processExited;i++)await wait(250);
    if(!report.workerScriptEvaluation)throw Error('synthetic Worker termination failed');
   }
   if(phase===4||phase===5||phase===6){
    // Pinned JSC Debugger protocol supports pause-on-all exceptions. The
    // M281 tiny module is ONLY synthetic proof; it is not the original ORT.
    const {binary}=await import('./m281-webkit-offset-capability.mjs');
    if(binary.length!==48||binary[44]!==0x28)throw Error('synthetic probe source changed');
    sendNested(102,'Debugger.setPauseOnExceptions',{state:'all'});
    for(let i=0;i<24&&!innerReplies.has(102)&&!report.processExited;i++)await wait(250);
    const pauseConfig=innerReplies.get(102);
    if(!pauseConfig||pauseConfig.error)throw Error('pause-on-exception setup rejected or absent');
    if(phase===5){
     // Pinned InspectorDebuggerAgent::setPauseOnDebuggerStatements explicitly
     // installs the statement breakpoint; Debugger.enable alone does not.
     sendNested(106,'Debugger.setPauseOnDebuggerStatements',{enabled:true});
     for(let i=0;i<24&&!innerReplies.has(106)&&!report.processExited;i++)await wait(250);
     if(!innerReplies.has(106)||innerReplies.get(106).error)
      throw Error('Debugger.setPauseOnDebuggerStatements rejected or absent');
    }
    // Source-backed controlled setting: InspectorDebuggerAgent uses
    // activateBreakpoints() independently of Debugger.enable.
    sendNested(107,'Debugger.setBreakpointsActive',{active:true});
    for(let i=0;i<24&&!innerReplies.has(107)&&!report.processExited;i++)await wait(250);
    if(!innerReplies.has(107)||innerReplies.get(107).error)
     throw Error('Debugger.setBreakpointsActive rejected or absent');
    const bytes=JSON.stringify(Array.from(binary));
    // Insert a single 'nop' before the load: shift known binary opcode 44
    // to 45; update section and function-body byte lengths. The original
    // JSEP and any real ONNX model are NOT loaded in this harness.
    const shifted=Uint8Array.from([...binary.slice(0,44),0x01,...binary.slice(44)]);
    shifted[36]=12;shifted[38]=10;
    if(phase===6){
     if(!WebAssembly.validate(shifted)||shifted.length!==49||shifted[45]!==0x28||
        binary[44]!==0x28)throw Error('two distinct synthetic WASM opcode controls invalid');
     report.dualSyntheticOpcodeOffsets=[44,45];
    }
    // A direct Runtime.evaluate exception may not yield a debugger pause.
    // Schedule the same genuine negative-only WASM opcode on the page event
    // loop, separately from the protocol evaluation call.
    const expression=phase===4?
     `(()=>{window.__m1541Result='ARMED';setTimeout(()=>{try{const m=new WebAssembly.Module(Uint8Array.from(${bytes}));new WebAssembly.Instance(m).exports.probe();window.__m1541Result='NO_TRAP'}catch(e){window.__m1541Result=e instanceof WebAssembly.RuntimeError&&/out of bounds|memory access/i.test(String(e.message))?'EXPECTED_SYNTHETIC_WASM_TRAP':'UNEXPECTED_EXCEPTION'}},400);return 'ARMED'})()`:
     phase===5?
     `(()=>{window.__m1541Result='ARMED';setTimeout(()=>{debugger;window.__m1541Result='EXPECTED_SYNTHETIC_DEBUGGER_STATEMENT'},400);return 'ARMED'})()`:
     `(()=>{window.__m1541Result='ARMED';setTimeout(()=>{let count=0;for(const raw of ${JSON.stringify([Array.from(binary),Array.from(shifted)])}){try{const m=new WebAssembly.Module(Uint8Array.from(raw));new WebAssembly.Instance(m).exports.probe()}catch(e){if(e instanceof WebAssembly.RuntimeError&&/out of bounds|memory access/i.test(String(e.message)))count++}}window.__m1541Result=count===2?'EXPECTED_DUAL_SYNTHETIC_WASM_TRAPS':'WRONG_TRAP_COUNT'},400);return 'ARMED'})()`;
    sendNested(103,'Runtime.evaluate',{expression,returnByValue:true});
    for(let i=0;i<40&&(!innerReplies.has(103)||(phase===6?report.dualPauseReceipts.length<2:!report.debuggerPauseObserved))&&!report.processExited;i++)await wait(250);
    const evalReply=innerReplies.get(103);
    if(!evalReply||evalReply.error||evalReply.result?.wasThrown||evalReply.result?.result?.value!=='ARMED')
     throw Error('scheduled evaluation was not armed');
    // Even on FAIL, independently check that the test really executed its
    // synthetic OOB opcode, rather than mistaking an idle debugger for RED.
    if(!report.debuggerPauseObserved)await wait(750);
    sendNested(105,'Runtime.evaluate',{expression:"window.__m1541Result||'MISSING'",returnByValue:true});
    for(let i=0;i<24&&!innerReplies.has(105)&&!report.processExited;i++)await wait(250);
    if(phase===6){
     if(!report.dualSyntheticTrapCaught)throw Error('independent two-opcode WASM traps not verified');
     if(report.dualPauseReceipts.length!==2||report.dualResumeAckCount!==2)
      throw Error('two paused+resumed native engine events were not observed');
     if(report.dualPauseReceipts.some(x=>x.reason!=='exception'||x.line===null||x.column===null))
      throw Error('synthetic dual pause reason or script location invalid');
     report.sameJavascriptPauseLocation=report.dualPauseReceipts[0].line===report.dualPauseReceipts[1].line&&
       report.dualPauseReceipts[0].column===report.dualPauseReceipts[1].column&&
       pauseScriptIds[0]!==null&&pauseScriptIds[0]===pauseScriptIds[1];
     // Distinct bytecode offsets but identical JS location is an empirically
     // demonstrated many-to-one mapping. Keep attribution explicitly FALSE.
     if(!report.sameJavascriptPauseLocation)throw Error('two probes have differing JS pause locations; offset mapping still unverified');
    }
    if(phase===4&&!report.syntheticTrapCaught)throw Error('synthetic WASM RuntimeError not independently returned');
    if(phase===5&&!report.syntheticDebuggerStatementCompleted)throw Error('synthetic debugger statement never completed');
    if(phase===4&&!report.exceptionPauseObserved)throw Error('scheduled synthetic WebAssembly exception pause absent');
    if(phase===5&&(!report.debuggerPauseObserved||report.debuggerPauseReason!=='DebuggerStatement'))
     throw Error('scheduled debugger statement pause absent');
    if(!report.debuggerResumeReply)throw Error('Debugger.resume reply absent');
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
