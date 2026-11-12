/** Actual pinned SAM2.1 tiny inference; research only, FAMILY ALPHA HOLD #255. */
import {AutoProcessor,Sam2Model,RawImage,Tensor} from '@huggingface/transformers';

export const SAM2_REFERENCE_67=Object.freeze({
 model:'onnx-community/sam2.1-hiera-tiny-ONNX',
 revision:'814a066640debee5a91e70aa401fb8e17e030503',dtype:'q8',device:'cpu'
});

export async function loadSam2Reference67(){
 const {model:modelId,revision,dtype,device}=SAM2_REFERENCE_67;
 const processor=await AutoProcessor.from_pretrained(modelId,{revision});
 const model=await Sam2Model.from_pretrained(modelId,{revision,dtype,device,
  use_external_data_format:true,session_options:{intraOpNumThreads:2,interOpNumThreads:1}});
 let disposed=false;
 return {
  specification:SAM2_REFERENCE_67,
  async segment(source,boxes){
   if(disposed)throw Error('SAM2 reference is disposed');
   const image=source instanceof RawImage?source:await RawImage.read(source);
   const {width,height}=image;
   if(!Array.isArray(boxes)||boxes.length===0||boxes.length>32)throw Error('Expected 1 to 32 original-pixel boxes');
   for(const box of boxes){
    if(!Array.isArray(box)||box.length!==4||!box.every(Number.isFinite)||
       box[0]<0||box[1]<0||box[2]>width||box[3]>height||box[2]<=box[0]||box[3]<=box[1])
     throw Error('Invalid original-pixel box');
   }
   // This export fixes the decoder prompt group to one. Encode the original
   // image once, then decode each box independently with shared image features.
   const inputs=await processor(image);
   const [rh,rw]=inputs.reshaped_input_sizes[0];
   const embeddings=await model.get_image_embeddings(inputs);
   const masks=[],predictedIoUs=[],objectScores=[],selectedMaskIndices=[],perPromptDimensions=[];
   try {
    for(const box of boxes){
     const input_boxes=new Tensor('float32',Float32Array.from([
      box[0]*rw/width,box[1]*rh/height,box[2]*rw/width,box[3]*rh/height]),[1,1,4]);
     const output=await model({...embeddings,input_boxes});
     const dims=output.pred_masks.dims;
     if(dims.length!==5||dims[0]!==1||dims[1]!==1||dims[2]!==3)throw Error('Unexpected SAM2 mask dimensions');
     const [,,,mh,mw]=dims,area=mh*mw;
     let best=0;for(let j=1;j<3;j++)if(output.iou_scores.data[j]>output.iou_scores.data[best])best=j;
     const score=output.iou_scores.data[best];
     if(!Number.isFinite(score))throw Error('Non-finite SAM2 prediction');
     selectedMaskIndices.push(best);predictedIoUs.push(score);
     objectScores.push(Number(output.object_score_logits.data[0]));
     perPromptDimensions.push({masks:dims,iou:output.iou_scores.dims,objects:output.object_score_logits.dims});
     // Select by predicted IoU before upsampling; never choose by ground truth.
     const selected=Float32Array.from(output.pred_masks.data.subarray(best*area,(best+1)*area));
     const chosen=new Tensor('float32',selected,[1,1,1,mh,mw]);
     const [full]=await processor.post_process_masks(chosen,inputs.original_sizes,inputs.reshaped_input_sizes,{mask_threshold:0,binarize:true});
     if(full.data.length!==width*height)throw Error('Unexpected original-resolution mask size');
     masks.push(Uint8Array.from(full.data,x=>x?1:0));
     full.dispose?.();chosen.dispose?.();input_boxes.dispose?.();
     output.pred_masks.dispose?.();output.iou_scores.dispose?.();output.object_score_logits.dispose?.();
    }
   } finally {
    for(const tensor of Object.values(embeddings))tensor.dispose?.();
    for(const tensor of Object.values(inputs))tensor?.dispose?.();
   }
   return {width,height,masks,predictedIoUs,objectScores,selectedMaskIndices,
    rawDimensions:{...perPromptDimensions[0],sequentialPrompts:boxes.length,perPrompt:perPromptDimensions},
    boxCount:boxes.length,notMeasuredAnnotationIoU:true};
  },
  async dispose(){if(!disposed){disposed=true;await model.dispose();}}
 };
}
