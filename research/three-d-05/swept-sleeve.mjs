/**
 * Closet Current 3D-05 — original procedural, source-color-only sleeve geometry.
 *
 * Use an actual ring plane perpendicular to the tilted arm centerline.
 * Previous 3D sleeve rings were horizontal discs stacked at different x:
 * that creates visible sharp tube/shoulder intersections.
 *
 * This is NOT inferred real garment dimensions, skinning, cloth simulation,
 * source-image manipulation or a visual-acceptance determination.
 */
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const profile=Object.freeze({
 long:Object.freeze([
  {y:1.245,x:.630,rx:.108,rz:.111},
  {y:1.36,x:.626,rx:.115,rz:.119},
  {y:1.55,x:.603,rx:.124,rz:.127},
  {y:1.76,x:.564,rx:.136,rz:.144},
  {y:1.94,x:.493,rx:.156,rz:.157},
  {y:2.09,x:.415,rx:.174,rz:.17},
  {y:2.16,x:.36,rx:.185,rz:.175}
 ]),
 short:Object.freeze([
  {y:1.81,x:.551,rx:.144,rz:.145},
  {y:1.93,x:.500,rx:.154,rz:.16},
  {y:2.08,x:.419,rx:.173,rz:.17},
  {y:2.16,x:.36,rx:.185,rz:.175}
 ])
});
const safeColor=c=>Array.isArray(c)&&c.length===3&&c.every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1);
export function sleeveCenterline({side=1,shoulderScale=1,length='long'}={}){
 if(![-1,1].includes(side)||typeof shoulderScale!=='number'||
  !Number.isFinite(shoulderScale)||shoulderScale<.7||shoulderScale>1.2||
  !Object.hasOwn(profile,length))throw Error('Unsupported mannequin arm or sleeve');
 return profile[length].map(p=>Object.freeze({
  y:p.y,x:side*p.x*shoulderScale,z:0,rx:p.rx*shoulderScale,rz:p.rz
 }));
}
export function buildSweptSleeve({side=1,shoulderScale=1,length='long',color=[.2,.2,.2],segments=32}={}){
 if(!safeColor(color)||!Number.isSafeInteger(segments)||segments<12||segments>64)
  throw Error('Invalid 3D sleeve parameters');
 const rings=sleeveCenterline({side,shoulderScale,length});
 const vertices=[],indices=[],crossSectionCenters=[];
 for(let i=0;i<rings.length;i++){
  const p=rings[i],a=rings[Math.max(0,i-1)],b=rings[Math.min(rings.length-1,i+1)];
  const dx=b.x-a.x,dy=b.y-a.y,m=Math.hypot(dx,dy);
  if(m<1e-8)throw Error('Degenerate sleeve centerline');
  // Cross-sections follow the arm's sloped centerline at the cuff/elbow.
  // Near the shoulder, ease their tilt toward the horizontal torso seam:
  // a fully tilted proximal ring previously rose above the shoulder as a
  // sharp black horn in the real licensed-photo browser screenshot.
  const fade=1-.88*clamp((p.y-1.90)/.26,0,1);
  const tilt=Math.atan2(-dx,dy)*fade;
  const ux=Math.cos(tilt),uy=Math.sin(tilt);
  crossSectionCenters.push(Object.freeze({x:p.x,y:p.y,z:0,rx:p.rx,rz:p.rz,
   ringNormal:[-uy,ux,0],shoulderBlend:1-fade}));
  for(let j=0;j<=segments;j++){
   const theta=-Math.PI+j*2*Math.PI/segments;
   const sn=Math.sin(theta),cs=Math.cos(theta);
   const nx0=sn*ux/p.rx,ny0=sn*uy/p.rx,nz0=cs/p.rz;
   const norm=Math.hypot(nx0,ny0,nz0);
   const x=p.x+sn*ux*p.rx,y=p.y+sn*uy*p.rx,z=cs*p.rz;
   vertices.push(x,y,z,nx0/norm,ny0/norm,nz0/norm,
    clamp(.5+.49*sn,.001,.999),(p.y-rings[0].y)/(rings.at(-1).y-rings[0].y),Math.max(0,cs));
   if(i<rings.length-1&&j<segments){
    const n=i*(segments+1)+j,k=n+segments+1;
    indices.push(n,k,n+1,n+1,k,k+1);
   }
  }
 }
 return Object.freeze({
  name:'shirt sleeve '+side,part:'garment',
  material:{name:'source-color sleeve '+side,color:[...color],photographed:false},
  vertices:new Float32Array(vertices),indices:new Uint16Array(indices),stride:9,
  photoRegion:[0,0,1,1],bounds:{minY:rings[0].y,maxY:rings.at(-1).y},
  crossSectionCenters,
  attachment:'anatomic-arm-axis-plus-torso-overlap',
  surface:'swept-circumferential-mesh-not-horizontal-cylinders',
  originalPhotoRequired:false,clothPhysics:false,releaseAuthorized:false
 });
}
