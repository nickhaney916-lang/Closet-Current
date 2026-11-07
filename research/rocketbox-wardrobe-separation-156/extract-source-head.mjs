/**
 * P156 strict anatomy-safe REAL GLB HEAD+HAIR EXTRACTION, not a nude-body
 * generator. Repack actual MIT Rocketbox original male/female 80-bone
 * sources to remove EVERY body/jacket/pants/shoe primitive AND the body
 * texture image bytes. Preserve only verified head and hair/opacity
 * skinned geometry, face texture, morphology and the original skeleton.
 *
 * No photo upload, no stored user garment, no production/staging writes.
 * Research-only original-163-bone owner-outfit renderer must still be used.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {CANDIDATES155} from '../dual-human-foundation-candidate-155/foundation-manifest.mjs';
import {inspectPinnedCandidate155} from '../dual-human-foundation-candidate-155/inspect-gltf.mjs';
import {assessRockboxSeparation156} from './analyze-source-anatomy.mjs';

const BASE='benchmark/rocketbox-wardrobe-separation-156';
const SRC='benchmark/dual-human-foundation-candidate-155/assets';
const fail=x=>{throw Error('P156_SAFE_HEAD_EXTRACTION '+x);};
const comp={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4};
const dimensions={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16};
const SHA=b=>createHash('sha256').update(b).digest('hex');
function originalGLB(b){
 if(!Buffer.isBuffer(b)||b.length<32||b.subarray(0,4).toString('ascii')!=='glTF')
  fail('source GLB missing');
 if(b.readUInt32LE(4)!==2||b.readUInt32LE(8)!==b.length)
  fail('invalid original binary glTF header');
 let offset=12,doc=null,bin=null;
 while(offset+8<=b.length){
  const n=b.readUInt32LE(offset),t=b.readUInt32LE(offset+4);
  if(n%4||offset+8+n>b.length)fail('invalid chunk');
  if(t===0x4E4F534A)doc=JSON.parse(b.subarray(offset+8,offset+8+n).toString().trim());
  if(t===0x004E4942)bin=b.subarray(offset+8,offset+8+n);
  offset+=8+n;
 }
 if(offset!==b.length||!doc||!bin||doc.buffers?.length!==1)fail('GLB must contain one embedded binary');
 return {doc,bin};
}
function cloneJSON(x){return JSON.parse(JSON.stringify(x));}
function allTextureIDs(mat){
 const ids=new Set();
 const walk=x=>{
  if(!x||typeof x!=='object')return;
  for(const [key,v] of Object.entries(x)){
   if(/Texture$/.test(key)&&Number.isInteger(v?.index))ids.add(v.index);
   else if(v&&typeof v==='object')walk(v);
  }
 };
 walk(mat);
 return [...ids];
}
function remapTextureRefs(mat,remap){
 const walk=x=>{
  if(!x||typeof x!=='object')return;
  for(const [k,v] of Object.entries(x)){
   if(/Texture$/.test(k)&&Number.isInteger(v?.index)){
    if(!remap.has(v.index))fail('material references untracked texture '+v.index);
    v.index=remap.get(v.index);
   }else if(v&&typeof v==='object')walk(v);
  }
 };
 walk(mat);return mat;
}
function repackSelected(doc,bin,candidate){
 const srcMeshes=doc.meshes||[];
 if(srcMeshes.length!==1||!srcMeshes[0].primitives||srcMeshes[0].primitives.length!==3)
  fail('unknown Rocketbox mesh partition; manual review required');
 const pri=srcMeshes[0].primitives,mat=doc.materials||[];
 const sourceNames=pri.map(p=>mat[p.material]?.name||'');
 const prefix=candidate.key==='female'?'f007_':'m006_';
 // Fail closed to EXACT SOURCE MATERIAL PREFIXES confirmed by genuine CI:
 // body source clothing shares a single material and is NOT skin-safe to strip
 // as a nude body. The head and hair are independent original primitives.
 if(sourceNames.join('|')!==[prefix+'body',prefix+'head',prefix+'opacity'].join('|'))
  fail('original source material anatomy changed: '+sourceNames.join('|'));
 const kept=[cloneJSON(pri[1]),cloneJSON(pri[2])];
 for(const p of kept){
  if(p.attributes?.JOINTS_0===undefined||p.attributes?.WEIGHTS_0===undefined)
   fail('head or hair primitive lacks skinned anatomy');
 }
 const out=cloneJSON(doc);
 const oldMaterials=[pri[1].material,pri[2].material];
 const materials=oldMaterials.map(i=>cloneJSON(mat[i]));
 const materialMap=new Map(oldMaterials.map((i,j)=>[i,j]));
 kept.forEach(p=>p.material=materialMap.get(p.material));
 const oldTextureIDs=[...new Set(materials.flatMap(allTextureIDs))].sort((a,b)=>a-b);
 const textureMap=new Map(oldTextureIDs.map((id,i)=>[id,i]));
 const textures=oldTextureIDs.map(i=>cloneJSON(doc.textures[i]));
 const sourceImages=[...new Set(textures.map(t=>t.source))].sort((a,b)=>a-b);
 const imageMap=new Map(sourceImages.map((id,i)=>[id,i]));
 const images=sourceImages.map(i=>cloneJSON(doc.images[i]));
 const oldAccessors=new Set(),neededViews=new Set();
 for(const p of kept){
  if(p.indices!==undefined)oldAccessors.add(p.indices);
  for(const a of Object.values(p.attributes||{}))oldAccessors.add(a);
  for(const target of p.targets||[])for(const a of Object.values(target))oldAccessors.add(a);
 }
 for(const skin of doc.skins||[]){
  if(skin.inverseBindMatrices!==undefined)oldAccessors.add(skin.inverseBindMatrices);
 }
 // Copy only selected ORIGINAL face and hair attribute elements; do not
 // include hidden bytes from interleaved body data even if share buffer view.
 const rows=[],views=[],accessors=[],mapAcc=new Map(),segments=[];
 const append=(b,target)=>{
  const pad=(4-b.length%4)%4,offset=segments.reduce((a,v)=>a+v.length,0);
  segments.push(b,pad?Buffer.alloc(pad):Buffer.alloc(0));
  const item={buffer:0,byteOffset:offset,byteLength:b.length};
  if(target!==undefined)item.target=target;
  views.push(item);
  return views.length-1;
 };
 for(const id of [...oldAccessors].sort((a,b)=>a-b)){
  const a=doc.accessors?.[id];
  if(!a||!Number.isInteger(a.bufferView)||a.sparse)
   fail('unsupported source head/hair accessor '+id);
  const v=doc.bufferViews?.[a.bufferView],elem=(comp[a.componentType]||0)*
   (dimensions[a.type]||0);
  if(!v||!elem||!Number.isInteger(a.count)||a.count<1)
   fail('corrupt skinned face accessor '+id);
  const stride=v.byteStride||elem,start=(v.byteOffset||0)+(a.byteOffset||0);
  const copy=Buffer.alloc(a.count*elem);
  for(let j=0;j<a.count;j++){
   const k=start+j*stride;
   if(k+elem>bin.length)fail('face accessor out of source binary bounds');
   bin.copy(copy,j*elem,k,k+elem);
  }
  const next=cloneJSON(a);
  next.bufferView=append(copy,v.target);
  next.byteOffset=0;
  mapAcc.set(id,accessors.length);accessors.push(next);
 }
 const nextIndex=id=>{
  if(!mapAcc.has(id))fail('untracked head accessor');
  return mapAcc.get(id);
 };
 for(const p of kept){
  if(p.indices!==undefined)p.indices=nextIndex(p.indices);
  for(const key of Object.keys(p.attributes))p.attributes[key]=nextIndex(p.attributes[key]);
  for(const target of p.targets||[])for(const key of Object.keys(target))
   target[key]=nextIndex(target[key]);
 }
 const skins=(doc.skins||[]).map(s=>{
  const item=cloneJSON(s);
  if(item.inverseBindMatrices!==undefined)
   item.inverseBindMatrices=nextIndex(item.inverseBindMatrices);
  return item;
 });
 for(let i=0;i<images.length;i++){
  const entry=images[i];
  if(!Number.isInteger(entry.bufferView)||!entry.mimeType)
   fail('embedded head/hair texture provenance required');
  const view=doc.bufferViews?.[entry.bufferView],o=view?.byteOffset||0,
   n=view?.byteLength||0;
  if(!view||n<80||o+n>bin.length)fail('original source head texture bytes missing');
  entry.bufferView=append(Buffer.from(bin.subarray(o,o+n)));
 }
 for(const tex of textures){
  if(!imageMap.has(tex.source))fail('nonembedded hair image');
  tex.source=imageMap.get(tex.source);
 }
 out.meshes=[{...srcMeshes[0],primitives:kept}];
 out.materials=materials.map(m=>remapTextureRefs(m,textureMap));
 out.textures=textures;out.images=images;
 out.bufferViews=views;out.accessors=accessors;
 out.skins=skins;
 out.buffers=[{byteLength:segments.reduce((n,b)=>n+b.length,0)}];
 // Original glTF animations/contexts might refer to removed morphs in future;
 // these pinned GLBs have none; refuse if animated.
 if((out.animations||[]).length)fail('source uses animation channels needing retarget');
 const binNew=Buffer.concat(segments);
 const json=Buffer.from(JSON.stringify(out),'utf8');
 const jsonPad=(4-json.length%4)%4;
 const jsonChunk=Buffer.concat([json,Buffer.alloc(jsonPad,0x20)]);
 const binPad=(4-binNew.length%4)%4;
 const binChunk=Buffer.concat([binNew,Buffer.alloc(binPad)]);
 const total=12+8+jsonChunk.length+8+binChunk.length;
 const h=Buffer.alloc(12),j=Buffer.alloc(8),b=Buffer.alloc(8);
 h.write('glTF',0);h.writeUInt32LE(2,4);h.writeUInt32LE(total,8);
 j.writeUInt32LE(jsonChunk.length,0);j.writeUInt32LE(0x4E4F534A,4);
 b.writeUInt32LE(binChunk.length,0);b.writeUInt32LE(0x004E4942,4);
 const output=Buffer.concat([h,j,jsonChunk,b,binChunk]);
 if(output.length!==total)fail('final source head binary mismatch');
 const reread=originalGLB(output).doc;
 if(reread.materials.length!==2||reread.meshes[0].primitives.length!==2||
   reread.materials.some(m=>/body|jacket|pant|coat|shoe/i.test(m.name||'')))
  fail('body or vendor baked clothing material survived repack');
 const names=reread.materials.map(m=>m.name);
 if(names[0]!==prefix+'head'||names[1]!==prefix+'opacity')
  fail('source face/hair material order changed');
 const originalBodyTexture=doc.materials[pri[0].material].pbrMetallicRoughness?.baseColorTexture?.index;
 if(originalBodyTexture!==undefined&&oldTextureIDs.includes(originalBodyTexture))
  fail('source jacket body texture accidentally shared with face-only extraction');
 return {output,
  proof:{figure:candidate.key,originalBytes:bin.length,
    newTotalBytes:output.length,skinnedSourceBones:(reread.skins[0]?.joints||[]).length,
    originalSourcePrimitives:3,retainedActualHeadAndHairPrimitives:2,
    retainedMaterialNames:names,retainedTextures:reread.textures.length,
    retainedEmbeddedImageCount:reread.images.length,
    sourceBodyTrianglesAndAccessorsDiscarded:true,
    originalBakedBodyTextureBytesDiscarded:true,
    skinningBindingsRepacked:true,
    headAndHairRealGeometryRetained:true,
    modelFaceIdentityNotBasedOnCustomerImage:true,
    faceSourceLicense:'MIT',
    compatibleWithOriginal163BoneOutfitRig:false,
    originalUserWardrobeReplaced:false,
    independentHumanPhotorealismApproved:false,
    releaseAuthorized:false,familyAlpha:'HOLD',
    sha256:SHA(output)}
 };
}
export function extractSourceHeadOnly156(bytes,candidate){
 assert.ok(CANDIDATES155.includes(candidate),'P156 only exact licensed pinned male/female source');
 inspectPinnedCandidate155(bytes,candidate);
 const {doc,bin}=originalGLB(bytes);
 return repackSelected(doc,bin,candidate);
}
if(import.meta.url===new URL('file://'+resolve(process.argv[1]||'')).href){
 const result=[];
 for(const c of CANDIDATES155){
  const original=await readFile(SRC+'/'+c.file);
  const {output,proof}=extractSourceHeadOnly156(original,c);
  await mkdir(BASE+'/heads',{recursive:true});
  await writeFile(BASE+'/heads/'+c.key+'-licensed-face-hair-only.glb',output);
  result.push(proof);
  console.log('P156_PHYSICALLY_REPACKED_REAL_HEAD '+JSON.stringify(proof));
 }
 await mkdir(BASE+'/audit',{recursive:true});
 await writeFile(BASE+'/audit/safe-head-extraction.json',
 JSON.stringify({priority:156,extractedMaleAndFemaleHeadOnlyGLBs:2,
  materialPrimitivesFromOriginalLicensedGLB:true,
  originalSourceBodyBakedClothingGeometryRemoved:true,
  newBodySkinGenerated:false,
  original163BonePhotoGarmentPipelinePreserved:true,
  ownerSavedGarmentFitToNewRigProven:false,
  physicalPhoneApproved:false,
  licenseMIT:true,familyAlpha:'HOLD',releaseAuthorized:false,
  records:result},null,2)+'\n');
}
