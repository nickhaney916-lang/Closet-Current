/** Principal in-plane stretch of authentic source triangles. UV identity alone
 * does not establish texel fidelity: geometry can shear unchanged UVs.
 * Inputs are same-topology world-space snapshots; no garment writes.
 */
export function measurePrincipalStretch86({original,candidate,indices,originalUV=null,candidateUV=null}={}){
 if(!(original instanceof Float32Array)||!(candidate instanceof Float32Array)||
  original.length!==candidate.length||original.length%3||original.length<9||
  ![original,candidate].every(a=>a.every(Number.isFinite)))throw Error('finite matching source positions required');
 const count=original.length/3;
 if(!(indices instanceof Uint16Array||indices instanceof Uint32Array)||!indices.length||indices.length%3||
  indices.length>300000||indices.some(i=>i>=count))throw Error('complete valid triangle indices required');
 const hasUV=originalUV!==null||candidateUV!==null;
 if(hasUV&&(!(originalUV instanceof Float32Array)||!(candidateUV instanceof Float32Array)||
  originalUV.length!==count*2||candidateUV.length!==count*2||
  ![originalUV,candidateUV].every(a=>a.every(Number.isFinite))))throw Error('complete finite source UV required');
 const uvPreserved=hasUV?BufferlessEqual(originalUV,candidateUV):null;
 let maxStretch=0,minStretch=Infinity,degenerate=0,over5=0,maxAnisotropy=1;
 for(let f=0;f<indices.length;f+=3){
  const [a,b,c]=Array.from(indices.slice(f,f+3));
  const gram=p=>{const e=[0,1,2].map(k=>p[b*3+k]-p[a*3+k]),v=[0,1,2].map(k=>p[c*3+k]-p[a*3+k]);
   const dot=(x,y)=>x.reduce((s,n,i)=>s+n*y[i],0);return [dot(e,e),dot(e,v),dot(v,v)];};
  const [a0,b0,c0]=gram(original),[a1,b1,c1]=gram(candidate);
  const det=a0*c0-b0*b0,det1=a1*c1-b1*b1;
  if(det<=1e-24||det1<=1e-24){degenerate++;continue;}
  // Generalized eigenvalues of G1 v = lambda G0 v.
  const trace=(c0*a1+a0*c1-2*b0*b1)/det,product=det1/det;
  const disc=Math.sqrt(Math.max(0,trace*trace-4*product));
  const hi=Math.sqrt(Math.max(0,(trace+disc)/2));
  // Product form avoids cancellation in the smaller eigenvalue.
  const lo=Math.sqrt(product)/hi;
  if(![hi,lo].every(Number.isFinite)||lo<=0){degenerate++;continue;}
  maxStretch=Math.max(maxStretch,hi);minStretch=Math.min(minStretch,lo);
  maxAnisotropy=Math.max(maxAnisotropy,hi/lo);
  if(hi>1.05+1e-7||lo<.95-1e-7)over5++;
 }
 return Object.freeze({triangles:indices.length/3,degenerateTriangles:degenerate,
  maxPrincipalStretch:degenerate===indices.length/3?null:maxStretch,minPrincipalStretch:degenerate===indices.length/3?null:minStretch,maxAnisotropy,
  trianglesOver5PercentPrincipalStrain:over5,sourceUVBytesPreserved:uvPreserved,photoProjectionMeasured:false,
  provisionalTextureMetricPassed:uvPreserved===true&&degenerate===0&&over5===0,
  photoPixelsVerified:false,collisionVerified:false,releaseAuthorized:false,familyAlpha:'HOLD'});
}
function BufferlessEqual(a,b){
 const x=new Uint8Array(a.buffer,a.byteOffset,a.byteLength),y=new Uint8Array(b.buffer,b.byteOffset,b.byteLength);
 return x.every((v,i)=>v===y[i]);
}
