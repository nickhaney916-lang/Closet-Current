/** P167 isolated app-build copy of proven research/capture-proof-01/source-proof.mjs. No deployment or release. */
/**
 * CAPTURE-PROOF-01: browser-local source proof producer. Pure WebCrypto SHA-256
 * over byte sequences, never filename/metadata/model scores. Opt-in research.
 * "Verified" means THESE bytes match the recorded digest, NOT that one
 * garment is present or that the user owns it. No network, gallery or storage.
 */
const SHA=/^[0-9a-f]{64}$/;
const JPEG=/^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/;
const MAX=12*1024*1024,MAX_PIXELS=80_000_000;
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
const MAX_IMPORT_BYTES=10*1024*1024;
const MAX_IMPORT_PIXELS=40_000_000;
const MAX_IMPORT_SIDE=8192;
const JPEG_FRAMES=new Set([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf]);
const FILE_TYPES={
 jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',
 heic:'image/heic',heif:'image/heif',avif:'image/avif',gif:'image/gif',
 svg:'image/svg+xml',bmp:'image/bmp',tif:'image/tiff',tiff:'image/tiff'
};
function importError(message){
 return Object.assign(new Error(message),{code:'PHOTO_IMPORT_INPUT'});
}
function checkImportDimensions(width,height){
 if(!width||!height||width>MAX_IMPORT_SIDE||height>MAX_IMPORT_SIDE||width*height>MAX_IMPORT_PIXELS)
  throw importError('Photo dimensions exceed the 40 megapixel or 8192 pixel limit. Choose a smaller JPEG.');
}
// Inspect the frame header before allocating a browser decoder. The browser
// still checks the encoded image data, and its display dimensions are checked again.
function jpegFrame(bytes){
 let offset=2,frame;
 while(offset<bytes.length-2&&bytes[offset++]===255){
  while(bytes[offset]===255)offset++;
  const marker=bytes[offset++];
  const length=(bytes[offset]<<8)|bytes[offset+1];
  if(length<2||offset+length>bytes.length-2)break;
  if(JPEG_FRAMES.has(marker)){
   if(frame||length<11||length!==8+3*bytes[offset+7])break;
   const height=(bytes[offset+3]<<8)|bytes[offset+4];
   const width=(bytes[offset+5]<<8)|bytes[offset+6];
   checkImportDimensions(width,height);
   frame={width,height};
  }
  if(marker===0xda&&frame)return frame;
  offset+=length;
 }
 throw importError('The JPEG header is incomplete or damaged. Choose a fresh copy of the photo.');
}
async function decodedImage(blob){
 const image=new Image(),url=URL.createObjectURL(blob);
 let timer;
 try{
  image.src=url;
  await Promise.race([image.decode(),new Promise((_,reject)=>{
   timer=setTimeout(()=>reject(new Error('Image decode timed out')),15000);
  })]);
  return {width:image.naturalWidth,height:image.naturalHeight};
 }catch{
  throw importError('The browser could not open this JPEG. Choose a fresh copy of the photo.');
 }finally{
  clearTimeout(timer);
  image.removeAttribute('src');
  URL.revokeObjectURL(url);
 }
}
/** Only JPEG can be retained byte-for-byte by the current original-photo store. */
export async function importCanonicalPhoto(file,{
 cryptoProvider=globalThis.crypto,decode=decodedImage,shouldContinue=()=>true
}={}){
 if(!file||typeof file.arrayBuffer!=='function'||!file.size||file.size>MAX_IMPORT_BYTES)
  throw importError('Choose a nonempty JPEG of 10 MB or less.');
 const bytes=new Uint8Array(await file.arrayBuffer());
 if(bytes.length!==file.size)throw importError('The file changed during import. Select it again.');
 if(!shouldContinue())throw Error('Photo import cancelled');
 const sniffedType=sniffPhotoMime(bytes);
 const declaredType=(file.type||'').toLowerCase().trim();
 const normalizedDeclared=declaredType==='image/jpg'?'image/jpeg':declaredType;
 const extension=file.name?.match(/\.([a-z0-9]+)$/i)?.[1].toLowerCase();
 const extensionType=Object.hasOwn(FILE_TYPES,extension)?FILE_TYPES[extension]:null;
 if(sniffedType&&((normalizedDeclared&&normalizedDeclared!=='application/octet-stream'&&
    normalizedDeclared!==sniffedType)||(extensionType&&extensionType!==sniffedType)))
  throw importError('The file type or extension contradicts the image bytes. Choose the actual JPEG file.');
 if(bytes[0]===255&&bytes[1]===216&&!validJPEG(bytes))
  throw importError('The JPEG file is incomplete. Choose a fresh copy of the photo.');
 if(sniffedType!=='image/jpeg')
  throw importError('To keep the original photograph, import an original JPEG (JPG). For HEIC, PNG, or WebP, export a JPEG on your device and select that new file.');
 const frame=jpegFrame(bytes);
 const orientation=jpegOrientation(bytes);
 const image=await decode(new Blob([bytes],{type:'image/jpeg'}));
 if(!shouldContinue())throw Error('Photo import cancelled');
 const width=image.naturalWidth||image.width,height=image.naturalHeight||image.height;
 pixelDimensions(width,height);
 const rotated=orientation>=5&&orientation<=8;
 if(width!==(rotated?frame.height:frame.width)||height!==(rotated?frame.width:frame.height))
  throw importError('The JPEG dimensions could not be verified. Choose a fresh copy of the photo.');
 const sha256=await digestBytes(bytes,cryptoProvider);
 if(!shouldContinue())throw Error('Photo import cancelled');
 return makeProof({image:'data:image/jpeg;base64,'+b64(bytes),sha256,width,height,origin:'import',
  originalFileSha256:sha256,originalFileType:'image/jpeg',originalFileBytes:bytes.length,
  transformed:false,orientation:orientation||'unknown',
  orientationConversion:orientation&&orientation!==1?'browser-exif-display-only':'none'});
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

