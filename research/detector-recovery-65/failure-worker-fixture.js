/**
 * DETECTOR-RECOVERY-65 TEST ONLY: synthetic worker failure injection.
 * Never changes source JPEG, actual crop editor, authenticated owner IDB,
 * Style My New Clothes, real garment records or backup/restore.
 * These modes DO NOT execute a real model or measure segmentation accuracy.
 */
(() => {
 const NativeWorker=window.Worker;
 const mode=window.__DETECTOR65_MODE;
 const supported=new Set(['constructor','post','runtime','messageerror','timeout','manualstop','terminal-late']);
 if(!supported.has(mode))return;
 let count=0,terminated=0;
 Object.defineProperty(window,'__detector65Audit',{
  configurable:true,get:()=>({mode,requests:count,terminated})
 });
 if(mode==='timeout'){
  const oldTimeout=window.setTimeout;
  // Isolated Playwright-only virtual long-worker timeout; production app
  // continues to use its real, unchanged 300-second limit.
  window.setTimeout=function(handler,delay,...params){
   return oldTimeout(handler,delay===300000?115:delay,...params);
  };
 }
 window.Worker=function FailureFixture65(url,options){
  if(!/^(?:\.\/)?outfit-worker\.mjs(?:\?|$)/.test(String(url)))
   return new NativeWorker(url,options);
  if(mode==='constructor')throw Error('SYNTHETIC_WORKER_CONSTRUCTOR_FAILURE_65');
  const worker={
   onmessage:null,onerror:null,onmessageerror:null,terminated:false,
   postMessage(request){
    if(request?.multi24!==true||!request.id||
       typeof request.image!=='string'||!request.image.startsWith('data:image/jpeg;base64,'))
     throw Error('DETECTOR65 did not receive authentic native source-bound JPEG');
    count++;
    if(mode==='post')throw Error('SYNTHETIC_WORKER_POSTMESSAGE_FAILURE_65');
    if(mode==='runtime')setTimeout(()=>{
     if(!worker.terminated)worker.onerror?.({message:'Synthetic module load error'});
    },12);
    if(mode==='messageerror')setTimeout(()=>{
     if(!worker.terminated)worker.onmessageerror?.({message:'Synthetic uncloneable message'});
    },12);
    // The timeout and manual-stop modes deliberately never reply.
    // Terminal-late violates protocol to check that a queued packet cannot
    // resurrect a completed worker or invent an unreviewed garment.
    if(mode==='terminal-late')setTimeout(()=>{
     worker.onmessage?.({data:{id:request.id,type:'done'}});
     worker.onmessage?.({data:{id:request.id,type:'piece',piece:{
      instanceKey:'seg-0-100-100-700-700-1',
      cropBounds:{x:.38,y:.055,width:.40,height:.345},
      personDetected:true,colorEstimate:{color:'Blue'},
      hint:{categories:['Tops'],types:['Button-down shirt'],confidence:1,clipped:false}
     }}});
    },12);
   },
   terminate(){if(!worker.terminated)terminated++;worker.terminated=true;}
  };
  return worker;
 };
})();
