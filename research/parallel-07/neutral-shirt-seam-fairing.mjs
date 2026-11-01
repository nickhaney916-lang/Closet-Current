/** PAR-07 opt-in rest-space shirt seam fairing. No photo/UV/skin/material mutation.
 * Requires trusted seam correspondences from the anatomical garment builder.
 * No correspondence => fail closed. Never use on source-photo front panel.
 */
export function fairNeutralShirtSeams({shirt,pairs,neutralVertexIndices,maxMoveMeters=.006,blend=.35}){
 const geometry=shirt?.geometry,p=geometry?.getAttribute('position');
 if(!shirt?.isSkinnedMesh||!p||!geometry.getAttribute('uv')||!geometry.getAttribute('skinIndex')||!geometry.getAttribute('skinWeight'))throw Error('Independent skinned shirt required');
 if(!Array.isArray(pairs)||!pairs.length||!(neutralVertexIndices instanceof Set)||!neutralVertexIndices.size)throw Error('Measured neutral seam topology required');
 if(!Number.isFinite(maxMoveMeters)||maxMoveMeters<=0||maxMoveMeters>.008||!Number.isFinite(blend)||blend<=0||blend>.5)throw Error('Unsafe fairing parameters');
 if(p.array.length!==p.count*3)throw Error('Invalid garment position buffer');
 const original=Float64Array.from(p.array),stride=p.itemSize;
 if(stride!==3)throw Error('3D positions required');
 // Validate every correspondence before touching the live mesh; errors must be atomic.
 for(const pair of pairs){
  if(!Array.isArray(pair)||pair.length!==2)throw Error('Invalid seam pair');
  const [a,b]=pair;
  if(!Number.isInteger(a)||!Number.isInteger(b)||a===b||a<0||b<0||a>=p.count||b>=p.count)throw Error('Invalid seam indices');
  if(!neutralVertexIndices.has(a)||!neutralVertexIndices.has(b))throw Error('Photographed front cannot be modified');
 }
 const delta=new Float64Array(original.length),weight=new Uint16Array(p.count);
 for(const pair of pairs){
  if(!Array.isArray(pair)||pair.length!==2)throw Error('Invalid seam pair');
  const [a,b]=pair;
  if(!Number.isInteger(a)||!Number.isInteger(b)||a===b||a<0||b<0||a>=p.count||b>=p.count)throw Error('Invalid seam indices');
  if(!neutralVertexIndices.has(a)||!neutralVertexIndices.has(b))throw Error('Photographed front cannot be modified');
  for(let axis=0;axis<3;axis++){
   const d=(original[b*3+axis]-original[a*3+axis])*blend;
   delta[a*3+axis]+=d;delta[b*3+axis]-=d;
  }
  weight[a]++;weight[b]++;
 }
 let moved=0,maxObserved=0;
 for(let i=0;i<p.count;i++)if(weight[i]){
  const x=delta[i*3]/weight[i],y=delta[i*3+1]/weight[i],z=delta[i*3+2]/weight[i];
  const norm=Math.hypot(x,y,z),factor=norm>maxMoveMeters?maxMoveMeters/norm:1;
  for(let k=0;k<3;k++)p.array[i*3+k]=original[i*3+k]+delta[i*3+k]/weight[i]*factor;
  if(norm>0)moved++;maxObserved=Math.max(maxObserved,Math.min(norm,maxMoveMeters));
 }
 p.needsUpdate=true;geometry.computeVertexNormals?.();
 return Object.freeze({movedVertices:moved,maxDisplacementMeters:maxObserved,sourceFrontPreserved:true,photoBytesUntouched:true,posedCollisionVerified:false,visualAcceptance:'REVIEW'});
}
