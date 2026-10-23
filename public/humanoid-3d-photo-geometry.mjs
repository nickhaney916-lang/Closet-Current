/** Issue #243 research extension of #232 meshes. Arbitrary units, NOT body sizing. */
import {ellipsoid,createBodyGeometry} from './humanoid-3d-body-geometry.mjs';
const tau=Math.PI*2,unit=v=>{const n=Math.hypot(...v)||1;return v.map(x=>x/n);};
export const torsoProfile=Object.freeze([[.88,.25,.13],[.82,.325,.16],[.66,.31,.165],[.44,.265,.145],[.19,.225,.135],[.04,.25,.15]].map(Object.freeze));
export const shellClearance=Object.freeze({top:.018,layer:.040,layer2:.066,layer3:.094,dress:.024});
export function contourMesh(profile,{x=0,z=0,lean=0,segments=32,gap=0,uvTop=profile?.[0]?.[0],uvBottom=profile?.at(-1)?.[0],uvWidth=.7}={}){
 if(!Array.isArray(profile)||profile.length<2||profile.length>32||!Number.isInteger(segments)||segments<8||segments>64||
  ![x,z,lean,gap,uvTop,uvBottom,uvWidth].every(Number.isFinite)||uvTop<=uvBottom||uvWidth<=0||gap<0||gap>.5||
  profile.some((r,i)=>!Array.isArray(r)||r.length!==3||!r.every(Number.isFinite)||r[1]<=0||r[2]<=0||i&&r[0]>=profile[i-1][0]))throw Error('Invalid contoured mesh');
 const rows=profile.map(([y,rx,rz],k)=>{
  const previous=profile[Math.max(0,k-1)],next=profile[Math.min(profile.length-1,k+1)],dy=next[0]-previous[0];
  const dx=(next[1]-previous[1])/dy,dz=(next[2]-previous[2])/dy;
  return Array.from({length:segments+1},(_,j)=>{
   const a=-Math.PI+tau*j/segments,s=Math.sin(a),c=Math.cos(a),t=(profile[0][0]-y)/(profile[0][0]-profile.at(-1)[0]);
   const px=x+lean*t+rx*s,n=unit([s/rx,-(s*s*dx/rx+c*c*dz/rz),c/rz]);
   return [px,y,z+rz*c,...n,.5+px/uvWidth,(uvTop-y)/(uvTop-uvBottom)];
  });
 });
 const out=[];
 for(let k=0;k<rows.length-1;k++)for(let j=0;j<segments;j++){
  const a=-Math.PI+tau*(j+.5)/segments;if(gap&&Math.abs(a)<gap)continue;
  const A=rows[k][j],B=rows[k][j+1],C=rows[k+1][j],D=rows[k+1][j+1];out.push(...A,...C,...B,...B,...C,...D);
 }
 return new Float32Array(out);
}
function oval(p){
 const input=ellipsoid(p),out=[];
 for(let i=0;i<input.length;i+=6){const [x,y,z]=input.subarray(i,i+3),n=unit([(x-(p.x||0))/p.rx**2,(y-(p.y||0))/p.ry**2,(z-(p.z||0))/p.rz**2]);out.push(x,y,z,...n,.5+x/.8,.5-y/3);}
 return new Float32Array(out);
}
export function createPhotoHumanoidGeometry(garments=[]){
 if(!Array.isArray(garments)||garments.length>6)throw Error('Invalid garment geometry selection');
 const seen=new Set();for(const g of garments){if(!g||!['top','bottom','shoes','layer','layer2','layer3'].includes(g.slot)||seen.has(g.slot))throw Error('Invalid or duplicate garment slot');seen.add(g.slot);}
 const dress=garments.find(g=>g.slot==='top'&&g.category==='Dresses');
 if(dress&&garments.some(g=>!['top','shoes'].includes(g.slot)))throw Error('Dress conflicts with separates/layers');
 const parts=[],add=(id,key,vertices,photo=false)=>parts.push({id,key,vertices,photo});
 // Reuse the existing authored hand meshes, refine head/neck/limb proportions.
 for(const p of createBodyGeometry().filter(p=>p.id.endsWith('-hand'))){const a=[];for(let i=0;i<p.vertices.length;i+=6)a.push(...p.vertices.subarray(i,i+6),0,0);add(p.id,'skin',new Float32Array(a));}
 add('head','skin',oval({y:1.22,rx:.127,ry:.18,rz:.133,segments:32,rings:18}));
 add('nose','skin',oval({y:1.21,z:.132,rx:.024,ry:.034,rz:.033,segments:16,rings:10}));
 add('neck','skin',contourMesh([[1.07,.063,.065],[.91,.083,.078]]));
 add('body','skin',contourMesh(torsoProfile));
 add('pelvis','skin',contourMesh([[.05,.245,.15],[-.18,.275,.18],[-.31,.25,.16]]));
 for(const side of [-1,1]){
  const name=side<0?'left':'right';
  add(name+'-ear','skin',oval({x:side*.13,y:1.22,rx:.022,ry:.043,rz:.022,segments:12,rings:8}));
  add(name+'-eye','detail',oval({x:side*.047,y:1.255,z:.122,rx:.024,ry:.008,rz:.011,segments:12,rings:8}));
  add(name+'-shoulder','skin',oval({x:side*.335,y:.78,rx:.14,ry:.12,rz:.09,segments:24,rings:12}));
  add(name+'-arm','skin',contourMesh([[.79,.092,.085],[.52,.08,.075],[.25,.062,.062],[-.045,.051,.053]],{x:side*.37,lean:side*.17}));
  add(name+'-leg','skin',contourMesh([[-.23,.125,.127],[-.60,.094,.095],[-.73,.10,.098],[-1.14,.065,.074]],{x:side*.15,lean:side*.045}));
  add(name+'-foot','skin',oval({x:side*.195,y:-1.205,z:.08,rx:.10,ry:.074,rz:.20}));
 }
 for(const g of garments){
  const key=g.slot;
  if(key==='top'&&dress){
   add('dress-bodice',key,contourMesh(torsoProfile.map(([y,rx,rz])=>[y,rx+.024,rz+.024]),{uvTop:.88,uvBottom:-.86,uvWidth:.9}),true);
   add('dress-skirt',key,contourMesh([[.045,.275,.177],[-.3,.325,.21],[-.61,.39,.25],[-.86,.44,.275]],{uvTop:.88,uvBottom:-.86,uvWidth:.9}),true);
  }else if(['top','layer','layer2','layer3'].includes(key)){
   const d=shellClearance[key],profile=torsoProfile.map(([y,rx,rz])=>[y,rx+d,rz+d]);
   if(key==='layer2')profile.push([-.12,.285+d,.17+d]);
   if(key==='layer3')profile.push([-.52,.33+d,.21+d]);
   const open=['layer2','layer3'].includes(key);
   add(key+'-contoured-shell',key,contourMesh(profile,{gap:open?.22:0,uvTop:.88,uvBottom:profile.at(-1)[0],uvWidth:.82}),true);
   const long=key!=='top'||g.sleeveLength==='Long sleeve';
   for(const s of [-1,1]){
    // Rounded estimated shoulder bridges the open sleeve ring and torso shell.
    add(key+(s<0?'-left-shoulder':'-right-shoulder'),key,oval({x:s*.335,y:.78,rx:.14+d,ry:.12,rz:.09+d,segments:24,rings:12}));
    add(key+(s<0?'-left-sleeve':'-right-sleeve'),key,contourMesh([[.79,.105+d,.09+d],[.50,.085+d,.078+d],...(long?[[.24,.07+d,.062+d],[-.045,.061+d,.056+d]]:[])],{x:s*.37,lean:s*(long?.17:.06)}));
   }
  }else if(key==='bottom'){
   if(g.itemType==='Skirt')add('separate-skirt',key,contourMesh([[.04,.27,.17],[-.35,.33,.21],[-.77,.405,.26]],{uvTop:.04,uvBottom:-.77,uvWidth:.85}),true);
   else{
    add('trouser-waist',key,contourMesh([[.05,.267,.17],[-.20,.30,.197],[-.30,.273,.18]],{uvTop:.05,uvBottom:-1.14,uvWidth:.68}),true);
    for(const s of [-1,1])add(s<0?'left-trouser':'right-trouser',key,contourMesh([[-.25,.142,.144],[-.56,.115,.12],...(g.itemType==='Shorts'?[]:[[-.75,.112,.115],[-1.14,.088,.095]])],{x:s*.15,lean:s*.045,uvTop:.05,uvBottom:-1.14,uvWidth:.68}),true);
   }
  }else if(key==='shoes'){
   for(const s of [-1,1]){
    add(s<0?'left-shoe':'right-shoe',key,oval({x:s*.195,y:-1.20,z:.09,rx:.12,ry:.09,rz:.235}),true);
    add(s<0?'left-sole':'right-sole',key,oval({x:s*.195,y:-1.267,z:.08,rx:.122,ry:.024,rz:.24}));
    if(/boots/i.test(g.itemType||''))add(s<0?'left-boot-upper':'right-boot-upper',key,contourMesh([[-.88,.104,.11],[-1.17,.105,.105]],{x:s*.195}));
   }
  }
 }
 return parts;
}
