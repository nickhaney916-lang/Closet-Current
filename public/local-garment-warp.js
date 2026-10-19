'use strict';
// In-browser conservative garment warp for ALREADY-transparent user-owned
// clothing cutouts. Does not classify, regenerate fabric, upload, or modify
// the saved high-resolution original. Not a physical fit simulator.
(function(root){
 const profiles=Object.freeze({
  Tops:Object.freeze([.95,1,.96,.86,.82]),
  Bottoms:Object.freeze([.9,.94,1,1,1]),
  Dresses:Object.freeze([.93,.98,.94,.96,1]),
  Outerwear:Object.freeze([.98,1,.99,.94,.9])
 });
 const Y=Object.freeze([0,.2,.45,.72,1]);
 const X=Object.freeze([0,.25,.5,.75,1]);
 const MESH_LIMIT=1024*1024;
 // Bounds include every nonzero alpha pixel: soft cuffs and hems survive.
 function alphaBounds(data,width,height){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||
    width*height>MESH_LIMIT||!(data instanceof Uint8ClampedArray||data instanceof Uint8Array)||
    data.length!==width*height*4)return null;
  let left=width,top=height,right=-1,bottom=-1;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>0){
   left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
  }
  return right<left?null:{left,top,width:right-left+1,height:bottom-top+1};
 }
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
    // Preserve the central half at its original scale (prints, buttons,
    // seams). Move only the outside quarters around shoulders/hips/hem.
    x:width*(x<=.25?x+(1-scales[row])*(.25-x):
      x>=.75?x-(1-scales[row])*(x-.75):x),y:height*y
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
 // An attached pale mannequin neck can survive exterior white matting.
 // Hold ambiguous upper-center protrusions; never erase guessed body pixels.
 function hasAmbiguousNeck(data,width,height,bounds){
  if(!bounds||!data||data.length!==width*height*4)return true;
  const x0=Math.floor(bounds.left+bounds.width*.44),x1=Math.ceil(bounds.left+bounds.width*.56);
  const y0=bounds.top,y1=Math.ceil(bounds.top+bounds.height*.12);
  let total=0,bright=0;
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
   const i=(y*width+x)*4;if(data[i+3]<128)continue;
   total++;
   const lo=Math.min(data[i],data[i+1],data[i+2]),hi=Math.max(data[i],data[i+1],data[i+2]);
   if(lo>=120&&hi-lo<=28)bright++;
  }
  return total>0&&bright/total>.65;
 }
 // Inverse triangle sampling writes each output pixel once. Canvas triangle
 // clips otherwise leave antialiased cracks and darken overlapping soft alpha.
 function rasterize(data,mesh){
  if(!mesh||!data||data.length!==mesh.width*mesh.height*4)return null;
  const {width,height}=mesh,out=new Uint8ClampedArray(data.length);
  for(const indices of mesh.triangles){
   const [p,q,r]=indices.map(i=>mesh.vertices[i]);
   const det=(q.y-r.y)*(p.x-r.x)+(r.x-q.x)*(p.y-r.y);
   if(!Number.isFinite(det)||Math.abs(det)<1e-7)return null;
   const left=Math.max(0,Math.floor(Math.min(p.x,q.x,r.x)));
   const right=Math.min(width,Math.ceil(Math.max(p.x,q.x,r.x)));
   const top=Math.max(0,Math.floor(Math.min(p.y,q.y,r.y)));
   const bottom=Math.min(height,Math.ceil(Math.max(p.y,q.y,r.y)));
   for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){
    const px=x+.5,py=y+.5;
    const u=((q.y-r.y)*(px-r.x)+(r.x-q.x)*(py-r.y))/det;
    const v=((r.y-p.y)*(px-r.x)+(p.x-r.x)*(py-r.y))/det,w=1-u-v;
    if(u< -1e-8||v< -1e-8||w< -1e-8)continue;
    const sx=Math.max(0,Math.min(width-1,u*p.sourceX+v*q.sourceX+w*r.sourceX-.5));
    const sy=Math.max(0,Math.min(height-1,u*p.sourceY+v*q.sourceY+w*r.sourceY-.5));
    const x0=Math.floor(sx),y0=Math.floor(sy),fx=sx-x0,fy=sy-y0;
    const x2=Math.min(x0+1,width-1),y2=Math.min(y0+1,height-1);
    let alpha=0,red=0,green=0,blue=0;
    for(let k=0;k<4;k++){
     const at=((k<2?y0:y2)*width+(k%2===0?x0:x2))*4;
     const weight=(k%2===0?1-fx:fx)*(k<2?1-fy:fy);
     const a=data[at+3]*weight;alpha+=a;
     red+=data[at]*a;green+=data[at+1]*a;blue+=data[at+2]*a;
    }
    const at=(y*width+x)*4;
    if(alpha>0){out[at]=red/alpha;out[at+1]=green/alpha;out[at+2]=blue/alpha;}
    out[at+3]=alpha;
   }
  }
  return out;
 }
 // Do not render a stretched output if the deterministic mesh unexpectedly
 // deletes visible garment material or changes central prints/buttons/seams.
 // This is a *conservative display safety check*, never an image quality score.
 // A rejected warp falls back to the unchanged transparent cutout upstream.
 function validateWarp(source,output,width,height){
  const hold=reason=>Object.freeze({accepted:false,reason,sourcePixelsChanged:false,
   fabricFitOrRealismVerified:false});
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<24||height<24||
    width*height>MESH_LIMIT||
    !(source instanceof Uint8Array||source instanceof Uint8ClampedArray)||
    !(output instanceof Uint8Array||output instanceof Uint8ClampedArray)||
    source.length!==width*height*4||output.length!==source.length)
   return hold('invalid-warp-pixels');
  let inputAlpha=0,outputAlpha=0,centerCompared=0,centerCorrupted=0,visibleSource=0;
  const minX=Math.floor(width*.28),maxX=Math.ceil(width*.72);
  const minY=Math.floor(height*.08),maxY=Math.ceil(height*.92);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const k=(y*width+x)*4,sa=source[k+3],da=output[k+3];
   inputAlpha+=sa;outputAlpha+=da;
   if(sa>=24)visibleSource++;
   if(x<minX||x>=maxX||y<minY||y>=maxY||sa<200)continue;
   centerCompared++;
   // Central half of every supported mesh has identity geometry. A large
   // change here is a rasterizer issue, not improved drape.
   if(da<sa-16||Math.max(
      Math.abs(output[k]-source[k]),
      Math.abs(output[k+1]-source[k+1]),
      Math.abs(output[k+2]-source[k+2]))>20)centerCorrupted++;
  }
  if(visibleSource<width*height*.015||inputAlpha===0)
   return hold('no-trustworthy-transparent-garment');
  const ratio=outputAlpha/inputAlpha;
  if(!Number.isFinite(ratio)||ratio<.64||ratio>1.08)
   return hold('implausible-visible-fabric-change');
  if(centerCompared>=12&&centerCorrupted/centerCompared>.015)
   return hold('central-texture-or-seam-corrupted');
  return Object.freeze({accepted:true,reason:'conservative-local-warp-integrity',
   visibleAlphaRatio:ratio,centerCompared,centerCorrupted,
   sourcePixelsChanged:false,fabricFitOrRealismVerified:false});
 }
 function warpTransparentImage(image,category,canvas){
  if(!image||!canvas||!image.naturalWidth||!image.naturalHeight||
     typeof canvas.getContext!=='function')return null;
  const mesh=makeMesh(image.naturalWidth,image.naturalHeight,category);
  if(!mesh)return null;
  canvas.width=mesh.width;canvas.height=mesh.height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  if(!ctx)return null;
  try{
   ctx.clearRect(0,0,mesh.width,mesh.height);
   ctx.drawImage(image,0,0);
   const pixels=ctx.getImageData(0,0,mesh.width,mesh.height);
   const output=rasterize(pixels.data,mesh);if(!output)return null;
   const quality=validateWarp(pixels.data,output,mesh.width,mesh.height);
   if(!quality.accepted)return null; // Caller retains intact original cutout.
   pixels.data.set(output);ctx.putImageData(pixels,0,0);
   return canvas.toDataURL('image/png');
  }catch{return null;}
 }
 root.ClosetGarmentWarp=Object.freeze({profiles,alphaBounds,hasAmbiguousNeck,makeMesh,affine,rasterize,validateWarp,warpTransparentImage});
 if(typeof module!=='undefined')module.exports=root.ClosetGarmentWarp;
})(typeof window!=='undefined'?window:globalThis);
