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
  if(typeof request.image!=='string'||!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(request.image)||request.image.length>15000000)throw Error('Invalid outfit photo.');
  if(request.analysisImage!==undefined&&(typeof request.analysisImage!=='string'||!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(request.analysisImage)||request.analysisImage.length>12000000))throw Error('Invalid derived outfit analysis image.');
  const {model,processor,RawImage}=await load(request.id);self.postMessage({type:'progress',id:request.id,phase:'separating'});
  const image=await RawImage.read(request.image);
  if(!Number.isInteger(image.width)||!Number.isInteger(image.height)||
     image.width<1||image.height<1||image.width>8192||image.height>8192||
     image.width*image.height>48000000)throw Error('Invalid original outfit photo dimensions.');
  // SegFormer receives a bounded *derived* analysis input. All returned
  // crops, color samples and original JPEG records still use image above.
  // Existing callers without a derived image remain bounded to 3072 px.
  const inference=request.analysisImage===undefined||request.analysisImage===request.image?image:await RawImage.read(request.analysisImage);
  if(!inference.width||!inference.height||Math.max(inference.width,inference.height)>3072||
     inference.width*inference.height>3072*3072||
     (request.analysisImage===undefined&&Math.max(image.width,image.height)>3072))
   throw Error('Invalid derived outfit analysis dimensions.');
  const output=await model(await processor(inference)),{clothingLabelMap,clothingMaskGroups,cropClothingPhotoPixels,isolateClothingPixels,clothingColorSample}=await import('./outfit-segmentation.mjs'+new URL(import.meta.url).search);
  await import('./photo-color.js'+new URL(import.meta.url).search);
  const map=clothingLabelMap(output.logits.data,output.logits.dims);
  const groups=request.multi24===true?
   (await import('../research/multi-garment-capture-01/visible-groups.mjs')).visibleGarmentGroups24(map):
   map.personDetected?clothingMaskGroups(map):[];
  // The consumer adds "piece" to the review queue as soon as it arrives.
  // A later original-photo crop/JPEG error must never leave half an outfit.
  // Bound temporary base64 memory while preparing the complete transaction.
  const pieces=[];let batchChars=0;
  for(const group of groups){
   const isolated=isolateClothingPixels(image,map,group),raw=cropClothingPhotoPixels(image,map,group),sample=clothingColorSample(image,map,group),b=raw.bounds;
   const piece={image:await jpegData(new RawImage(isolated.data,isolated.width,isolated.height,3)),recognitionPhoto:{image:await jpegData(new RawImage(raw.data,raw.width,raw.height,3))},cropBounds:{x:b.left/image.width,y:b.top/image.height,width:b.width/image.width,height:b.height/image.height},colorEstimate:group.sourceDisconnectedReviewRequired===true?null:(()=>{const palette=PhotoColor.maskedPalette(sample.data,sample.width,sample.height);return palette&&!palette.needsConfirmation?{color:palette.primary,source:'photo-estimate',support:palette.colors[0]?.share||0,secondaryColor:palette.secondary}:null;})(),label:group.label,instanceKey:request.multi24===true?group.instanceKey:undefined,personDetected:map.personDetected,hint:{categories:group.categories,types:group.types||[],clipped:group.clipped,confidence:group.confidence,sourceDisconnectedReviewRequired:request.multi24!==true&&group.sourceDisconnectedReviewRequired===true,sourceIslandCount:Number.isInteger(group.largeSourceIslandCount)?group.largeSourceIslandCount:1}};
   const size=piece.image.length+(piece.recognitionPhoto?.image?.length||0);
   if(piece.image.length>8000000||piece.recognitionPhoto?.image?.length>8000000||
      batchChars+size>24000000){
    const error=new RangeError('OUTFIT_SOURCE_BATCH_MEMORY_CAP');
    error.code='OUTFIT_SOURCE_BATCH_MEMORY_CAP';
    throw error;
   }
   batchChars+=size;pieces.push(piece);
  }
  // Publish all reviewed-source candidates only after EVERY crop and JPEG
  // has succeeded. An errored job publishes ZERO individual garment pieces.
  for(const piece of pieces)self.postMessage({type:'piece',id:request.id,piece});
  self.postMessage({type:'done',id:request.id,count:pieces.length});
 }catch(error){
  if(error?.code==='MULTI24_REVIEW_OVERFLOW'){
   self.postMessage({type:'error',id:request.id,
    text:'This photo contains more clothing regions than can be reviewed safely in one group. No regions were imported. Try photographing fewer garments together.'});
  }else if(error?.code==='OUTFIT_SOURCE_BATCH_MEMORY_CAP'){
   self.postMessage({type:'error',id:request.id,
    text:'This photo produced too much clothing image data to review safely on this device. No pieces were imported. Try photographing fewer garments together.'});
  }else self.postMessage({type:'error',id:request.id,
   text:'This outfit could not be separated on this device. Your existing photos are kept. Try another clear photo of one person, head to toe.'});
 }
 }).catch(()=>self.postMessage({type:'error',id:request.id,text:'Outfit separation stopped. Try the photo again.'}));};
