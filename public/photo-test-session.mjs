export function photoTestSession({WorkerClass=globalThis.Worker,workerUrl='./local-worker.mjs',onProgress=()=>{},schedule=setTimeout,cancel=clearTimeout}={}){
 const worker=new WorkerClass(workerUrl,{type:'module'}),pending=new Map();let sequence=0,closed=false;
 const error=code=>Object.assign(Error('Recognition could not finish.'),{code});
 function close(code='cancelled'){
  if(closed)return;closed=true;
  for(const job of pending.values()){cancel(job.timer);job.reject(error(code));}
  pending.clear();worker.terminate();
 }
 worker.onmessage=({data})=>{
  if(closed)return;
  if(data.type==='progress'){onProgress(data);return;}
  const job=pending.get(data.id);if(!job)return;
  if(['result','ready','error'].includes(data.type)){
   cancel(job.timer);pending.delete(data.id);
   if(data.type==='error')job.reject(error(data.code||'unknown'));else job.resolve(data);
  }
 };
 worker.onerror=()=>close('runtime');
 return {call(payload){
  if(closed)return Promise.reject(error('cancelled'));
  const id=++sequence;
  return new Promise((resolve,reject)=>{
   const timer=schedule(()=>close('timeout'),payload.type==='load'?300000:60000);
   pending.set(id,{resolve,reject,timer});
   try{worker.postMessage({...payload,id});}catch{close('runtime');}
  });
 },close};
}
