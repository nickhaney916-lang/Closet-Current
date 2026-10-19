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
  const output=await model(await processor(image)),{clothingLabelMap,clothingMaskGroups,reviewOnlyUnwornOutfitGroups,cropClothingPhotoPixels,isolateClothingPixels,clothingColorSample,clothingInteriorColorSample,garmentDisplayMaskReliability}=await import('./outfit-segmentation.mjs'+new URL(import.meta.url).search);
  await import('./photo-color.js'+new URL(import.meta.url).search);
  const map=clothingLabelMap(output.logits.data,output.logits.dims),groups=map.personDetected?clothingMaskGroups(map):reviewOnlyUnwornOutfitGroups(map);
  // When a presumed dress also contains substantial competing shirt
  // evidence above and skirt evidence below, the single dress mask may combine
  // separate worn garments. Keep the ORIGINAL source crop for user review and
  // never auto-approve its color or save it as one dress. This model-only
  // signal is not evidence of two separate physical garments.
  const dressConflict=map.personDetected&&groups.some(group=>group.id===7)
   ?(await import('./dress-layer-review.mjs'+new URL(import.meta.url).search))
     .dressClassCompetition(output.logits.data,output.logits.dims,map).mixedClassReviewCandidate
   :false;
  // Explicit benchmark opt-in only. No per-pixel output or camera imagery.
  // Never change masks, recognition inputs, or auto-save criteria for diagnostics.
  if(request.diagnostics===true){
   const {diagnoseOutfitRegions}=await import('./outfit-diagnostics.mjs'+new URL(import.meta.url).search);
   self.postMessage({type:'diagnostics',id:request.id,summary:diagnoseOutfitRegions(output.logits.data,output.logits.dims,map,groups)});
  }
  let count=0;
  for(const group of groups){
   // Index/recognize using the fixed, narrow ORIGINAL 5% RGB crop only.
   // When a mask is structurally unreliable, DISPLAY a wider 12% source
   // crop so missing hems/soles just beyond coarse model bounds survive.
   // The enlarged display crop is NEVER sent to recognition or color inference.
   const raw=cropClothingPhotoPixels(image,map,group),maskReview=garmentDisplayMaskReliability(map,group),
    display=group.id===7&&dressConflict
     ?{...maskReview,useOriginalCrop:true,reason:'dress-layer-conflict-review-only'}
     :group.reviewOnlyReason?{...maskReview,useOriginalCrop:true,reason:group.reviewOnlyReason}:maskReview,
    isolated=display.useOriginalCrop?cropClothingPhotoPixels(image,map,group,{marginFraction:.12}):isolateClothingPixels(image,map,group),
    sample=display.useOriginalCrop?null:clothingColorSample(image,map,group),
    core=display.useOriginalCrop?null:clothingInteriorColorSample(image,map,group),b=raw.bounds;
   const piece={image:await jpegData(new RawImage(isolated.data,isolated.width,isolated.height,3)),recognitionPhoto:{image:await jpegData(new RawImage(raw.data,raw.width,raw.height,3))},cropBounds:{x:b.left/image.width,y:b.top/image.height,width:b.width/image.width,height:b.height/image.height},colorEstimate:(()=>{if(display.useOriginalCrop)return null;const full=PhotoColor.maskedPalette(sample.data,sample.width,sample.height);
    const interior=core&&PhotoColor.maskedPalette(core.data,core.width,core.height);
    // Both spatial views must agree; a boundary-only color isn't reliable.
    return PhotoColor.confirmedGarmentPalette(full,interior);
   })(),label:group.label,hint:{categories:group.categories,types:group.types||[],clipped:group.clipped,confidence:group.confidence,displayFallback:display.useOriginalCrop?'original-crop':null,displayFallbackReason:display.reason}};
   self.postMessage({type:'piece',id:request.id,piece});count++;
  }
  self.postMessage({type:'done',id:request.id,count});
 }catch{self.postMessage({type:'error',id:request.id,text:'This outfit could not be separated on this device. Your existing photos are kept. Try another clear photo of one person, head to toe.'});}
 }).catch(()=>self.postMessage({type:'error',id:request.id,text:'Outfit separation stopped. Try the photo again.'}));};
