/**
 * DETECTOR57 only: deterministic UNTRUSTED detector-message replay in Playwright.
 *
 * No real model, segmentation-quality, or classification-accuracy claim.
 * The native app and genuine photographed JPEG are unchanged. This in-page
 * adapter replaces ONLY outfit-worker.mjs, and only when Playwright explicitly
 * requests DETECTOR57=1; it is never loaded by the app itself.
 *
 * Deliberately high score (1.0), synthetic affirmative personEvidence and
 * plausible model category/color stress the user-review gate. Worker output
 * is deliberately untrustworthy: it never proves the crop was reviewed.
 */
(() => {
 const NativeWorker=window.Worker;
 let requestCount=0;
 Object.defineProperty(window,'__detector57Audit',{configurable:true,
  get:()=>({requests:requestCount})});
 window.Worker=function Worker57(url,options){
  if(!/^(?:\.\/)?outfit-worker\.mjs(?:\?|$)/.test(String(url)))
   return new NativeWorker(url,options);
  const mock={
   onmessage:null,onerror:null,terminated:false,
   postMessage(request){
    if(request?.multi24!==true||typeof request.image!=='string'||
       !request.image.startsWith('data:image/jpeg;base64,'))
     throw new Error('DETECTOR57 fixture requires native local original JPEG worker request');
    requestCount++;
    const raw={
     instanceKey:'seg-0-100-100-700-700-1',
     cropBounds:{x:.38,y:.055,width:.40,height:.345},
     personDetected:true,
     colorEstimate:{color:'Blue'},
     hint:{categories:['Tops'],types:['Button-down shirt'],confidence:1,clipped:false}
    };
    // Relay asynchronous, session-bound normal worker messages through the
    // native onmessage handler; never mutate private state or call UI APIs.
    setTimeout(()=>{
     if(!mock.terminated)mock.onmessage?.({data:{id:request.id,type:'piece',piece:raw}});
    },10);
    setTimeout(()=>{
     if(!mock.terminated)mock.onmessage?.({data:{id:request.id,type:'done'}});
    },35);
   },
   terminate(){mock.terminated=true;}
  };
  return mock;
 };
})();
