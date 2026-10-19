'use strict';
// In-browser conservative garment warp for ALREADY-transparent user-owned
// clothing cutouts. Does not classify, regenerate fabric, upload, or modify
// the saved high-resolution original. Not a physical fit simulator.
(function(root){
 const profiles=Object.freeze({
  Tops:Object.freeze([.95,1,.96,.86,.82]),
  Bottoms:Object.freeze([.9,.94,1,1.02,1]),
  Dresses:Object.freeze([.93,.98,.94,.96,1]),
  Outerwear:Object.freeze([.98,1,.99,.94,.9])
 });
 const Y=Object.freeze([0,.2,.45,.72,1]);
 const X=Object.freeze([0,.25,.5,.75,1]);
 const MESH_LIMIT=1024*1024;
 function makeMesh(width,height,category){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<24||height<24||
   width*height>MESH_LIMIT||!Object.hasOwn(profiles,category))return null;
  const scales=profiles[category];
  const vertices=[];
  // x=0 and x=1 are the garment image edges; zero-filled peripheral alpha
  // remains transparent after the same transform as real garment pixels.
  for(let row=0;row<Y.length;row++)for(let col=0;col<X.length;col++){
   const x=X[col],y=Y[row];
   vertices.push(Object.freeze({
    sourceX:width*x,sourceY:height*y,
    x:width*(.5+(x-.5)*scales[row]),y:height*y
   }));
  }
  const triangles=[];
  for(let row=0;row<Y.length-1;row++)for(let col=0;col<X.length-1;col++){
   const a=row*X.length+col,b=a+1,c=a+X.length,d=c+1;
   triangles.push(Object.freeze([a,b,d]),Object.freeze([a,d,c]));
  }
  return {width,height,category,vertices,triangles,geometryOnly:true,
   sourcePhotoChanged:false,photorealisticFitVerified:false};
 }
 function affine(points){
  if(!Array.isArray(points)||points.length!==3)return null;
  const [p,q,r]=points, x1=p.sourceX,y1=p.sourceY,
   x2=q.sourceX,y2=q.sourceY,x3=r.sourceX,y3=r.sourceY;
  const det=(x2-x1)*(y3-y1)-(x3-x1)*(y2-y1);
  if(!Number.isFinite(det)||Math.abs(det)<1e-7)return null;
  const a=((q.x-p.x)*(y3-y1)-(r.x-p.x)*(y2-y1))/det;
  const c=((r.x-p.x)*(x2-x1)-(q.x-p.x)*(x3-x1))/det;
  const b=((q.y-p.y)*(y3-y1)-(r.y-p.y)*(y2-y1))/det;
  const d=((r.y-p.y)*(x2-x1)-(q.y-p.y)*(x3-x1))/det;
  const e=p.x-a*x1-c*y1,f=p.y-b*x1-d*y1;
  if(![a,b,c,d,e,f].every(Number.isFinite))return null;
  return [a,b,c,d,e,f];
 }
 function warpTransparentImage(image,category,canvas){
  if(!image||!canvas||!image.naturalWidth||!image.naturalHeight||
     typeof canvas.getContext!=='function')return null;
  const mesh=makeMesh(image.naturalWidth,image.naturalHeight,category);
  if(!mesh)return null;
  canvas.width=mesh.width;canvas.height=mesh.height;
  const ctx=canvas.getContext('2d');
  if(!ctx)return null;
  ctx.clearRect(0,0,mesh.width,mesh.height);
  try{
   for(const indices of mesh.triangles){
    const points=indices.map(i=>mesh.vertices[i]),m=affine(points);
    if(!m)return null;
    ctx.save();
    try{
     ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);
     ctx.lineTo(points[1].x,points[1].y);
     ctx.lineTo(points[2].x,points[2].y);
     ctx.closePath();ctx.clip();
     ctx.setTransform(...m);
     ctx.drawImage(image,0,0);
    }finally{ctx.restore();}
   }
   // Display-only, not a substitute for the item image/source bytes.
   return canvas.toDataURL('image/png');
  }catch{return null;}
 }
 root.ClosetGarmentWarp=Object.freeze({profiles,makeMesh,affine,warpTransparentImage});
 if(typeof module!=='undefined')module.exports=root.ClosetGarmentWarp;
})(typeof window!=='undefined'?window:globalThis);
