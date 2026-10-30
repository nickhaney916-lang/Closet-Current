/** 3D45: physically distinct skinned shoulder cap panels cut from the genuine
 * independently photographed shirt shell. Source photograph front/UV/rig
 * stays unchanged. No synthetic rear photo, cloth simulation, or collision
 * certification. Zero midpoints are introduced on a panel boundary: this
 * avoids triangle T-junctions against the retained torso and lower sleeve.
 */
import * as T from 'three';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
const clamp=T.MathUtils.clamp,sm=T.MathUtils.smoothstep;
const pkey=p=>p.toArray().map(v=>v.toFixed(5)).join(':');
const edge=(a,b)=>[a,b].sort().join('|');
export function constructIndependentShoulderCaps(shirt,root,{enabled=true}={}){
 if(!enabled)return shirt;
 if(!shirt?.stats?.sourceVerifiedUpperSleeveTailoring||
  !shirt?.stats?.independentRearShirtPattern)throw Error('3D45 requires reviewed original photographed 3D44 tailored shirt');
 root.updateMatrixWorld(true);
 const arms=['L','R'].map(side=>{
  const find=name=>{let b;root.traverse(o=>{if(o.isBone&&o.name===name+side)b=o;});if(!b)throw Error('Original anatomical arm landmark missing: '+name+side);return b.getWorldPosition(new T.Vector3());};
  const shoulder=find('upperarm01'),elbow=find('lowerarm01');
  return {side,shoulder,elbow,axis:elbow.clone().sub(shoulder)};
 });
 const counts={L:{faces:0,edges:0,newVertices:0,panels:0},R:{faces:0,edges:0,newVertices:0,panels:0}};
 let originalFaces=0,retainedFaces=0,addedFaces=0,caps=0;
 const shells=shirt.meshes.filter(m=>m.name==='Work56-independent-shirt-shell');
 if(!shells.length)throw Error('Original photographed garment shell not present');
 // We plan both cap components before modifying any source shirt indices.
 const plans=[];
 for(const shell of shells){
  shell.updateWorldMatrix(true,false);
  const g=shell.geometry,idx=g.index,pos=g.getAttribute('position'),panel=g.getAttribute('panelNormal');
  if(!idx||!pos||!panel||!g.getAttribute('skinIndex')||!g.getAttribute('skinWeight'))throw Error('Original photo and bone attributes missing');
  const world=new Map(),worldAt=i=>{
   if(!world.has(i))world.set(i,new T.Vector3().fromBufferAttribute(pos,i).applyMatrix4(shell.matrixWorld));
   return world.get(i);
  };
  const chosen=new Map(arms.map(a=>[a.side,[]]));
  const excluded=new Set();
  const classify=(ids)=>{
   const c=worldAt(ids[0]).clone().add(worldAt(ids[1])).add(worldAt(ids[2])).multiplyScalar(1/3);
   if(Math.abs(c.x)<.245)return null; // never cut original front chest / torso print
   const arm=arms.find(a=>Math.sign(a.elbow.x)===Math.sign(c.x));
   if(!arm)return null;
   const t=c.clone().sub(arm.shoulder).dot(arm.axis)/arm.axis.lengthSq();
   if(t<.095||t>.58)return null;
   const axisPoint=arm.shoulder.clone().addScaledVector(arm.axis,t),radius=c.distanceTo(axisPoint);
   if(radius<.038||radius>.167)return null;
   // No photographed center-front points or neckline/cuff/hem boundaries.
   if(ids.some(id=>Math.abs(worldAt(id).x)<.227))return null;
   return arm;
  };
  for(let i=0;i<idx.count;i+=3){
   const ids=[idx.getX(i),idx.getX(i+1),idx.getX(i+2)];
   const arm=classify(ids);
   if(arm){chosen.get(arm.side).push({at:i,ids});excluded.add(i);}
  }
  if(excluded.size)plans.push({shell,g,idx,pos,worldAt,chosen,excluded});
 }
 for(const {shell,g,idx,pos,worldAt,chosen,excluded} of plans){
  const keep=[];
  for(let i=0;i<idx.count;i+=3)if(!excluded.has(i))keep.push(idx.getX(i),idx.getX(i+1),idx.getX(i+2));
  originalFaces+=idx.count/3;retainedFaces+=keep.length/3;
  const newCaps=[];
  for(const arm of arms){
   const faces=chosen.get(arm.side);
   if(faces.length<20)continue;
   // The material's photo is sampled from immutable source panel attributes.
   // All cut cap faces are already outside the front chest texture region.
   const allAttr=Object.entries(g.attributes).filter(([name])=>name!=='normal');
   const data=Object.fromEntries(allAttr.map(([name])=>[name,[]]));
   const vertexMap=new Map(),midpointMap=new Map(),edgeFrequency=new Map();
   for(const face of faces)for(let k=0;k<3;k++){
    const a=face.ids[k],b=face.ids[(k+1)%3],id=edge(pkey(worldAt(a)),pkey(worldAt(b)));
    edgeFrequency.set(id,(edgeFrequency.get(id)||0)+1);
   }
   const get=(old)=>{
    if(vertexMap.has(old))return vertexMap.get(old);
    const id=data.position.length/3;vertexMap.set(old,id);
    for(const [name,a] of allAttr)for(let k=0;k<a.itemSize;k++)data[name].push(a.getComponent(old,k));
    return id;
   };
   const mid=(a,b)=>{
    const name=edge(pkey(worldAt(a)),pkey(worldAt(b)));
    if(midpointMap.has(name))return midpointMap.get(name);
    const id=data.position.length/3;
    const q=worldAt(a).clone().lerp(worldAt(b),.5);
    // Internal cut-panel sample: soften a bulky deltoid bulge with a small
    // independent longitudinal fabric shaping term (3 mm maximum). Outer
    // source seam endpoints are EXACT, so both pieces meet without a gap.
    const t=clamp(q.clone().sub(arm.shoulder).dot(arm.axis)/arm.axis.lengthSq(),0,1);
    const c=arm.shoulder.clone().addScaledVector(arm.axis,t),r=q.clone().sub(c);
    const relief=.003*sm(t,.10,.24)*(1-sm(t,.43,.59));
    if(r.length()>.03)q.addScaledVector(r.normalize(),-relief);
    const local=q.applyMatrix4(shell.matrixWorld.clone().invert());
    for(const [name,attribute] of allAttr){
     if(name==='position'){data[name].push(...local.toArray());continue;}
     if(name==='skinIndex'||name==='skinWeight')continue;
     for(let k=0;k<attribute.itemSize;k++)data[name].push(.5*(attribute.getComponent(a,k)+attribute.getComponent(b,k)));
    }
    const weight=new Map();
    for(const orig of [a,b])for(let k=0;k<4;k++){
     const bone=g.getAttribute('skinIndex').getComponent(orig,k);
     const w=g.getAttribute('skinWeight').getComponent(orig,k)*.5;
     weight.set(bone,(weight.get(bone)||0)+w);
    }
    const sorted=[...weight.entries()].sort((a,b)=>b[1]-a[1]).slice(0,4);
    while(sorted.length<4)sorted.push([0,0]);
    const sum=sorted.reduce((s,p)=>s+p[1],0);
    // Truncating a legitimate 5–8 bone weighted midpoint to the original
    // 4 influence skin format can discard small nonzero contributions.
    // Reject only a genuinely empty/non-finite original influence set.
    if(!Number.isFinite(sum)||sum<.01)throw Error('3D45 invalid original cap skin weights');
    data.skinIndex.push(...sorted.map(v=>v[0]));
    data.skinWeight.push(...sorted.map(v=>v[1]/sum));
    midpointMap.set(name,id);
    return id;
   };
   const triangles=[];
   for(const face of faces){
    const [a,b,c]=face.ids.map(get);
    const [oa,ob,oc]=face.ids;
    const e=[
     edgeFrequency.get(edge(pkey(worldAt(oa)),pkey(worldAt(ob))))===2,
     edgeFrequency.get(edge(pkey(worldAt(ob)),pkey(worldAt(oc))))===2,
     edgeFrequency.get(edge(pkey(worldAt(oc)),pkey(worldAt(oa))))===2,
    ];
    const [ab,bc,ca]=e.map((v,k)=>v?mid(face.ids[k],face.ids[(k+1)%3]):null);
    const bits=Number(e[0])+Number(e[1])+Number(e[2]);
    if(bits===0)triangles.push(a,b,c);
    else if(bits===1){
     if(ab!==null)triangles.push(a,ab,c,ab,b,c);
     else if(bc!==null)triangles.push(b,bc,a,bc,c,a);
     else triangles.push(c,ca,b,ca,a,b);
    }else if(bits===2){
     if(ab!==null&&bc!==null)triangles.push(b,bc,ab,a,ab,c,ab,bc,c);
     else if(ab!==null&&ca!==null)triangles.push(a,ab,ca,ab,b,c,ab,c,ca);
     else triangles.push(c,ca,bc,b,bc,a,bc,ca,a);
    }else triangles.push(a,ab,ca,ab,b,bc,ca,bc,c,ab,bc,ca);
   }
   if(midpointMap.size<8||triangles.length/3<=faces.length)continue;
   const pg=new T.BufferGeometry();
   for(const [name,a] of allAttr){
    const arr=new a.array.constructor(data[name]);
    pg.setAttribute(name,new T.BufferAttribute(arr,a.itemSize,a.normalized));
   }
   pg.setIndex(triangles);
   pg.computeVertexNormals();
   smoothSurfaceNormals(pg,pg.getAttribute('position').count);
   pg.computeBoundingBox();pg.computeBoundingSphere();
   const cap=new T.SkinnedMesh(pg,shell.material);
   cap.position.copy(shell.position);cap.quaternion.copy(shell.quaternion);cap.scale.copy(shell.scale);
   cap.name='Work45-independent-shoulder-cap-'+arm.side;
   cap.userData.work56Garment=true;
   cap.userData.work45IndependentShoulderCap=arm.side;
   cap.frustumCulled=false;
   newCaps.push({cap,faces:faces.length,split:midpointMap.size});
   addedFaces+=triangles.length/3;
   const record=counts[arm.side];record.faces+=faces.length;record.edges+=midpointMap.size;record.newVertices+=data.position.length/3;record.panels++;
  }
  if(!newCaps.length)continue;
  g.setIndex(keep);
  g.computeVertexNormals();smoothSurfaceNormals(g,g.getAttribute('position').count);
  g.computeBoundingBox();g.computeBoundingSphere();
  for(const {cap} of newCaps){
   shell.parent.add(cap);cap.bind(shell.skeleton,shell.bindMatrix);
   shirt.meshes.push(cap);caps++;
  }
 }
 if(caps<2||arms.some(a=>counts[a.side].faces<20||counts[a.side].edges<8)||addedFaces<150)
  throw Error('3D45 real independently retessellated bilateral armhole cap unavailable '+JSON.stringify({caps,counts,addedFaces}));
 return {...shirt,stats:{...shirt.stats,
  independentArmholeCapPanels:true,realSeparateSkinnedCapMeshes:caps,
  armholePanelOriginalSourceFaces:counts.L.faces+counts.R.faces,
  armholePanelRetessellatedFaces:addedFaces,
  armholePanelInteriorEdgesSplit:counts.L.edges+counts.R.edges,
  armholePanels:counts,originalShirtPixelsUnchanged:true,
  sourcePanelAttributesInterpolatedForNewNeutralOnly:true,
  originalFrontGarmentPhotoAndUVUnchanged:true,
  independentOriginalBodyRigUnchanged:true,
  originalOpenArmholeSeamVerticesRetained:true,
  actualNewSewnFabricSimulation:false,watertightCollisionCertified:false,
  sweptMotionCollisionCertified:false,humanVisualApproval:false,
  releaseAuthorized:false}};
}
