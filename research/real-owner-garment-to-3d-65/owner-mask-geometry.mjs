/**
 * P65 bounded source-mask contour shaping for the existing skinned blouse.
 * This changes the physical shell from owner-asserted, byte-verified alpha
 * rows; it does not claim a newly reconstructed pattern, hidden construction,
 * or independently witnessed human segmentation.
 */
const SOURCE='e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24';
const SHA=/^[a-f0-9]{64}$/;
const BINS=32;

function maskRows(data,width,height){
 if(!(data instanceof Uint8ClampedArray)||!Number.isInteger(width)||!Number.isInteger(height)||
    width<32||height<32||width*height>8_000_000||data.length!==width*height*4)
  throw Error('P65 bounded RGBA mask pixels required');
 const rows=[];let total=0,clipped=0;
 for(let b=0;b<BINS;b++){
  const y0=Math.floor(height*b/BINS),y1=Math.max(y0+1,Math.floor(height*(b+1)/BINS));
  let left=width,right=-1,n=0;
  for(let y=y0;y<Math.min(height,y1);y++)for(let x=0;x<width;x++){
   if(data[(y*width+x)*4+3]<128)continue;
   left=Math.min(left,x);right=Math.max(right,x);n++;total++;
   if(x===0||x===width-1||y===0||y===height-1)clipped++;
  }
  rows.push(n?Object.freeze({left:left/width,right:(right+1)/width,coverage:n/((y1-y0)*width)}):null);
 }
 if(total<width*height*.04||clipped>Math.max(4,total*.025)||rows.filter(Boolean).length<24)
  throw Error('P65 mask empty, clipped, or too sparse for contour fitting');
 return Object.freeze({rows:Object.freeze(rows),width,height,coverage:total/(width*height)});
}

/** Build only after P187/P188/P189 have rechecked owner, review lease and bytes. */
export function createOwnerMaskGeometryProfile65({ownerId,garmentId,sourceSHA256,
 ownerMaskSHA256,ownerMaskData,baselineMaskData,width,height}={}){
 if(typeof ownerId!=='string'||!ownerId||typeof garmentId!=='string'||!garmentId||
    sourceSHA256!==SOURCE||!SHA.test(ownerMaskSHA256||'')||ownerMaskSHA256===SOURCE||
    ownerMaskData===baselineMaskData)
  throw Error('P65 owner, garment, original source, and distinct reviewed mask identity required');
 const owner=maskRows(ownerMaskData,width,height),base=maskRows(baselineMaskData,width,height);
 if(owner.width!==base.width||owner.height!==base.height)throw Error('P65 mask registration mismatch');
 const factors=[];
 for(let i=0;i<BINS;i++){
  const a=owner.rows[i],b=base.rows[i];
  if(!a||!b){factors.push(null);continue;}
  const aw=(a.right-a.left)/2,bw=(b.right-b.left)/2;
  factors.push(Math.max(.7,Math.min(1.3,aw/Math.max(.04,bw))));
 }
 for(let i=0;i<BINS;i++)if(factors[i]===null){
  const near=factors.filter(Number.isFinite);
  if(near.length<24)throw Error('P65 owner mask contour has unsupported vertical gaps');
  factors[i]=i<BINS/2?near[0]:near.at(-1);
 }
 return Object.freeze({ownerId,garmentId,sourceSHA256,ownerMaskSHA256,width,height,
  rowFactors:Object.freeze(factors),ownerMaskCoverage:owner.coverage,
  baselineMaskCoverage:base.coverage,geometrySource:'reviewed-owner-alpha-row-contour',
  ownerReviewAssertionOnly:true,independentlyHumanReviewed:false,
  reconstructedTopology:false,inferredRear:true,releaseAuthorized:false});
}

export function requireCurrentOwnerMaskGeometry65(profile,{ownerId,garmentId,sourceSHA256}={}){
 if(!profile||typeof ownerId!=='string'||!ownerId||profile.ownerId!==ownerId||
    profile.garmentId!==garmentId||profile.sourceSHA256!==sourceSHA256||
    profile.ownerReviewAssertionOnly!==true||profile.releaseAuthorized!==false)
  throw Error('P65 owner mask does not match the current signed garment and original source');
 return true;
}

function factorAt(profile,v){
 const t=Math.max(0,Math.min(.999999,1-v))*BINS,i=Math.floor(t),f=t-i;
 const a=profile.rowFactors[i],b=profile.rowFactors[Math.min(BINS-1,i+1)];
 // Linear interpolation is intentionally small and smooths neighboring mask rows.
 return a+(b-a)*f;
}

/** Deform the actual 163-bone shell and sewn shoulder caps from mask contours. */
export function fitOwnerMaskGeometry65(shirt,root,profile){
 if(!profile||profile.sourceSHA256!==shirt?.stats?.sourceSHA256||
    profile.sourceSHA256!==SOURCE||!SHA.test(profile.ownerMaskSHA256||'')||
    profile.ownerReviewAssertionOnly!==true||profile.releaseAuthorized!==false||
    profile.reconstructedTopology!==false||!Array.isArray(profile.rowFactors)||
    profile.rowFactors.length!==BINS||!Array.isArray(shirt?.meshes)||typeof root?.traverse!=='function')
  throw Error('P65 verified source-bound owner contour and skinned garment required');
 const targets=shirt.meshes.filter(m=>m?.name==='Work56-independent-shirt-shell'||
  ['L','R'].includes(m?.userData?.work45IndependentShoulderCap));
 const bodySkeletons=new Set();root.traverse(o=>{if(o?.isSkinnedMesh&&!o.userData?.work56Garment&&o.skeleton)bodySkeletons.add(o.skeleton);});
 if(!targets.length||targets.some(m=>!m.isSkinnedMesh||m.skeleton?.bones?.length!==163||!bodySkeletons.has(m.skeleton)))
  throw Error('P65 requires the current 163-bone source garment and joined shoulder caps');
 const pending=[];let moved=0,maxMove=0,bounded=0;
 for(const mesh of targets){
  mesh.updateWorldMatrix(true,false);
  const g=mesh.geometry,p=g.getAttribute('position'),panel=g.getAttribute('panelPosition');
  if(!p||!panel||p.count<100||panel.count!==p.count)throw Error('P65 garment panel coordinates missing');
  const inv=mesh.matrixWorld.clone().invert(),next=p.array.slice(),panelNext=panel.array.slice();
  for(let i=0;i<p.count;i++){
   const x=panel.getX(i),y=panel.getY(i),z=panel.getZ(i);
   if(![x,y,z].every(Number.isFinite))throw Error('P65 source garment has invalid panel coordinates');
   const photoSpanHeight=shirt.stats?.photoSpan?.height;
   if(!Number.isFinite(photoSpanHeight)||photoSpanHeight<=0)throw Error('P65 source photo span unavailable');
   const normalizedY=(y-1.11)/photoSpanHeight;
   const requestedFactor=factorAt(profile,normalizedY);
   const maxFactor=.035/Math.max(.035,Math.abs(x));
   const factor=Math.max(1-maxFactor,Math.min(1+maxFactor,requestedFactor));
   if(factor!==requestedFactor)bounded++;
   const nx=x*factor,delta=Math.abs(nx-x);
   if(delta>.0001){
    moved++;maxMove=Math.max(maxMove,delta);panelNext[i*3]=nx;
    const world=mesh.position.clone().set(p.getX(i),p.getY(i),p.getZ(i)).applyMatrix4(mesh.matrixWorld);
    world.x+=nx-x;world.applyMatrix4(inv);
    next[i*3]=world.x;next[i*3+1]=world.y;next[i*3+2]=world.z;
   }
  }
  pending.push({mesh,p,panel,next,panelNext});
 }
 if(moved<20||maxMove<.0001)throw Error('P65 contour produced no meaningful source-mesh geometry change');
 for(const row of pending){row.p.array.set(row.next);row.panel.array.set(row.panelNext);row.p.needsUpdate=true;row.panel.needsUpdate=true;
  row.mesh.geometry.computeVertexNormals();row.mesh.geometry.computeBoundingBox();row.mesh.geometry.computeBoundingSphere();}
 return {...shirt,stats:{...shirt.stats,ownerMaskGeometry65:true,
  ownerMaskGeometry65MovedVertices:moved,ownerMaskGeometry65MaxDisplacementMeters:maxMove,
  ownerMaskGeometry65BoundedVertices:bounded,
  ownerMaskGeometry65SHA256:profile.ownerMaskSHA256,ownerMaskGeometry65OwnerId:profile.ownerId,
  ownerMaskReviewAssertionOnly65:true,ownerMaskHumanReviewIndependentlyVerified65:false,
  uniqueTopologyReconstructed65:false,inferredRear65:true,collisionCertified65:false,
  releaseAuthorized:false}};
}

export const OWNER_MASK_GEOMETRY_BINS_65=BINS;
