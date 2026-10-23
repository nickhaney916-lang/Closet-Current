/**
 * RESEARCH-ONLY bounded, per-snapshot optimization for duplicate JPEG digest
 * work. Not imported by the production Closet Current app.
 *
 * - Exact data URI identity only; NEVER merge different image bytes.
 * - Caller authenticates/isolates owner and computes the actual SHA-256 path.
 * - Cache is per backup encoding, not shared across accounts or sessions.
 * - Evicted promises can complete, and no photo bytes are transformed.
 */
export function memoizeExactImageEncodes(encode, {maxEntries=64}={}) {
 if(typeof encode!=='function')throw new TypeError('Image encoder callback required');
 if(!Number.isInteger(maxEntries)||maxEntries<1||maxEntries>256)throw new RangeError('Invalid bounded cache size');
 const entries=new Map();
 let uniqueCalls=0,hits=0;
 async function mapImage(image) {
  if(typeof image!=='string'||!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(image)) {
   throw new TypeError('Validated JPEG data URI required');
  }
  if(entries.has(image)){
   const promise=entries.get(image);entries.delete(image);entries.set(image,promise);hits++;
   return promise;
  }
  uniqueCalls++;
  const value=Promise.resolve().then(()=>encode(image));
  entries.set(image,value);
  if(entries.size>maxEntries)entries.delete(entries.keys().next().value);
  try{return await value;}
  catch(error){if(entries.get(image)===value)entries.delete(image);throw error;}
 }
 return {
  mapImage,
  clear:()=>entries.clear(),
  stats:()=>({uniqueCalls,hits,retainedEntries:entries.size,maxEntries})
 };
}


/**
 * Count source duplicates before scheduling SHA work, then retain only those
 * hash promises until their FINAL use. This avoids a general-purpose LRU
 * retaining mostly one-off high-resolution JPEG data URI strings.
 *
 * Prescan is local, synchronous and performs no image decoding or mutation.
 * A caller MUST keep one authenticated snapshot/account per instance.
 */
export function memoizeRepeatedImageEncodes(snapshot, encode) {
 if(typeof encode!=='function')throw new TypeError('Image encoder callback required');
 const uses=new Map();
 let totalReferences=0;
 function collect(node) {
  if(Array.isArray(node)){for(const part of node)collect(part);return;}
  if(node&&typeof node==='object'){
   for(const [key,value] of Object.entries(node)){
    if(['__proto__','constructor','prototype'].includes(key))throw Error('Unsafe snapshot key');
    if(key==='image'&&typeof value==='string'&&value){
     if(!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(value))throw Error('Invalid JPEG input');
     uses.set(value,(uses.get(value)||0)+1);totalReferences++;
    }else collect(value);
   }
  }
 }
 collect(snapshot);
 for(const [image,count] of uses)if(count===1)uses.delete(image);
 const repeatedKinds=uses.size,pending=new Map();
 let hashes=0,hits=0,peakPending=0;
 async function mapImage(image) {
  if(typeof image!=='string'||!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(image))throw TypeError('Validated JPEG input required');
  if(!uses.has(image)){hashes++;return encode(image);}
  let work=pending.get(image);
  if(work){hits++;}
  else{hashes++;work=Promise.resolve().then(()=>encode(image));pending.set(image,work);peakPending=Math.max(peakPending,pending.size);}
  const remaining=uses.get(image)-1;
  if(remaining===0){uses.delete(image);pending.delete(image);}
  else uses.set(image,remaining);
  return work;
 }
 return {mapImage,clear:()=>{pending.clear();uses.clear();},stats:()=>({hashes,hits,totalReferences,repeatedKinds,pending:pending.size,peakPending})};
}
