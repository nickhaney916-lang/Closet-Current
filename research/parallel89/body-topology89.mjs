/**
 * Parallel #89 / HOLD: conservative indexed-edge topology and orientation
 * inventory on the ACTUAL posed anatomical mesh, not a proxy avatar.
 *
 * Even a closed index-edge manifold is NOT signed exterior garment clearance:
 * meshes may have split UV seams, duplicated vertices, open body cavities,
 * multiple components or incorrect winding. No owner data/face coordinates.
 * An unsigned distance >0 does not prove the shirt is outside the body.
 */
const deny=reason=>Object.freeze({
 schema:'P89-original-anatomical-body-index-topology/v1',
 status:'BODY_INDEX_TOPOLOGY_UNVERIFIED',reason,
 signedOutsideBodyCertified:false,meshPhysicalVolumeCertified:false,
 fullContinuousClothContactCertified:false,
 consumer3DAuthorized:false,sourcePhoto2DFallbackRequired:true,
 releaseAuthorized:false,familyAlpha:'HOLD'
});
const valid=n=>Number.isSafeInteger(n)&&n>=0;
const bound=Object.freeze({maxVertices:450000,maxFaces:300000});
export function auditOriginalAnatomicalBodyIndexTopology89(geometry){
 try{
  const pos=geometry?.getAttribute?.('position');
  const idx=geometry?.getIndex?.();
  if(!geometry?.isBufferGeometry||!pos||pos.itemSize!==3||
   !valid(pos.count)||pos.count<4||pos.count>bound.maxVertices||
   (idx&&idx.itemSize!==1))throw Error('original-source-position-index-inventory-required');
  const total=idx?.count??pos.count;
  if(!valid(total)||total<12||total%3||total/3>bound.maxFaces)
   throw Error('original-body-triangle-inventory-invalid');
  for(let i=0;i<pos.count;i++)
   for(let j=0;j<3;j++)if(!Number.isFinite(pos.getComponent(i,j)))
    throw Error('nonfinite-original-anatomical-vertices');
  const edgeCounts=new Map();
  let repeatedVertexFaces=0,zeroAreaFaces=0,faceCount=0;
  const getIndex=i=>idx?idx.getX(i):i;
  for(let i=0;i<total;i+=3){
   const a=getIndex(i),b=getIndex(i+1),c=getIndex(i+2);
   if(!valid(a)||!valid(b)||!valid(c)||
    a>=pos.count||b>=pos.count||c>=pos.count)
    throw Error('real-anatomical-face-index-out-of-range');
   faceCount++;
   if(a===b||a===c||b===c){
    repeatedVertexFaces++;continue;
   }
   const ax=pos.getX(a),ay=pos.getY(a),az=pos.getZ(a);
   const ux=pos.getX(b)-ax,uy=pos.getY(b)-ay,uz=pos.getZ(b)-az;
   const vx=pos.getX(c)-ax,vy=pos.getY(c)-ay,vz=pos.getZ(c)-az;
   const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
   if(nx*nx+ny*ny+nz*nz<=1e-20)zeroAreaFaces++;
   for(const [u,v] of [[a,b],[b,c],[c,a]]){
    const lo=Math.min(u,v),hi=Math.max(u,v);
    const key=lo+'|'+hi,sign=u===lo?1:-1;
    const row=edgeCounts.get(key);
    if(row){row.count++;row.winding+=sign;}
    else edgeCounts.set(key,{count:1,winding:sign});
   }
  }
  let boundaryEdges=0,nonManifoldEdges=0,sameDirectionDoubleEdges=0;
  for(const {count,winding} of edgeCounts.values()){
   if(count===1)boundaryEdges++;
   else if(count!==2)nonManifoldEdges++;
   else if(winding!==0)sameDirectionDoubleEdges++;
  }
  const open=boundaryEdges>0||nonManifoldEdges>0||
   sameDirectionDoubleEdges>0||repeatedVertexFaces>0||zeroAreaFaces>0;
  return Object.freeze({
   schema:'P89-original-anatomical-body-index-topology/v1',
   status:open?'ORIGINAL_INDEX_TOPOLOGY_NOT_A_CERTIFIED_CLOSED_ORIENTED_VOLUME':
    'ORIGINAL_INDEX_EDGE_TOPOLOGY_CLOSED_BUT_INSIDE_OUTSIDE_NOT_PROVED',
   originalWorldSpaceSourceVertices:pos.count,
   originalSourceTriangleFaces:faceCount,
   originalIndexedTriangleFaces:idx?faceCount:0,
   sourceIsIndexed:!!idx,
   uniqueIndexEdges:edgeCounts.size,boundaryIndexEdges:boundaryEdges,
   nonManifoldIndexEdges:nonManifoldEdges,
   sameWindingAdjacentIndexEdges:sameDirectionDoubleEdges,
   repeatedVertexTriangleFaces:repeatedVertexFaces,
   zeroAreaOriginalTriangleFaces:zeroAreaFaces,
   indexTopologyRequiresIndependentPhysicalSurfaceClosure:open,
   vertexSeamsMaySplitGeometricSurface:true,
   staticUnsignedGapDoesNotProveOutsideBody:true,
   actual3DClothSignedClearanceUnknown:true,
   signedOutsideBodyCertified:false,meshPhysicalVolumeCertified:false,
   fullContinuousClothContactCertified:false,
   consumer3DAuthorized:false,sourcePhoto2DFallbackRequired:true,
   releaseAuthorized:false,familyAlpha:'HOLD'
  });
 }catch(e){
  return deny(String(e?.message??'unknown').replace(/[^a-z0-9-]/gi,'').slice(0,100));
 }
}
