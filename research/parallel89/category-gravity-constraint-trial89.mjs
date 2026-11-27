/** Nonmetric pinned-edge gravity-inspired relaxation of a research shell.
 * This is not a calibrated fabric solver, sewn garment, or wearable fit.
 * Only a separate posed copy is modified. All candidate vetoes stay active.
 */
import {auditCategoryStaticContact89} from './category-static-body-contact89.mjs';
import {auditCategorySelfContact89} from './category-self-contact-bending89.mjs';
import {auditSharedEdgeFoldover89} from './category-adjacent-hinge-foldover89.mjs';
const hold={consumer3DAdmitted:false,physicalFitProved:false,clothDrapeProved:false,materialParametersMeasured:false,continuousMotionProved:false,originalPhoto2DFallbackRequired:true,familyAlpha:'HOLD',releaseAuthorized:false};
export function trialGravityRelaxation89(input){
 const {posed,restPositions,sourceIndices:idx}=input;
 if(!(posed instanceof Float64Array)||posed.length<9||posed.length%3||posed.length/3>200000||!posed.every(Number.isFinite)||!(idx instanceof Uint32Array)||idx.length<3||idx.length%3||idx.length/3>150000||idx.some(i=>i>=posed.length/3))throw Error('invalid-gravity-trial-geometry');
 if(!(restPositions instanceof Float64Array)||restPositions.length!==posed.length||!restPositions.every(Number.isFinite))throw Error('invalid-gravity-trial-rest-geometry');
 const n=posed.length/3,edges=[],seen=new Set(),inv=new Float64Array(n);
 let lo=Infinity,hi=-Infinity;
 for(let i=1;i<posed.length;i+=3){lo=Math.min(lo,posed[i]);hi=Math.max(hi,posed[i]);}
 const height=hi-lo;if(!(height>1e-6))throw Error('invalid-shell-height');
 let pinned=0;
 for(let i=0;i<n;i++){inv[i]=posed[i*3+1]>=hi-.15*height?0:1;if(!inv[i])pinned++;}
 if(!pinned||pinned===n)throw Error('missing-pinned-or-free-region');
 const distance=(p,a,b)=>Math.hypot(p[a*3]-p[b*3],p[a*3+1]-p[b*3+1],p[a*3+2]-p[b*3+2]);
 for(let i=0;i<idx.length;i+=3)for(let j=0;j<3;j++){
  let a=idx[i+j],b=idx[i+(j+1)%3];if(a>b)[a,b]=[b,a];
  const key=a+':'+b;if(seen.has(key))continue;seen.add(key);
  const d=distance(posed,a,b);if(!(d>1e-12))throw Error('degenerate-rest-edge');
  const original=distance(restPositions,a,b);
  if(!(original>1e-12))throw Error('degenerate-original-edge');
  edges.push([a,b,d,original]);
 }
 const attempts=[];
 for(const load of [.002,.001,.0005]){
  const p=posed.slice();
  // Four deterministic load increments and six full edge-projection sweeps
  // per increment. Unitless downward displacement, no metric gravity claim.
  for(let step=0;step<4;step++){
   for(let i=0;i<n;i++)if(inv[i])p[3*i+1]-=height*load;
   for(let iter=0;iter<6;iter++)for(const [a,b,rest] of edges){
    const wa=inv[a],wb=inv[b];if(!(wa+wb))continue;
    const d=distance(p,a,b);if(!(d>1e-12))throw Error('degenerate-relaxed-edge');
    const factor=(d-rest)/(d*(wa+wb));
    for(let k=0;k<3;k++){const delta=(p[3*b+k]-p[3*a+k])*factor;p[3*a+k]+=wa*delta;p[3*b+k]-=wb*delta;}
   }
  }
  let strain=0,combinedStrain=0,maxMove=0,freeDrop=0,minAreaRatio=Infinity,combinedMinAreaRatio=Infinity;
  for(const [a,b,posedLength,restLength] of edges){
   const length=distance(p,a,b);
   strain=Math.max(strain,Math.abs(length/posedLength-1));
   combinedStrain=Math.max(combinedStrain,Math.abs(length/restLength-1));
  }
  const area=(q,a,b,c)=>{const x=q[3*b]-q[3*a],y=q[3*b+1]-q[3*a+1],z=q[3*b+2]-q[3*a+2],u=q[3*c]-q[3*a],v=q[3*c+1]-q[3*a+1],w=q[3*c+2]-q[3*a+2];return Math.hypot(y*w-z*v,z*u-x*w,x*v-y*u);};
  for(let i=0;i<idx.length;i+=3){
   const [a,b,c]=idx.subarray(i,i+3);
   const relaxedArea=area(p,a,b,c),posedArea=area(posed,a,b,c),restArea=area(restPositions,a,b,c);
   minAreaRatio=Math.min(minAreaRatio,posedArea>1e-18?relaxedArea/posedArea:0);
   combinedMinAreaRatio=Math.min(combinedMinAreaRatio,restArea>1e-18?relaxedArea/restArea:0);
  }
  for(let i=0;i<n;i++){
   const dx=p[3*i]-posed[3*i],dy=p[3*i+1]-posed[3*i+1],dz=p[3*i+2]-posed[3*i+2];
   if(!inv[i]&&(dx!==0||dy!==0||dz!==0))throw Error('pinned-source-vertex-moved');
   maxMove=Math.max(maxMove,Math.hypot(dx,dy,dz));if(inv[i])freeDrop=Math.max(freeDrop,-dy);
  }
  const a={load,strain,minAreaRatio,combinedStrain,combinedMinAreaRatio,maxMove,freeDrop};attempts.push(a);
  if(!p.every(Number.isFinite)||strain>.05||minAreaRatio<.5||maxMove>.02*height||freeDrop<=height*1e-6)continue;
  // Articulation and relaxation share one strain budget measured from rest.
  if(!Number.isFinite(combinedStrain)||!Number.isFinite(combinedMinAreaRatio)||combinedStrain>.05||combinedMinAreaRatio<.5){
   a.decision='BLOCKED_COMBINED_STRAIN';
   continue;
  }
  const body=auditCategoryStaticContact89({...input,sourcePositions:p,scale:1,translation:[0,0,0]});
  a.bodyStatus=body.status;if(body.status!=='NO_DISCRETE_SURFACE_CONTACT_DETECTED')continue;
  const self=auditCategorySelfContact89({rest:posed,posed:p,indices:idx});
  a.selfStatus=self.status;if(self.status!=='NO_NONLOCAL_SELF_CONTACT_DETECTED')continue;
  const hinge=auditSharedEdgeFoldover89({positions:p,indices:idx});
  a.hingeStatus=hinge.status;if(hinge.status!=='NO_SHARED_EDGE_FOLDOVER_DETECTED')continue;
  return {status:'PINNED_GRAVITY_RELAXATION_RESEARCH_ONLY',positions:p,pinnedVertices:pinned,freeVertices:n-pinned,height,edgeCount:edges.length,attempts,selected:a,sourceGeometryUnmodified:true,...hold};
 }
 return {status:'GRAVITY_RELAXATION_BLOCKED',pinnedVertices:pinned,freeVertices:n-pinned,height,edgeCount:edges.length,attempts,sourceGeometryUnmodified:true,...hold};
}
