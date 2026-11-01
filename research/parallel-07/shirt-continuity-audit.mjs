/** Research-only shirt source and geometric continuity guard.
 * Does not alter original photographs, UVs, skin weights, geometry or production.
 * Use on the existing independently skinned shirt before/after any experimental fit.
 */
export function auditShirtContinuity({shirt,sourceSHA256,expectedSHA256,shoulderPairs=[],armholePairs=[],maxGapMeters=0.012}){
 if(!/^[a-f0-9]{64}$/.test(expectedSHA256||'')||sourceSHA256!==expectedSHA256)throw Error('Original photograph SHA identity mismatch');
 if(!shirt?.isSkinnedMesh||!shirt.geometry?.getAttribute('position')||!shirt.geometry?.getAttribute('uv')||!shirt.geometry?.getAttribute('skinIndex')||!shirt.geometry?.getAttribute('skinWeight'))throw Error('Actual independently skinned photographed shirt required');
 if(!Number.isFinite(maxGapMeters)||maxGapMeters<=0||maxGapMeters>0.03)throw Error('Invalid physical seam tolerance');
 const pos=shirt.geometry.getAttribute('position'),n=pos.count;
 const check=(pairs,label)=>pairs.map(([a,b])=>{
  if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a>=n||b>=n)throw Error('Invalid '+label+' vertex index');
  const gap=Math.hypot(pos.getX(a)-pos.getX(b),pos.getY(a)-pos.getY(b),pos.getZ(a)-pos.getZ(b));
  if(!Number.isFinite(gap))throw Error('Nonfinite '+label+' geometry');
  return gap;
 });
 const shoulder=check(shoulderPairs,'shoulder'),armhole=check(armholePairs,'armhole');
 const worst=Math.max(0,...shoulder,...armhole);
 return Object.freeze({status:worst<=maxGapMeters?'PASS':'REVIEW',originalSHA256:sourceSHA256,vertexCount:n,shoulderPairs:shoulder.length,armholePairs:armhole.length,maxGapMeters:worst,toleranceMeters:maxGapMeters,measuredOn:'rest-geometry-only',poseContactCertified:false,photorealismCertified:false});
}
