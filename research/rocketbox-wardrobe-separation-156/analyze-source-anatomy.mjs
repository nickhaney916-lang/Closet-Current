/**
 * P156: EXAMINE actual pinned 80-bone Rocketbox GLB anatomy; cannot call
 * a clothed GLB a garment-free human without independently proving skin,
 * hair and clothing exist as separable mesh primitives.
 *
 * Input: genuine exact-size, Git blob SHA and SHA256 verified P155 binaries,
 * never customer photos, and never shipping source. Output is a reproducible
 * original-source anatomical partition/rig compatibility report.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {CANDIDATES155,FOUNDATION155} from '../dual-human-foundation-candidate-155/foundation-manifest.mjs';
import {inspectPinnedCandidate155} from '../dual-human-foundation-candidate-155/inspect-gltf.mjs';

const dir='benchmark/rocketbox-wardrobe-separation-156';
const source='benchmark/dual-human-foundation-candidate-155/assets';
const fail=m=>{throw Error('P156 source cannot auto-separate clothing: '+m);};
function parseGLB(b){
 if(b.length<20||b.subarray(0,4).toString('ascii')!=='glTF')fail('no source GLB');
 if(b.readUInt32LE(4)!==2||b.readUInt32LE(8)!==b.length)
  fail('inconsistent immutable source GLB');
 let offset=12,doc=null,bin=null;
 while(offset+8<=b.length){
  const count=b.readUInt32LE(offset),kind=b.readUInt32LE(offset+4);
  if(offset+8+count>b.length)fail('incomplete data chunk');
  const bytes=b.subarray(offset+8,offset+8+count);
  if(kind===0x4E4F534A)doc=JSON.parse(bytes.toString().trim());
  else if(kind===0x004E4942)bin=bytes;
  offset+=8+count;
 }
 if(!doc||!bin||offset!==b.length)fail('binary mesh unavailable');
 return {doc,bin};
}
const componentMap={5120:{bytes:1,read:'readInt8'},5121:{bytes:1,read:'readUInt8'},
 5122:{bytes:2,read:'readInt16LE'},5123:{bytes:2,read:'readUInt16LE'},
 5125:{bytes:4,read:'readUInt32LE'},5126:{bytes:4,read:'readFloatLE'}};
const typeMap={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
function inspectAccessor(doc,bin,index){
 const a=doc.accessors?.[index];
 if(!a||!Number.isInteger(a.bufferView))fail('unsupported sparse or missing accessor '+index);
 const v=doc.bufferViews?.[a.bufferView],c=componentMap[a.componentType];
 if(!v||!c||!typeMap[a.type]||!Number.isInteger(a.count)||a.count<1)
  fail('original primitive accessor invalid');
 const comps=typeMap[a.type],stride=v.byteStride||comps*c.bytes;
 const base=(v.byteOffset||0)+(a.byteOffset||0);
 const last=base+(a.count-1)*stride+comps*c.bytes;
 if(last>bin.length||stride<comps*c.bytes)fail('out-of-range source accessors');
 const entries=[];
 const needed=Math.min(a.count,250000);
 for(let i=0;i<needed;i++){
  const row=[];
  for(let j=0;j<comps;j++){
   const p=base+i*stride+j*c.bytes;
   row.push(bin[c.read](p));
  }
  entries.push(row);
 }
 return {count:a.count,type:a.type,componentType:a.componentType,
  min:a.min,max:a.max,byteStride:stride,rows:entries};
}
function boxes(points){
 const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 for(const p of points)for(let i=0;i<Math.min(3,p.length);i++){
  lo[i]=Math.min(lo[i],p[i]);hi[i]=Math.max(hi[i],p[i]);
 }
 return {min:lo.map(x=>Math.round(x*1000)/1000),
  max:hi.map(x=>Math.round(x*1000)/1000)};
}
function info(bytes,candidate){
 const pinned=inspectPinnedCandidate155(bytes,candidate);
 const {doc,bin}=parseGLB(bytes),meshes=doc.meshes||[],nodes=doc.nodes||[],
  mats=doc.materials||[],skins=doc.skins||[];
 const nodeNames=nodes.map(n=>n.name||'');
 const boneNames=(skins[0]?.joints||[]).map(i=>nodeNames[i]);
 const primitives=[];
 for(let mi=0;mi<meshes.length;mi++){
  const mesh=meshes[mi];
  for(let pi=0;pi<(mesh.primitives||[]).length;pi++){
   const prim=mesh.primitives[pi],attrs=prim.attributes;
   if(!attrs||attrs.POSITION===undefined)fail('mesh source POSITION missing');
   const position=inspectAccessor(doc,bin,attrs.POSITION);
   const index=prim.indices===undefined?null:inspectAccessor(doc,bin,prim.indices);
   if(position.type!=='VEC3')fail('source POSITION not 3D');
   const tri=(index?index.count:position.count)/3;
   const material=mats[prim.material||0]||{};
   const textureIds=[];
   const walk=(obj)=>{
    if(!obj||typeof obj!=='object')return;
    for(const [key,value] of Object.entries(obj)){
     if(key.endsWith('Texture')&&Number.isInteger(value?.index))
      textureIds.push({usage:key,index:value.index});
     else if(key!=='extensions')walk(value);
    }
   };
   walk(material);
   const p={
    meshIndex:mi,meshName:mesh.name||'',primitiveIndex:pi,
    materialIndex:prim.material??null,materialName:material.name||'',
    materialAlphaMode:material.alphaMode||'OPAQUE',
    materialDoubleSided:material.doubleSided===true,
    textureRefs:textureIds,
    vertices:position.count,triangles:tri,
    morphTargets:(prim.targets||[]).length,
    attributes:Object.keys(attrs),
    skinned:attrs.JOINTS_0!==undefined&&attrs.WEIGHTS_0!==undefined,
    bounds:boxes(position.rows),
    coordinateFrame:'rest_model_space_as_stored_in_original_GLTF',
    containsIndependentBodySkinUnknown:true,
    canEraseClothingWithoutDamagingFaceAndSkin:false
   };
   primitives.push(p);
  }
 }
 const materialToPrimitiveCount=new Map();
 for(const p of primitives)materialToPrimitiveCount.set(p.materialIndex,
  (materialToPrimitiveCount.get(p.materialIndex)||0)+1);
 const isNamedGarment=p=>/shirt|pants|shoe|garment|coat|jacket|jeans|dress|pants|bodycloth/i.test(p.materialName+' '+p.meshName);
 const splitCandidate=primitives.filter(isNamedGarment);
 const clothingIsDedicated=splitCandidate.length>0&&
  splitCandidate.length<primitives.length&&
  splitCandidate.every(p=>materialToPrimitiveCount.get(p.materialIndex)===1);
 // Names are not proof of completeness: even a named jacket can include
 // skin/undershirt, or other clothing may share a primitive.
 return {
  figure:candidate.key,
  originalGLBSHA256:pinned.sha256,
  gitBlobSHA1:pinned.gitBlobSHA1,
  immutableMITProvenance:FOUNDATION155.sourcePinnedCommit,
  bytes:bytes.length,
  sourceMeshCount:meshes.length,
  originalRigBones:boneNames.length,
  boneNames,
  originalNodeCount:nodes.length,
  materials:mats.map((m,i)=>({id:i,name:m.name||'',
   alphaMode:m.alphaMode||'OPAQUE',
   pbrBaseColorTexture:m.pbrMetallicRoughness?.baseColorTexture?.index??null,
   normalTexture:m.normalTexture?.index??null,
   alphaFactor:m.pbrMetallicRoughness?.baseColorFactor?.[3]??1})),
  primitives,
  headNamedBones:boneNames.filter(n=>/head|neck/i.test(n)),
  armNamedBones:boneNames.filter(n=>/arm|hand|shoulder|clavicle/i.test(n)),
  footNamedBones:boneNames.filter(n=>/foot|calf|thigh|leg|toe/i.test(n)),
  syntacticDedicatedGarmentPrimitivePresent:clothingIsDedicated,
  originalGenuineBodySkinSufficientlyUnclothed:false,
  photoBasedGarmentFitAfterRemovalProven:false,
  sourceRig80ToOriginal163MappingComplete:false,
  originalWardrobeViewerRequired:true,
  licensedShippingAssetReady:false,
  familyAlpha:'HOLD',
  releaseAuthorized:false,
  sourceMeshAndPrimitiveCounts:[meshes.length,primitives.length],
  maxSkinnedPrimitiveVertices:Math.max(...primitives.filter(x=>x.skinned).map(x=>x.vertices))
 };
}
export function assessRockboxSeparation156(sourceReport){
 if(!sourceReport||!Array.isArray(sourceReport.primitives)||sourceReport.originalRigBones!==80)
  fail('genuine pinned 80-bone source report required');
 const sameMesh=sourceReport.sourceMeshCount===1&&sourceReport.primitives.length<=3;
 const hasGarmentMaterial=sourceReport.primitives.some(p=>/coat|jacket|pant|shirt|shoe/i.test(p.materialName));
 const ready=sourceReport.syntacticDedicatedGarmentPrimitivePresent===true&&
  sourceReport.originalGenuineBodySkinSufficientlyUnclothed===true&&
  sourceReport.photoBasedGarmentFitAfterRemovalProven===true&&
  sourceReport.sourceRig80ToOriginal163MappingComplete===true;
 return Object.freeze({
  figure:sourceReport.figure,
  existingOriginalSourceStructure:sourceReport.sourceMeshAndPrimitiveCounts,
  mergedSourceMesh:sameMesh,
  anyExplicitGarmentMaterialName:hasGarmentMaterial,
  originalStandaloneNudeBodyExists:sourceReport.originalGenuineBodySkinSufficientlyUnclothed,
  canAutoStripClothes:ready,
  canReplaceOriginalPhotographedOutfit:ready,
  proprietaryVendorNetworkNeeded:false,
  ownerSourcePhotoChanged:false,
  originalFigure163BoneModelPreserved:true,
  realisticHeadOnlyResearchFallbackPossible:sourceReport.headNamedBones.length>0,
  reason:ready?'INDEPENDENT_FULL_GARMENT_COMPOSABILITY_VERIFIED':
   'BAKED_SOURCE_CLOTHING_AND_RIG_COMPATIBILITY_UNVERIFIED',
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
if(import.meta.url===new URL('file://'+resolve(process.argv[1]||'')).href){
 const cases=[];
 for(const c of CANDIDATES155){
  const bytes=await readFile(source+'/'+c.file);
  const report=info(bytes,c),verdict=assessRockboxSeparation156(report);
  cases.push({report,verdict});
  console.log('P156_REAL_GLTF_ANATOMY '+JSON.stringify({
   figure:c.key,sourceMeshCount:report.sourceMeshCount,
   primitives:report.primitives.map(x=>({
    material:x.materialName,meshName:x.meshName,triangles:x.triangles,
    vertices:x.vertices,textureRefs:x.textureRefs,bounds:x.bounds
   })),
   originalRigBones:report.originalRigBones,
   sourceAutoUndressApproved:verdict.canAutoStripClothes,
   ownerWardrobeUnmodified:true
  }));
 }
 await mkdir(dir+'/audit',{recursive:true});
 await writeFile(dir+'/audit/real-source-anatomy.json',JSON.stringify({
  priority:156,originalPinnedMITAssetsExamined:2,
  sourceReadyForWardrobeRetarget:false,
  originalOwnerWardrobePreserved:true,
  testsUseRealGLTFTriangleData:true,
  cases,familyAlpha:'HOLD',releaseAuthorized:false
 },null,2)+'\n');
}
