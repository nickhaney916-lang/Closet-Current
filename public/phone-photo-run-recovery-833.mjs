/**
 * Mission 1 P833 — bounded, fail-closed recovery for the no-account photo trial.
 *
 * A worker's 60-second classify timeout or crash closes photoTestSession.
 * Without recovery, every later photo is incorrectly marked "cancelled"
 * without attempting inference. This wrapper preserves the FAILED photo,
 * allows exactly ONE model restart for a later photo, and never retries or
 * silently upgrades the failed original.
 *
 * No upload, persistence, scoring, classifier or release changes.
 */
const FATAL_SESSION_CODES_833=new Set(['timeout','runtime','cancelled']);
const failure833=code=>Object.assign(Error('Recognition could not finish on this device.'),{code});

export function createTrialRecoverySession833({
 makeSession,
 isActive=()=>true,
 onRestart=()=>{},
 maxRestarts=1,
 classifyType='classify',
}={}){
 if(typeof makeSession!=='function'||typeof isActive!=='function'||
    typeof onRestart!=='function'||maxRestarts!==1||
    !['classify','classify-guard835'].includes(classifyType))
  throw Error('Invalid bounded trial session configuration.');
 let session=null,state='new',restartCount=0;
 const active=()=>state!=='closed'&&isActive();

 async function load(){
  if(!active())throw failure833('cancelled');
  if(state==='ready')return;
  if(state==='dead')throw failure833('runtime');
  if(state==='loading')throw failure833('runtime'); // sequential-only owner trial
  if(state==='needs-restart'){
   if(restartCount===maxRestarts){state='dead';throw failure833('runtime');}
   restartCount++;
   onRestart(restartCount);
   if(!active())throw failure833('cancelled');
  }
  let candidate;
  try{
   candidate=makeSession();
   if(!candidate||typeof candidate.call!=='function'||typeof candidate.close!=='function')
    throw failure833('runtime');
   session=candidate;
   state='loading';
   await candidate.call({type:'load'});
   if(!active()||session!==candidate)throw failure833('cancelled');
   state='ready';
  }catch(e){
   // close() can run while the replacement model is still loading. It
   // already terminated that candidate: never double-close it, and retain
   // cancellation rather than converting an intentional reset to runtime.
   const cancelled=!active()||e?.code==='cancelled';
   if(state!=='closed')candidate?.close?.();
   if(session===candidate)session=null;
   if(state!=='closed')state='dead';
   throw failure833(cancelled?'cancelled':e?.code==='timeout'?'timeout':'runtime');
  }
 }

 async function classify(image){
  await load();
  if(!active())throw failure833('cancelled');
  try{
   const reply=await session.call({type:classifyType,image});
   if(!active())throw failure833('cancelled');
   return reply;
  }catch(e){
   if(state!=='closed'&&FATAL_SESSION_CODES_833.has(e?.code)){
    session?.close();
    session=null;
    state='needs-restart';
   }
   // Preserve the real source failure type: do not reinterpret it as a
   // successful category, and do not repeat the private source JPEG.
   throw failure833(typeof e?.code==='string'?e.code:'runtime');
  }
 }

 function close(){
  if(state==='closed')return;
  state='closed';
  session?.close();
  session=null;
 }

 return {load,classify,close,get restartCount(){return restartCount;}};
}
