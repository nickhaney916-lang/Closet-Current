/**
 * Closet Current 3D75: ORIGINAL photographed denim, source-measured spatial
 * fold construction on the independent 163-bone SKINNED trouser surfaces.
 *
 * Static, bounded fold ridges conditioned on original source-pose anatomy,
 * genuine sewn denim side/rear coordinates and true nearest-body triangles.
 * Not cloth dynamics, future-pose contact, scanned reverse photographs,
 * material retexturing, nor production. Explicit research opt-in only.
 * Front pixels, photo source SHA, original alpha/UV/rest + skin stay intact.
 */
import * as THREE from 'three';
import {bodySurface} from '../three-d-20/surface-fit.mjs';
import {smoothSurfaceNormals} from '../three-d-08/garment-fit-profile.mjs';
import {isSourceVerifiedDenimId} from '../three-d-30/reviewed-photo-pants.mjs';

const clamp=THREE.MathUtils.clamp;
const smooth=THREE.MathUtils.smoothstep;
const sourceNames=['pantsRest','pantsSourceUV','pantsSourceFront','skinIndex','skinWeight'];
const stamp=v=>v.toArray().map(n=>n.toFixed(5)).join(':');
const gauss=(x,s)=>Math.exp(-.5*(x/s)**2);
const pct=(values,q)=>{const v=values.slice().sort((a,b)=>a-b);return v[Math.floor(q*(v.length-1))];};
const mix=THREE.MathUtils.lerp;

/** A simple pure seam-coherent research fold profile, NOT an actual fabric solver. */
export function sourceMeasuredFoldField75({y,x,leg,knee,ankle,rearZ,sourceRear,sourceOuter}){
 if(![y,x,leg,knee,ankle,rearZ,sourceRear,sourceOuter].every(Number.isFinite)||
  (leg!==-1&&leg!==1)||knee-ankle<.19||sourceOuter<=0)return 0;
 const f=(y-ankle)/(knee-ankle);
 // Diagonal source-sized folds. At the rear, the transverse knee ridge and
 // calf fold change phase progressively across the measured sewn shell width.
 const across=clamp((Math.abs(x)-sourceOuter*.28)/Math.max(.035,sourceOuter*.65),0,1);
 const diagonal=.24*(across-.43)*leg*Math.sign(x||1);
 const rear=1-smooth(rearZ-sourceRear,.015,.14);
 const kneeRidge=gauss(f-(1.10+diagonal*.42),.105);
 const belowKnee=gauss(f-(.77-diagonal*.34),.12);
 const lowerShin=gauss(f-(.39+diagonal*.25),.11);
 const weight=smooth(f,.08,.22)*(1-smooth(f,1.32,1.46));
 return clamp((.030*kneeRidge+.024*belowKnee+.016*lowerShin)*rear*weight,0,.040);
}

export function constructSourcePhotoDenimFolds75(pants,body,{enabled=true}={}){
 if(!enabled)return pants;
 const mesh=pants?.meshes?.[0],original=mesh?.geometry,position=original?.getAttribute('position');
 if(!mesh?.isSkinnedMesh||pants?.meshes?.length!==1||
  !pants.stats?.sourcePhotographedDenimCalfHang74||
  !pants.stats?.sourcePhotographedDenimRearDrape73||
  !pants.stats?.independentSewnPattern||pants.stats?.photoApplied!==true||
  !isSourceVerifiedDenimId(pants.stats?.sourceId)||
  !/^[a-f0-9]{64}$/.test(pants.stats?.sourceSHA256||'')||
  !body?.isObject3D||!position||position.count<400||
  sourceNames.some(name=>original.getAttribute(name)?.count!==position.count))
  throw Error('3D75 requires genuine source SHA-verified photographed 3D74 sewn denim, never neutral or generic');
 const landmarks=pants.stats.landmarks?.map(l=>({
  hip:new THREE.Vector3(...l.hip),knee:new THREE.Vector3(...l.knee),
  ankle:new THREE.Vector3(...l.ankle)}));
 if(landmarks?.length!==2||landmarks.some(l=>[l.hip,l.knee,l.ankle].some(v=>!v.toArray().every(Number.isFinite))||
  l.hip.y-l.knee.y<.24||l.knee.y-l.ankle.y<.22))
  throw Error('3D75 actual anatomical hip-knee-ankle landmarks missing');
 const snapshots=new Map(sourceNames.map(name=>[name,original.getAttribute(name).array.slice()]));
 body.updateMatrixWorld(true);mesh.updateWorldMatrix(true,false);
 const originalFront=original.getAttribute('pantsSourceFront'),groups=new Map();
 for(let i=0;i<position.count;i++){
  const q=new THREE.Vector3().fromBufferAttribute(position,i).applyMatrix4(mesh.matrixWorld);
  if(!q.toArray().every(Number.isFinite))throw Error('3D75 nonfinite authentic skinned cloth vertex');
  const key=stamp(q);
  if(!groups.has(key))groups.set(key,{q,ids:[],front:0});
  const g=groups.get(key);g.ids.push(i);g.front=Math.max(g.front,originalFront.getX(i));
 }
 const nodes=[...groups.values()],sideOf=q=>q.x>=0?0:1;
 const profiles=landmarks.map((l,side)=>{
  const start=l.ankle.y+.075,end=l.knee.y+.145,rows=[];
  const all=nodes.filter(n=>sideOf(n.q)===side&&n.front<.26);
  for(let y=start;y<end;y+=.028){
   const frac=clamp((y-l.ankle.y)/(l.knee.y-l.ankle.y),0,1);
   const center=mix(l.ankle.x,l.knee.x,frac);
   const sample=all.filter(n=>Math.abs(n.q.y-y)<.04&&Math.abs(n.q.x-center)<.24);
   if(sample.length<10)continue;
   rows.push({y,z:pct(sample.map(n=>n.q.z),.08),
     outside:pct(sample.map(n=>Math.abs(n.q.x-center)),.80)});
  }
  if(rows.length<9)throw Error('3D75 not enough genuine source denim rear cross-sections');
  return {start,end,rows,centerAt:y=>{
   const t=clamp((y-l.ankle.y)/(l.knee.y-l.ankle.y),0,1);
   return mix(l.ankle.x,l.knee.x,t);
  }};
 });
 const at=(rows,y,field)=>{
  if(y<=rows[0].y)return rows[0][field];
  for(let j=1;j<rows.length;j++)if(y<=rows[j].y)
   return mix(rows[j-1][field],rows[j][field],
    clamp((y-rows[j-1].y)/(rows[j].y-rows[j-1].y),0,1));
  return rows.at(-1)[field];
 };
 const geometry=original.clone(),out=geometry.getAttribute('position'),
  inverse=mesh.matrixWorld.clone().invert(),nearest=bodySurface(body);
 const perLeg=[0,0],byBand={knee:0,calf:0,shin:0};
 let moved=0,maxMove=0,frontProtected=0,contactLimited=0,
  beforeNegative=0,afterNegative=0;
 for(const g of nodes){
  if(g.front>=.26){frontProtected+=g.ids.length;continue;}
  const side=sideOf(g.q),l=landmarks[side],p=profiles[side],y=g.q.y;
  if(y<p.start||y>p.end)continue;
  const center=p.centerAt(y),width=Math.abs(g.q.x-center);
  const measured=at(p.rows,y,'z'),outer=at(p.rows,y,'outside');
  // Protect inside crotch and front silhouette; work only on measured genuine
  // rear and original side textile where a neutral reverse already exists.
  if(width>outer+.085)continue;
  const sideFade=1-smooth(width,outer*.83,outer+.085);
  const unphotographed=1-smooth(g.front,.015,.25);
  const ridge=sourceMeasuredFoldField75({
   y,x:g.q.x-center,leg:side===0?1:-1,
   knee:l.knee.y,ankle:l.ankle.y,rearZ:g.q.z,
   sourceRear:measured,sourceOuter:outer});
  let dz=-ridge*sideFade*unphotographed;
  if(Math.abs(dz)<.00018)continue;
  // No unsupported signed contact claim. Never worsen the existing sample
  // against the actual unmodified rig's oriented nearest triangle.
  const hit=nearest(g.q);
  if(!hit?.point||!hit.normal||![...hit.point.toArray(),...hit.normal.toArray()].every(Number.isFinite)){
   geometry.dispose();throw Error('3D75 original human body surface missing');}
  const before=g.q.clone().sub(hit.point).dot(hit.normal);
  if(!Number.isFinite(before)){geometry.dispose();throw Error('3D75 invalid oriented body gap');}
  const floor=Math.min(before,.005);
  if(before+dz*hit.normal.z<floor){
   if(hit.normal.z>1e-8)dz=Math.max(dz,(floor-before)/hit.normal.z);
   else dz=0;
   contactLimited++;
  }
  const after=before+dz*hit.normal.z;
  if(after<floor-.0003){geometry.dispose();throw Error('3D75 worsened source-pose body gap');}
  if(Math.abs(dz)<.00018)continue;
  const local=g.q.clone().add(new THREE.Vector3(0,0,dz)).applyMatrix4(inverse);
  for(const i of g.ids)out.setXYZ(i,local.x,local.y,local.z);
  moved+=g.ids.length;perLeg[side]+=g.ids.length;
  maxMove=Math.max(maxMove,Math.abs(dz));
  const f=(y-l.ankle.y)/(l.knee.y-l.ankle.y);
  if(f>=.92)byBand.knee++;else if(f>=.57)byBand.calf++;else byBand.shin++;
  if(before<0)beforeNegative++;if(after<0)afterNegative++;
 }
 if(moved<100||perLeg.some(n=>n<35)||maxMove<.007||maxMove>.040001||
  frontProtected<100||Object.values(byBand).some(n=>n<10)){
  geometry.dispose();throw Error('3D75 actual source-photographed sewn folds not safely measurable '+
   JSON.stringify({moved,perLeg,maxMove,frontProtected,byBand,contactLimited}));
 }
 out.needsUpdate=true;geometry.computeVertexNormals();smoothSurfaceNormals(geometry,out.count);
 geometry.computeBoundingBox();geometry.computeBoundingSphere();
 for(const name of sourceNames){
  const before=snapshots.get(name),after=geometry.getAttribute(name)?.array;
  if(!after||before.length!==after.length||!after.every((v,i)=>v===before[i])){
   geometry.dispose();throw Error('3D75 changed original JPEG/UV/rest/source-front or 163-bone skin data: '+name);
  }
 }
 mesh.geometry=geometry;let disposed=false;
 return {...pants,stats:{...pants.stats,
  sourcePhotoDenimStructuralFolds75:true,sourcePhotoFoldMethod:
   'source-measured sewn rear cloth knee/shin diagonal ridge field with genuine body nearest triangle clearance; static, no dynamics',
  sourcePhotoFoldMovedVertices:moved,sourcePhotoFoldPerLeg:perLeg,
  sourcePhotoFoldBands:byBand,sourcePhotoFoldMaxWorldMovement:maxMove,
  sourcePhotoFoldSourceStations:profiles.map(p=>p.rows.length),
  sourcePhotoFoldProtectedFrontVertices:frontProtected,
  sourcePhotoFoldOrientedContactLimited:contactLimited,
  sourcePhotoFoldNegativeBefore:beforeNegative,sourcePhotoFoldNegativeAfter:afterNegative,
  originalPhotographicRGBAlphaAndHashUntouched:true,
  originalPhotoUVRestSourceFrontAndSkinUntouched:true,
  originalPhotographicBackInvented:false,
  realClothPhysicsCertified:false,continuousSweptContactCertified:false,
  independentHumanPhotorealismApproved:false,physicalPhoneTested:false,
  releaseAuthorized:false},
  dispose(){if(disposed)return;disposed=true;mesh.geometry=original;geometry.dispose();pants.dispose();}
 };
}
