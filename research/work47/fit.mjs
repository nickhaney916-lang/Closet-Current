/** Offline fitting of actual source pixels. No mask creation, owner approval,
 * storage, requests or fabric synthesis. Callers must verify their source. */
export const BODY=Object.freeze({shoulders:[[115,145],[245,145]],waist:[[145,306],[215,306]]});
const point=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);
export function similarity(source,target){
 if(!Array.isArray(source)||!Array.isArray(target)||source.length!==2||target.length!==2||![...source,...target].every(point))throw Error('Two source and body anchors required');
 const [a,b]=source,[u,v]=target,dx=b[0]-a[0],dy=b[1]-a[1],d=dx*dx+dy*dy;
 if(d<16)throw Error('Anchor pair is too small');
 const A=((v[0]-u[0])*dx+(v[1]-u[1])*dy)/d,B=((v[1]-u[1])*dx-(v[0]-u[0])*dy)/d;
 return [A,B,-B,A,u[0]-A*a[0]+B*a[1],u[1]-B*a[0]-A*a[1]];
}
export const mapPoint=(m,p)=>[m[0]*p[0]+m[2]*p[1]+m[4],m[1]*p[0]+m[3]*p[1]+m[5]];
export function rotationAt(m,p,degrees){
 if(!Number.isFinite(degrees)||Math.abs(degrees)>35)throw Error('Sleeve rotation exceeds review limit');
 const [x,y]=mapPoint(m,p),c=Math.cos(degrees*Math.PI/180),s=Math.sin(degrees*Math.PI/180);
 return [c*m[0]-s*m[1],s*m[0]+c*m[1],c*m[2]-s*m[3],s*m[2]+c*m[3],x+c*(m[4]-x)-s*(m[5]-y),y+s*(m[4]-x)+c*(m[5]-y)];
}
export function planGarmentFit(width,height,profile,adjust={}){
 if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||width<16||height<16||width*height>8e6)throw Error('Invalid source size');
 if(!profile||!['top','layer','bottom','dress'].includes(profile.slot)||!Array.isArray(profile.anchors)||profile.anchors.length!==2||!profile.anchors.every(p=>point(p)&&p.every(n=>n>=0&&n<=1)))throw Error('Reviewed source landmarks required');
 const {dx=0,dy=0,scale=1}=adjust;
 if(![dx,dy,scale].every(Number.isFinite)||Math.abs(dx)>30||Math.abs(dy)>48||scale<.8||scale>1.2)throw Error('Unsafe fit adjustment');
 const base=profile.target||(profile.slot==='bottom'?BODY.waist:BODY.shoulders);
 if(!Array.isArray(base)||base.length!==2||!base.every(p=>point(p)&&p[0]>=80&&p[0]<=280&&p[1]>=120&&p[1]<=340))throw Error('Invalid body target');
 const target=base.map(([x,y])=>[180+(x-180)*scale+dx,base[0][1]+(y-base[0][1])*scale+dy]);
 const src=profile.anchors.map(([x,y])=>[x*width,y*height]);
 const m=similarity(src,target);
 const angle=Math.atan2(m[1],m[0]);if(Math.abs(angle)>Math.PI/6)throw Error('Source pose is not front facing');
 const panels=profile.panels||[{polygon:[[0,0],[1,0],[1,1],[0,1]]}];
 if(!panels.length||panels.length>4)throw Error('Invalid panel count');
 const pieces=panels.map(p=>{
  if(!p||!Array.isArray(p.polygon)||p.polygon.length<3||p.polygon.length>32||!p.polygon.every(v=>point(v)&&v.every(n=>n>=0&&n<=1)))throw Error('Invalid garment panel');
  if(p.rotate&&!point(p.pivot))throw Error('Sleeve pivot required');
  const matrix=p.rotate?rotationAt(m,[p.pivot[0]*width,p.pivot[1]*height],p.rotate):m;
  return {matrix,polygon:p.polygon.map(([x,y])=>[x*width,y*height])};
 });
 return {pieces,source:src,target,sourceRGBModified:false,mode:pieces.length>1?'rigid-panels':'rigid-anchors'};
}
export function paintGarmentFit(canvas,image,profile,adjust={}){
 const plan=planGarmentFit(image.naturalWidth,image.naturalHeight,profile,adjust);
 // Refuse fitting that would silently crop visible garment fabric. Sample only
 // for this guard; the actual garment is drawn from the native source image.
 const sample=canvas.ownerDocument.createElement('canvas');
 const ratio=Math.min(1,240/Math.max(image.naturalWidth,image.naturalHeight));
 sample.width=Math.ceil(image.naturalWidth*ratio);sample.height=Math.ceil(image.naturalHeight*ratio);
 const probe=sample.getContext('2d',{willReadFrequently:true});probe.drawImage(image,0,0,sample.width,sample.height);
 const pixels=probe.getImageData(0,0,sample.width,sample.height).data;
 const inside=(x,y,poly)=>{let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [a,b]=poly[i],[c,d]=poly[j];if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)yes=!yes;}return yes;};
 for(let y=0;y<sample.height;y++)for(let x=0;x<sample.width;x++){
  if(pixels[(y*sample.width+x)*4+3]<128)continue;
  const p=[(x+.5)*image.naturalWidth/sample.width,(y+.5)*image.naturalHeight/sample.height];
  for(const piece of plan.pieces)if(inside(...p,piece.polygon)){
   const [u,v]=mapPoint(piece.matrix,p);if(u<0||u>360||v<0||v>600)throw Error('Fit would crop visible garment; adjust landmarks or reduce size');
  }
 }
 canvas.width=720;canvas.height=1200;const ctx=canvas.getContext('2d');ctx.scale(2,2);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 for(const p of plan.pieces){ctx.save();ctx.transform(...p.matrix);ctx.beginPath();p.polygon.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.clip();ctx.drawImage(image,0,0);ctx.restore();}
 return plan;
}
