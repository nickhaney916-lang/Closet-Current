/** Disposable STATIC research A/B only. Reaudits current real source pose,
 * retains original geometry/skin/rest/material, restores visibility on cleanup.
 * Not installed in consumer code; not an animated skinned fitted garment.
 */
import * as THREE from 'three';
import {auditActualPhotographedDressSurfaces52} from '../mission2-source-length/actual-photo-contact-52.mjs';
export function createRadialPreview86(root,dress){
 const started=performance.now();
 if(globalThis.location?.hostname!=='127.0.0.1'&&globalThis.location?.hostname!=='localhost')throw Error('local research only');
 const audit=auditActualPhotographedDressSurfaces52({root,dress,
  refineTriangleDistances53:true,refineSourceTopology54:true,refineEdgeWinding55:true,
  refineBoundaryComponents56:true,refineAnatomicalLoopLandmarks57:true,
  refineArticulatedContacts58:true,refineBodyHeightWitnessBands59:true,
  refineUpperTorsoFitTrial60:true,refineSurfaceStrain61:true});
 const a=audit.originalArticulatedContactReceipt58;
 const trials=[a.disposableNeutralUpperTorsoTrial60,...a.disposableArticulatedUpperTorsoTrials60];
 if(trials.length!==3||trials.some(t=>t.sourceGlobalRadialScreen86?.rows?.find(x=>x.scale===1.025)?.sampledNumericalClearance!==true))throw Error('all sampled pose numerical gates required');
 const source=dress.mesh,meshes=dress.meshes;
 if(!source?.isSkinnedMesh||!meshes.includes(source))throw Error('exact source dress surface required');
 const parent=root.parent;if(!parent)throw Error('source scene parent required');
 root.updateMatrixWorld(true);
 const spine=source.skeleton.bones.find(b=>b.name==='spine04');if(!spine)throw Error('real spine required');
 const center=spine.getWorldPosition(new THREE.Vector3()),inverse=parent.matrixWorld.clone().invert();
 const sourceSnapshots=meshes.flatMap(mesh=>[...Object.values(mesh.geometry.attributes),...(mesh.geometry.index?[mesh.geometry.index]:[])].map(attribute=>({attribute,bytes:new Uint8Array(attribute.array.buffer,attribute.array.byteOffset,attribute.array.byteLength).slice()})));
 const verifySource=()=>{for(const {attribute,bytes} of sourceSnapshots){const current=new Uint8Array(attribute.array.buffer,attribute.array.byteOffset,attribute.array.byteLength);if(current.length!==bytes.length||!current.every((v,i)=>v===bytes[i]))throw Error('original source buffer changed');}};
 const copies=[];
 for(const original of meshes){
 original.updateWorldMatrix(true,false);original.skeleton.update();
 const geometry=original.geometry.clone(),position=geometry.getAttribute('position'),v=new THREE.Vector3();
 for(let i=0;i<position.count;i++){
  v.fromBufferAttribute(original.geometry.getAttribute('position'),i);
  original.applyBoneTransform(i,v);v.applyMatrix4(original.matrixWorld);
  v.x=center.x+(v.x-center.x)*1.025;v.z=center.z+(v.z-center.z)*1.025;
  v.applyMatrix4(inverse);position.setXYZ(i,v.x,v.y,v.z);
 }
 position.needsUpdate=true;geometry.computeVertexNormals();
 const material=original.material.clone();material.onBeforeCompile=original.material.onBeforeCompile;
 material.customProgramCacheKey=()=>original.material.customProgramCacheKey();
 const clone=new THREE.Mesh(geometry,material);clone.name='P86-static-source-radial-preview';
 clone.visible=false;parent.add(clone);copies.push({original,clone,geometry,material,wasVisible:original.visible});
 }
 let disposed=false;
 const clear=()=>{disposed=true;for(const c of copies){c.original.visible=c.wasVisible;c.clone.removeFromParent();c.geometry.dispose();c.material.dispose();}};
 const ensure=()=>{if(disposed)throw Error('preview disposed');try{verifySource();}catch(e){clear();throw e;}};
 const receipt={sourceTriangles:audit.originalSourceFaces,scale:1.025,
  sampledPoseNumericalClearance:true,staticSnapshotOnly:true,sourceImageUnchanged:true,
  sourceSHA256:dress.stats.sourceSHA256,
  sampledPoseResults:trials.map((t,pose)=>({pose,baselineBodyWitnesses:t.baselineOriginalBodyStrictCrossings,
   selected:t.sourceGlobalRadialScreen86.rows.find(x=>x.scale===1.025)})),
  constructionAndReauditMs:performance.now()-started,
  sourceRestAndSkinUnmodified:true,sourceBufferByteSnapshotsChecked:true,openingRimCollisionSeparatelyVerified:false,continuousAnimationVerified:false,
  humanVisualApproved:false,consumer3DAdmitted:false,releaseAuthorized:false,familyAlpha:'HOLD'};
 return Object.freeze({receipt,
  original(){ensure();for(const c of copies){c.original.visible=c.wasVisible;c.clone.visible=false;}},
  candidate(){ensure();for(const c of copies){c.original.visible=false;c.clone.visible=true;}},
  dispose(){if(disposed)return;try{verifySource();}finally{clear();}}
 });
}
