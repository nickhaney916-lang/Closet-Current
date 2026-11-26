/** P167 isolated app-build copy of proven research/capture-proof-01/source-proof.mjs. No deployment or release. */
/**
 * CAPTURE-PROOF-01: browser-local source proof producer. Pure WebCrypto SHA-256
 * over byte sequences, never filename/metadata/model scores. Opt-in research.
 * "Verified" means THESE bytes match the recorded digest, NOT that one
 * garment is present or that the user owns it. No network, gallery or storage.
 */
const SHA=/^[0-9a-f]{64}$/;
const JPEG=/^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/;
const MAX=12*1024*1024,MAX_PIXELS=80_000_000,MAX_SAVED_JPEG=8_000_000;
function assert(condition,message){if(!condition)throw Error('CAPTURE-PROOF-01 '+message);}
function asHex(bytes){return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');}
export async function digestBytes(bytes,cryptoProvider=globalThis.crypto){
 assert(bytes instanceof Uint8Array&&bytes.length>0&&bytes.length<=MAX,'invalid original bytes');
 assert(cryptoProvider?.subtle?.digest,'crypto digest unavailable');
 return asHex(new Uint8Array(await cryptoProvider.subtle.digest('SHA-256',bytes)));
}
function decodeBase64(text){
 assert(typeof text==='string'&&text.length<=MAX*1.38,'image too large');
 const binary=atob(text),bytes=new Uint8Array(binary.length);
 for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
 return bytes;
}
function validJPEG(bytes){return bytes.length>=4&&bytes[0]===255&&bytes[1]===216&&
 bytes.at(-2)===255&&bytes.at(-1)===217;}
/** Byte-signature media identification. Extensions and picker MIME are hints only. */
export function sniffPhotoMime(bytes){
 if(!(bytes instanceof Uint8Array)||bytes.length<12)return null;
 const ascii=(a,b)=>String.fromCharCode(...bytes.subarray(a,b));
 if(validJPEG(bytes))return 'image/jpeg';
 if(bytes.length>=8&&bytes[0]===137&&ascii(1,4)==='PNG'&&bytes[4]===13&&bytes[5]===10&&bytes[6]===26&&bytes[7]===10)return 'image/png';
 if(ascii(0,6)==='GIF87a'||ascii(0,6)==='GIF89a')return 'image/gif';
 if(ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP')return 'image/webp';
 if(ascii(4,8)==='ftyp'){
  const brand=ascii(8,12),brands=new Set([brand,...(ascii(16,Math.min(bytes.length,64)).match(/.{4}/g)||[])]);
  if(['avif','avis'].some(x=>brands.has(x)))return 'image/avif';
  if(['heic','heix','hevc','hevx','heim','heis','hevm','hevs'].some(x=>brands.has(x)))return 'image/heic';
  if(['mif1','msf1'].some(x=>brands.has(x)))return 'image/heif';
 }
 return null;
}
export function jpegBytes(dataUrl){
 const m=typeof dataUrl==='string'&&dataUrl.match(JPEG);
 assert(m,'canonical original must be JPEG data');
 const bytes=decodeBase64(m[1]);assert(validJPEG(bytes),'invalid JPEG envelope');
 return bytes;
}
function b64(bytes){
 // Avoid argument-length limits with imported 10MB photos.
 let s='';for(let i=0;i<bytes.length;i+=8192)
  s+=String.fromCharCode(...bytes.subarray(i,i+8192));
 return btoa(s);
}
function pixelDimensions(w,h){
 assert(Number.isInteger(w)&&Number.isInteger(h)&&w>0&&h>0&&
  w*h<=MAX_PIXELS,'invalid image dimensions');
}
// Read encoded dimensions before allocating a browser image or canvas.
function checkImportDimensions(bytes,type){
 const header=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 const tag=(offset,length)=>String.fromCharCode(...bytes.subarray(offset,offset+length));
 const valid=(condition)=>assert(condition,'invalid image header');
 switch(type){
  case 'image/jpeg': {
   let offset=2;
   while(offset+3<bytes.length&&bytes[offset++]===255){
    while(bytes[offset]===255)offset++;
    const marker=bytes[offset++];
    if(marker===0xda||marker===0xd9||offset+2>bytes.length)break;
    const size=header.getUint16(offset);
    valid(size>=2&&offset+size<=bytes.length);
    if(marker>=0xc0&&marker<=0xcf&&![0xc4,0xc8,0xcc].includes(marker)){
     valid(size>=8);
     pixelDimensions(header.getUint16(offset+5),header.getUint16(offset+3));
     return;
    }
    offset+=size;
   }
   valid(false);
   return;
  }
  case 'image/png':
   valid(bytes.length>=33&&header.getUint32(8)===13&&tag(12,4)==='IHDR');
   pixelDimensions(header.getUint32(16),header.getUint32(20));
   return;
  case 'image/gif':
   valid(bytes.length>=13);
   pixelDimensions(header.getUint16(6,true),header.getUint16(8,true));
   return;
  case 'image/webp': {
   valid(bytes.length>=20&&header.getUint32(4,true)+8===bytes.length);
   const chunkSize=header.getUint32(16,true);
   valid(chunkSize<=bytes.length-20);
   const chunk=tag(12,4);
   if(chunk==='VP8X'){
    valid(chunkSize===10);
    const u24=offset=>bytes[offset]+256*bytes[offset+1]+65536*bytes[offset+2];
    pixelDimensions(u24(24)+1,u24(27)+1);
    return;
   }
   if(chunk==='VP8L'){
    valid(chunkSize>=5&&bytes[20]===0x2f);
    const size=header.getUint32(21,true);
    pixelDimensions((size&0x3fff)+1,((size>>>14)&0x3fff)+1);
    return;
   }
   valid(chunk==='VP8 '&&chunkSize>=10&&bytes[23]===0x9d&&bytes[24]===1&&bytes[25]===0x2a);
   pixelDimensions(header.getUint16(26,true)&0x3fff,header.getUint16(28,true)&0x3fff);
   return;
  }
  default:
   assert(false,'image format cannot be dimension checked');
 }
}
function makeProof({image,sha256,width,height,origin,originalFileSha256,
  originalFileType,originalFileBytes,transformed,orientation,orientationConversion,fileTypeMismatch}){
 return Object.freeze({
  image,originalPhoto:Object.freeze({image,sha256,width,height,
   origin,originalFileSha256:originalFileSha256||sha256,
   originalFileType:originalFileType||'image/jpeg',fileTypeMismatch:!!fileTypeMismatch,
   originalFileBytes:originalFileBytes??null,
   transformed:!!transformed,orientation:orientation??1,
   orientationConversion:orientationConversion||'none'}),
  sourceSHA256:sha256,sourceHashVerified:true,
  singleGarmentVerified:false, // only independent segmentation/human may confirm
  recognitionFromOriginal:true
 });
}
export async function captureCanonicalJPEG(dataUrl,{width,height,origin='camera',
 cryptoProvider=globalThis.crypto}={}){
 pixelDimensions(width,height);
 const bytes=jpegBytes(dataUrl),sha256=await digestBytes(bytes,cryptoProvider);
 return makeProof({image:dataUrl,sha256,width,height,origin,
  originalFileSha256:sha256,transformed:false});
}
/** EXIF orientation parser: inspection only, NOT image transformation. */
export function jpegOrientation(bytes){
 if(!validJPEG(bytes))return null;
 let i=2;
 while(i+4<=bytes.length){
  if(bytes[i]!==255)break;const marker=bytes[i+1];i+=2;
  if(marker===0xda||marker===0xd9)break;
  if(marker===0x01||marker>=0xd0&&marker<=0xd7)continue;
  const size=(bytes[i]<<8)|bytes[i+1];if(size<2||i+size>bytes.length)break;
  if(marker===0xe1&&size>=16&&String.fromCharCode(...bytes.subarray(i+2,i+8))==='Exif\0\0'){
   const t=i+8,le=bytes[t]===73&&bytes[t+1]===73,be=bytes[t]===77&&bytes[t+1]===77;
   if(!le&&!be){i+=size;continue;}
   const u16=(p)=>le?bytes[p]|bytes[p+1]<<8:bytes[p]<<8|bytes[p+1];
   const u32=(p)=>le?((bytes[p]|bytes[p+1]<<8|bytes[p+2]<<16|bytes[p+3]<<24)>>>0):
    (((bytes[p]<<24)|(bytes[p+1]<<16)|(bytes[p+2]<<8)|bytes[p+3])>>>0);
   const ifd=t+u32(t+4);if(ifd+2>i+size){i+=size;continue;}
   for(let j=0,n=u16(ifd);j<n&&j<128;j++){
    const p=ifd+2+j*12;if(p+12>i+size)break;
    if(u16(p)===0x112&&u16(p+2)===3&&u32(p+4)===1){
     const value=u16(p+8);return value>=1&&value<=8?value:null;
    }
   }
  }
  i+=size;
 }
 return 1;
}
function decodedImage(blob,{urlAPI=URL,ImageCtor=Image}={}){
 return (async()=>{
  const url=urlAPI.createObjectURL(blob);
  try{
   const image=new ImageCtor();image.src=url;await image.decode();
   pixelDimensions(image.naturalWidth||image.width,image.naturalHeight||image.height);
   return image;
  }finally{urlAPI.revokeObjectURL(url);}
 })();
}
/**
 * Imports: do not transcode true JPEG bytes (preserves EXIF and exact source).
 * Other formats: full decoded dimensions → JPEG; keep separate raw-file SHA.
 * Raw non-JPEG bytes are not retained; original input can be reverified if
 * user supplies the source file again. Canonical derived JPEG IS retained.
 */
export async function importCanonicalPhoto(file,{
 cryptoProvider=globalThis.crypto,decode=decodedImage,
 makeCanvas=()=>document.createElement('canvas'),shouldContinue=()=>true
}={}){
 assert(file&&typeof file.arrayBuffer==='function'&&file.size>0&&file.size<=10*1024*1024,
  'unsupported input size');
 assert(shouldContinue(),'import cancelled');
 const bytes=new Uint8Array(await file.arrayBuffer());
 assert(shouldContinue(),'import cancelled');
 assert(bytes.length===file.size,'imported file changed during read');
 const declaredType=(file.type||'').toLowerCase().trim();
 const sniffedType=sniffPhotoMime(bytes),recognizedJPEG=sniffedType==='image/jpeg';
 if(declaredType==='image/jpeg'&&!recognizedJPEG)throw Error('CAPTURE-PROOF-01 false JPEG MIME');
 assert(sniffedType,'unsupported or unrecognized image signature');
 const normalizedDeclared=declaredType==='image/jpg'?'image/jpeg':declaredType;
 if(normalizedDeclared&&normalizedDeclared!==sniffedType)throw Error('CAPTURE-PROOF-01 file type contradicts image bytes');
 checkImportDimensions(bytes,sniffedType);
 if(recognizedJPEG)assert(bytes.length<=MAX_SAVED_JPEG,'JPEG too large for wardrobe storage');
 const originalFileSha256=await digestBytes(bytes,cryptoProvider);
 assert(shouldContinue(),'import cancelled');
 const blob=new Blob([bytes],{type:sniffedType});
 const image=await decode(blob);
 assert(shouldContinue(),'import cancelled');
 const width=image.naturalWidth||image.width,height=image.naturalHeight||image.height;
 pixelDimensions(width,height);
 if(recognizedJPEG){
  const dataUrl='data:image/jpeg;base64,'+b64(bytes);
  const orientation=jpegOrientation(bytes);
  return makeProof({image:dataUrl,sha256:originalFileSha256,width,height,origin:'import',
   originalFileSha256,originalFileType:sniffedType,
   originalFileBytes:bytes.length,transformed:false,orientation:orientation||'unknown',
   orientationConversion:orientation&&orientation!==1?'browser-exif-display-only':'none'});
 }
 assert(sniffedType.startsWith('image/'),'unsupported image format');
 const canvas=makeCanvas();canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext('2d');
 assert(ctx,'image conversion unavailable');
 ctx.fillStyle='#ffffff';ctx.fillRect(0,0,width,height);
 ctx.drawImage(image,0,0,width,height);
 const converted=canvas.toDataURL('image/jpeg',.94);
 const jpeg=jpegBytes(converted);
 assert(jpeg.length<=MAX_SAVED_JPEG,'converted JPEG too large for wardrobe storage');
 const sha256=await digestBytes(jpeg,cryptoProvider);
 return makeProof({image:converted,sha256,width,height,origin:'import',
  originalFileSha256,originalFileType:sniffedType,
  fileTypeMismatch:!!declaredType&&normalizedDeclared!==sniffedType,originalFileBytes:bytes.length,
  transformed:true,orientation:'browser-decoded',
  orientationConversion:'browser-decoded-to-jpeg'});
}
/** Verify an already persisted proof; reject tampered bytes or invented flags. */
export async function verifyStoredCanonical(proof,{cryptoProvider=globalThis.crypto}={}){
 if(!proof||!SHA.test(proof.sourceSHA256||'')||proof.sourceHashVerified!==true||
  proof.originalPhoto?.sha256!==proof.sourceSHA256||
  proof.originalPhoto?.image!==proof.image)return false;
 try{
  const expected=await digestBytes(jpegBytes(proof.image),cryptoProvider);
  return expected===proof.sourceSHA256;
 }catch{return false;}
}

