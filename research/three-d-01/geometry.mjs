/**
 * Closet Current — genuine WebGL prototype geometry, NOT apparel reconstruction.
 * Garment templates are original procedural 3D meshes with volume. The existing
 * 2D clothing slots map to these templates. All measurements are approximations.
 * No browser, network, storage, file access, AI calls or PII.
 */
export const TYPES=Object.freeze(['shirt','pants','dress']);
export const SLOTS=Object.freeze({shirt:'top',pants:'bottom',dress:'dress'});
const ring=(y,rx,rz,x=0,z=0)=>({y,rx,rz,x,z});
const material=(name,color,photographed=false)=>({name,color,photographed});
function tube(name,rings,{segments=32,color=[.75,.76,.76],photographed=false,part='body',photoRegion=[0,0,1,1]}={}){
 if(!Array.isArray(rings)||rings.length<2||rings.length>32||
  !Number.isSafeInteger(segments)||segments<8||segments>64||
  rings.some(r=>!Number.isFinite(r.y)||!Number.isFinite(r.rx)||!Number.isFinite(r.rz)||r.rx<=0||r.rz<=0))
  throw Error('Invalid 3D garment rings');
 const yMin=Math.min(...rings.map(r=>r.y)),yMax=Math.max(...rings.map(r=>r.y));
 if(yMax===yMin)throw Error('Zero garment height');
 const vertices=[],indices=[];
 for(let i=0;i<rings.length;i++){
  const r=rings[i];
  for(let j=0;j<=segments;j++){
   const theta=-Math.PI+j*2*Math.PI/segments;
   const sn=Math.sin(theta),cs=Math.cos(theta);
   const x=(r.x||0)+r.rx*sn,z=(r.z||0)+r.rz*cs;
   const nx=sn/r.rx,nz=cs/r.rz,m=Math.hypot(nx,nz);
   // position xyz, outward radial normal xyz, source-photo uv, front flag
   vertices.push(x,r.y,z,nx/m,0,nz/m,.5+.49*sn,(r.y-yMin)/(yMax-yMin),Math.max(0,cs));
   if(i<rings.length-1&&j<segments){
    const a=i*(segments+1)+j,b=a+segments+1;
    indices.push(a,b,a+1,a+1,b,b+1);
   }
  }
 }
 return {name,part,material:material(name,color,photographed),
  vertices:new Float32Array(vertices),indices:new Uint16Array(indices),stride:9,
  photoRegion, bounds:{minY:yMin,maxY:yMax},surface:'true-3d-closed-circumference'};
}
function sphere(name,center,radius,color,lat=12,lon=24){
 const vertices=[],indices=[];
 for(let i=0;i<=lat;i++){
  const p=i*Math.PI/lat;
  for(let j=0;j<=lon;j++){
   const t=j*2*Math.PI/lon,ny=Math.cos(p),nx=Math.sin(p)*Math.sin(t),nz=Math.sin(p)*Math.cos(t);
   vertices.push(center[0]+nx*radius[0],center[1]+ny*radius[1],center[2]+nz*radius[2],nx,ny,nz,
    j/lon,i/lat,0);
   if(i<lat&&j<lon){const a=i*(lon+1)+j,b=a+lon+1;indices.push(a,a+1,b,a+1,b+1,b);}
  }
 }
 return {name,part:'body',material:material(name,color),vertices:new Float32Array(vertices),
  indices:new Uint16Array(indices),stride:9,surface:'true-3d-ellipsoid'};
}
const MODEL=Object.freeze({
 adult:{shoulder:1,hip:1,height:1},
 youth:{shoulder:.91,hip:.92,height:.94}
});
export function buildAvatarScene({type='shirt',body='adult',photoEnabled=true,sleeveLength='short'}={}){
 if(!TYPES.includes(type)||!Object.hasOwn(MODEL,body)||typeof photoEnabled!=='boolean'||!['short','long'].includes(sleeveLength))
  throw Error('Unsupported 3D garment or figure');
 const scale=MODEL[body],s=scale.shoulder;
 const skin=[.64,.67,.69],cloth=type==='shirt'?[.67,.22,.29]:type==='pants'?[.21,.34,.55]:[.39,.43,.62];
 const parts=[
  tube('humanoid torso',[ring(1.23,.25*s,.15),ring(1.62,.30*s,.19),ring(1.99,.34*s,.20),ring(2.22,.28*s,.18)],{color:skin}),
  tube('humanoid neck',[ring(2.21,.10,.10),ring(2.45,.10,.10)],{color:skin}),
  sphere('humanoid head',[0,2.67,0],[.20,.27,.18],skin),
  tube('body left leg',[ring(.10,.105,.105,-.15),ring(1.26,.15,.15,-.15)],{color:skin}),
  tube('body right leg',[ring(.10,.105,.105,.15),ring(1.26,.15,.15,.15)],{color:skin}),
  tube('body left arm',[ring(1.25,.09,.09,-.62),ring(2.13,.11,.11,-.38)],{color:skin}),
  tube('body right arm',[ring(1.25,.09,.09,.62),ring(2.13,.11,.11,.38)],{color:skin})
 ];
 if(type==='shirt'){
  parts.push(tube('shirt torso',[
   ring(1.33,.315*s,.205),ring(1.70,.345*s,.225),ring(2.02,.40*s,.24),
   ring(2.15,.375*s,.227),ring(2.265,.13*s,.115)
  ],{color:cloth,part:'garment',photographed:photoEnabled}));
  for(const side of [-1,1]){
   const sleeveRings=sleeveLength==='long'?
    [ring(1.25,.112,.12,.63*s*side),ring(1.55,.132,.145,.605*s*side),
     ring(1.85,.147,.153,.535*s*side),ring(2.12,.17,.17,.39*s*side)]:
    [ring(1.81,.145,.15,.55*s*side),ring(2.11,.16,.16,.39*s*side)];
   parts.push(tube('shirt sleeve '+side,sleeveRings,{
    color:cloth,part:'garment',photographed:false
   }));
  }
 }else if(type==='pants'){
  parts.push(tube('pants hips',[ring(1.08,.29*s,.20),ring(1.36,.32*s,.23)],{color:cloth,part:'garment',photographed:photoEnabled}));
  for(const side of [-1,1])parts.push(tube('pants leg '+side,
   [ring(.14,.135,.14,.164*s*side),ring(.78,.155,.16,.164*s*side),ring(1.24,.168,.17,.164*s*side)],{color:cloth,part:'garment',photographed:photoEnabled}));
 }else{
  parts.push(tube('dress bodice',[ring(1.30,.29*s,.21),ring(1.70,.34*s,.22),ring(2.06,.38*s,.23),ring(2.17,.355*s,.22),ring(2.26,.135*s,.12)],{color:cloth,part:'garment',photographed:photoEnabled,photoRegion:[0,0,1,.49]}));
  parts.push(tube('dress skirt',[ring(.50,.57*s,.41),ring(.90,.46*s,.32),ring(1.38,.30*s,.23)],{color:cloth,part:'garment',photographed:photoEnabled,photoRegion:[0,.39,1,.61]}));
  for(const side of [-1,1])parts.push(tube('dress sleeve '+side,
   [ring(1.89,.13,.14,.51*s*side),ring(2.12,.16,.16,.37*s*side)],{color:cloth,part:'garment',photographed:false}));
 }
 const triangles=parts.reduce((n,p)=>n+p.indices.length/3,0);
 return Object.freeze({type,slot:SLOTS[type],body,parts,triangles,
  rearMaterial:'inferred-neutral-color',geometry:'static-template-no-cloth-simulation',
  humanVisualApproval:false,releaseAuthorized:false,offline:true});
}
export function validateReviewedTexture({rgba,width,height,slot,reviewConfirmed=false}={}){
 if(!['top','bottom','dress'].includes(slot)||reviewConfirmed!==true||
  !(rgba instanceof Uint8ClampedArray)||!Number.isInteger(width)||!Number.isInteger(height)||
  width<16||height<16||width*height>240*240||rgba.length!==width*height*4)
  return {allowed:false,reason:'review-or-bounded-RGBA-required',previewOnly:true,releaseAuthorized:false};
 let transparent=0,solid=0,edgeSolid=0,edges=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const a=rgba[(y*width+x)*4+3];if(a<=16)transparent++;if(a>=250)solid++;
  if(!x||!y||x===width-1||y===height-1){edges++;if(a>=250)edgeSolid++;}
 }
 const opaque=transparent===0||solid/(width*height)>.98&&edgeSolid/edges>.95;
 return {allowed:!opaque,reason:opaque?'opaque-photo-not-reviewed-cutout':'reviewed-but-still-manual-visual-review',
  previewOnly:true,releaseAuthorized:false};
}
