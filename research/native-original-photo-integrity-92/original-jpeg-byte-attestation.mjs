/**
 * NATIVE92: independent WebCrypto SHA-256 of ORIGINAL JPEG source bytes,
 * research only. No network, no photo uploads, no garment geometry changes.
 * The decoded photograph is local to this function, and is never returned.
 */
const PREFIX='data:image/jpeg;base64,';
const MAX_JPEG_BYTES=24*1024*1024;
const sha64=/^[a-f0-9]{64}$/;
const idOk=x=>typeof x==='string'&&x.length>0&&x.length<=160&&!/[\u0000-\u001f]/.test(x);

export async function attestOriginalJPEGBytes92({
 row,ownerId,cryptoImpl=globalThis.crypto,decodeBase64=globalThis.atob
}={}){
 if(!idOk(ownerId)||!idOk(row?.id)||row.ownerId!==ownerId)
  throw Error('NATIVE92 original JPEG owner or garment ID invalid');
 const expected=row.sourceSHA256;
 if(!sha64.test(expected||'')||row.originalPhoto?.sha256!==expected||
    row.sourceHash!==undefined&&row.sourceHash!==expected)
  throw Error('NATIVE92 original JPEG SHA metadata mismatch');
 const src=row.originalPhoto?.image;
 if(typeof src!=='string'||!src.startsWith(PREFIX))
  throw Error('NATIVE92 original JPEG data URL required');
 const base64=src.slice(PREFIX.length);
 if(base64.length<4||base64.length>Math.ceil(MAX_JPEG_BYTES*4/3)+8||
   base64.length%4!==0||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64))
  throw Error('NATIVE92 bounded canonical JPEG base64 required');
 if(typeof decodeBase64!=='function'||typeof cryptoImpl?.subtle?.digest!=='function')
  throw Error('NATIVE92 browser SHA-256 unavailable; preview blocked');
 let bytes;
 try{
  const raw=decodeBase64(base64);
  if(raw.length>MAX_JPEG_BYTES||raw.length<4)
   throw Error('Invalid JPEG length');
  bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
 }catch{throw Error('NATIVE92 original JPEG decoding failed');}
 if(bytes[0]!==0xff||bytes[1]!==0xd8)
  throw Error('NATIVE92 original JPEG marker invalid');
 const hash=Array.from(new Uint8Array(await cryptoImpl.subtle.digest('SHA-256',bytes)),
  x=>x.toString(16).padStart(2,'0')).join('');
 if(hash!==expected)
  throw Error('NATIVE92 ORIGINAL JPEG BYTES DO NOT MATCH SOURCE SHA; 3D BLOCKED');
 return Object.freeze({id:row.id,sha256:hash,
  category:String(row.category||''),itemType:String(row.itemType||''),
  color:String(row.color||''),secondaryColor:String(row.secondaryColor||'')});
}
