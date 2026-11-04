/**
 * MASK-31 independent genuine pinned SegFormer ONNX execution, research only.
 * No application source, storage, user photos, auth, or customer data touched.
 * Emits exact model-pixel mask fingerprints and group membership conservation.
 * Original JPEG stays in browser for overlay, never transmitted by this worker.
 */
let modelPromise;
async function loaded(id){
 if(!modelPromise)modelPromise=(async()=>{
  self.postMessage({id,type:'progress',phase:'loading'});
  const {AutoModelForSemanticSegmentation,AutoProcessor,RawImage,env}=
   await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js');
  env.allowLocalModels=false;env.useBrowserCache=true;
  env.backends.onnx.wasm.numThreads=1;env.backends.onnx.wasm.proxy=false;
  const name='Xenova/segformer_b0_clothes',revision='a2489ea8e7ec1ee912190546bad31a4906ccca76';
  const processor=await AutoProcessor.from_pretrained(name,{revision});
  const model=await AutoModelForSemanticSegmentation.from_pretrained(name,{
   revision,device:'wasm',dtype:'fp32',
   progress_callback:e=>self.postMessage({id,type:'progress',phase:'loading',
    percent:Number.isFinite(e.progress)?Math.round(e.progress):null})
  });
  return {model,processor,RawImage};
 })().catch(e=>{modelPromise=null;throw e});
 return modelPromise;
}
async function sha(data){
 const hash=await crypto.subtle.digest('SHA-256',data);
 return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function normalizedCrop(group,map,ow,oh){
 const scaleX=ow/map.width,scaleY=oh/map.height,b=group.bounds;
 const padding=Math.max(2,Math.round(Math.max((b.right-b.left)*scaleX,
  (b.bottom-b.top)*scaleY)*.025));
 const l=Math.max(0,Math.floor(b.left*scaleX)-padding);
 const t=Math.max(0,Math.floor(b.top*scaleY)-padding);
 const r=Math.min(ow,Math.ceil(b.right*scaleX)+padding);
 const bot=Math.min(oh,Math.ceil(b.bottom*scaleY)+padding);
 return {x:l/ow,y:t/oh,width:(r-l)/ow,height:(bot-t)/oh};
}
function countMask(data){let count=0;for(const x of data)count+=Number(x!==0);return count;}
function unionClass(groups,id,size){
 const result=new Uint8Array(size);
 for(const g of groups)if(g.id===id)
  for(let i=0;i<size;i++)if(g.selected[i])result[i]=1;
 return result;
}
let chain=Promise.resolve();
self.onmessage=event=>{
 const req=event.data;
 chain=chain.then(async()=>{
  const id=req?.id;
  try{
   if(!Number.isInteger(id)||id<1||
      typeof req.analysisImage!=='string'||
      !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(req.analysisImage)||
      req.analysisImage.length>12000000||![req.originalWidth,req.originalHeight].every(
       v=>Number.isInteger(v)&&v>0&&v<=8192)||
      req.originalWidth*req.originalHeight>48000000)
    throw Error('Invalid bounded source-locked model request');
   const {model,processor,RawImage}=await loaded(id);
   self.postMessage({id,type:'progress',phase:'infer'});
   // WebKit intermittently rejects createImageBitmap(Blob) in a module
   // worker. The page can transfer the exact decoded *analysis JPEG* RGBA
   // pixels instead; these are real browser image pixels, not synthetic masks.
   let input;
   if(req.analysisRGBA!==undefined){
    if(!(req.analysisRGBA instanceof Uint8ClampedArray)||
       !Number.isInteger(req.analysisWidth)||!Number.isInteger(req.analysisHeight)||
       req.analysisWidth<1||req.analysisHeight<1||
       req.analysisWidth>3072||req.analysisHeight>3072||
       req.analysisWidth*req.analysisHeight>3072*3072||
       req.analysisRGBA.length!==req.analysisWidth*req.analysisHeight*4)
     throw Error('Invalid bounded browser decoded model-analysis pixels');
    input=new RawImage(req.analysisRGBA,req.analysisWidth,req.analysisHeight,4);
   }else input=await RawImage.read(req.analysisImage);
   if(input.width>3072||input.height>3072||input.width*input.height>3072*3072)
    throw Error('Oversized inference input');
   const logits=await model(await processor(input));
   const {clothingLabelMap}=await import('../../public/outfit-segmentation.mjs');
   const {visibleGarmentGroups24}=await import('../multi-garment-capture-01/visible-groups.mjs');
   const {visibleGarmentGroups24:oldGroups}=await import('./legacy-visible-groups.mjs');
   const map=clothingLabelMap(logits.logits.data,logits.logits.dims);
   const before=oldGroups(map,{limit:24}),after=visibleGarmentGroups24(map,{limit:24});
   const size=map.width*map.height;
   const ids=[4,5,6,7,9],conservation=[];
   for(const family of ids){
    const old=unionClass(before,family,size),now=unionClass(after,family,size);
    const oldHash=await sha(old),newHash=await sha(now);
    if(oldHash!==newHash)throw Error('Source mask membership changed between grouping rules');
    conservation.push({semanticRegionId:family,pixelCount:countMask(old),
     sourceMembershipSHA256:oldHash,retainedWithoutChanges:true});
   }
   const describe=async g=>({
    regionId:g.id,label:g.label,needsReview:g.needsReview,
    instanceKey:g.instanceKey,confidence:g.confidence,
    selectedCount:g.count,bounds:g.bounds,
    selectedMaskSHA256:await sha(g.selected),
    crop:normalizedCrop(g,map,req.originalWidth,req.originalHeight)
   });
   const results={sourceId:req.sourceId,
    outputDims:logits.logits.dims,
    modelRevision:'a2489ea8e7ec1ee912190546bad31a4906ccca76',
    model:'Xenova/segformer_b0_clothes',
    analysisResolution:[input.width,input.height],
    modelMask:[map.width,map.height],
    personDetected:map.personDetected,
    sourceMapLabelsSHA256:await sha(map.labels),
    // Read-only, actual decoded model label pixels for visible audit overlays.
    // The browser receives these only for public SHA-locked research photos.
    labelMapBase64:(()=>{
     let s='';for(let start=0;start<map.labels.length;start+=16000)
      s+=String.fromCharCode(...map.labels.subarray(start,start+16000));
     return btoa(s);
    })(),
    maskPixelMembershipConserved:true,
    familyConservation:conservation,
    before:await Promise.all(before.map(describe)),
    after:await Promise.all(after.map(describe)),
    sourcePixelsNeverReturned:true
   };
   self.postMessage({id,type:'done',result:results});
  }catch(e){self.postMessage({id,type:'error',
    error:'model_failed',stage:e.message.slice(0,160)})}
 }).catch(()=>{self.postMessage({id:req?.id,type:'error',error:'worker_failed'})});
};
