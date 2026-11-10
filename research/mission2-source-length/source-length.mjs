/** Source-proportion rest-pose extension, not inferred garment measurements or cloth simulation. */
import {prepareSourceProjection} from './source-projection.mjs';
import {createPosedBodyIntersectionAudit} from './posed-intersections.mjs';
import {validatePhotoGarmentTargets} from '../user-photo-to-anatomical-3d-62/silhouette-fit.mjs';
const SOURCE='e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24';
const fail=m=>{throw Error('M2 source length '+m);};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=(x,a,b)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
export function deriveSourceLength({profile,minY,maxY,spanX}={}){
 if(profile?.accepted!==true||profile.sourceSHA256!==SOURCE||
    profile.inferredBack!==true||profile.releaseAuthorized!==false||
    !/^[a-f0-9]{64}$/.test(profile.cutoutSHA256||'')||
    !Number.isFinite(profile.silhouetteAspect)||profile.silhouetteAspect<.48||profile.silhouetteAspect>1.9||
    !Array.isArray(profile.bands)||profile.bands.length!==8||
    !profile.bands.every(v=>Number.isFinite(v)&&v>0&&v<=1)||
    ![minY,maxY,spanX].every(Number.isFinite)||maxY-minY<.25||maxY-minY>.9||spanX<.5||spanX>1.6)
  fail('current registered source contour and anatomical garment bounds required');
 const observedLength=spanX/profile.silhouetteAspect;
 const targetLength=clamp(observedLength,.70,.95);
 const extension=clamp(targetLength-(maxY-minY),.08,.38);
 const flare=clamp(profile.bands[6]/profile.bands[4],1,1.35);
 return Object.freeze({extension,flare,minY,maxY,pivot:minY+.22,
  observedPhotoAspect:profile.silhouetteAspect,sourceProportionLength:observedLength,
  boundedTargetLength:targetLength,absoluteSizeMeasured:false});
}
export function fitSourceLength(shirt,root,profile,{projectSourceRGB=false}={}){
 const started=performance.now();
 if(shirt?.stats?.sourceSHA256!==SOURCE||shirt.stats.ownerAlphaMaskBasedPhysicalGeometry190!==true||
    shirt.stats.ownerPhysicalBilateralReadbackVerified196!==true||shirt.stats.cutoutSHA256!==profile?.cutoutSHA256||
    !Array.isArray(shirt.meshes)||typeof root?.traverse!=='function')fail('verified source and existing private owner fitting required');
 const targets=shirt.meshes.filter(m=>m.name==='Work56-independent-shirt-shell'||['L','R'].includes(m.userData?.work45IndependentShoulderCap));
 if(targets.some(m=>!m.isSkinnedMesh||m.skeleton?.bones?.length!==163))fail('original 163-bone garment required');
 validatePhotoGarmentTargets(targets,fail);
 let minY=Infinity,maxY=-Infinity,minX=Infinity,maxX=-Infinity;
 for(const mesh of targets){
  const a=mesh.geometry.getAttribute('position');
  for(let i=0;i<a.count;i++){
   const w=mesh.position.clone().fromBufferAttribute(a,i).applyMatrix4(mesh.matrixWorld);
   minX=Math.min(minX,w.x);maxX=Math.max(maxX,w.x);
   if(Math.abs(w.x)<.23){minY=Math.min(minY,w.y);maxY=Math.max(maxY,w.y);}
  }
 }
 const shape=deriveSourceLength({profile,minY,maxY,spanX:maxX-minX});
 const staged=[];let moved=0,lowest=Infinity,maximum=0;
 const center=shirt.stats.envelope?.center;
 if(!Number.isFinite(center))fail('original anatomical front/back center required');
 for(const mesh of targets){
  const p=mesh.geometry.getAttribute('position'),next=p.array.slice(),inv=mesh.matrixWorld.clone().invert();
  for(let i=0;i<p.count;i++){
   const old=mesh.position.clone().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld),w=old.clone();
   const lower=1-smooth(w.y,shape.minY,shape.pivot);
   const torso=1-smooth(Math.abs(w.x),.23,.32),weight=lower*torso;
   w.y-=shape.extension*weight;
   w.x*=1+(shape.flare-1)*weight;
   w.z=center+(w.z-center)*(1+.18*weight);
   const delta=w.distanceTo(old);maximum=Math.max(maximum,delta);
   if(delta>.0001)moved++;
   lowest=Math.min(lowest,w.y);w.applyMatrix4(inv);
   next[i*3]=w.x;next[i*3+1]=w.y;next[i*3+2]=w.z;
  }
  if(!next.every(Number.isFinite))fail('nonfinite staged extension');
  staged.push({mesh,p,next});
 }
 if(moved<100||maximum>.42||lowest>minY-.07||lowest<.55)fail('bounded actual lower garment extension not established');
 const sourceProjection=projectSourceRGB?prepareSourceProjection(shirt,staged,
  [(minX+maxX)/2,maxX-minX,maxY-lowest,lowest]):null;
 const audit=createPosedBodyIntersectionAudit(root);let before,after;
 try{before=audit.measure(targets);after=audit.measure(targets,new Map(staged.map(r=>[r.mesh,r.next])));}
 finally{audit.dispose();}
 if(after.intersectingPairs>before.intersectingPairs)fail('new posed body intersection pairs '+before.intersectingPairs+' -> '+after.intersectingPairs);
 for(const {mesh,p,next} of staged){p.array.set(next);p.needsUpdate=true;
  mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();}
 sourceProjection?.commit();
 return {...shirt,stats:{...shirt.stats,sourceProjectionRGB:sourceProjection!==null,
  sourceProjectionMaterialCount:sourceProjection?.materialCount||0,sourceProjectionRuntime:sourceProjection?.runtime||null,sourceProjectionRearPhotographed:false,sourceLengthFit:true,sourceLengthSHA256:SOURCE,
  sourceLengthMovedVertices:moved,sourceLengthOldHemY:minY,sourceLengthNewHemY:lowest,
  sourceLengthExtension:shape.extension,sourceLengthFlare:shape.flare,
  sourceLengthOriginalUVPreserved:true,sourceLengthRearInferred:true,
  sourceLengthPhysicalSizeMeasured:false,sourceLengthCollisionCertified:false,
  sourceLengthRestPoseOnly:true,sourceLengthConstructionMs:performance.now()-started,sourceLengthIntersectionPairsBefore:before.intersectingPairs,
  sourceLengthIntersectionPairsAfter:after.intersectingPairs,sourceLengthTestedPairs:after.testedPairs,releaseAuthorized:false}};
}
