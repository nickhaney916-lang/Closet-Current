/**
 * P62: constrained upper-body source-photo fitting inputs.
 *
 * The mask supplies a two-dimensional silhouette only. It is not a body
 * measurement, a rear view, or proof that the garment is physically sewn.
 * Unknown, clipped, asymmetric, or weak masks must stay on the original-photo
 * 2D path. Geometry changes are bounded and run on an isolated 163-bone shell.
 */
const SHA=/^[a-f0-9]{64}$/;
const SOURCES=Object.freeze({
  'commons-0016':Object.freeze({
    sourceSHA256:'e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24',
    itemType:'Blouse'
  })
});
const smooth=(v,a,b)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};

export function measureUpperSilhouette62({data,width,height,sourceId,sourceSHA256,
 cutoutSHA256,reviewConfirmed=false}={}){
 const source=SOURCES[sourceId];
 if(!source||source.sourceSHA256!==sourceSHA256||!SHA.test(cutoutSHA256||'')||
   reviewConfirmed!==true||!(data instanceof Uint8ClampedArray)||
   !Number.isInteger(width)||!Number.isInteger(height)||width<32||height<32||
   width*height>240*240||data.length!==width*height*4)
  return Object.freeze({accepted:false,reason:'source-review-or-bounded-mask-missing',releaseAuthorized:false});
 let left=width,right=-1,top=height,bottom=-1,visible=0;
 const rows=new Uint8Array(height);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>=160){
  visible++;rows[y]++;left=Math.min(left,x);right=Math.max(right,x);
  top=Math.min(top,y);bottom=Math.max(bottom,y);
 }
 if(visible<width*height*.04||right<left||bottom<top||
    left<1||top<1||right>width-2||bottom>height-2)
  return Object.freeze({accepted:false,reason:'mask-empty-or-source-garment-clipped',releaseAuthorized:false});
 const boxW=right-left+1,boxH=bottom-top+1;
 if(boxW/boxH<.48||boxW/boxH>1.9)
  return Object.freeze({accepted:false,reason:'silhouette-aspect-not-supported-for-upper-body-3d',releaseAuthorized:false});
 const bands=[];
 for(let band=0;band<8;band++){
  const y0=Math.round(top+boxH*(band/8)),y1=Math.max(y0+1,Math.round(top+boxH*((band+1)/8)));
  let sum=0,n=0;
  for(let y=y0;y<Math.min(height,y1);y++){sum+=rows[y];n++;}
  bands.push(n?sum/n/boxW:0);
 }
 const mid=Math.max(...bands.slice(2,7)),shoulder=Math.max(...bands.slice(0,3));
 const hem=Math.max(...bands.slice(6,8));
 const symmetry=[];
 for(let y=top;y<=bottom;y+=Math.max(1,Math.floor(boxH/32))){
  const row=[];for(let x=left;x<=right;x++)if(data[(y*width+x)*4+3]>=160)row.push(x);
  if(row.length>4){const center=(row[0]+row.at(-1))/2;symmetry.push(Math.abs(center-(left+right)/2)/boxW);}
 }
 const asymmetry=symmetry.reduce((a,b)=>a+b,0)/Math.max(1,symmetry.length);
 if(asymmetry>.12||mid<.22||shoulder<.24||hem<.2)
  return Object.freeze({accepted:false,reason:'silhouette-confidence-below-safe-fit-threshold',releaseAuthorized:false});
 const sleeveReach=Math.max(...bands.slice(0,4));
 return Object.freeze({accepted:true,sourceId,sourceSHA256,cutoutSHA256,
  itemType:source.itemType,maskBounds:Object.freeze({left,top,right:right+1,bottom:bottom+1}),
  bands:Object.freeze(bands),shoulderToTorso:shoulder/mid,hemToTorso:hem/mid,
  silhouetteAspect:boxW/boxH,symmetryError:asymmetry,
  visibleFraction:visible/(width*height),sleeveReachSignal:sleeveReach,
  measurements:'normalized-photo-silhouette-only',
  inferredBack:true,releaseAuthorized:false});
}

/** Apply small silhouette-driven shaping to the actual source shell. */
export function fitReviewedUpperPhoto62(shirt,root,profile,{enabled=true}={}){
 if(!enabled)return shirt;
 if(!profile?.accepted||profile.sourceSHA256!==shirt?.stats?.sourceSHA256||
    profile.itemType!=='Blouse'||
    profile.inferredBack!==true||profile.releaseAuthorized!==false||
    !Array.isArray(shirt?.meshes)||typeof root?.traverse!=='function')
  throw Error('P62 requires the exact reviewed source-photo silhouette and matching 3D shell');
 const targets=shirt.meshes.filter(m=>m?.name==='Work56-independent-shirt-shell');
 const bodySkeletons=new Set();root.traverse(o=>{if(o?.isSkinnedMesh&&!o.userData?.work56Garment&&o.skeleton)bodySkeletons.add(o.skeleton);});
 if(!targets.length||targets.some(m=>!m.isSkinnedMesh||m.skeleton?.bones?.length!==163||!bodySkeletons.has(m.skeleton)))
  throw Error('P62 requires the actual 163-bone fitted source garment shell');
 const shoulder=Math.max(.88,Math.min(1.12,profile.shoulderToTorso));
 const hem=Math.max(.88,Math.min(1.14,profile.hemToTorso));
 const pending=[];let moved=0,maxMove=0;
 for(const mesh of targets){
  mesh.updateWorldMatrix(true,false);const g=mesh.geometry,p=g.getAttribute('position');
  const panel=g.getAttribute('panelPosition');
  if(!p||!panel||p.count<100||panel.count!==p.count)throw Error('P62 source shell attributes incomplete');
  const inv=mesh.matrixWorld.clone().invert(),next=p.array.slice(),panelNext=panel.array.slice();
  for(let i=0;i<p.count;i++){
   const x=panel.getX(i),y=panel.getY(i),z=panel.getZ(i);
   if(![x,y,z].every(Number.isFinite))throw Error('P62 source shell contains invalid coordinates');
   const t=smooth(y,1.19,1.61),targetWidth=1+(shoulder-1)*(1-t)+(hem-1)*t;
   const bounded=Math.max(.95,Math.min(1.05,targetWidth));
   const nx=x*bounded,delta=Math.abs(nx-x);
   if(delta>.0001){
    moved++;maxMove=Math.max(maxMove,delta);
    panelNext[i*3]=nx;
    // Convert the world-space fitted delta to mesh-local coordinates without
    // changing texture pixels, source bytes, skin indices, or bone weights.
    const worldPoint=mesh.position.clone().set(nx,y,z).applyMatrix4(inv);
    next[i*3]=worldPoint.x;next[i*3+1]=worldPoint.y;next[i*3+2]=worldPoint.z;
   }
  }
  pending.push({mesh,p,panel,next,panelNext});
 }
 if(moved<20||maxMove<.001||maxMove>.025)throw Error('P62 source silhouette geometry delta is outside its bounded acceptance range');
 for(const row of pending){row.p.array.set(row.next);row.panel.array.set(row.panelNext);row.p.needsUpdate=true;row.panel.needsUpdate=true;row.mesh.geometry.computeVertexNormals();row.mesh.geometry.computeBoundingBox();row.mesh.geometry.computeBoundingSphere();}
 return {...shirt,stats:{...shirt.stats,sourcePhotoSilhouetteFit62:true,
  silhouetteFit62MovedVertices:moved,silhouetteFit62MaxMeters:maxMove,
  silhouetteSourceSHA256:profile.sourceSHA256,cutoutSHA256:profile.cutoutSHA256,
  normalizedSilhouetteOnly:true,inferredRear62:true,collisionCertified:false,
  humanVisualApproval:false,releaseAuthorized:false}};
}

export const UPPER_PHOTO_SOURCES_62=SOURCES;
