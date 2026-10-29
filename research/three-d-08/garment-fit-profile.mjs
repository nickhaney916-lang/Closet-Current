/** Reusable rest-space fitting primitives. No image edits or body mutation. */
import * as T from 'three';
export function originalPhotoSpan(image,crop,height=.57){
 const w=image?.naturalWidth||image?.width,h=image?.naturalHeight||image?.height;
 if(!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0||!Array.isArray(crop)||crop.length!==4||crop[2]<=0||crop[3]<=0)throw Error('Decoded source image dimensions required');
 return Object.freeze({height,width:height*(crop[2]*w)/(crop[3]*h),imageWidth:w,imageHeight:h,sourcePixelsRescaled:false});
}
export function deriveTorsoEnvelope(root){
 let front=-Infinity,back=Infinity;
 root.traverse(o=>{if(!o.isSkinnedMesh||o.userData.work56Garment)return;const a=o.geometry.attributes.position;
  for(let i=0;i<a.count;i++){const p=new T.Vector3().fromBufferAttribute(a,i).applyMatrix4(o.matrixWorld);
   if(Math.abs(p.x)<.22&&p.y>1.20&&p.y<1.53){front=Math.max(front,p.z);back=Math.min(back,p.z);}
  }
 });
 if(!Number.isFinite(front)||!Number.isFinite(back)||front<=back)throw Error('Anatomical torso envelope unavailable');
 return Object.freeze({front:front+.045,back:back-.025,center:(front+back)/2,minimumClearance:.018,measurementFit:false});
}
export function roundedNeckBoundary(p,neckHeight,centerZ){
 const center=1-T.MathUtils.smoothstep(Math.abs(p.x),.065,.13);
 const front=T.MathUtils.smoothstep(p.z,centerZ-.015,centerZ+.015);
 return neckHeight-.028-center*(.014+.041*front)-p.y;
}
export function drapeTorso(q,p,n,envelope){
 const central=1-T.MathUtils.smoothstep(Math.abs(p.x),.10,.23);
 const vertical=T.MathUtils.smoothstep(p.y,1.10,1.16)*(1-T.MathUtils.smoothstep(p.y,1.51,1.61));
 const front=T.MathUtils.smoothstep(n.z,.05,.35)*T.MathUtils.smoothstep(p.z,envelope.center-.015,envelope.center+.015);
 // A broad hanging front replaces the female bust/waist concavity without
 // moving the actual body. Envelope only expands the offset shell outward.
 const desired=envelope.front-.012*Math.pow(Math.min(Math.abs(p.x)/.23,1),2);
 q.z=T.MathUtils.lerp(q.z,Math.max(q.z,desired),central*vertical*front);
 const side=T.MathUtils.smoothstep(Math.abs(n.x),.35,.85)*vertical;
 const width=Math.max(Math.abs(q.x),.205);
 q.x=T.MathUtils.lerp(q.x,Math.sign(p.x)*width,side);
 return q;
}
export function smoothSurfaceNormals(geometry,surfaceVertices){
 const p=geometry.attributes.position,n=geometry.attributes.normal,groups=new Map();
 for(let i=0;i<surfaceVertices;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>v.toFixed(5)).join(',');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(i);}
 for(const ids of groups.values()){const v=new T.Vector3();for(const i of ids)v.add(new T.Vector3().fromBufferAttribute(n,i));if(v.lengthSq()<1e-10)continue;v.normalize();for(const i of ids)n.setXYZ(i,v.x,v.y,v.z);}
 n.needsUpdate=true;
}
