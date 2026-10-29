/** Body-section tailoring and actual open armholes. No source-image or body mutation. */
import * as T from 'three';
function weldNormals(g){
 const p=g.attributes.position,n=g.attributes.normal,groups=new Map();
 for(let i=0;i<p.count;i++){const k=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>Math.round(v*1e5)).join(',');if(!groups.has(k))groups.set(k,[]);groups.get(k).push(i);}
 for(const ids of groups.values()){const normal=new T.Vector3();for(const i of ids)normal.add(new T.Vector3().fromBufferAttribute(n,i));if(normal.lengthSq()<1e-12)continue;normal.normalize();for(const i of ids)n.setXYZ(i,...normal.toArray());}n.needsUpdate=true;
}
const point=(m,i)=>new T.Vector3().fromBufferAttribute(m.geometry.attributes.position,i).applyMatrix4(m.matrixWorld);
export function anatomicalSections(root){
 root.updateMatrixWorld(true);const triangles=[],bones=new Map();
 root.traverse(m=>{
  if(m.isBone)bones.set(m.name,m.getWorldPosition(new T.Vector3()));
  if(!m.isSkinnedMesh||m.userData.work56Garment)return;
  const g=m.geometry,p=g.attributes.position;
  for(let i=0;i<(g.index?.count||p.count);i+=3){const v=[0,1,2].map(k=>point(m,g.index?g.index.getX(i+k):i+k));triangles.push({v,low:Math.min(...v.map(p=>p.y)),high:Math.max(...v.map(p=>p.y))});}
 });
 const waist=bones.get('spine04'),neck=bones.get('neck01'),shoulders=['L','R'].map(s=>bones.get('upperarm01'+s));
 if(!waist||!neck||shoulders.some(p=>!p)||triangles.length<1000)throw Error('Original anatomical torso and shoulder landmarks required');
 const cache=new Map();
 function section(y){
  const key=y.toFixed(6);if(cache.has(key))return cache.get(key);
  const edges=[];
  for(const {v,low,high}of triangles){if(y<low||y>high)continue;const hits=[];
   for(let k=0;k<3;k++){const a=v[k],b=v[(k+1)%3];if((a.y<=y&&b.y>y)||(b.y<=y&&a.y>y))hits.push(a.clone().lerp(b,(y-a.y)/(b.y-a.y)));}
   if(hits.length===2)edges.push(hits);
  }
  if(edges.length<10)throw Error('Missing original torso section');cache.set(key,edges);return edges;
 }
 function radius(y,angle){
  const edges=section(y),axisHits=[];
  for(const [a,b]of edges){if((a.x<=waist.x&&b.x>waist.x)||(b.x<=waist.x&&a.x>waist.x))axisHits.push(T.MathUtils.lerp(a.z,b.z,(waist.x-a.x)/(b.x-a.x)));}
  if(axisHits.length<2)throw Error('Missing original sagittal torso section');
  const origin=new T.Vector3(waist.x,y,(Math.min(...axisHits)+Math.max(...axisHits))/2),dx=Math.sin(angle),dz=Math.cos(angle);let nearest=Infinity;
  for(const [a,b]of edges){
   const ex=b.x-a.x,ez=b.z-a.z,den=dx*ez-dz*ex;if(Math.abs(den)<1e-12)continue;
   const ax=a.x-origin.x,az=a.z-origin.z,t=(ax*ez-az*ex)/den,u=(ax*dz-az*dx)/den;
   if(t>.008&&u>=-1e-7&&u<=1.0000001)nearest=Math.min(nearest,t);
  }
  if(!Number.isFinite(nearest)||nearest>.6)throw Error('Original body ray does not reach torso at '+y+' / '+angle);
  return {origin,radius:nearest};
 }
 return {waist,neck,shoulders,radius};
}
export function fitAnatomicalDress(dress,root,{enabled=true}={}){
 if(enabled===false)return dress;
 if(enabled!==true||!dress?.mesh?.isSkinnedMesh||dress.stats?.sourceId!=='commons-0053'||dress.stats.physicalFrontNeckline!==true||dress.stats.releaseAuthorized!==false)throw Error('Reviewed PR427 dress with physical neckline required');
 const m=dress.mesh,g=m.geometry,rows=dress.stats.ringCount,stride=g.attributes.position.count/rows,segments=stride-1;
 if(rows!==9||!Number.isInteger(segments)||segments<24||segments>96)throw Error('Unexpected original dress topology');
 m.updateWorldMatrix(true,false);const inv=m.matrixWorld.clone().invert(),body=anatomicalSections(root),verts=[],indices=[];
 const original=(r,j)=>{const i=r*stride+j;return {p:point(m,i),rest:new T.Vector3().fromBufferAttribute(g.attributes.dressRest,i),skin:Array.from({length:4},(_,k)=>g.attributes.skinIndex.array[i*4+k]),weights:Array.from({length:4},(_,k)=>g.attributes.skinWeight.array[i*4+k])};};
 const interpolate=(a,b,t)=>({p:a.p.clone().lerp(b.p,t),rest:a.rest.clone().lerp(b.rest,t),skin:a.skin.slice(),weights:a.weights.map((w,k)=>w*(1-t)+b.weights[k]*t)});
 const dense=[],subdivisions=4;let largest=0;
 for(let row=0;row<(rows-1)*subdivisions+1;row++){
  const r=Math.min(rows-2,Math.floor(row/subdivisions)),t=row/subdivisions-r,out=[];
  for(let j=0;j<=segments;j++){
   const v=interpolate(original(r,j),original(r+1,j),t),before=v.p.clone(),angle=j*2*Math.PI/segments;
   // Preserve the approved V-shaped opening height profile exactly. Its X/Z
   // attachment follows the same original-body sections as the shoulders.
   {
    const y=v.p.y,hipY=body.waist.y-.025;
    const slice=body.radius(Math.max(hipY,y),angle);
    let radius=slice.radius+.018;
    if(y<hipY){const hem=original(0,j).p.y,t=T.MathUtils.clamp((hipY-y)/(hipY-hem),0,1);radius+=.095*Math.pow(t,1.35);}
    const target=new T.Vector3(slice.origin.x+Math.sin(angle)*radius,y,slice.origin.z+Math.cos(angle)*radius);
    v.p.copy(target);
   }
   largest=Math.max(largest,v.p.distanceTo(before));v.angle=angle;out.push(v);
  }dense.push(out);
 }
 // Clip true side openings out of the continuous dress. The ellipse follows
 // actual shoulder height; no fabric caps remain across the upper arm.
 const hole=v=>{
  const side=Math.sin(v.angle)>=0?0:1,shoulder=body.shoulders[side];
  const top=shoulder.y+.065,bottom=shoulder.y-.19,mid=(top+bottom)/2,height=(top-bottom)/2;
  return (Math.cos(v.angle)/.66)**2+((v.p.y-mid)/height)**2-1;
 };
 const mix=(a,b,t)=>({...interpolate(a,b,t),angle:T.MathUtils.lerp(a.angle,b.angle,t)});
 let removed=0;
 for(let r=0;r<dense.length-1;r++)for(let j=0;j<segments;j++)for(const tri of [[dense[r][j],dense[r][j+1],dense[r+1][j]],[dense[r][j+1],dense[r+1][j+1],dense[r+1][j]]]){
  const poly=[];for(let k=0;k<3;k++){const a=tri[k],b=tri[(k+1)%3],fa=hole(a),fb=hole(b);if(fa>=0)poly.push(a);if((fa>=0)!==(fb>=0))poly.push(mix(a,b,fa/(fa-fb)));}
  if(poly.length!==3||tri.some(v=>hole(v)<0))removed++;
  for(let k=1;k<poly.length-1;k++){const start=verts.length;verts.push(poly[0],poly[k],poly[k+1]);indices.push(start,start+1,start+2);}
 }
 if(removed<20)throw Error('No actual armhole openings created');
 const data={position:[],dressRest:[],skinIndex:[],skinWeight:[]};
 for(const v of verts){data.position.push(...v.p.clone().applyMatrix4(inv).toArray());data.dressRest.push(...v.rest.toArray());data.skinIndex.push(...v.skin);data.skinWeight.push(...v.weights);}
 const geometry=new T.BufferGeometry();for(const name of ['position','dressRest'])geometry.setAttribute(name,new T.Float32BufferAttribute(data[name],3));geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(data.skinIndex,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(data.skinWeight,4));geometry.setIndex(indices);geometry.computeVertexNormals();weldNormals(geometry);geometry.computeBoundingBox();geometry.computeBoundingSphere();
 m.geometry=geometry;
 const dispose=dress.dispose; // Original builder owns material/texture; new buffer is owned here.
 return {...dress,stats:{...dress.stats,anatomicalDress:true,anatomicalSections:true,actualOpenArmholes:true,armholeClippedTriangles:removed,triangles:indices.length/3,ringCount:dense.length,maxDressMovement:largest,necklineProfilePreserved:true,necklinePreservation:'original-Y-drop-and-source-map-XZ-body-fitted',unverifiedRearNecklineUnchanged:false,originalPhotoCoordinatesUnchanged:false,originalPhotoMappingPreserved:true,skinWeightsUnchanged:false,skinWeightsInterpolated:true,photoMapping:'interpolated-original-dressRest',collisionValidated:false,releaseAuthorized:false},dispose(){geometry.dispose();dispose();}};
}
/** Finish only actual boundary edges, including armholes, with neutral 3mm thickness. */
export function finishAnatomicalOpenings(dress){
 const original=dress.mesh,g=original.geometry,p=g.attributes.position,edges=new Map();original.updateWorldMatrix(true,false);
 const key=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(n=>Math.round(n*1e5)).join(',');
 for(let j=0;j<g.index.count;j+=3)for(let k=0;k<3;k++){const a=g.index.getX(j+k),b=g.index.getX(j+(k+1)%3),id=[key(a),key(b)].sort().join('|');const row=edges.get(id);if(row)row.count++;else edges.set(id,{a,b,count:1});}
 const positions=[],rest=[],skin=[],weights=[],idx=[],inverse=original.matrixWorld.clone().invert(),nm=new T.Matrix3().getNormalMatrix(original.matrixWorld);let boundary=0;
 for(const {a,b,count}of edges.values())if(count===1){const start=positions.length/3;boundary++;
  for(const [i,inward]of [[a,false],[b,false],[a,true],[b,true]]){const q=point(original,i);if(inward)q.addScaledVector(new T.Vector3().fromBufferAttribute(g.attributes.normal,i).applyMatrix3(nm).normalize(),-.003);positions.push(...q.applyMatrix4(inverse).toArray());rest.push(0,-99,0);for(let k=0;k<4;k++){skin.push(g.attributes.skinIndex.array[i*4+k]);weights.push(g.attributes.skinWeight.array[i*4+k]);}}
  idx.push(start,start+1,start+2,start+1,start+3,start+2);
 }
 const rim=new T.BufferGeometry();rim.setAttribute('position',new T.Float32BufferAttribute(positions,3));rim.setAttribute('dressRest',new T.Float32BufferAttribute(rest,3));rim.setAttribute('skinIndex',new T.Uint16BufferAttribute(skin,4));rim.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));rim.setIndex(idx);rim.computeVertexNormals();
 const mesh=new T.SkinnedMesh(rim,original.material);mesh.name='3D24-neutral-neck-armhole-hem-rims';mesh.userData.work56Garment=true;mesh.userData.experimentalDress14=true;mesh.position.copy(original.position);mesh.quaternion.copy(original.quaternion);mesh.scale.copy(original.scale);original.parent.add(mesh);mesh.bind(original.skeleton,original.bindMatrix);mesh.frustumCulled=false;
 const dispose=dress.dispose;return {...dress,meshes:[original,mesh],stats:{...dress.stats,openingBoundaryEdges:boundary,edgeRimTriangles:idx.length/3,neutralOpeningThickness:.003,triangles:dress.stats.triangles+idx.length/3},dispose(){mesh.removeFromParent();rim.dispose();dispose();}};
}
