import {fingerprintOriginalPhoto} from './original-photo-fingerprint.mjs';

/** Decode the app's normalized JPEG data URL, not a cropped preview or raw upload. */
export function decodeOriginalJpegDataUrl(value){
 if(typeof value!=='string'||!/^data:image\/jpeg;base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))throw Error('Valid JPEG data URL required');
 const encoded=value.slice('data:image/jpeg;base64,'.length);
 if(!encoded||encoded.length>Math.ceil(8388608/3)*4+4)throw Error('Original JPEG exceeds supported size');
 let bytes;
 if(typeof atob==='function')bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
 else throw Error('Base64 decoder unavailable');
 if(bytes.length<4||bytes.length>8388608||bytes[0]!==255||bytes[1]!==216||bytes[bytes.length-2]!==255||bytes[bytes.length-1]!==217)throw Error('Invalid original JPEG bytes');
 return bytes;
}
export async function fingerprintOriginalJpegDataUrl(value,cryptoProvider=globalThis.crypto){
 return fingerprintOriginalPhoto(decodeOriginalJpegDataUrl(value),cryptoProvider);
}
