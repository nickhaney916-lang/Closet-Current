/** Research-only adapter: source bytes must cross #340's photoToJPEG privacy
 * boundary before returning to a caller. No raw photo is returned or stored.
 * One capture at a time; session cancellation discards late completions.
 */
export function createStillCapture({getTrack,ImageCaptureClass,convert,frameFallback,isActive=()=>true}) {
 if(typeof getTrack!=='function'||typeof convert!=='function'||typeof frameFallback!=='function'||typeof isActive!=='function') throw TypeError('Missing adapter');
 let generation=0,busy=false;
 const guard=token=>{if(token!==generation||!isActive())throw Error('Capture session ended');};
 const cancel=()=>{generation++;};
 async function take(){
  if(busy)throw Error('Capture already in progress');busy=true;const token=generation;
  try{
   guard(token);const track=getTrack();guard(token);
   if(track&&track.readyState==='live'&&typeof ImageCaptureClass==='function'){
    let blob;
    try{blob=await new ImageCaptureClass(track).takePhoto();}catch{guard(token);}
    guard(token);
    if(blob instanceof Blob&&blob.size>0&&blob.size<=10*1024*1024&&/^image\//i.test(blob.type)){
     // Reuse the exact importer: safe metadata-free JPEG passthrough, otherwise
     // decode/re-encode with limits. An importer error must not expose raw bytes.
     try{const safe=await convert(blob);guard(token);if(typeof safe==='string'&&safe.startsWith('data:image/jpeg;base64,'))return {image:safe,method:'still',note:'Still source; delivered resolution varies by device.'};}catch{guard(token);}
    }
   }
   guard(token);const image=await frameFallback();guard(token);
   if(typeof image!=='string'||!image.startsWith('data:image/jpeg;base64,'))throw Error('No usable image');
   return {image,method:'video-frame',note:'Standard video frame; full-resolution still unavailable.'};
  }finally{busy=false;}
 }
 return {take,cancel};
}
