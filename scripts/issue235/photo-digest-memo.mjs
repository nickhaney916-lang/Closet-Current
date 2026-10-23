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
