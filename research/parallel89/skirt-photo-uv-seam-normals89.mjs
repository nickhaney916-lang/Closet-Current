/**
 * P89 source-photo skinned skirt research: render-normal UV split continuity.
 *
 * The ring's j=0 and j=48 vertices represent the same source rest/location,
 * but are duplicated to preserve garment UV/skin identity. THREE computes
 * independent per-vertex normals and can leave a spurious lighting stripe.
 * We only average the two shading normals, NOT positions, skin, UV, triangles,
 * source photo, physical seams, body clearance, or unreconstructed rear.
 */
const finite=Number.isFinite;
const dist=(a,b,o1,o2,n)=>{
 let s=0;for(let i=0;i<n;i++){const d=a[o1+i]-b[o2+i];s+=d*d;}
 return Math.sqrt(s);
};
const fail=msg=>{throw Error('P89-photo-UV-seam-normal: '+msg);};
export function smoothOriginalPhotoSkirtUVSeamNormals89({
 positions,sourceRest,uv,skinIndex,skinWeight,normals,
 rows=7,segments=48
}={}){
 const count=rows*(segments+1);
 if(rows!==7||segments!==48||
  !(positions instanceof Float32Array)||positions.length!==count*3||
  !(sourceRest instanceof Float32Array)||sourceRest.length!==count*3||
  !(uv instanceof Float32Array)||uv.length!==count*2||
  !(skinIndex instanceof Uint16Array)||skinIndex.length!==count*4||
  !(skinWeight instanceof Float32Array)||skinWeight.length!==count*4||
  !(normals instanceof Float32Array)||normals.length!==count*3)
  fail('authentic-343-vertex-source-skirt-attribute-shapes-required');
 // Validate the complete modest research fixture, not just the seam rows,
 // so unobserved corrupted source or normal arrays cannot be silently accepted.
 for(const a of [positions,sourceRest,uv,skinWeight,normals])
  for(const value of a)if(!finite(value)||Math.abs(value)>20)
   fail('source-attributes-or-render-normal-nonfinite-or-unbounded');
 let beforeMax=0,afterMax=0,correctedPairs=0;
 // Validate all observations FIRST. Never partially rewrite shader normals
 // on a later failure; only one explicit commit stage touches the normal array.
 const staged=[];
 for(let row=0;row<rows;row++){
  const a=row*(segments+1),b=a+segments;
  if(dist(positions,positions,3*a,3*b,3)>2e-5||
   dist(sourceRest,sourceRest,3*a,3*b,3)>2e-5||
   dist(uv,uv,2*a,2*b,2)>2e-5||
   dist(skinWeight,skinWeight,4*a,4*b,4)>1e-6)
   fail('photo-skirt-UV-seam-vertex-rest-position-or-weight-mismatch');
  for(let k=0;k<4;k++)if(skinIndex[4*a+k]!==skinIndex[4*b+k])
   fail('photo-skirt-UV-seam-vertex-skin-binding-mismatch');
  const na=[normals[3*a],normals[3*a+1],normals[3*a+2]],
   nb=[normals[3*b],normals[3*b+1],normals[3*b+2]],
   la=Math.hypot(...na),lb=Math.hypot(...nb),
   dot=na.reduce((s,n,i)=>s+n*nb[i],0);
  if(la<.5||lb<.5||Math.abs(la-1)>.12||Math.abs(lb-1)>.12||
   dot/(la*lb)<.3)
   fail('unreliable-or-opposing-source-skirt-UV-seam-normals');
  const sum=na.map((n,i)=>n+nb[i]),len=Math.hypot(...sum);
  if(!finite(len)||len<.5)fail('UV-seam-smoothing-degenerate');
  const combined=sum.map(n=>Math.fround(n/len));
  const mismatch=Math.hypot(...na.map((n,i)=>n-nb[i]));
  beforeMax=Math.max(beforeMax,mismatch);
  if(mismatch>1e-6)correctedPairs++;
  staged.push([a,b,combined]);
 }
 for(const [a,b,n] of staged){
  for(let k=0;k<3;k++)normals[3*a+k]=normals[3*b+k]=n[k];
  afterMax=Math.max(afterMax,dist(normals,normals,3*a,3*b,3));
 }
 if(afterMax!==0)fail('original-UV-seam-lighting-continuity-not-achieved');
 return Object.freeze({
  schema:'P89-original-photo-skirt-UV-split-render-normals/v1',
  status:'RESEARCH_343_SOURCE_VERTICES_SEAM_SHADING_CONTINUOUS',
  inspectedUVSeamVertexPairs:rows,
  correctedUVSeamVertexPairs:correctedPairs,
  maximumOriginalSeamNormalMismatch:Number(beforeMax.toPrecision(7)),
  maximumPostSmoothingSeamNormalMismatch:afterMax,
  sourcePositionsUVSkinRestAndTriangleIndicesUntouched:true,
  originalPhotoAndSourceGeometryUnchanged:true,
  neutralRearNotActualPhotograph:true,
  physicalClosureAndDrapeStillUnverified:true,
  consumer3DAdmitted:false,releaseAuthorized:false,
  originalPhoto2DFallbackRequired:true,familyAlpha:'HOLD'
 });
}
