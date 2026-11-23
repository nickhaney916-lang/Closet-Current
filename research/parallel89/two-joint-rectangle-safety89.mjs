/**
 * Mission 2 independent dual-spine 2D joint-angle rectangular envelope.
 * RESEARCH ONLY: all vertex/grid input must be separately authenticated in
 * the original licensed rig by a native caller; SHA-shaped strings are not
 * independent original-source proof.
 *
 * For true two-joint fixed-axis LBS, each coordinate has the tensor basis
 * [1,cos(a),sin(a)] x [1,cos(b),sin(b]. Grid interpolation plus a global
 * derivative bound encloses every angle pair inside each rectangular cell.
 * This is NOT body fit, physically measured clothing or wearable 3D.
 */
const finite = v => typeof v === 'number' && Number.isFinite(v);
const safe = v => Number.isSafeInteger(v) && v > 0;
const rad = v => v*Math.PI/180;
const basis = a => [1,Math.cos(a),Math.sin(a)];
const deny = (decision, extra={}) => ({
  decision,...extra,arbitraryTwoAngleOriginalRectanglePhysicalFitCertified:false,
  cameraAndGarmentPhysicalScaleVerified:false,
  originalObservedGarmentReverseAvailable:false,
  verifiedActualClothMaterialAndDrape:false,
  sourceOriginalPhoto2DFallbackRequired:true,
  consumer3DAdmitted:false,familyAlpha:'HOLD'
});
const fit = (low,mid,high,angle) => {
  const cc=((high+low)/2-mid)/(Math.cos(angle)-1);
  const ss=(high-low)/(2*Math.sin(angle));
  return [mid-cc,cc,ss];
};
const overlap=(a,b)=>a[0]<=b[3]&&b[0]<=a[3]&&
  a[1]<=b[4]&&b[1]<=a[4]&&a[2]<=b[5]&&b[2]<=a[5];
const box = () => [Infinity,Infinity,Infinity,-Infinity,-Infinity,-Infinity];
function union(t,s){for(let k=0;k<3;k++){
  t[k]=Math.min(t[k],s[k]);t[k+3]=Math.max(t[k+3],s[k+3]);
}}
function faceBox(vertexBoxes,indices,f){
  const b=box();for(let t=0;t<3;t++)union(b,vertexBoxes[indices[3*f+t]]);
  return b;
}
function area2(pos,inds,f){
  const [i,j,k]=[inds[3*f],inds[3*f+1],inds[3*f+2]],
   A=[pos[i*3],pos[i*3+1],pos[i*3+2]],
   B=[pos[j*3],pos[j*3+1],pos[j*3+2]],
   C=[pos[k*3],pos[k*3+1],pos[k*3+2]],
   u=B.map((x,l)=>x-A[l]),v=C.map((x,l)=>x-A[l]);
  return Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],
   u[0]*v[1]-u[1]*v[0]);
}
/** All-source-surface, all-(a,b) static-envelope exclusion; NOT fitted 3D. */
export function evaluateTwoJointOriginalRectangle({
 frontGridPoses,bodyGridPoses,independentOffDiagonalHoldouts,
 frontIndices,bodyIndices,expectedFrontFaces,expectedBodyFaces,
 sourceWitness,subdivisions=2,maxTotalFaces=200000,
 maxTotalVertices=250000,maxBVHVisits=8000000,
 maxLeafTests=2000000
}={}){
 const shapes=[frontGridPoses,bodyGridPoses];
 if(!shapes.every(grid=>Array.isArray(grid)&&grid.length===9&&
   grid[0]?.length>0&&grid[0].length%3===0&&
   grid.every(p=>p?.length===grid[0].length)) ||
  !frontIndices||!bodyIndices||!safe(expectedFrontFaces)||
  !safe(expectedBodyFaces)||!safe(maxTotalFaces)||!safe(maxTotalVertices)||
  !safe(maxBVHVisits)||!safe(maxLeafTests)||
  !safe(subdivisions)||subdivisions>8)
  return deny('BLOCKED_UNSAFE_OR_INCOMPLETE_RECTANGLE_INPUT');
 const nf=frontIndices.length/3,nb=bodyIndices.length/3,
  vf=frontGridPoses[0].length/3,vb=bodyGridPoses[0].length/3;
 if(!Number.isSafeInteger(nf)||!Number.isSafeInteger(nb)||
  nf!==expectedFrontFaces||nb!==expectedBodyFaces)
  return deny('BLOCKED_INCOMPLETE_ORIGINAL_INDEXED_SCOPE',{nf,nb});
 if(nf+nb>maxTotalFaces||vf+vb>maxTotalVertices)
  return deny('BLOCKED_RECTANGLE_RESOURCE_SCOPE',{nf,nb,vf,vb});
 if(!sourceWitness||sourceWitness.actualRigBoneCount!==163||
  sourceWitness.simultaneousMovingNamedBones?.length!==2||
  sourceWitness.simultaneousMovingNamedBones?.[0]!=='spine03'||
  sourceWitness.simultaneousMovingNamedBones?.[1]!=='spine04'||
  sourceWitness.other161BoneLocalTransformsFrozen!==true||
  sourceWitness.sourceCoordinatesReadFromOriginalPositionAttribute!==true||
  sourceWitness.independentOriginalSourceJointPoses!==true||
  sourceWitness.originalSourceSkinnedMesh!==true||
  !/^[a-f0-9]{64}$/.test(sourceWitness.originalJPEG_SHA256||'')||
  !/^[a-f0-9]{64}$/.test(sourceWitness.actualLicensedRigSHA256||''))
  return deny('BLOCKED_ORIGINAL_RIG_PROVENANCE_UNVERIFIED');
 for(const [inds,count,grid] of [[frontIndices,vf,frontGridPoses],
  [bodyIndices,vb,bodyGridPoses]]){
  for(const id of inds)
   if(!Number.isSafeInteger(id)||id<0||id>=count)
    return deny('BLOCKED_ORIGINAL_TRIANGLE_INDEX_INVALID');
  for(const positions of grid){
   for(const v of positions)
    if(!finite(v))return deny('BLOCKED_NONFINITE_ORIGINAL_POSITION');
   for(let i=0;i<inds.length/3;i++){
    const area=area2(positions,inds,i);
    if(!finite(area)||area<=1e-12)
     return deny('BLOCKED_DEGENERATE_ORIGINAL_GRID_TRIANGLE');
   }
  }
 }
 if(!Array.isArray(independentOffDiagonalHoldouts)||
   independentOffDiagonalHoldouts.length!==2||
   !independentOffDiagonalHoldouts.every((h,i)=>
    h?.anglesDeg?.length===2&&
    h.anglesDeg[0]===[-3,3][i]&&h.anglesDeg[1]===[6,-6][i]&&
    h.frontVertices?.length===vf*3&&h.bodyVertices?.length===vb*3))
  return deny('BLOCKED_MISSING_INDEPENDENT_OFF_DIAGONAL_WITNESS');
 const cells=[];
 for(let ai=0;ai<subdivisions;ai++)for(let bi=0;bi<subdivisions;bi++){
  const a0=rad(-6+12*ai/subdivisions),a1=rad(-6+12*(ai+1)/subdivisions);
  const b0=rad(-12+24*bi/subdivisions),b1=rad(-12+24*(bi+1)/subdivisions);
  cells.push({a:(a0+a1)/2,b:(b0+b1)/2,
   da:(a1-a0)/2,db:(b1-b0)/2});
 }
 let maxResidual=0,maxInflation=0;
 function vertexBoxes(grid,kind){
  const output=cells.map(()=>Array.from({length:grid[0].length/3},()=>box()));
  for(let coord=0;coord<grid[0].length;coord++){
   const raw=grid.map(p=>p[coord]);
   const al=Array.from({length:3},()=>new Array(3));
   for(let j=0;j<3;j++){
    const c=fit(raw[j],raw[3+j],raw[6+j],rad(6));
    for(let i=0;i<3;i++)al[i][j]=c[i];
   }
   const C=new Array(9);
   for(let i=0;i<3;i++){
    const c=fit(al[i][0],al[i][1],al[i][2],rad(12));
    for(let j=0;j<3;j++)C[i*3+j]=c[j];
   }
   if(!C.every(finite))return null;
   const predict=(a,b)=>{
    const A=basis(a),B=basis(b);let z=0;
    for(let i=0;i<3;i++)for(let j=0;j<3;j++)z+=C[i*3+j]*A[i]*B[j];
    return z;
   };
   for(let i=0;i<2;i++){
    const h=independentOffDiagonalHoldouts[i];
    const real=h[kind][coord];
    if(!finite(real))return null;
    const e=Math.abs(real-predict(rad(h.anglesDeg[0]),rad(h.anglesDeg[1])));
    if(!finite(e))return null;
    maxResidual=Math.max(maxResidual,e);
   }
   // Global partial-derivative Lipschitz bounds: |sin|,|cos| <= 1.
   // Includes the mixed tensor coefficients omitted by one-joint-only guards.
   let La=0,Lb=0;
   for(let i=0;i<3;i++)for(let j=0;j<3;j++){
    if(i>0)La+=Math.abs(C[i*3+j]);
    if(j>0)Lb+=Math.abs(C[i*3+j]);
   }
   const vertex=Math.floor(coord/3),component=coord%3;
   for(let ci=0;ci<cells.length;ci++){
    const cell=cells[ci],pred=predict(cell.a,cell.b),
     inflate=La*cell.da+Lb*cell.db+1e-4;
    if(!finite(pred)||!finite(inflate))return null;
    maxInflation=Math.max(maxInflation,inflate);
    output[ci][vertex][component]=pred-inflate;
    output[ci][vertex][component+3]=pred+inflate;
   }
  }
  return output;
 }
 const fb=vertexBoxes(frontGridPoses,'frontVertices'),
  bb=vertexBoxes(bodyGridPoses,'bodyVertices');
 if(!fb||!bb)return deny('BLOCKED_NONFINITE_TWO_JOINT_TENSOR_OR_BOUND');
 const common={sourceWitnessIsSelfReportedNotIndependentNativeAuthentication:true,
  originalFullFrontFaces:nf,originalFullBodyFaces:nb,
  originalFullFrontVertices:vf,originalFullBodyVertices:vb,
  verifiedOffDiagonalMaxResidualRigUnits:maxResidual,
  conservativeMaxCellInflationRigUnits:maxInflation,
  angleDomainDeg:{spine03:[-6,6],spine04:[-12,12]},
  cells:cells.length,entireTwoAngleRectangleIncluded:true,
  realOriginalGarmentFrontFloatingAndUncalibrated:true};
 if(maxResidual>1e-5)
  return deny('BLOCKED_NON_LBS_OR_INVALID_OFF_DIAGONAL_ORIGINAL_POSE',common);
 let visits=0,leafTests=0;
 const build=(ids,low,high,boxes)=>{
  const bounds=box();for(let k=low;k<high;k++)union(bounds,boxes[ids[k]]);
  if(high-low<=12)return {bounds,ids,low,high};
  let axis=0;if(bounds[4]-bounds[1]>bounds[3]-bounds[0])axis=1;
  if(bounds[5]-bounds[2]>bounds[axis+3]-bounds[axis])axis=2;
  const sorted=ids.slice(low,high);
  sorted.sort((x,y)=>(boxes[x][axis]+boxes[x][axis+3])-
   (boxes[y][axis]+boxes[y][axis+3]));
  for(let k=0;k<sorted.length;k++)ids[low+k]=sorted[k];
  const mid=(low+high)>>1;
  return {bounds,left:build(ids,low,mid,boxes),right:build(ids,mid,high,boxes)};
 };
 for(let ci=0;ci<cells.length;ci++){
  const F=Array.from({length:nf},(_,i)=>faceBox(fb[ci],frontIndices,i)),
   B=Array.from({length:nb},(_,i)=>faceBox(bb[ci],bodyIndices,i)),
   ids=Array.from({length:nb},(_,i)=>i),root=build(ids,0,nb,B);
  for(let fi=0;fi<nf;fi++){
   const stack=[root];
   while(stack.length){
    const node=stack.pop();visits++;
    if(visits>maxBVHVisits)
     return deny('BLOCKED_RECTANGLE_BVH_VISIT_LIMIT',{
      ...common,visits,leafTests,lastCell:ci});
    if(!overlap(F[fi],node.bounds))continue;
    if(node.left){stack.push(node.left,node.right);continue;}
    for(let j=node.low;j<node.high;j++){
     leafTests++;
     if(leafTests>maxLeafTests)
      return deny('BLOCKED_RECTANGLE_FACE_PAIR_LIMIT',{
       ...common,visits,leafTests,lastCell:ci});
     if(overlap(F[fi],B[node.ids[j]]))
      return deny('BLOCKED_UNRESOLVED_ORIGINAL_TWO_ANGLE_RECTANGLE_ENVELOPE_OVERLAP',{
       ...common,visits,leafTests,originalWitness:{
        frontFace:fi,bodyFace:node.ids[j],cell:ci}});
    }
   }
  }
 }
 return deny('RESEARCH_ONLY_WHOLE_TWO_ANGLE_RECTANGLE_AABB_SEPARATION',{
  ...common,visits,leafTests,entireOriginalFaceBroadphaseCompleted:true,
  verifiedClothBodyFit:false,sourcePhoto2DFallbackRequired:true});
}
