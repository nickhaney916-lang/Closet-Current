import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';
import {trialCategoryRigAlignment89 as trial} from '../research/parallel89/category-rig-alignment89.mjs';
import {auditCategoryStaticContact89 as audit,realTriangleContactControl89 as control} from '../research/parallel89/category-static-body-contact89.mjs';
import {approachCategoryBody89 as approach} from '../research/parallel89/category-near-body-placement89.mjs';
import {auditCategoryTwoJointPose89 as motion,blendCategoryTwoJoint89 as move} from '../research/parallel89/category-two-joint-motion89.mjs';
import {limitCategoryJointStrain89 as limit} from '../research/parallel89/category-strain-limited-motion89.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const donor=resolve(process.argv[2]??'.'),here=resolve('.');
assert.notEqual(donor,here);
const engine=process.env.P89_BROWSER;assert.ok(['chromium','webkit'].includes(engine));
const hashes={female:'a571a5872a5f9d75c013ce6d88b3484436cf2109bf133fbc31e42c41f52389f1',male:'d15a07e2b4cf1d08a3b91cb212a9a06a91438077f05a3f2a62f45351e8a71eb8'};
const rigs=Object.fromEntries(Object.keys(hashes).map(kind=>[kind,readFileSync(resolve(donor,'research/three-d-06/models',kind+'-cc0-rigged.glb'))]));
for(const [k,b] of Object.entries(rigs))assert.equal(sha(b),hashes[k]);
const server=createServer((req,res)=>{
 try{
  const p=new URL(req.url,'http://127.0.0.1').pathname;
  res.setHeader('Cache-Control','no-store');
  if(p==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><script type="importmap">{"imports":{"three":"/node_modules/three/build/three.module.js","three/addons/":"/node_modules/three/examples/jsm/"}}</script>');return}
  const k=/^\/rig\/(female|male)$/.exec(p);
  if(k){res.setHeader('Content-Type','model/gltf-binary');res.end(rigs[k[1]]);return}
  if(p.startsWith('/node_modules/three/')&&!p.includes('..')&&p.endsWith('.js')){res.setHeader('Content-Type','text/javascript');res.end(readFileSync(resolve(here,p.slice(1))));return}
  throw Error('not allowed');
 }catch{res.writeHead(404);res.end('not found')}
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port;
let browser;const rows=[],external=[],errors=[];
try{
 browser=await ({chromium,webkit})[engine].launch({headless:true});
 const page=await browser.newPage();
 page.on('request',r=>{if(/^https?:/i.test(r.url())&&!r.url().startsWith(origin+'/'))external.push(r.url())});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin);
 const registry=JSON.parse(readFileSync(new URL('../benchmark/locked-photo-sources.json',import.meta.url)));
 for(const [kind,rigBytes] of Object.entries(rigs)){
  const b=await page.evaluate(async ({kind,expected})=>{
   const THREE=await import('three'),{GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js');
   const bytes=await (await fetch('/rig/'+kind)).arrayBuffer();
   const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
   if(digest!==expected)throw Error('actual rig byte hash mismatch');
   const {scene}=await new GLTFLoader().parseAsync(bytes,'/rig/');
   scene.updateMatrixWorld(true);
   const meshes=[];scene.traverse(m=>{if(m.isSkinnedMesh)meshes.push(m)});
   if(!meshes.length||meshes.some(m=>m.skeleton.bones.length!==163))throw Error('original rig bone count invalid');
   // Original world matrices may inherit nonuniform scale. A rigid
   // attachment uses the origin and an explicitly orthonormalized frame,
   // not a raw affine delta that could stretch the source garment.
   function rigidFrame(m){
    const e=m.elements,x=new THREE.Vector3(e[0],e[1],e[2]),y=new THREE.Vector3(e[4],e[5],e[6]),z0=new THREE.Vector3(e[8],e[9],e[10]);
    if(x.length()<1e-9||y.length()<1e-9||z0.length()<1e-9)throw Error('degenerate original joint frame');
    x.normalize();y.addScaledVector(x,-y.dot(x));
    if(y.length()<1e-9)throw Error('collinear original joint frame');
    y.normalize();const z=new THREE.Vector3().crossVectors(x,y);
    if(z.dot(z0)<=0)throw Error('reflected original joint frame');
    return new THREE.Matrix4().makeBasis(x,y,z).setPosition(new THREE.Vector3(e[12],e[13],e[14]));
   }
   function rigidityResidual(m){
    const e=m.elements,v=[new THREE.Vector3(e[0],e[1],e[2]),new THREE.Vector3(e[4],e[5],e[6]),new THREE.Vector3(e[8],e[9],e[10])];
    return Math.max(...v.flatMap((a,i)=>v.map((b,j)=>Math.abs(a.dot(b)-(i===j?1:0)))));
   }
   const anchors=[...new Set(meshes.flatMap(m=>m.skeleton.bones.filter(x=>x.name.replaceAll('.','')==='spine04')))];
   if(anchors.length!==1)throw Error('unique real spine04 anchor required');
   const anchor=anchors[0],lowerBones=[...new Set(meshes.flatMap(m=>m.skeleton.bones.filter(x=>x.name.replaceAll('.','')==='spine03')))];
   if(lowerBones.length!==1)throw Error('unique real spine03 required');
   const lower=lowerBones[0],restQ=anchor.quaternion.clone(),lowerQ=lower.quaternion.clone(),inverse=rigidFrame(anchor.matrixWorld).invert(),lowerInverse=rigidFrame(lower.matrixWorld).invert(),rawInverse=anchor.matrixWorld.clone().invert(),rawLowerInverse=lower.matrixWorld.clone().invert();
   const originalBones=[...new Set(meshes.flatMap(m=>m.skeleton.bones))].map(b=>({b,p:b.position.clone(),q:b.quaternion.clone(),s:b.scale.clone()}));
   function extract(){
    const positions=[],indices=[];
    for(const m of meshes){
     m.skeleton.update();m.updateWorldMatrix(true,false);
     const p=m.geometry.getAttribute('position'),idx=m.geometry.getIndex(),offset=positions.length/3;
     if(!p||p.count<3)throw Error('original rig position absent');
     for(let i=0;i<p.count;i++){const v=new THREE.Vector3().fromBufferAttribute(p,i);m.applyBoneTransform(i,v);v.applyMatrix4(m.matrixWorld);positions.push(v.x,v.y,v.z)}
     for(let i=0;i<(idx?.count??p.count);i++)indices.push(offset+(idx?idx.getX(i):i));
    }
    if(indices.length%3||!positions.every(Number.isFinite))throw Error('incomplete real body');
    return {positions,indices};
   }
   const rest=extract(),poses=[];
   for(const angle of [-12,0,12]){
    lower.quaternion.copy(lowerQ);lower.rotateZ(-angle*.5*Math.PI/180);anchor.quaternion.copy(restQ);anchor.rotateZ(angle*Math.PI/180);scene.updateMatrixWorld(true);
    const posed=extract();
    if(posed.indices.length!==rest.indices.length||posed.indices.some((x,i)=>x!==rest.indices[i]))throw Error('rig topology changed');
    if(originalBones.some(({b,p,q,s})=>!b.position.equals(p)||!b.scale.equals(s)||(b!==anchor&&b!==lower&&!b.quaternion.equals(q))))throw Error('unexpected rig transform');
    const raw=anchor.matrixWorld.clone().multiply(rawInverse),rawLower=lower.matrixWorld.clone().multiply(rawLowerInverse),delta=rigidFrame(anchor.matrixWorld).multiply(inverse).toArray();
    poses.push({angle,positions:posed.positions,upperDelta:delta,lowerDelta:rigidFrame(lower.matrixWorld).multiply(lowerInverse).toArray(),rawRigidityResidual:Math.max(rigidityResidual(raw),rigidityResidual(rawLower))});
   }
   anchor.quaternion.copy(restQ);lower.quaternion.copy(lowerQ);scene.updateMatrixWorld(true);
   const restored=extract();
   if(restored.positions.some((v,i)=>v!==rest.positions[i]))throw Error('rig rest restoration failed');
   return {...rest,poses,digest};
  },{kind,expected:hashes[kind]});
  assert.equal(b.digest,hashes[kind]);assert.ok(b.indices.length/3>50000);
  const bodyPositions=new Float64Array(b.positions),bodyIndices=new Uint32Array(b.indices);
  const maxZ=bodyPositions.reduce((m,v,i)=>i%3===2?Math.max(m,v):m,-Infinity);
  for(const id of ['commons-0001','commons-0003','commons-0016','commons-0023','commons-0041','commons-0053']){
   const originalBytes=readFileSync(new URL('../benchmark/fixtures/'+id+'.jpg',import.meta.url)),originalSHA=sha(originalBytes);
   const r=await trial({sourceId:id,originalBytes,lockedRecord:registry.find(x=>x.id===id),rigKind:kind,rigBytes});
   assert.equal(r.status,'LICENSED_RIG_LANDMARK_PLACEMENT_TRIAL_ONLY');
   const t=r.sourceVolume.topology,sourcePositions=t.positions,sourceIndices=t.indices;
   const input={bodyPositions,bodyIndices,sourcePositions,sourceIndices,scale:r.placement.scale,translation:r.placement.translation,sourcePlaneIndexCount:r.sourceVolume.sourcePlane.indices.length};
   const originalPositions=sourcePositions.slice(),originalIndices=sourceIndices.slice();
   const near=approach(input);assert.equal(near.status,'CONSERVATIVE_CAMERA_AXIS_APPROACH_RESEARCH_ONLY');
   const checks=[];
   const base={...input,translation:near.translation};
   const rest=move({...base,lowerDelta:b.poses[1].lowerDelta,upperDelta:b.poses[1].upperDelta}).posed;
   for(const pose of b.poses){
    const x=motion({...base,bodyPositions:new Float64Array(pose.positions),lowerDelta:pose.lowerDelta,upperDelta:pose.upperDelta});
    assert.equal(x.status,'TWO_JOINT_DEFORMATION_RESEARCH_ONLY');
    assert.equal(x.consumer3DAdmitted,false);assert.equal(x.anatomicalWeightsVerified,false);
    assert.ok(x.mixedVertices>0);assert.ok(x.weights.every(w=>w>=0&&w<=1));
    assert.ok(Number.isFinite(x.maxEdgeStrain)&&Number.isFinite(x.minAreaRatio));
    assert.equal(x.strainVeto,x.degenerateEdges>0||x.maxEdgeStrain>.05||x.minAreaRatio<.5);
    if(x.strainVeto)assert.equal(x.decision,'BLOCKED_DEFORMATION_STRAIN');
    let maxDisplacement=0;
    for(let i=0;i<rest.length;i+=3)maxDisplacement=Math.max(maxDisplacement,Math.hypot(...[0,1,2].map(k=>x.posed[i+k]-rest[i+k])));
    if(pose.angle===0){assert.ok(maxDisplacement<1e-9);assert.ok(x.maxEdgeStrain<1e-8);}
    else assert.ok(maxDisplacement>1e-4);
    const limited=limit({...base,bodyPositions:new Float64Array(pose.positions),lowerDelta:pose.lowerDelta,upperDelta:pose.upperDelta});
    assert.equal(limited.consumer3DAdmitted,false);assert.equal(limited.baselineStrainVeto,x.strainVeto);
    assert.equal(limited.baselineStrain,x.maxEdgeStrain);
    if(limited.status==='STRAIN_LIMITED_DISCRETE_RESEARCH_ONLY'){
     assert.ok(limited.influence>0&&limited.influence<=1);
     assert.ok(limited.maxEdgeStrain<=.05&&limited.minAreaRatio>=.5&&limited.degenerateEdges===0);
     assert.equal(limited.contact.status,'NO_DISCRETE_SURFACE_CONTACT_DETECTED');
     if(pose.angle!==0)assert.ok(limited.differentialDisplacement>1e-6);
     if(x.strainVeto)assert.ok(limited.influence<1&&limited.maxEdgeStrain<x.maxEdgeStrain);
     if(pose.angle===0)assert.equal(limited.influence,1);
    }else assert.equal(limited.status,'BLOCKED_NO_STRAIN_AND_CONTACT_CLEAR_CANDIDATE');
    const limitedReceipt={status:limited.status,influence:limited.influence??null,strain:limited.maxEdgeStrain??null,areaRatio:limited.minAreaRatio??null,contact:limited.contact?.status??null,differentialDisplacement:limited.differentialDisplacement??null,attempts:limited.attempts};
    checks.push({limited:limitedReceipt,angle:pose.angle,rawRigidityResidual:pose.rawRigidityResidual,maxDisplacement,mixedVertices:x.mixedVertices,maxEdgeStrain:x.maxEdgeStrain,minAreaRatio:x.minAreaRatio,strainVeto:x.strainVeto,decision:x.decision,contact:x.contact.status,bodyFaces:x.contact.bodyFacesSubmitted,garmentFaces:x.contact.garmentFacesSubmitted});
   }
   assert.deepEqual(sourcePositions,originalPositions);assert.deepEqual(sourceIndices,originalIndices);
   assert.equal(sha(originalBytes),originalSHA);assert.equal(sha(rigBytes),hashes[kind]);
   assert.throws(()=>move({...base,upperDelta:b.poses[1].upperDelta,lowerDelta:[2,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}),/not-rigid/);
   rows.push({id,kind,originalSHA,rigSHA:hashes[kind],checks,consumer3DAdmitted:false});
   console.log('STRAIN_LIMITED_ROW '+JSON.stringify(rows.at(-1)));
  }
 }
 assert.equal(rows.length,12);assert.equal(rows.flatMap(r=>r.checks).length,36);assert.ok(rows.some(r=>r.checks.some(c=>c.strainVeto&&c.limited.status==='STRAIN_LIMITED_DISCRETE_RESEARCH_ONLY')),'at least one actual strain veto must recover');assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
 const report={engine,rows,actualRigBytesVerified:true,originalPhoto2DFallbackRequired:true,physicalFitProved:false,consumer3DAdmitted:false,familyAlpha:'HOLD'};
 mkdirSync('benchmark/m2-category-strain-limited-motion-HOLD',{recursive:true});writeFileSync('benchmark/m2-category-strain-limited-motion-HOLD/'+engine+'.json',JSON.stringify(report,null,2));
}finally{await browser?.close();await new Promise(ok=>server.close(ok))}
