'use strict';
/**
 * Preserve original sensor/photo pixels only for small, structurally valid
 * JPEGs with NO user or device metadata segments. Never upload GPS/EXIF/XMP
 * by newly bypassing the old canvas metadata stripping behavior.
 * Return false on uncertainty, allowing canvas fallback to remove metadata.
 */
function plainOriginalJPEG(bytes){
 if(!(bytes instanceof Uint8Array)||bytes.length<64||bytes[0]!==255||
  bytes[1]!==216||bytes[bytes.length-2]!==255||bytes[bytes.length-1]!==217)
  return false;
 let p=2,foundFrame=false;
 while(p<bytes.length-4){
  if(bytes[p++]!==255)return false;
  while(bytes[p]===255)p++;
  const marker=bytes[p++];
  if(marker===0xda){
   // A valid frame and start-of-scan segment must precede entropy bytes.
   if(!foundFrame||p+2>bytes.length-2)return false;
   const size=(bytes[p]<<8)|bytes[p+1];
   return size>=6&&p+size<=bytes.length-2;
  }
  if(marker===0xd9||marker===0xd8||marker===0||marker===1||
   marker>=0xd0&&marker<=0xd7||p+2>bytes.length-2)
   return false;
  const size=(bytes[p]<<8)|bytes[p+1];
  if(size<2||p+size>bytes.length-2)return false;
  // APP1 Exif/XMP, ICC/vendor APP2, Photoshop APP13, comments and any
  // unrecognized application segment can contain personal metadata.
  if(marker>=0xe0&&marker<=0xef){
   // Allow ONLY plain JFIF with no embedded thumbnail.
   if(marker!==0xe0||size!==16||bytes[p+2]!==74||bytes[p+3]!==70||
    bytes[p+4]!==73||bytes[p+5]!==70||bytes[p+6]!==0||
    bytes[p+14]!==0||bytes[p+15]!==0)return false;
  }
  if(marker===0xfe)return false;
  if([0xc0,0xc1,0xc2,0xc3].includes(marker))foundFrame=true;
  p+=size;
 }
 return false;
}
function exactJpegDataURI(bytes){
 // Fixed-size chunks avoid stack overflow; no JPEG pixels are recompressed.
 let binary='';
 for(let p=0;p<bytes.length;p+=32768)
  binary+=String.fromCharCode(...bytes.subarray(p,p+32768));
 return 'data:image/jpeg;base64,'+btoa(binary);
}
async function photoToJPEG(file,{maxDimension=4096,quality=.96}={}){
 if(!file||!Number.isFinite(file.size)||file.size<=0)
  throw Error('Unreadable clothing photo');
 const url=URL.createObjectURL(file);
 try{
  const image=new Image();image.src=url;await image.decode();
  const width=image.naturalWidth||image.width,height=image.naturalHeight||image.height;
  if(!width||!height)throw Error('No image content');
  // Accepted small JPEGs remain EXACT originals, provided they have no
  // EXIF/location, XMP, ICC or unknown metadata and fit local storage cap.
  if(file.size<=4*1024*1024&&width<=maxDimension&&height<=maxDimension&&
   /^(image\/jpeg|image\/pjpeg)$/i.test(file.type||'')&&
   typeof file.arrayBuffer==='function'){
   const bytes=new Uint8Array(await file.arrayBuffer());
   if(bytes.length===file.size&&plainOriginalJPEG(bytes))
    return exactJpegDataURI(bytes);
  }
  // Existing policy for EXIF-bearing or large images: decode, paint,
  // re-encode without original metadata. Better source detail than old 2048px
  // cap, bounded on-device size. No fake upscaling if file is small.
  const scale=Math.min(1,maxDimension/Math.max(width,height));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(width*scale));
  canvas.height=Math.max(1,Math.round(height*scale));
  let context=canvas.getContext('2d');
  if(!context)throw Error('Camera photo conversion unavailable');
  const redraw=()=>{
   context.fillStyle='#ffffff';context.fillRect(0,0,canvas.width,canvas.height);
   context.drawImage(image,0,0,canvas.width,canvas.height);
  };
  redraw();
  let encoded=canvas.toDataURL('image/jpeg',quality);
  for(const q of [.91,.85,.78]){
   if(encoded.length<=5_600_000)break;
   encoded=canvas.toDataURL('image/jpeg',q);
  }
  if(encoded.length>5_600_000&&Math.max(canvas.width,canvas.height)>2048){
   canvas.width=Math.max(1,Math.round(canvas.width*.75));
   canvas.height=Math.max(1,Math.round(canvas.height*.75));
   context=canvas.getContext('2d');
   if(!context)throw Error('Camera photo conversion unavailable');
   redraw();encoded=canvas.toDataURL('image/jpeg',.85);
  }
  if(!encoded.startsWith('data:image/jpeg;base64,')||encoded.length>5_600_000)
   throw Error('Photo is too large for a safe local copy');
  return encoded;
 }finally{URL.revokeObjectURL(url);}
}
async function readPhotoBatch(files,decode,onPhoto){
 const errors=[],results=[];let added=0;
 for(const file of files){
  let reason=null;
  if(file.size>10*1024*1024)reason='larger than 10 MB';
  else if(!file.type.startsWith('image/')&&!/\\.(jpe?g|png|webp|avif|heic|heif)$/i.test(file.name))reason='not an image';
  if(reason){errors.push(file.name+': '+reason);results.push({name:file.name,status:'rejected',reason});continue;}
  try{
   const image=await decode(file),accepted=await onPhoto(image,file);
   if(accepted===false){results.push({name:file.name,status:'duplicate',reason:'exact duplicate image'});}
   else{added++;results.push({name:file.name,status:'added'});}
  }catch(error){
   reason=error instanceof Error?error.message:'unknown error';
   errors.push(file.name+': could not open; try JPEG or PNG');
   results.push({name:file.name,status:'error',reason});
  }
 }
 return {added,errors,results};
}
