// Research only. Integrity checks depend on trusted, already-authenticated
// snapshot hashes and account/session supplied by the integrating caller.
// No app auth, photo permission, cutout approval, or storage is provided here.
const eq=(a,b)=>a?.ownerId===b?.ownerId&&a?.sessionId===b?.sessionId&&!!a?.ownerId&&!!a?.sessionId;
const validHash=x=>typeof x==='string'&&/^[0-9a-f]{64}$/.test(x);
export async function evaluateOutfit({items,context,getContext,digest}){
 if(!eq(context,getContext())||!Array.isArray(items)||!items.length||items.length>8||typeof digest!=='function')return {mode:'REVIEW REQUIRED',reason:'Photo identity or session requires review.'};
 const ids=new Set();
 try{
  for(const it of items){
   if(!it||typeof it.id!=='string'||!it.id||ids.has(it.id)||it.ownerId!==context.ownerId||!validHash(it.trustedSourceSha256)||!(it.original instanceof Blob)||it.original.type!=='image/jpeg'||it.original.size<4||it.original.size>10*1024*1024)return {mode:'REVIEW REQUIRED',reason:'Photo identity or ownership requires review.'};
   ids.add(it.id);const bytes=new Uint8Array(await it.original.arrayBuffer());
   if(!eq(context,getContext())||bytes[0]!==255||bytes[1]!==216||bytes[bytes.length-2]!==255||bytes[bytes.length-1]!==217)return {mode:'REVIEW REQUIRED',reason:'Photo source or session requires review.'};
   if(await digest(bytes)!==it.trustedSourceSha256||!eq(context,getContext()))return {mode:'REVIEW REQUIRED',reason:'Photo source or session requires review.'};
  }
  // There is no independent, source-bound worn-combination approval service in
  // this prototype. A boolean, test result, or arbitrary caller must not grant it.
  return {mode:'PHOTO PREVIEW',reason:'Original photos are shown; realistic worn preview has not been approved.'};
 }catch{return {mode:'REVIEW REQUIRED',reason:'Photo verification could not be completed.'};}
}
