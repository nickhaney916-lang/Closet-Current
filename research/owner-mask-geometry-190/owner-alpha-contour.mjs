/**
 * P190: physically move licensed-source upper garment skinned panels using
 * the WIDTH SIGNAL of a separately SHA-verified, owner-asserted PNG alpha.
 * A bounded experimental 2D width correction on exactly one public blouse.
 * NOT 3D reconstruction from an arbitrary photograph, segmentation truth,
 * collision simulation, independent owner review or a photographed rear.
 */
const SRC='e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24';
const HEX=/^[0-9a-f]{64}$/;
const fail=x=>{throw Error('P190 '+x);};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function alphaRows(image){
 const w=image?.naturalWidth||image?.width||0,h=image?.naturalHeight||image?.height||0;
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<32||h<32||w*h>8000000)
  fail('actual bounded decoded alpha image required');
 const c=document.createElement('canvas');c.width=w;c.height=h;
 const x=c.getContext('2d',{willReadFrequently:true});
 if(!x)fail('actual 2D alpha pixel readback required');
 x.drawImage(image,0,0,w,h);
 const d=x.getImageData(0,0,w,h).data,rows=[];
 for(let y=0;y<h;y++){
  let first=w,last=-1,visible=0;
  for(let col=0;col<w;col++)if(d[(y*w+col)*4+3]>=160){
   first=Math.min(first,col);last=col;visible++;
  }
  rows.push({first,last,visible,width:last>=first?last-first+1:0});
 }
 return {w,h,rows};
}
export function profileOwnerAlphaGeometry190({source,owner,maskSHA}={}){
 if(!HEX.test(maskSHA||''))fail('separate current owner PNG SHA required');
 const a=alphaRows(source),b=alphaRows(owner);
 if(a.w!==b.w||a.h!==b.h)fail('owner mask must share original source coordinates');
 const bands=[],width=a.w,height=a.h;
 let valid=0,maxDiff=0;
 for(let i=0;i<12;i++){
  const start=Math.round(height*(.08+i*.07)),end=Math.min(height,Math.round(height*(.08+(i+1)*.07)));
  let total=0,n=0;
  for(let y=start;y<end;y++){
   const aa=a.rows[y],bb=b.rows[y];
   // Exclude sparsely sampled edge/strap rows from width inference: a
   // one-pixel difference at the neckline must never become a large 3D
   // torso/cap deformation, even with a genuine SHA-verified mask.
   if(aa.width<Math.max(24,width*.12)||bb.width<Math.max(24,width*.12))continue;
   if(bb.first<aa.first-width*.01||bb.last>aa.last+width*.01)
    fail('owner PNG grows outside licensed frontal silhouette');
   const ratio=bb.width/aa.width;
   if(ratio<.86||ratio>1.02)fail('mask contour exceeds supported 2D blouse adjustment');
   total+=ratio;n++;
  }
  bands.push(n?total/n:1);valid+=n;
  maxDiff=Math.max(maxDiff,Math.abs(1-bands.at(-1)));
 }
 if(valid<height*.32||maxDiff<.009)
  fail('independent owner mask must have measurable, registered shape difference');
 return Object.freeze({ownerAlphaSourceShape190:true,sourceId:'commons-0016',sourceSHA256:SRC,
  ownerMaskSHA256:maskSHA,ratioBands:Object.freeze(bands),maxRelativeDifference:maxDiff,
  widthEvidenceRows:valid,sourceBasedBlouseOnly:true,mirrorRearInferred:true,
  independentSegmentationWitness:false,independentReviewWitness:false,
  generalizedToOtherGarments:false,releaseAuthorized:false,familyAlpha:'HOLD'});
}
function ratioAt190(profile,y){
 // Top of photographed blouse is HIGH anatomical world Y, hem is LOW.
 const t=clamp((1.78-y)/.66,0,1)*(profile.ratioBands.length-1);
 const i=Math.floor(t),j=Math.min(i+1,profile.ratioBands.length-1);
 return profile.ratioBands[i]*(1-(t-i))+profile.ratioBands[j]*(t-i);
}
export function boundedOwnerAlphaContour190({x,y,profile}={}){
 if(!Number.isFinite(x)||!Number.isFinite(y)||
    profile?.ownerAlphaSourceShape190!==true||
    profile?.sourceSHA256!==SRC||!HEX.test(profile?.ownerMaskSHA256||'')||
    !Array.isArray(profile.ratioBands)||profile.ratioBands.length!==12||
    profile.ratioBands.some(r=>!Number.isFinite(r)||r<.86||r>1.02))
  fail('finite source-verified 12-band mask silhouette required');
 const maskRatio=ratioAt190(profile,y);
 const mid=smooth(y,1.1,1.17)*(1-smooth(y,1.77,1.86));
 const shift=clamp(x*(maskRatio-1)*.6*mid,-.009,.009);
 return Object.freeze({x:x+shift,y,zChange:0,deltaX:shift,maskRatio,
  mirrorRearInferred:true,releaseAuthorized:false});
}
function smooth(v,a,b){const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);}
export function fitOwnerAlphaToSkinnedBlouse190(shirt,root,profile){
 if(profile?.ownerAlphaSourceShape190!==true||profile?.sourceSHA256!==SRC||
    !HEX.test(profile.ownerMaskSHA256||'')||
    shirt?.stats?.sourceSHA256!==SRC||
    shirt?.stats?.sourceShoulderEased185!==true||
    shirt?.stats?.independentShoulderCapSeamsRetained185!==true||
    !Array.isArray(shirt?.meshes)||typeof root?.traverse!=='function')
  fail('requires already source-fitted 163-bone shirt with two sewn cap joins');
 const targets=shirt.meshes.filter(m=>m?.name==='Work56-independent-shirt-shell'||
  ['L','R'].includes(m?.userData?.work45IndependentShoulderCap));
 if(targets.length<3||!['L','R'].every(side=>
    targets.some(m=>m.userData?.work45IndependentShoulderCap===side)))
  fail('both actual shoulder caps plus torso shell are required');
 const skeletons=new Set();root.traverse(o=>{if(o?.isSkinnedMesh&&
  !o.userData?.work56Garment&&o.skeleton)skeletons.add(o.skeleton);});
 if(targets.some(m=>!m.isSkinnedMesh||m.skeleton?.bones?.length!==163||
   !skeletons.has(m.skeleton)))fail('only the original licensed skinned 163-bone shell can be moved');
 let moved=0,maxShift=0,activeCaps=new Set(),panels=[];
 for(const mesh of targets){
  mesh.updateWorldMatrix(true,false);
  const p=mesh.geometry?.getAttribute('position'),panel=mesh.geometry?.getAttribute('panelPosition');
  if(!p||!panel||p.count<100||p.count!==panel.count)
   fail('source panel coordinates, current skinned vertices and UV relations required');
  const inv=mesh.matrixWorld.clone().invert(),positions=p.array.slice(),pan=panel.array.slice();
  for(let i=0;i<panel.count;i++){
   const x=panel.getX(i),y=panel.getY(i),z=panel.getZ(i);
   if(![x,y,z].every(Number.isFinite))fail('nonfinite true source garment vertex');
   const change=boundedOwnerAlphaContour190({x,y,profile});
   const delta=change.deltaX;
   if(Math.abs(delta)<.0001)continue;
   moved++;maxShift=Math.max(maxShift,Math.abs(delta));
   pan[i*3]=change.x;
   const world=mesh.position.clone().set(p.getX(i),p.getY(i),p.getZ(i))
    .applyMatrix4(mesh.matrixWorld);
   world.x+=delta;world.applyMatrix4(inv);
   positions[i*3]=world.x;positions[i*3+1]=world.y;positions[i*3+2]=world.z;
   if(['L','R'].includes(mesh.userData?.work45IndependentShoulderCap))
    activeCaps.add(mesh.userData.work45IndependentShoulderCap);
  }
  panels.push({mesh,p,panel,positions,pan});
 }
 if(moved<20||maxShift<.0005||maxShift>.00901||activeCaps.size!==2)
  fail('real bilateral owner-mask-derived shell displacement not independently established');
 // Atomic in-memory validation: commit geometry ONLY after all meshes pass.
 for(const row of panels){
  row.p.array.set(row.positions);row.panel.array.set(row.pan);
  row.p.needsUpdate=true;row.panel.needsUpdate=true;
  row.mesh.geometry.computeVertexNormals();
  row.mesh.geometry.computeBoundingBox();row.mesh.geometry.computeBoundingSphere();
 }
 return {...shirt,stats:{...shirt.stats,ownerAlphaMaskBasedPhysicalGeometry190:true,
  ownerAlphaMaskSHA256_190:profile.ownerMaskSHA256,
  ownerMaskAdjustedVertices190:moved,ownerMaskMaxMoveMeters190:maxShift,
  ownerMaskBilateralCapJoins190:activeCaps.size,ownerMaskOnlyUpperBlouse190:true,
  inferredOwnerMaskRear190:true,ownerMaskHumanReviewCertified190:false,
  ownerMaskTopologyValidated191:profile.ownerMaskTopologyVerified191===true&&
    profile.sourceSHA256===SRC&&HEX.test(profile.ownerMaskSHA256||'')&&
    Number.isFinite(profile.ownerMaskTopologyIoU191)&&
    profile.ownerMaskTopologyIoU191>=.80&&
    Number.isFinite(profile.ownerMaskTopologyConnected191)&&
    profile.ownerMaskTopologyConnected191>=.87,
  ownerMaskSourceOverlapIoU191:profile.ownerMaskTopologyIoU191||0,
  ownerMaskLargestConnected191:profile.ownerMaskTopologyConnected191||0,
  ownerMaskInsideSource191:profile.ownerMaskTopologyInsideSource191||0,
  ownerMaskIndependentHumanReviewed191:false,
  generalizedUserPhotoTo3D190:false,collisionCertified:false,
  humanVisualApproval:false,releaseAuthorized:false}};
}
