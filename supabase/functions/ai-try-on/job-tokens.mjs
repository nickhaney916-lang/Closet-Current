import {safeJobId} from './protocol.mjs';
export function createPredictionTokens(getSecret){
const text=(value)=>new TextEncoder().encode(value);
const b64url=(bytes)=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const fromB64url=(value)=>Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-value.length%4)%4)),c=>c.charCodeAt(0));
async function signer(){
 const raw=getSecret()||'';
 if(raw.length<32)throw Error('Pilot signing secret missing');
 return await crypto.subtle.importKey('raw',text(raw),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
}
async function signPrediction(id,uid,figure,category,step){
 const payload=b64url(text(JSON.stringify({id,uid,figure,category,step,time:Date.now()})));
 const signature=await crypto.subtle.sign('HMAC',await signer(),text(payload));
 return payload+'.'+b64url(new Uint8Array(signature));
}
async function readPrediction(token,uid){
 if(typeof token!=='string'||token.length>1024||!/^[-_A-Za-z0-9]+\.[-_A-Za-z0-9]+$/.test(token))throw Error('Invalid prediction token');
 const [payload,signature]=token.split('.');
 if(!await crypto.subtle.verify('HMAC',await signer(),fromB64url(signature),text(payload)))throw Error('Invalid prediction token');
 const value=JSON.parse(new TextDecoder().decode(fromB64url(payload)));
 if(value.uid!==uid||!safeJobId(value.id)||!['female','male'].includes(value.figure)||
  !['tops','bottoms','one-pieces'].includes(value.category)||![1,2].includes(value.step)||
  !Number.isFinite(value.time)||Date.now()-value.time<0||Date.now()-value.time>10*60000)
  throw Error('Prediction no longer available');
 return value;
}

return {signPrediction,readPrediction};
}
