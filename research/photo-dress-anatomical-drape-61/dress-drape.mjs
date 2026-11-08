/**
 * PHOTO-DRESS-ANATOMICAL-DRAPE-END-TO-END-61
 * Bounded geometry refinement for the one public SHA-verified Commons 0053
 * photographed dress in a disposable P541 research renderer. Owner photos,
 * app wardrobe, source pixels, UV/rest projection and skin weights are denied.
 */
import * as T from 'three';

export const DRESS_DRAPE_61 = Object.freeze({
  sourceId: 'commons-0053',
  torsoClearanceMeters: 0.011,
  maxTorsoCorrectionMeters: 0.0129,
  skirtOutwardMeters: 0.018,
  maxHemDropMeters: 0.006,
  folds: 7,
  frontProtectedCos: 0.68,
  releaseAuthorized: false,
  humanVisualApproval: false,
  collisionValidated: false
});

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const smooth = (a, b, x) => { const t = clamp((x-a)/(b-a), 0, 1); return t*t*(3-2*t); };

/** Re-measure source body sections; this does not deform or attach body meshes. */
function bodySections61(root) {
  root.updateMatrixWorld(true);
  const tris=[],bones=new Map();
  root.traverse(m=>{
    if(m.isBone)bones.set(m.name,m.getWorldPosition(new T.Vector3()));
    if(!m.isSkinnedMesh||m.userData.work56Garment)return;
    const g=m.geometry,p=g.attributes.position;
    for(let i=0;i<(g.index?.count||p.count);i+=3){
      const v=[0,1,2].map(k=>new T.Vector3().fromBufferAttribute(p,g.index?g.index.getX(i+k):i+k).applyMatrix4(m.matrixWorld));
      tris.push({v,low:Math.min(...v.map(q=>q.y)),high:Math.max(...v.map(q=>q.y))});
    }
  });
  const waist=bones.get('spine04'),neck=bones.get('neck01'),shoulders=['L','R'].map(s=>bones.get('upperarm01'+s));
  if(!waist||!neck||shoulders.some(q=>!q)||tris.length<1000)throw Error('P61 original anatomical torso and shoulder landmarks required');
  const cache=new Map();
  function section(y){
    const key=y.toFixed(6);if(cache.has(key))return cache.get(key);const edges=[];
    for(const {v,low,high}of tris){if(y<low||y>high)continue;const hits=[];
      for(let k=0;k<3;k++){const a=v[k],b=v[(k+1)%3];if((a.y<=y&&b.y>y)||(b.y<=y&&a.y>y))hits.push(a.clone().lerp(b,(y-a.y)/(b.y-a.y)));}
      if(hits.length===2)edges.push(hits);
    }
    if(edges.length<10)throw Error('P61 missing original body cross-section');cache.set(key,edges);return edges;
  }
  function radius(y,angle){
    const edges=section(y),axis=[];
    for(const [a,b]of edges)if((a.x<=waist.x&&b.x>waist.x)||(b.x<=waist.x&&a.x>waist.x))axis.push(T.MathUtils.lerp(a.z,b.z,(waist.x-a.x)/(b.x-a.x)));
    if(axis.length<2)throw Error('P61 missing sagittal body section');
    const origin=new T.Vector3(waist.x,y,(Math.min(...axis)+Math.max(...axis))/2),dx=Math.sin(angle),dz=Math.cos(angle);let nearest=Infinity;
    for(const [a,b]of edges){const ex=b.x-a.x,ez=b.z-a.z,den=dx*ez-dz*ex;if(Math.abs(den)<1e-12)continue;const ax=a.x-origin.x,az=a.z-origin.z,t=(ax*ez-az*ex)/den,u=(ax*dz-az*dx)/den;if(t>.008&&u>=-1e-7&&u<=1.0000001)nearest=Math.min(nearest,t);}
    if(!Number.isFinite(nearest)||nearest>.6)throw Error('P61 body ray missed measured torso');return {origin,radius:nearest};
  }
  return {waist,neck,shoulders,radius};
}

/** Geometry-only physical shape of the skirt's side/rear fall. */
export function skirtFold61({theta, t}) {
  if (!Number.isFinite(theta) || !Number.isFinite(t) || t < 0 || t > 1)
    throw Error('Finite normalized source skirt coordinates required');
  const front = Math.cos(theta);
  const sideRear = 1 - smooth(.30, DRESS_DRAPE_61.frontProtectedCos, front);
  const fall = smooth(.08, .94, t);
  if (sideRear < 1e-8 || fall < 1e-8) return { outward: 0, drop: 0 };
  const phase = DRESS_DRAPE_61.folds*theta + .58*t + .17*Math.sin(2*theta);
  const pleat = .16 + .84*Math.pow(.5 + .5*Math.cos(phase), 1.55);
  const bias = .82 + .18*Math.sin(2.4*theta + .4)**2;
  return {
    outward: DRESS_DRAPE_61.skirtOutwardMeters * sideRear * fall * pleat * bias,
    drop: DRESS_DRAPE_61.maxHemDropMeters * sideRear * Math.pow(t, 2.4) * (.35 + .65*pleat)
  };
}

/**
 * Pull the photographed bodice toward measured body sections and soften the
 * lower side/rear skirt with bounded, gravity-biased relief. The actual source
 * texture, `dressRest`, skin indices and weights stay byte-for-byte unchanged.
 */
export function refinePhotographedDress61(dress, root, {enabled=true}={}) {
  if (enabled === false) return dress;
  if (enabled !== true || !dress?.mesh?.isSkinnedMesh ||
      dress.stats?.sourceId !== DRESS_DRAPE_61.sourceId ||
      dress.stats?.sourceSHA256 !== 'e7a617cd23a159864f619e8397d5f37d48b684e47dddc4ad6b46b14481042019' ||
      dress.stats?.anatomicalDress !== true || dress.stats?.actualOpenArmholes !== true ||
      dress.stats?.releaseAuthorized !== false || dress.stats?.collisionValidated !== false ||
      !root?.isObject3D)
    throw Error('P61 only accepts the pinned unapproved anatomical Commons 0053 dress');
  const mesh=dress.mesh, g=mesh.geometry;
  const p=g.getAttribute('position'), rest=g.getAttribute('dressRest');
  const si=g.getAttribute('skinIndex'), sw=g.getAttribute('skinWeight');
  const uv=g.getAttribute('uv');
  if (!p || !rest || !si || !sw || p.count<2000 || p.count!==rest.count ||
      p.count!==si.count || p.count!==sw.count)
    throw Error('P61 requires the existing skinned fitted dress mesh');
  const snapshots={rest:rest.array.slice(),si:si.array.slice(),sw:sw.array.slice(),
    uv:uv?.array.slice()||null,material:mesh.material};
  root.updateMatrixWorld(true); mesh.updateWorldMatrix(true,false);
  const body=bodySections61(root), waist=body.waist.y;
  const shoulderY=Math.min(...body.shoulders.map(s=>s.y));
  const bodiceLow=waist+.025, bodiceHigh=shoulderY-.055;
  if (!(bodiceHigh-bodiceLow>.10)) throw Error('Measured torso sections do not cover dress bodice');
  const inv=mesh.matrixWorld.clone().invert(), world=new T.Vector3(), edits=[];
  let torsoVertices=0,skirtVertices=0,frontProtected=0,maxTorso=0,maxSkirt=0;
  let hem=Infinity;
  for(let i=0;i<rest.count;i++) hem=Math.min(hem,rest.getY(i));
  const skirtTransition=hem+.33;
  if (!Number.isFinite(hem) || skirtTransition>1.30) throw Error('Unsafe source skirt extent');

  // Stage all target positions first; any bad sample fails without mutation.
  for(let i=0;i<p.count;i++) {
    world.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);
    const sourceY=rest.getY(i);
    let moved=world.clone(), kind='';
    if(sourceY>bodiceLow && sourceY<bodiceHigh) {
      const theta=Math.atan2(world.x-body.waist.x, world.z-body.waist.z);
      const section=body.radius(world.y,theta);
      const dx=world.x-section.origin.x, dz=world.z-section.origin.z;
      const radius=Math.hypot(dx,dz);
      if(radius<.05) throw Error('Invalid measured bodice radius');
      const current=radius-section.radius;
      const blend=smooth(bodiceLow,bodiceLow+.11,sourceY) *
        (1-smooth(bodiceHigh-.10,bodiceHigh,sourceY));
      const correction=clamp((DRESS_DRAPE_61.torsoClearanceMeters-current)*blend,
        -DRESS_DRAPE_61.maxTorsoCorrectionMeters,DRESS_DRAPE_61.maxTorsoCorrectionMeters);
      if(Math.abs(correction)>.0001) {
        const target=Math.max(.006,radius+correction),scale=target/radius;
        moved.set(section.origin.x+dx*scale,world.y,section.origin.z+dz*scale);
        kind='torso';
      }
    } else if(sourceY<skirtTransition) {
      const t=clamp((skirtTransition-sourceY)/(skirtTransition-hem),0,1);
      const theta=Math.atan2(world.x-body.waist.x,world.z-body.waist.z);
      const fold=skirtFold61({theta,t});
      if(Math.cos(theta)>=DRESS_DRAPE_61.frontProtectedCos) frontProtected++;
      const dx=world.x-body.waist.x,dz=world.z-body.waist.z,r=Math.hypot(dx,dz);
      if(r<.05) throw Error('Skirt fold approaches anatomical center axis');
      moved.set(world.x+fold.outward*dx/r,world.y-fold.drop,world.z+fold.outward*dz/r);
      if(fold.outward>.0001 || fold.drop>.0001) kind='skirt';
    }
    if(kind) {
      const distance=world.distanceTo(moved);
      const limit=kind==='torso'?DRESS_DRAPE_61.maxTorsoCorrectionMeters:
        Math.hypot(DRESS_DRAPE_61.skirtOutwardMeters,DRESS_DRAPE_61.maxHemDropMeters)+1e-5;
      if(!Number.isFinite(distance)||distance>limit) throw Error(`P61 bounded displacement exceeded at vertex ${i}: ${kind} ${distance.toFixed(8)}m > ${limit.toFixed(8)}m`);
      moved.applyMatrix4(inv);
      if(![moved.x,moved.y,moved.z].every(Number.isFinite))throw Error('P61 generated nonfinite position');
      edits.push({i,moved,kind,distance});
      if(kind==='torso'){torsoVertices++;maxTorso=Math.max(maxTorso,distance);}
      else {skirtVertices++;maxSkirt=Math.max(maxSkirt,distance);}
    }
  }
  if(torsoVertices<100 || skirtVertices<100 || frontProtected<100 || maxTorso<.001 || maxSkirt<.001)
    throw Error('P61 could not demonstrate bounded bodice and skirt geometry changes');
  for(const {i,moved} of edits)p.setXYZ(i,moved.x,moved.y,moved.z);
  p.needsUpdate=true; g.computeBoundingBox(); g.computeBoundingSphere();
  const equal=(a,b)=>a?.length===b?.length&&a.every((x,i)=>x===b[i]);
  if(!equal(rest.array,snapshots.rest)||!equal(si.array,snapshots.si)||
     !equal(sw.array,snapshots.sw)||(uv&&!equal(uv.array,snapshots.uv))||mesh.material!==snapshots.material)
    throw Error('P61 changed source mapping, skinning, or material provenance');
  return {...dress,stats:{...dress.stats,
    photographedDressDrape61:true,torsoVertices61:torsoVertices,skirtVertices61:skirtVertices,
    maxTorsoMovementMeters61:maxTorso,maxSkirtMovementMeters61:maxSkirt,
    skirtTransitionSourceY61:skirtTransition,frontProtectedVertices61:frontProtected,
    originalRestPhotoCoordinatesUnchanged61:true,sourceSHA256Preserved61:true,
    sourceTextureAndMaterialPreserved61:true,skinIndicesAndWeightsPreserved61:true,
    armholeAndShoulderTopologyPreserved61:true,physicsSimulation:false,
    bodyIntersectionAudit:false,arbitraryOwnerPhotos3DApproved:false,
    humanVisualApproval:false,releaseAuthorized:false}};
}
