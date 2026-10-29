/** 3D-15 research-only exact-SHA CC0 download with provider-owned file host.
 * The 3D-06 published landing endpoint now redirects to files.innerscene.com.
 * Keep that original immutable script unchanged; neither host is a CDN
 * permitted at browser runtime. Refuse any nonprovider redirect or new bytes.
 */
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {SOURCES,MODEL_OUTPUT,validateGLB} from '../three-d-06/fetch-licensed-avatars.mjs';
export const PINNED_HOSTS=Object.freeze(['www.innerscene.com','files.innerscene.com']);
export function isPinnedProviderUrl(uri,kind){
 try{
  const u=new URL(uri),name=SOURCES[kind]?.source.split('/').at(-1);
  return u.protocol==='https:'&&PINNED_HOSTS.includes(u.hostname)&&
   Boolean(name)&&(u.hostname==='www.innerscene.com'?
    u.pathname===new URL(SOURCES[kind].download).pathname:
    u.pathname.startsWith('/library/'+name+'/')&&u.pathname.endsWith('.glb'));
 }catch{return false;}
}
const sha=b=>createHash('sha256').update(b).digest('hex');
export async function fetchPinnedCombinedResearchGLBs({fetcher=fetch,output=MODEL_OUTPUT}={}){
 await mkdir(output,{recursive:true});
 const list=[];
 for(const [kind,src] of Object.entries(SOURCES)){
  if(!/^[a-f0-9]{64}$/.test(src.sha256||''))throw Error('Unpinned CC0 source denied');
  const path=resolve(output,src.filename);
  let bytes;
  try{const local=await readFile(path);
   if(sha(local)===src.sha256)bytes=local;
  }catch{}
  if(!bytes){
   const response=await fetcher(src.download,{redirect:'follow',
    headers:{accept:'application/octet-stream'}});
   if(!response?.ok||!isPinnedProviderUrl(response.url,kind))
    throw Error('Untrusted CC0 provider redirect or response: '+kind);
   const size=Number(response.headers?.get?.('content-length')||0);
   if(size>12000000)throw Error('Oversized CC0 model response');
   bytes=Buffer.from(await response.arrayBuffer());
   if(bytes.length>12000000||sha(bytes)!==src.sha256)
    throw Error('LOCKED MODEL SHA mismatch or size: '+kind);
  }
  const shape=validateGLB(bytes);
  await writeFile(path,bytes);
  list.push({kind,file:src.filename,sha256:src.sha256,license:src.license,
   source:src.source,bytes:bytes.length,locked:true,...shape});
 }
 await writeFile(resolve(output,'verified-assets.json'),JSON.stringify({
  researchOnly:true,releaseAuthorized:false,sources:list
 },null,2));
 return list;
}
if(process.argv[1]?.endsWith('cc0-pinned-download.mjs')){
 fetchPinnedCombinedResearchGLBs().then(rows=>rows.forEach(r=>
  console.log('CC0_PINNED_RESEARCH_MODEL',JSON.stringify(r))))
  .catch(e=>{console.error('CC0_PINNED_DOWNLOAD_BLOCKED',e.message);process.exitCode=1;});
}
