/**
 * Mission 1 P832 — diagnostic-only original photo preprocessing.
 *
 * Preserve production photoToJPEG's 2048px / .94 JPEG preprocessing, but
 * release decode resources on Start over, pagehide, or a bounded timeout.
 * No model, account, upload or wardrobe writes. Never expose file names.
 */
const coded=code=>Object.assign(Error('Could not prepare this clothing photo.'),{code});

/** @param {File} file */
export async function prepareTrialPhotoJPEG832(file,{
 signal,
 timeoutMs=15000,
 maxDimension=2048,
 quality=.94,
 ImageClass=globalThis.Image,
 canvasFactory=()=>document.createElement('canvas'),
 createObjectURL=value=>URL.createObjectURL(value),
 revokeObjectURL=value=>URL.revokeObjectURL(value),
 schedule=setTimeout,
 cancel=clearTimeout,
}={}){
 if(signal?.aborted)throw coded('cancelled');
 if(!file||!Number.isFinite(file.size)||file.size<0||file.size>10*1024*1024||
    !Number.isFinite(timeoutMs)||timeoutMs<1||timeoutMs>15000||
    !Number.isFinite(maxDimension)||maxDimension<1||maxDimension>2048||
    !Number.isFinite(quality)||quality<=0||quality>1)
  throw coded('image');
 let url,image,timer,onAbort;
 try{
  url=createObjectURL(file);
  image=new ImageClass();
  const abortOrTimeout=new Promise((_,reject)=>{
   onAbort=()=>reject(coded('cancelled'));
   if(signal)signal.addEventListener('abort',onAbort,{once:true});
   timer=schedule(()=>reject(coded('image')),timeoutMs);
  });
  if(signal?.aborted)throw coded('cancelled');
  image.src=url;
  await Promise.race([image.decode(),abortOrTimeout]);
  if(signal?.aborted)throw coded('cancelled');
  if(!image.width||!image.height)throw coded('image');
  const scale=Math.min(1,maxDimension/Math.max(image.width,image.height));
  const canvas=canvasFactory();
  canvas.width=Math.max(1,Math.round(image.width*scale));
  canvas.height=Math.max(1,Math.round(image.height*scale));
  const context=canvas.getContext('2d');
  if(!context)throw coded('image');
  context.fillStyle='#ffffff';
  context.fillRect(0,0,canvas.width,canvas.height);
  context.drawImage(image,0,0,canvas.width,canvas.height);
  if(signal?.aborted)throw coded('cancelled');
  const result=canvas.toDataURL('image/jpeg',quality);
  if(typeof result!=='string'||!result.startsWith('data:image/jpeg;base64,'))
   throw coded('image');
  return result;
 }catch(error){
  if(signal?.aborted)throw coded('cancelled');
  throw coded(error?.code==='cancelled'?'cancelled':'image');
 }finally{
  if(timer!=null)cancel(timer);
  if(onAbort&&signal)signal.removeEventListener('abort',onAbort);
  // Ending the current image request and revoking its own URL prevents a
  // late decode from starting a full-size canvas encoding after cancellation.
  if(image)image.src='';
  if(url)revokeObjectURL(url);
 }
}
