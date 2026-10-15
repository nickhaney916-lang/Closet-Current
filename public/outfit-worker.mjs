let loader;
async function load(requestId){
 if(!loader)loader=(async()=>{
  self.postMessage({type:'progress',id:requestId,phase:'loading'});
  const {AutoModelForSemanticSegmentation,AutoProcessor,RawImage,env}=await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js');
  env.allowLocalModels=false;env.useBrowserCache=true;env.backends.onnx.wasm.numThreads=1;env.backends.onnx.wasm.proxy=false;
  const modelId='Xenova/segformer_b0_clothes',revision='a2489ea8e7ec1ee912190546bad31a4906ccca76';
  const processor=await AutoProcessor.from_pretrained(modelId,{revision});
  const model=await AutoModelForSemanticSegmentation.from_pretrained(modelId,{revision,device:'wasm',dtype:'fp32',progress_callback:event=>self.postMessage({type:'progress',id:requestId,phase:'loading',percent:String(event.file||'').endsWith('.onnx')&&Number.isFinite(event.progress)?Math.round(event.progress):null})});
  return {model,processor,RawImage};
 })().catch(error=>{loader=null;throw error;});
 return loader;
}
async function jpegData(image){
 const bytes=new Uint8Array(await(await image.toBlob('image/jpeg',.94)).arrayBuffer());let text='';for(let i=0;i<bytes.length;i+=32768)text+=String.fromCharCode(...bytes.subarray(i,i+32768));return 'data:image/jpeg;base64,'+btoa(text);
}
let chain=Promise.resolve();
self.onmessage=event=>{const request=event.data;chain=chain.then(async()=>{
 try{
  if(typeof request.image!=='string'||!/^data:image\/jpeg;base64,/.test(request.image)||request.image.length>12000000)throw Error('Invalid outfit photo.');
  const {model,processor,RawImage}=await load(request.id);self.postMessage({type:'progress',id:request.id,phase:'separating'});
  const image=await RawImage.read(request.image);if(!image.width||!image.height||Math.max(image.width,image.height)>3072)throw Error('Invalid outfit photo dimensions.');
  const output=await model(await processor(image)),{clothingLabelMap,clothingMaskGroups,cropClothingPhotoPixels,isolateClothingPixels,clothingColorSample}=await import('./outfit-segmentation.mjs'+new URL(import.meta.url).search);
  await import('./photo-color.js'+new URL(import.meta.url).search);
  const map=clothingLabelMap(output.logits.data,output.logits.dims),groups=map.personDetected?clothingMaskGroups(map):[];let count=0;
  for(const group of groups){
   const raw=cropClothingPhotoPixels(image,map,group),sample=clothingColorSample(image,map,group),b=raw.bounds;
   const piece={image:await jpegData(new RawImage(raw.data,raw.width,raw.height,3)),recognitionPhoto:null,cropBounds:{x:b.left/image.width,y:b.top/image.height,width:b.width/image.width,height:b.height/image.height},colorEstimate:(()=>{const palette=PhotoColor.maskedPalette(sample.data,sample.width,sample.height);return palette&&!palette.needsConfirmation?{color:palette.primary,source:'photo-estimate',support:palette.colors[0]?.share||0,secondaryColor:palette.secondary}:null;})(),label:group.label,hint:{categories:group.categories,types:group.types||[],clipped:group.clipped,confidence:group.confidence}};
   self.postMessage({type:'piece',id:request.id,piece});count++;
  }
  self.postMessage({type:'done',id:request.id,count});
 }catch{self.postMessage({type:'error',id:request.id,text:'This outfit could not be separated on this device. Your existing photos are kept. Try another clear photo of one person, head to toe.'});}
 }).catch(()=>self.postMessage({type:'error',id:request.id,text:'Outfit separation stopped. Try the photo again.'}));};
