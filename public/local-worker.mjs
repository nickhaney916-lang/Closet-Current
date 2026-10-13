// Register the message handler before downloading dependencies, so import
// failures become explicit job errors instead of an unexplained setup wait.
let classifierPromise;
async function load(){
 if(!classifierPromise)classifierPromise=(async()=>{
  self.postMessage({type:'progress',stage:'runtime'});
  const {pipeline,env}=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js');
  env.allowLocalModels=false;env.useBrowserCache=true;
  env.backends.onnx.wasm.numThreads=1;env.backends.onnx.wasm.proxy=false;
  return pipeline('zero-shot-image-classification','ff13/fashion-clip',{device:'wasm',dtype:'q8',progress_callback:event=>{
   const weights=String(event.file||'').endsWith('.onnx');
   self.postMessage({type:'progress',stage:weights?'weights':'runtime',percent:weights&&Number.isFinite(event.progress)?Math.round(event.progress):null});
  }});
 })().catch(error=>{classifierPromise=null;throw error;});
 return classifierPromise;
}
let chain=Promise.resolve();
self.onmessage=event=>{const request=event.data;chain=chain.then(async()=>{
 try{
  const model=await load();
  if(request.type==='load'){self.postMessage({type:'ready',id:request.id});return;}
  if(request.type!=='classify'||typeof request.image!=='string'||!request.image.startsWith('data:image/jpeg;base64,'))throw Error('Invalid captured image.');
  const {localCandidates,clothingChoices,strongMatch,garmentDetailGroups,groupedGarmentDetails}=await import('./local-catalog.mjs'+new URL(import.meta.url).search);
  const results=await model(request.image,localCandidates.map(c=>c.label),{hypothesis_template:'A photo of {}.'});
  const choices=clothingChoices(results),first=choices[0],strong=strongMatch(choices);let details={};
  if(strong){
   self.postMessage({type:'identified',id:request.id,choice:first});
   const groups=garmentDetailGroups(first),labels=Object.values(groups).flat().map(x=>x.label);
   const ranked=await model(request.image,labels,{hypothesis_template:'A photo of {}.'});
   details=groupedGarmentDetails(ranked,groups);
   if(details.sleeveLength)first.sleeveLength=details.sleeveLength;
  }
  self.postMessage({type:'result',id:request.id,choices,strong,details});
 }catch{
  self.postMessage({type:'error',id:request.id,text:'Recognition could not finish on this device. Try again or use Adjust.'});
 }
}).catch(()=>{self.postMessage({type:'error',id:request.id,text:'Recognition stopped. Try again or use Adjust.'});});};
