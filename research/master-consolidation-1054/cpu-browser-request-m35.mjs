/** M25: strictly opt-in transport for a separate research CPU-only WASM worker.
 * Native owner-review controller remains the ONLY publisher and only normal
 * owner-confirmed save path. No production import or global runtime switch.
 */
export function cpuBrowserRequest25(request,{signal,onProgress=()=>{},timeoutMs=240000}={}){
 return new Promise((resolve,reject)=>{
  if(signal?.aborted)return reject(Error('P82_CANCELLED'));
  if(!Number.isInteger(timeoutMs)||timeoutMs<1000||timeoutMs>300000)return reject(Error('P82_TIMEOUT_INVALID'));
  let worker;
  try{worker=new Worker(new URL('./cpu-wasm-review-worker-m35.mjs',import.meta.url),{type:'module'});}
  catch{return reject(Error('P82_WORKER_UNAVAILABLE'));}
  let ended=false;
  const terminate=(error,value)=>{
   if(ended)return;ended=true;clearTimeout(timer);
   signal?.removeEventListener('abort',cancel);
   try{worker.onmessage=null;worker.onerror=null;worker.onmessageerror=null;}catch{}
   try{worker.terminate();}catch{}
   error?reject(error):resolve(value);
  };
  const cancel=()=>terminate(Error('P82_CANCELLED'));
  const timer=setTimeout(()=>terminate(Error('P82_TIMEOUT')),timeoutMs);
  signal?.addEventListener('abort',cancel,{once:true});
  worker.onerror=()=>terminate(Error('P82_WORKER_FAILURE'));
  worker.onmessageerror=()=>terminate(Error('P82_MESSAGE_DECODE_FAILURE'));
  worker.onmessage=({data})=>{
   if(ended||data?.requestId!==request?.requestId)return;
   if(data.type==='progress'){
    try{onProgress(data.stage);}catch{terminate(Error('P82_PROGRESS_FAILURE'));}
   }else if(data.type==='error'){
    terminate(Error(/^P82_[A-Z_]+$/.test(data.code||'')?data.code:'P82_MODEL_UNAVAILABLE'));
   }else if(data.type==='result'){
    // Never bypass original owner-model response acceptance.
    import('/dual-core-82.mjs').then(({validateResponse82})=>{
     try{
      const checked=validateResponse82(data.output,request);
      if(!checked||data.output?.researchRuntime!=='m25-cpu-only-wasm'||
         data.output?.automaticAdmissions!==0||data.output?.hostedWrites!==0||
         data.output?.productionAdoption===true)throw Error('P82_CPU_RESEARCH_SCOPE');
      terminate(null,data.output);
     }catch{terminate(Error('P82_RESEARCH_RESPONSE_INVALID'));}
    }).catch(()=>terminate(Error('P82_RESEARCH_RESPONSE_INVALID')));
   }else terminate(Error('P82_WORKER_PROTOCOL'));
  };
  try{worker.postMessage(request);}catch{terminate(Error('P82_REQUEST_UNDELIVERABLE'));}
 });
}
