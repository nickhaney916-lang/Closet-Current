/**
 * 3D-06: download published CC0 MakeHuman-derived human bases for RESEARCH ONLY.
 * Runtime preview serves only loopback local files. No personal images or AI.
 *
 * SHA-256 values were locked from the Oct 28 2026 CC0 source verification run.
 * The files remain RESEARCH ONLY and are not bundled in the production app.
 */
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
export const SOURCES=Object.freeze({
 male:Object.freeze({
  source:'https://www.innerscene.com/tools/library/3d-parts/male-base-mesh-3d-person-rigged-a-pose-380e6d89',
  download:'https://www.innerscene.com/api/library/male-base-mesh-3d-person-rigged-a-pose-380e6d89/download',
  sha256:'d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8',license:'CC0-1.0',filename:'male-cc0-rigged.glb'}),
 female:Object.freeze({
  source:'https://www.innerscene.com/tools/library/3d-parts/female-base-mesh-3d-person-rigged-a-pose-dba97ed5',
  download:'https://www.innerscene.com/api/library/female-base-mesh-3d-person-rigged-a-pose-dba97ed5/download',
  sha256:'a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1',license:'CC0-1.0',filename:'female-cc0-rigged.glb'})
});
export const MODEL_OUTPUT='research/three-d-06/models';
export function validateGLB(bytes){
 const b=Buffer.from(bytes);
 if(b.byteLength<10000||b.byteLength>12000000)throw Error('Unexpected human GLB size');
 if(b.toString('ascii',0,4)!=='glTF'||b.readUInt32LE(4)!==2||
  b.readUInt32LE(8)!==b.length)throw Error('Invalid glTF 2.0 binary header');
 const jsonLen=b.readUInt32LE(12);
 if(jsonLen<100||jsonLen>b.length-24||b.toString('ascii',16,20)!=='JSON')
  throw Error('Invalid embedded glTF JSON');
 const doc=JSON.parse(b.toString('utf8',20,20+jsonLen));
 if(doc.asset?.version!=='2.0'||!Array.isArray(doc.meshes)||!Array.isArray(doc.nodes)||
  !Array.isArray(doc.skins)||doc.meshes.length===0||doc.nodes.length<20||doc.skins.length===0)
  throw Error('GLB lacks real rigged anatomical human mesh');
 const triangles=(doc.meshes||[]).reduce((sum,m)=>sum+(m.primitives||[]).reduce((n,p)=>{
  const access=doc.accessors?.[p.indices];
  if(p.mode!==undefined&&p.mode!==4)return n;
  return n+(access?.count||0)/3;
 },0),0);
 if(triangles<10000||triangles>700000)throw Error('Unexpected human anatomical mesh triangle count');
 const bones=Math.max(...doc.skins.map(s=>(s.joints||[]).length));
 if(bones<25||bones>300)throw Error('Missing usable human skeleton');
 return {meshes:doc.meshes.length,skinCount:doc.skins.length,bones,triangles:Math.round(triangles),
  nodes:doc.nodes.length,materials:doc.materials?.length||0};
}
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function fetchHumanModels({fetcher=fetch,output=MODEL_OUTPUT}={}){
 await mkdir(output,{recursive:true});
 const entries=[];
 for(const [kind,model] of Object.entries(SOURCES)){
  const path=resolve(output,model.filename);
  let bytes;
  try{bytes=await readFile(path);}catch{}
  if(!bytes){
   const res=await fetcher(model.download,{redirect:'follow',headers:{accept:'application/octet-stream'}});
   if(!res.ok||!res.body)throw Error('CC0 '+kind+' download unavailable: '+res.status);
   if(res.url&&new URL(res.url).hostname!=='www.innerscene.com')throw Error('Untrusted model redirect');
   const ab=await res.arrayBuffer();
   if(ab.byteLength>12000000)throw Error('Oversized download blocked');
   bytes=Buffer.from(ab);
  }
  const actual=sha(bytes),shape=validateGLB(bytes);
  if(model.sha256&&actual!==model.sha256)throw Error('LOCKED MODEL SHA mismatch: '+kind);
  await writeFile(path,bytes,{flag:'w'});
  entries.push({kind,file:model.filename,sha256:actual,license:model.license,
   source:model.source,bytes:bytes.length,...shape,locked:!!model.sha256});
 }
 await writeFile(resolve(output,'verified-assets.json'),JSON.stringify({
  researchOnly:true,releaseAuthorized:false,sources:entries
 },null,2));
 return entries;
}
if(process.argv[1]&&process.argv[1].endsWith('fetch-licensed-avatars.mjs')){
 fetchHumanModels().then(rows=>{
  for(const r of rows)console.log('CC0_ANATOMICAL_MODEL',JSON.stringify(r));
 }).catch(e=>{console.error('CC0_ASSET_FETCH_BLOCKED',e.message);process.exitCode=1;});
}
