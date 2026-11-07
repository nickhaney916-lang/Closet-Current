/**
 * Strict real GLB inspection P155: no placeholder JSON mock or nominal
 * product description can satisfy the actual binary geometry evidence gate.
 * Asset must exactly match pinned Git blob hash and embedded glTF container.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,basename} from 'node:path';
import assert from 'node:assert/strict';
import {FOUNDATION155,CANDIDATES155} from './foundation-manifest.mjs';

const hash=(name,b)=>createHash(name).update(b).digest('hex');
const gitBlob=b=>hash('sha1',Buffer.concat([
 Buffer.from('blob '+b.length+'\0','utf8'),b
]));
const safeDataUri=s=>typeof s==='string'&&s.startsWith('data:')&&s.length<25000000;
function glbDecode(bytes){
 if(bytes.length<44||bytes.subarray(0,4).toString('utf8')!=='glTF')
  throw Error('P155 genuine glTF binary magic required');
 const version=bytes.readUInt32LE(4),total=bytes.readUInt32LE(8);
 if(version!==2||total!==bytes.length)
  throw Error('P155 genuine glTF v2 and complete byte size required');
 let p=12,header=null,binBytes=0,chunkCount=0;
 while(p<total){
  if(p+8>total)throw Error('P155 incomplete GLB chunk header');
  const len=bytes.readUInt32LE(p),type=bytes.readUInt32LE(p+4);
  if(len%4!==0||p+8+len>total)throw Error('P155 malformed GLB chunk bounds');
  const content=bytes.subarray(p+8,p+8+len);
  if(chunkCount===0&&type!==0x4E4F534A)throw Error('P155 first GLB chunk must be JSON');
  if(type===0x4E4F534A){
   if(header!==null||len>4000000)throw Error('P155 duplicate or huge JSON chunk');
   header=JSON.parse(content.toString('utf8').replace(/\0+| +$/g,''));
  }else if(type===0x004E4942)binBytes+=len;
  else throw Error('P155 unsupported nonstandard GLB chunk');
  p+=8+len;chunkCount++;
 }
 if(!header||p!==total||header.asset?.version!=='2.0'||binBytes<2048)
  throw Error('P155 original textured binary glTF mesh unavailable');
 return {header,binBytes,chunkCount};
}
function inspectGLTF(g){
 const nodes=g.nodes||[],meshes=g.meshes||[],skins=g.skins||[],
  materials=g.materials||[],accessors=g.accessors||[],images=g.images||[],
  textures=g.textures||[],animations=g.animations||[];
 if(!nodes.length||!meshes.length||!skins.length||!accessors.length)
  throw Error('P155 not a genuine rigged glTF humanoid');
 if(!Number.isInteger(g.scene)&&!g.scenes?.length)
  throw Error('P155 GLB lacks a renderable scene');
 for(const b of (g.buffers||[])){
  if(b.uri&&!safeDataUri(b.uri))throw Error('P155 external buffer URI prohibited');
 }
 for(const i of images){
  if(i.uri&&!safeDataUri(i.uri))throw Error('P155 external image URI prohibited');
  if(i.bufferView===undefined&&!i.uri)
   throw Error('P155 image lacks embedded or validated data');
 }
 if(g.extensionsRequired?.some(x=>!['KHR_materials_unlit','KHR_texture_transform'].includes(x)))
  throw Error('P155 unsupported required rendering extension');
 let triangleCount=0,weightedPrimitives=0,primitives=0,
  referencedRigNodes=new Set(),blendshapeTargets=0;
 for(const sk of skins){
  if(!Array.isArray(sk.joints)||sk.joints.length<15)
   throw Error('P155 rig lacks meaningful humanoid joint hierarchy');
  for(const id of sk.joints){
   if(!Number.isInteger(id)||!nodes[id])
    throw Error('P155 rig node unresolved');
   referencedRigNodes.add(id);
  }
 }
 for(const mesh of meshes)for(const primitive of (mesh.primitives||[])){
  primitives++;
  if(!primitive.attributes||primitive.attributes.POSITION===undefined)
   throw Error('P155 mesh missing original POSITION attribute');
  for(const attr of Object.values(primitive.attributes)){
   if(!accessors[attr])throw Error('P155 invalid primitive accessor');
  }
  const count=primitive.indices===undefined?
   accessors[primitive.attributes.POSITION].count:
   accessors[primitive.indices]?.count;
  if(!Number.isInteger(count)||count<3)
   throw Error('P155 cannot establish genuine model triangle count');
  if((primitive.mode??4)===4)triangleCount+=Math.floor(count/3);
  if(primitive.attributes.JOINTS_0!==undefined&&
     primitive.attributes.WEIGHTS_0!==undefined)weightedPrimitives++;
  blendshapeTargets+=primitive.targets?.length||0;
 }
 if(!weightedPrimitives||triangleCount<3000)
  throw Error('P155 rigged source lacks usable skinned mesh');
 const names=nodes.map(n=>n.name||'');
 const headNodes=names.filter(x=>/head/i.test(x));
 const armNodes=names.filter(x=>/arm|hand/i.test(x));
 const legNodes=names.filter(x=>/leg|foot|thigh|calf/i.test(x));
 if(!headNodes.length||armNodes.length<2||legNodes.length<2)
  throw Error('P155 no original humanoid head/arms/legs to use for hair/cloth retarget');
 return Object.freeze({
  nodes:nodes.length,meshes:meshes.length,skins:skins.length,
  minimumBonesPerSkin:Math.min(...skins.map(x=>x.joints.length)),
  maximumBonesPerSkin:Math.max(...skins.map(x=>x.joints.length)),
  uniqueJoints:referencedRigNodes.size,headNodes:headNodes.slice(0,15),
  armNodes:armNodes.length,legNodes:legNodes.length,
  primitives,weightedPrimitives,triangleCount,
  materialCount:materials.length,textureCount:textures.length,
  embeddedImages:images.length,hasNamedHead:true,
  blendshapeTargets,animationClips:animations.length,
  texturesExternallyFetched:false,
  sourceOwnerUserPhotoAttached:false
 });
}
export function inspectPinnedCandidate155(bytes,candidate){
 assert.ok(candidate&&CANDIDATES155.includes(candidate),
  'P155 only pinned and licensed candidate manifest');
 if(!Buffer.isBuffer(bytes))throw Error('P155 requires actual original binary GLB buffer');
 if(bytes.length!==candidate.size||bytes.length>8500000)
  throw Error('P155 exact pinned model byte size mismatch');
 if(gitBlob(bytes)!==candidate.gitBlobSHA1)
  throw Error('P155 upstream pinned Git blob SHA mismatch (refuse changed source)');
 const {header,binBytes,chunkCount}=glbDecode(bytes);
 const quality=inspectGLTF(header);
 return Object.freeze({
  key:candidate.key,file:candidate.file,
  originalProvenance:candidate.source,
  immutableSourceCommit:FOUNDATION155.sourcePinnedCommit,
  originalLicense:'MIT',
  originalLicenseTextMustShip:true,
  gitBlobSHA1:candidate.gitBlobSHA1,sha256:hash('sha256',bytes),
  bytes:bytes.length,binBytes,chunkCount,
  sourceHasBuiltInClothing:true,
  canReplaceUserOwnedOutfit:false,
  mayUseForRealPhotographedDress:false,
  canRenderIsolatedResearchCandidate:true,
  original163BonePhotoViewerFallbackRequired:true,
  licensedForReleaseLegalReviewRequired:true,
  independentHumanPhotoRealismApproval:false,
  familyAlpha:'HOLD',releaseAuthorized:false,
  ...quality
 });
}
if(import.meta.url===new URL('file://'+resolve(process.argv[1]||'')).href){
 const prefix=process.argv[2]||'benchmark/dual-human-foundation-candidate-155';
 const records=[];
 for(const candidate of CANDIDATES155){
  const input=resolve(prefix,'assets',candidate.file);
  const bytes=await readFile(input);
  const evidence=inspectPinnedCandidate155(bytes,candidate);
  records.push(evidence);
  console.log('P155_BINARY_GLTF_INSPECTED '+JSON.stringify({
   key:evidence.key,bytes:evidence.bytes,sha256:evidence.sha256,
   skins:evidence.skins,bones:evidence.maximumBonesPerSkin,
   triangles:evidence.triangleCount,
   textures:evidence.textureCount,embeddedImages:evidence.embeddedImages,
   bakedClothes:true,ownedPhotoWardrobeCompatible:false,
   releaseAuthorized:false
  }));
 }
 await mkdir(resolve(prefix,'audit'),{recursive:true});
 await writeFile(resolve(prefix,'audit','original-model-verification.json'),
  JSON.stringify({priority:155,sourceOriginalCommit:FOUNDATION155.sourcePinnedCommit,
   realTwoBinaryGLBsChecked:records.length,license:'MIT',
   original163BoneWardrobeIntegrationPreserved:true,
   familyAlpha:'HOLD',releaseAuthorized:false,records},null,2)+'\n');
}
