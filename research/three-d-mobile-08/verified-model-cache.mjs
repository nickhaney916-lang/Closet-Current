/**
 * Isolated Chat 3D-08 / mobile experiment. NEVER caches a live Three.js scene,
 * skeleton, geometry, shirt texture, account data or private photograph.
 * Keeps at most TWO hash-verified CC0 GLB source buffers in memory.
 * Integrates solely in the optional research boot page; original Work58 remains unchanged.
 */
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export const PINNED_MODELS=Object.freeze({
 'male-cc0-rigged.glb': Object.freeze({
  sha256:'d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8',
  license:'CC0-1.0'
 }),
 'female-cc0-rigged.glb': Object.freeze({
  sha256:'a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1',
  license:'CC0-1.0'
 })
});
const MODEL_PATH='/research/three-d-06/models/';
const MAX_BYTES=12_000_000;
const sha256=async data=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',data)))
 .map(x=>x.toString(16).padStart(2,'0')).join('');
const monotonic=()=>performance.now();
export function parsePinnedModelURL(url,origin){
 let resolved;
 try{resolved=new URL(url,origin);}catch{return null;}
 if(resolved.origin!==origin||resolved.search||resolved.hash)return null;
 if(!resolved.pathname.startsWith(MODEL_PATH))return null;
 const name=resolved.pathname.slice(MODEL_PATH.length);
 if(!Object.hasOwn(PINNED_MODELS,name))throw Error('Unapproved anatomical model URL');
 return {name,url:resolved.href,baseURL:new URL('./',resolved.href).href};
}
export function installVerifiedModelCache({fetcher=fetch,digest=sha256,clock=monotonic}={}){
 const original=GLTFLoader.prototype.loadAsync;
 const entries=new Map(),inflight=new Map();
 let live=true,generation=0;
 const stats={fetches:0,networkBytes:0,cacheHits:0,inflightHits:0,verified:0,
  parses:0,parseFailures:0,fetchFailures:0,refusals:0,lastFetchMs:null,lastParseMs:null,
  lastModel:null};
 const getBytes=async model=>{
  if(entries.has(model.name)){stats.cacheHits++;return entries.get(model.name);}
  if(inflight.has(model.name)){stats.inflightHits++;return inflight.get(model.name);}
  const born=generation,started=clock();
  const job=(async()=>{
   let bytes;
   try{
    const response=await fetcher(model.url,{method:'GET',credentials:'omit',
     redirect:'error',cache:'no-store',mode:'same-origin'});
    if(!response.ok)throw Error('Pinned anatomical model not available: '+response.status);
    const len=Number(response.headers.get('content-length')||0);
    if(len>MAX_BYTES)throw Error('Oversized anatomical model');
    bytes=await response.arrayBuffer();
    stats.fetches++;stats.networkBytes+=bytes.byteLength;
    if(bytes.byteLength<10000||bytes.byteLength>MAX_BYTES)throw Error('Invalid GLB size');
    const data=new DataView(bytes);
    if(data.getUint32(0,true)!==0x46546c67||data.getUint32(4,true)!==2||
     data.getUint32(8,true)!==bytes.byteLength)throw Error('Invalid GLB binary');
    if(await digest(bytes)!==PINNED_MODELS[model.name].sha256){
     stats.refusals++;throw Error('LOCKED MODEL SHA mismatch: '+model.name);
    }
    if(!live||generation!==born)throw Error('Stale model request');
    entries.set(model.name,bytes);
    stats.verified++;
    stats.lastFetchMs=clock()-started;
    return bytes;
   }catch(e){stats.fetchFailures++;throw e;}
  })();
  inflight.set(model.name,job);
  try{return await job;}finally{if(inflight.get(model.name)===job)inflight.delete(model.name);}
 };
 GLTFLoader.prototype.loadAsync=async function(url,onProgress){
  const model=parsePinnedModelURL(url,location.origin);
  if(!model)return original.call(this,url,onProgress);
  if(!live)throw Error('Model cache released');
  const bytes=await getBytes(model),started=clock();
  // Copy verified compressed binary for the GLTF parser. Geometry buffers
  // created by a displayed model must not share mutable CPU memory with cache.
  try{
   const gltf=await this.parseAsync(bytes.slice(0),model.baseURL);
   stats.parses++;stats.lastParseMs=clock()-started;stats.lastModel=model.name;
   return gltf;
  }catch(e){stats.parseFailures++;throw e;}
 };
 const metrics=()=>Object.freeze({...stats,modelNames:Array.from(entries.keys()),
  cacheBytes:Array.from(entries.values()).reduce((n,b)=>n+b.byteLength,0),
  cacheEntries:entries.size,inflight:inflight.size,installed:live,
  sourceProvenance:'exact-two-CC0-SHA256-pinned',gpuScenesCached:0});
 const clear=()=>{generation++;entries.clear();};
 const dispose=()=>{if(!live)return;live=false;clear();GLTFLoader.prototype.loadAsync=original;};
 return {metrics,clear,dispose};
}
