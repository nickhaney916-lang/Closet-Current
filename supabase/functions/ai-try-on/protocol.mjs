// Provider contract, shared with Node CI. No image, user ID or secret logging.
const DATA_URI=/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;
export function validateStart(body){
 if(body?.action!=='start'||!['female','male'].includes(body.figure)||
 !['tops','bottoms','one-pieces'].includes(body.category)||
 typeof body.garmentImage!=='string'||body.garmentImage.length>7_500_000||
 body.garmentImage.length<128||!DATA_URI.test(body.garmentImage))
  throw Error('Invalid try-on input');
 return {figure:body.figure,category:body.category,garmentImage:body.garmentImage};
}
export function providerRequest({modelImage,garmentImage,category}){
 if(typeof modelImage!=='string'||!((/^https:\/\/[^\s<>"']+$/).test(modelImage)||(modelImage.length>=128&&modelImage.length<=10_000_000&&DATA_URI.test(modelImage))))throw Error('Standard figure unavailable');
 if(!DATA_URI.test(garmentImage))throw Error('Invalid private garment data');
 return {model_name:'tryon-v1.6',inputs:{
  model_image:modelImage,garment_image:garmentImage,category,
  garment_photo_type:'auto',mode:'balanced',moderation_level:'conservative',
  output_format:'jpeg',num_samples:1,return_base64:true
 }};
}
export function safeJobId(id){
 return typeof id==='string'&&id.length>=12&&id.length<=128&&/^[a-zA-Z0-9-]+$/.test(id);
}
export function normalizeStatus(data){
 if(data?.status==='completed'){
  const image=data?.output?.[0];
  if(typeof image!=='string'||!DATA_URI.test(image)||image.length>10_000_000)
   throw Error('Try-on output is unavailable');
  return {status:'completed',image};
 }
 if(data?.status==='failed')return {status:'failed'};
 if(['starting','in_queue','processing'].includes(data?.status))return {status:'processing'};
 throw Error('Unexpected try-on state');
}

// Second real AI pass: only a signed, completed first provider job can supply
// the model image. The browser never submits arbitrary people or generated
// imagery as a replacement model. Server feature MUST remain hard disabled
// until paid compute quotas, owner consent and real visual fidelity are tested.
export function validateContinuation(body,previous){
 const valid=['tops','bottoms'];
 if(body?.action!=='continue'||!previous||previous.step!==1||
    !valid.includes(previous.category)||!valid.includes(body.category)||
    body.category===previous.category||
    body.figure!==previous.figure||
    typeof body.garmentImage!=='string'||body.garmentImage.length>7_500_000||
    body.garmentImage.length<128||!DATA_URI.test(body.garmentImage))
   throw Error('Invalid multi-garment continuation');
 return {figure:previous.figure,category:body.category,garmentImage:body.garmentImage};
}
export function completedIntermediateImage(data){
 const result=normalizeStatus(data);
 if(result.status!=='completed'||typeof result.image!=='string'||
    result.image.length<128||result.image.length>10_000_000)
  throw Error('Previous garment render is incomplete');
 return result.image;
}
