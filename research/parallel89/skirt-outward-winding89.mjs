/**
 * Source PHOTO skirt research-only outward face winding audit.
 * The genuine 7x49 P89 skirt proposal is a provisional open waist/hem shell.
 * Correct normals improve a research renderer, but do not certify wearer fit,
 * physical cloth, hidden rear appearance, or any consumer 3D admission.
 */
export function outwardSkirtQuadTriangles89(p,q){
 if(!Number.isSafeInteger(p)||!Number.isSafeInteger(q)||p<0||q<=p+1)
  throw Error('skirt-strip-quad-indices-invalid');
 // Circumferential +j followed by decreasing Y: the OLD (p,p+1,q)
 // order faces inward. Reversed winding faces away from the skirt axis.
 return [p,q,p+1,p+1,q,q+1];
}
export function auditOutwardSkirtRestWinding89({worldRest,indices,
 centerX,centerZ,segments=48,rows=7}={}){
 if(segments!==48||rows!==7||
  !(Array.isArray(worldRest)||worldRest instanceof Float32Array)||
  !(Array.isArray(indices)||indices instanceof Uint16Array||indices instanceof Uint32Array)||
  worldRest.length!==(rows*(segments+1)*3)||
  indices.length!==(rows-1)*segments*6||
  !Number.isFinite(centerX)||!Number.isFinite(centerZ))
  throw Error('bounded-source-skirt-rest-and-index-evidence-required');
 const component=(i,k)=>worldRest[3*i+k];
 let minimumRadialWinding=Infinity,outwardFaces=0;
 for(let row=0;row<rows-1;row++)for(let col=0;col<segments;col++){
  const p=row*(segments+1)+col,q=p+segments+1,
   offset=(row*segments+col)*6;
  const expected=outwardSkirtQuadTriangles89(p,q);
  for(let k=0;k<6;k++)if(indices[offset+k]!==expected[k])
   throw Error('skirt-source-face-index-order-or-winding-invalid');
  for(let t=0;t<2;t++){
   const a=indices[offset+t*3],b=indices[offset+t*3+1],
    c=indices[offset+t*3+2];
   const ax=component(a,0),ay=component(a,1),az=component(a,2),
    bx=component(b,0),by=component(b,1),bz=component(b,2),
    cx=component(c,0),cy=component(c,1),cz=component(c,2);
   if(![ax,ay,az,bx,by,bz,cx,cy,cz].every(Number.isFinite))
    throw Error('skirt-rest-triangle-nonfinite');
   const e1x=bx-ax,e1y=by-ay,e1z=bz-az,
    e2x=cx-ax,e2y=cy-ay,e2z=cz-az;
   const nx=e1y*e2z-e1z*e2y,nz=e1x*e2y-e1y*e2x;
   const radial=nx*((ax+bx+cx)/3-centerX)+
    nz*((az+bz+cz)/3-centerZ);
   if(!Number.isFinite(radial)||radial<=1e-9)
    throw Error('inward-or-degenerate-skirt-source-face-normal');
   minimumRadialWinding=Math.min(minimumRadialWinding,radial);
   outwardFaces++;
  }
 }
 return Object.freeze({
  schema:'P89-research-photo-skirt-original-rest-outward-winding/v1',
  status:'PROVISIONAL_SKIRT_SOURCE_REST_TRIANGLES_OUTWARD',
  outwardRestTriangleCount:outwardFaces,
  expectedRestTriangleCount:2*segments*(rows-1),
  minimumPositiveRadialNormalDot:Number(minimumRadialWinding.toPrecision(8)),
  sourceFrontTexturePixelsModified:false,originalPhoto2DFallbackRequired:true,
  originalPhotoRearUnobserved:true,physicalClothFitProven:false,
  actualBodySignedExteriorProven:false,consumer3DAdmitted:false,
  releaseAuthorized:false,familyAlpha:'HOLD'
 });
}
