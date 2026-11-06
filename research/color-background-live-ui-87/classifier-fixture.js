/**
 * COLOR87 TEST FIXTURE ONLY. Does not execute a learned AI model.
 * Exercises the genuine browser UI/canvas/source photo/owner IndexedDB,
 * while a synthetic worker abstains from classifying either photograph.
 */
(()=>{
 const NativeWorker=window.Worker;
 const calls={classification:0,detection:0};
 Object.defineProperty(window,'__color87WorkerFixture',{get:()=>({...calls})});
 window.Worker=function COLOR87TestWorker(url,options){
  const src=String(url);
  const isDetection=/^(?:\.\/)?outfit-worker\.mjs(?:\?|$)/.test(src);
  const isClassifier=/^(?:\.\/)?local-worker\.mjs(?:\?|$)/.test(src);
  if(!isDetection&&!isClassifier)return new NativeWorker(url,options);
  const mock={onmessage:null,onerror:null,terminated:false,
   postMessage(request){
    if(!request?.id||!String(request.image||'').startsWith('data:image/jpeg;base64,'))
     throw Error('COLOR87 synthetic fixture received invalid JPEG request');
    if(isDetection){
     calls.detection++;
     setTimeout(()=>{if(!mock.terminated)mock.onmessage?.({data:{id:request.id,type:'done'}})},9);
     return;
    }
    if(request.type!=='classify')throw Error('COLOR87 unexpected classifier operation');
    calls.classification++;
    // Explicit no-classification answer: COLOR87 evaluates *only* real canvas
    // pixel safety and manually confirmed private closet saving.
    setTimeout(()=>{if(!mock.terminated)mock.onmessage?.({data:{
     id:request.id,type:'result',strong:false,categoryConfirmed:false,
     choices:[],details:{},reason:'category_uncertain'
    }})},8);
   },
   terminate(){mock.terminated=true}
  };
  return mock;
 };
})();