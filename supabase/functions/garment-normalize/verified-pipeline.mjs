// EXPERIMENTAL INTERNAL DRY RUN ONLY. No real AI/provider fetch or customer writes.
// This proves exactly which input bytes a private adapter received, and binds
// the returned preview bytes to that input with a short-lived server HMAC.
// IT DOES NOT PROVE THE AI RETAINED THE ACTUAL GARMENT'S IDENTITY.
import {validateNormalizeCandidate,planEdit,validateOutput} from './protocol.mjs';

const encoder=new TextEncoder(),decoder=new TextDecoder();
const B64=/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;
const HEX=/^[a-f0-9]{64}$/;
const ID=/^[A-Za-z0-9_-]{8,100}$/;
const DAY=86400000;
function uint8DataUri(uri,maxBytes){
 if(typeof uri!=='string'||uri.length>Math.ceil(maxBytes*4/3)+80)throw Error('Image exceeds private preview limit');
 const m=uri.match(B64);if(!m)throw Error('Invalid image data URI');
 let bytes;
 try{
  const raw=atob(m[2]);bytes=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
 }catch{throw Error('Invalid base64 image bytes');}
 if(bytes.length<24||bytes.length>maxBytes)throw Error('Unusable or oversized image');
 const png=bytes.length>23&&[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v)
  &&decoder.decode(bytes.slice(12,16))==='IHDR';
 const jpeg=bytes.length>3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 const webp=bytes.length>12&&decoder.decode(bytes.slice(0,4))==='RIFF'&&decoder.decode(bytes.slice(8,12))==='WEBP';
 if((m[1]==='png'&&!png)||(m[1]==='jpeg'&&!jpeg)||(m[1]==='webp'&&!webp))
  throw Error('Image content does not match claimed MIME type');
 if(png){
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  const w=view.getUint32(16),h=view.getUint32(20);
  if(w<1||h<1||w>5000||h>5000||w*h>18_000_000)
   throw Error('Unsafe PNG image dimensions');
 }
 return bytes;
}
async function hash(bytes){
 if(!globalThis.crypto?.subtle)throw Error('Server cryptography unavailable');
 const digest=await crypto.subtle.digest('SHA-256',bytes);
 return [...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('');
}
const b64url=bytes=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const readB64url=txt=>{
 if(!/^[A-Za-z0-9_-]+$/.test(txt)||txt.length>2048)throw Error('Invalid receipt encoding');
 const raw=atob(txt.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-txt.length%4)%4));
 return Uint8Array.from(raw,c=>c.charCodeAt(0));
};
async function macKey(secret){
 if(typeof secret!=='string'||secret.length<32||secret.length>512)throw Error('Missing server signing secret');
 return crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
}
function safePrincipal(s){return typeof s==='string'&&ID.test(s);}
function reservationValid(reservation,ownerId,requestId,now){
 return reservation?.allowed===true&&reservation.ownerId===ownerId&&
 reservation.requestId===requestId&&reservation.mode==='simulation'&&
 reservation.maxJobs===1&&Number.isFinite(reservation.expiresAt)&&
 reservation.expiresAt>now&&reservation.expiresAt<=now+DAY;
}
export async function runVerifiedMockEdit({candidate,principal,reservation,requestId,secret,now=Date.now(),adapter,enabled=false}){
 // Never accept a production provider inside this test pipeline. A real
 // private endpoint requires separate authentication, spend caps and review.
 if(enabled!==true||adapter?.kind!=='mock'||typeof adapter.edit!=='function')
  throw Error('Verified simulation not enabled');
 if(!safePrincipal(principal?.id)||principal?.authenticatedByServer!==true||
    !safePrincipal(requestId)||!Number.isSafeInteger(now)||now<0||
    !reservationValid(reservation,principal.id,requestId,now))
  throw Error('Missing authenticated user or scoped pilot reservation');
 const input=validateNormalizeCandidate(candidate);
 const sourceBytes=uint8DataUri(input.garmentImage,5_500_000);
 const sourceSha256=await hash(sourceBytes);
 if(sourceSha256!==input.photoSha256)throw Error('Original source bytes do not match claim');
 const payload=planEdit(candidate);
 if(payload.inputs.image!==input.garmentImage||payload.inputs.num_images!==1)
  throw Error('One source image per request required');
 const image=await adapter.edit(payload);
 const output=validateOutput(image);
 const previewBytes=uint8DataUri(output.image,7_500_000);
 const previewSha256=await hash(previewBytes);
 if(sourceSha256===previewSha256)throw Error('No distinct generated preview');
 const receiptData={
  version:1,trial:'mock-only',sourceSha256,previewSha256,
  userId:principal.id,itemId:input.itemId,category:input.category,
  requestId,createdAt:now,expiresAt:now+10*60*1000,
  model:'edit',providerRunAuthenticated:false,identityVerified:false,
  outputCount:1,originalBytesPreserved:true
 };
 const serialized=b64url(encoder.encode(JSON.stringify(receiptData)));
 const signature=b64url(new Uint8Array(await crypto.subtle.sign('HMAC',await macKey(secret),encoder.encode(serialized))));
 return {
  receipt:serialized+'.'+signature,
  evidence:receiptData,
  preview:image,previewOnly:true,sourceOriginalUnchanged:true,
  paidProviderUsed:false,actualAIReconstructionRun:false,
  cannotAutoSave:true,requiresOwnerReview:true,
  canReplaceOriginal:false
 };
}
export async function verifyMockReceipt({receipt,secret,sourceSha256,previewSha256,userId,itemId,category,requestId,now=Date.now()}){
 if(typeof receipt!=='string'||receipt.length>4096||!/^[-_A-Za-z0-9]+\.[-_A-Za-z0-9]+$/.test(receipt)||
   !HEX.test(sourceSha256||'')||!HEX.test(previewSha256||'')||
   !safePrincipal(userId)||!safePrincipal(requestId)||
   typeof itemId!=='string'||itemId.length>128)return false;
 try{
  const [payload,signature]=receipt.split('.');
  const key=await macKey(secret);
  if(!await crypto.subtle.verify('HMAC',key,readB64url(signature),encoder.encode(payload)))return false;
  const value=JSON.parse(decoder.decode(readB64url(payload)));
  return value.version===1&&value.trial==='mock-only'&&
   value.sourceSha256===sourceSha256&&value.previewSha256===previewSha256&&
   value.userId===userId&&value.itemId===itemId&&value.category===category&&
   value.requestId===requestId&&value.outputCount===1&&value.model==='edit'&&
   value.providerRunAuthenticated===false&&value.identityVerified===false&&
   value.originalBytesPreserved===true&&Number.isSafeInteger(value.createdAt)&&
   Number.isSafeInteger(value.expiresAt)&&Number.isFinite(now)&&
   value.expiresAt-value.createdAt===10*60*1000&&
   now>=value.createdAt&&now<=value.expiresAt;
 }catch{return false;}
}
