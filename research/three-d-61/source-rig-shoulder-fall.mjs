/** 3D-61 — source-rigged, seam-locked shoulder-to-sleeve gravity ease.
 * Reduces the visually padded horizontal shoulder shelf on actual original
 * skinned, licensed photographic shirt material. Research only; default OFF.
 * No synthesized garment photo, UV edits, source color changes, new body,
 * paid inference, or assertion of continuous cloth physics.
 */
import * as THREE from 'three';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';

const sm = THREE.MathUtils.smoothstep;
const stamp = q => q.toArray().map(v => v.toFixed(5)).join(':');
const preserve = ['panelPosition','panelNormal','skinIndex','skinWeight','uv'];

export function easePhotographedShoulderFall(shirt, root, {enabled=true}={}) {
 if (!enabled) return shirt;
 if (!shirt?.stats?.measuredNaturalShirtSideFlow ||
     !shirt?.stats?.naturalSourceShoulderSleeveTransition ||
     !shirt?.stats?.sourceMeasuredNaturalSleeveHang ||
     !shirt?.stats?.independentArmholeCapPanels)
   throw Error('3D61 requires original photo, anatomical fitted shirt and physically separate sewn shoulders');
 root.updateMatrixWorld(true);
 const joints = {};
 root.traverse(o => {
   if (o.isBone && ['upperarm01L','upperarm01R'].includes(o.name))
     joints[o.name.endsWith('L')?'L':'R'] = o.getWorldPosition(new THREE.Vector3());
 });
 if (!joints.L || !joints.R || Math.sign(joints.L.x) === Math.sign(joints.R.x))
   throw Error('3D61 missing bilateral original 163-joint anatomical shoulder bones');

 const meshes = shirt.meshes.filter(m => m.isSkinnedMesh &&
   (m.name === 'Work56-independent-shirt-shell' || m.userData.work45IndependentShoulderCap));
 if (!meshes.some(m => m.userData.work45IndependentShoulderCap === 'L') ||
     !meshes.some(m => m.userData.work45IndependentShoulderCap === 'R') ||
     !meshes.some(m => m.name === 'Work56-independent-shirt-shell'))
   throw Error('3D61 requires real original source independently sewn cap and torso geometry');
 const snapshots = new Map(), groups = new Map();
 let originalCenterProtected = 0;
 for (const mesh of meshes) {
   mesh.updateWorldMatrix(true,false);
   const geo=mesh.geometry, p=geo.getAttribute('position'), ix=geo.index;
   if (!p || !ix || ix.count < 3) throw Error('3D61 requires real indexed skinned garment triangles');
   const raw = new Map();
   for (const name of preserve) {
     const attr = geo.getAttribute(name);
     if (name === 'uv' && !attr) continue;
     if (!attr || attr.count !== p.count)
       throw Error('3D61 original source photo or anatomical skin attribute missing '+name);
     raw.set(name, attr.array.slice());
   }
   snapshots.set(mesh,raw);
   const used = new Set();
   for(let j=0;j<ix.count;j++){
     const i=ix.getX(j);
     if(!Number.isInteger(i)||i<0||i>=p.count)throw Error('3D61 invalid original garment face index');
     used.add(i);
   }
   for (const i of used) {
     const q=new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);
     if(![q.x,q.y,q.z].every(Number.isFinite))
       throw Error('3D61 nonfinite original skinned garment position');
     if(Math.abs(q.x)<.315)originalCenterProtected++;
     const id=stamp(q);
     if(!groups.has(id))groups.set(id,{q,refs:[]});
     groups.get(id).refs.push({mesh,i});
   }
 }
 const sides={L:{moved:0,caps:0,shells:0,maxMove:0,sourceBoneY:joints.L.y},
   R:{moved:0,caps:0,shells:0,maxMove:0,sourceBoneY:joints.R.y}};
 let moved=0,maxMove=0,shared={L:0,R:0},seamGap=0,protectedCount=0;
 for (const {q,refs} of groups.values()) {
   const x=Math.abs(q.x),side=Math.sign(q.x)===Math.sign(joints.L.x)?'L':'R';
   const isCap=refs.some(({mesh}) => !!mesh.userData.work45IndependentShoulderCap);
   const isTorso=refs.some(({mesh}) => mesh.name==='Work56-independent-shirt-shell');
   if(isCap&&isTorso)shared[side]++;
   // Shoulder yoke, not printed chest, neck trim, cuff or outer sleeve.
   if(x<=.315||x>=.615){protectedCount+=refs.length;continue;}
   const dy=q.y-joints[side].y;
   const across=sm(x,.315,.405)*(1-sm(x,.535,.615));
   const band=sm(dy,-.41,-.275)*(1-sm(dy,.045,.145));
   const weight=across*band;
   if(weight<.075)continue;
   // The original source bone determines the upper-arm drape start. A small
   // gravity drop with a soft outward-to-inward taper avoids a horizontal
   // foam shoulder shelf without inventing dimensions or a garment back.
   const high=Math.max(0,dy+.25);
   const drop=(.0045+Math.min(.0105,high*.045))*weight;
   const pull=.0038*weight;
   const delta=new THREE.Vector3(-Math.sign(q.x)*pull,-drop,0);
   const length=delta.length();
   if(length<.0005)continue;
   if(!Number.isFinite(length)||length>.01601)
     throw Error('3D61 original-source shoulder adjustment outside bounded 16mm fabric envelope');
   const target=q.clone().add(delta);
   for(const {mesh,i} of refs) {
     const local=target.clone().applyMatrix4(mesh.matrixWorld.clone().invert());
     mesh.geometry.getAttribute('position').setXYZ(i,local.x,local.y,local.z);
     moved++;
     const stats=sides[side];stats.moved++;
     if(mesh.userData.work45IndependentShoulderCap)stats.caps++;else stats.shells++;
     stats.maxMove=Math.max(stats.maxMove,length);
   }
   maxMove=Math.max(maxMove,length);
 }
 for(const {refs} of groups.values()) {
   if(new Set(refs.map(r=>r.mesh)).size<2)continue;
   const pts=refs.map(({mesh,i})=>new THREE.Vector3().fromBufferAttribute(
     mesh.geometry.getAttribute('position'),i).applyMatrix4(mesh.matrixWorld));
   for(const point of pts.slice(1))seamGap=Math.max(seamGap,point.distanceTo(pts[0]));
 }
 for(const mesh of meshes) {
   const g=mesh.geometry,p=g.getAttribute('position');
   p.needsUpdate=true;g.computeVertexNormals();smoothSurfaceNormals(g,p.count);
   g.computeBoundingBox();g.computeBoundingSphere();
   for(const [name,old] of snapshots.get(mesh)){
     const now=g.getAttribute(name)?.array;
     if(!now||old.length!==now.length||!now.every((v,i)=>v===old[i]))
       throw Error('3D61 changed immutable original photographic panel/UV or skinned body weights: '+name);
   }
 }
 if(moved<20||maxMove<.002||maxMove>.01601||originalCenterProtected<100||
    !Number.isFinite(seamGap)||seamGap>5e-5||
    ['L','R'].some(side=>sides[side].caps<5||sides[side].shells<5||shared[side]<3))
   throw Error('3D61 actual bilateral sewn source shoulder fall unverified '+JSON.stringify(
     {moved,maxMove,originalCenterProtected,protectedCount,shared,seamGap,sides}));
 return {...shirt,stats:{...shirt.stats,
    sourceRigNaturalShoulderFall:true,
    shoulderFallRealVertices:moved,
    shoulderFallMaximumWorldMove:maxMove,
    shoulderFallBySide:sides,
    shoulderFallSharedSeamWitnesses:shared,
    shoulderFallSeamGap:seamGap,
    shoulderFallProtectedCenterPhotoVertices:originalCenterProtected,
    shoulderFallMethod:'true original upper-arm source bones, indexed sewn cap/torso shared-vertex easing, original photograph and skin untouched',
    shoulderFallOriginalPhotoUVSkinUnchanged:true,
    shoulderFallNoFabricBackInvented:true,
    shoulderFallContinuousClothPhysicsApproved:false,
    shoulderFallHumanVisualApproved:false,
    releaseAuthorized:false
 }};
}
