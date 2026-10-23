/**
 * Procedural HUMAN-SHAPED mesh reference, authored locally for the research UI.
 * Units are arbitrary: no anatomy, size, garment fit, or drape measurements.
 * Does not import any third-party asset, weight, texture, or personal photo.
 */
const TAU=Math.PI*2;
const tri=(a,b,c,out)=>{out.push(...a,...b,...c);};
function normal(x,y,z){const n=Math.hypot(x,y,z)||1;return [x/n,y/n,z/n];}
function pushTriangle(a,b,c,out){
 const cross=(u,v)=>[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
 const ab=b.map((v,i)=>v-a[i]),ac=c.map((v,i)=>v-a[i]),n=normal(...cross(ab,ac));
 for(const p of [a,b,c])out.push(...p,...n);
}
function cap(out,ring,center,reverse=false){
 for(let j=0;j<ring.length;j++){
  const a=ring[j],b=ring[(j+1)%ring.length];
  if(reverse)pushTriangle(center,b,a,out);else pushTriangle(center,a,b,out);
 }
}
export function taperedLimb({x=0,z=0,top,bottom,rTop,rBottom,depth=0.82,lean=0,segments=14,rings=6}){
 if(![x,z,top,bottom,rTop,rBottom,depth,lean].every(Number.isFinite)||top<=bottom||rTop<=0||rBottom<=0)throw new TypeError('Invalid humanoid part');
 const out=[],circle=[];
 for(let k=0;k<=rings;k++){
  const t=k/rings,y=top+(bottom-top)*t;
  const radius=rTop+(rBottom-rTop)*t;
  const centerX=x+lean*t;
  const ring=[];
  for(let i=0;i<segments;i++){
   const a=TAU*i/segments;
   ring.push([centerX+Math.cos(a)*radius,y,z+Math.sin(a)*radius*depth]);
  }
  circle.push(ring);
 }
 for(let k=0;k<rings;k++)for(let i=0;i<segments;i++){
  const a=circle[k][i],b=circle[k][(i+1)%segments],c=circle[k+1][i],d=circle[k+1][(i+1)%segments];
  pushTriangle(a,b,c,out);pushTriangle(b,d,c,out);
 }
 cap(out,circle[0],[x,top,z],true);
 cap(out,circle[rings],[x+lean,bottom,z],false);
 return new Float32Array(out);
}
export function ellipsoid({x=0,y=0,z=0,rx,ry,rz,segments=18,rings=12}){
 if(![x,y,z,rx,ry,rz].every(Number.isFinite)||Math.min(rx,ry,rz)<=0)throw new TypeError('Invalid ellipsoid');
 const out=[];
 const surface=(t,p)=>[x+rx*Math.sin(t)*Math.cos(p),y+ry*Math.cos(t),z+rz*Math.sin(t)*Math.sin(p)];
 for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){
  const t0=Math.PI*j/rings,t1=Math.PI*(j+1)/rings,p0=TAU*i/segments,p1=TAU*(i+1)/segments;
  const a=surface(t0,p0),b=surface(t0,p1),c=surface(t1,p0),d=surface(t1,p1);
  pushTriangle(a,c,b,out);pushTriangle(b,c,d,out);
 }
 return new Float32Array(out);
}
export function createBodyGeometry(){
 const shapes=[];
 const tube=(key,id,params)=>shapes.push({key,id,vertices:taperedLimb(params)});
 const oval=(key,id,params)=>shapes.push({key,id,vertices:ellipsoid(params)});
 // Approximate 7.5-head silhouette, narrowing waist, independent legs/arms.
 oval('skin','head',{x:0,y:1.20,rx:.175,ry:.24,rz:.16});
 tube('skin','neck',{top:.98,bottom:.83,rTop:.075,rBottom:.095});
 tube('top','torso',{top:.80,bottom:.05,rTop:.33,rBottom:.235,depth:.66,rings:10});
 tube('skin','left-hand',{x:-.54,top:-.03,bottom:-.23,rTop:.075,rBottom:.060,lean:-.025});
 tube('skin','right-hand',{x:.54,top:-.03,bottom:-.23,rTop:.075,rBottom:.060,lean:.025});
 for(const sign of [-1,1]){
  tube('top',sign<0?'left-shirt-sleeve':'right-shirt-sleeve',
   {x:sign*.39,top:.72,bottom:.10,rTop:.115,rBottom:.082,lean:sign*.13,depth:.88});
  tube('bottom',sign<0?'left-leg':'right-leg',
   {x:sign*.155,top:-.28,bottom:-1.13,rTop:.142,rBottom:.10,lean:sign*.045,depth:.90});
  oval('shoes',sign<0?'left-shoe':'right-shoe',
   {x:sign*.205,y:-1.20,z:.08,rx:.145,ry:.095,rz:.25});
 }
 tube('bottom','hips',{top:.11,bottom:-.34,rTop:.235,rBottom:.285,depth:.80});
 // Surface overlays are slightly larger to avoid z fighting; never simulate drape.
 tube('layer','sweater-shell',{top:.805,bottom:.015,rTop:.352,rBottom:.265,depth:.74});
 tube('layer2','jacket-shell',{top:.825,bottom:-.06,rTop:.372,rBottom:.275,depth:.81});
 tube('layer3','coat-shell',{top:.835,bottom:-.42,rTop:.397,rBottom:.32,depth:.90});
 // Dresses deliberately replace trousers and outer layers in this prototype.
 tube('dress','dress-bodice',{top:.81,bottom:.045,rTop:.35,rBottom:.26,depth:.77});
 tube('dress','dress-skirt',{top:.045,bottom:-.77,rTop:.25,rBottom:.445,depth:.85});
 return shapes;
}
