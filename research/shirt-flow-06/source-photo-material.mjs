/**
 * SHIRT-FLOW-06 — original-photographed fabric optical response, HOLD.
 * The photo colour, mask, source-projected texture sampler, UV/panel
 * coordinates, shader source, 163-bone skin and original garment geometry
 * are immutable. A bounded matte textile roughness adjustment allows the
 * existing ACTUAL skinned triangle surface normals and 3D fabric folds to
 * catch more grazing light. This is not a generated fabric texture, print
 * substitution, fake painted wrinkle or claim of measured fibre optics.
 */
export function calibratePhotoClothLight(shirt,{enabled=false}={}){
 if(!enabled)return {enabled:false,materialCount:0,releaseAuthorized:false,dispose(){}};
 if(!shirt?.stats?.sourceMeasuredNaturalSleeveHang||
    !shirt?.stats?.naturalSourceShoulderSleeveTransition)
  throw Error('F06 accepts only original independently skinned photographed 3D55 shirt');
 const meshes=shirt.meshes.filter(m=>m.isSkinnedMesh&&m.userData.work56Garment);
 if(!meshes.length||!meshes.some(m=>m.name==='Work56-independent-shirt-shell'))
  throw Error('F06 original independent sewn skinned source shell missing');
 const map=new Map();
 for(const mesh of meshes)for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material]){
  if(map.has(material))continue;
  if(!material?.isMeshStandardMaterial||typeof material.onBeforeCompile!=='function')
   throw Error('F06 original source-projected MeshStandardMaterial shader required');
  if(!Number.isFinite(material.roughness)||material.roughness<.70||material.roughness>1||
     Math.abs(material.metalness)>1e-10)
   throw Error('F06 missing physically matte source cloth baseline');
  if(material.map||material.normalMap||material.roughnessMap)
   throw Error('F06 cannot replace original source shader with speculative garment maps');
  const original={roughness:material.roughness,metalness:material.metalness,
   color:material.color.clone(),shader:material.onBeforeCompile,
   side:material.side,sourcePhotoMaterialUUID:material.uuid};
  map.set(material,original);
 }
 if(!map.size)throw Error('F06 no original photographed garment material');
 let activated=false;
 try{
  for(const [material,old] of map){
   // Material changes only: original uPhoto, source RGBA, original
   // shader code, geometric normals and all skin weights are retained.
   // Cotton-like matte response (.80) rather than the nearly unlit
   // baseline (.94); actual source fabric identity is NOT classified.
   material.roughness=Math.max(.78,Math.min(.82,old.roughness-.14));
   material.needsUpdate=true;
  }
  activated=true;
 }finally{
  if(!activated)for(const [m,o] of map)m.roughness=o.roughness;
 }
 const provenance=[...map].map(([m,o])=>({
  originalMaterialUUID:o.sourcePhotoMaterialUUID,
  originalRoughness:o.roughness,reviewRoughness:m.roughness,
  originalShaderUnchanged:m.onBeforeCompile===o.shader,
  originalRGBAndColorUnchanged:m.color.equals(o.color),
  originalMetalnessUnchanged:m.metalness===o.metalness,
  originalUVAndSkinUnchanged:true,sourceProjectedPhotoSamplerRetained:true
 }));
 const report={enabled:true,materialCount:map.size,provenance,
  boundedMatteSurfaceResponse:true,realGarmentGeometryAndNormalsUsed:true,
  originalPhotoAndSkinUnmodified:true,newTexturesOrFabricPatterns:0,
  clothMaterialSourceMeasured:false,independentHumanApproval:false,
  physicalPhoneApproved:false,releaseAuthorized:false};
 return {...report,dispose(){
  for(const [m,o] of map){m.roughness=o.roughness;m.needsUpdate=true;}
  map.clear();
 }};
}
