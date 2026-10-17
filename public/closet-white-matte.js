'use strict';
(function(root){
 // Zero-cost, preview-only white-matte removal. Only confidently plain WHITE
 // exterior pixels are made transparent. The raw garment and saved image stay
 // byte-for-byte unchanged. No masks are inferred behind folded fabric.
 const MAX_PIXELS=160000;
 const white=(data,i,c)=>{
  const k=i*c,r=data[k],g=data[k+1],b=data[k+2];
  return (c===3||data[k+3]>=250)&&r>=247&&g>=247&&b>=247&&
   Math.max(r,g,b)-Math.min(r,g,b)<=8;
 };
 function analyze(data,width,height){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<24||height<24||
    width*height>MAX_PIXELS||
    !(data instanceof Uint8Array||data instanceof Uint8ClampedArray)||
    ![width*height*3,width*height*4].includes(data.length))
   throw Error('Invalid white-matte preview pixels');
  const n=width*height,c=data.length/n;
  const untouched=reason=>({eligible:false,reason,backgroundPixels:0,
    sourceAltered:false,garmentReconstructed:false});
  const paper=new Uint8Array(n);
  let perimeter=0,whiteBorder=0,opaque=0,minX=width,minY=height,maxX=-1,maxY=-1,colored=0;
  for(let i=0;i<n;i++){
   const x=i%width,y=Math.floor(i/width),isWhite=white(data,i,c);
   if(isWhite)paper[i]=1;
   if(x===0||y===0||x===width-1||y===height-1){
    perimeter++;if(isWhite)whiteBorder++;
   }
   const k=i*c;
   // A mostly WHITE shirt or faint pale fabric has no reliable foreground.
   // Reject instead of erasing a sleeve or a white graphic.
   if((c===3||data[k+3]>=245)&&Math.min(data[k],data[k+1],data[k+2])<=205){
    colored++;opaque++;
    minX=Math.min(minX,x);minY=Math.min(minY,y);
    maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);
   }
  }
  if(whiteBorder/perimeter<.985)return untouched('nonwhite-or-translucent-photo-border');
  if(colored/n<.08||colored/n>.77||maxX<0)
   return untouched('insufficient-distinct-colored-garment');
  if(minX<width*.025||maxX>width*.975||minY<height*.025||maxY>height*.975)
   return untouched('garment-or-scene-near-image-boundary');
  if((maxX-minX+1)/width<.24||(maxY-minY+1)/height<.16)
   return untouched('foreground-too-small-or-ambiguous');
  // Flood ONLY externally connected very-white pixels. Internal white
  // stripes/prints, bright buttons and holes cannot be removed merely
  // because they are white.
  const visited=new Uint8Array(n),queue=new Int32Array(n);
  let front=0,back=0;
  const push=i=>{
   if(paper[i]&&!visited[i]){visited[i]=1;queue[back++]=i;}
  };
  for(let x=0;x<width;x++){push(x);push((height-1)*width+x);}
  for(let y=1;y<height-1;y++){push(y*width);push(y*width+width-1);}
  while(front<back){
   const i=queue[front++],x=i%width,y=Math.floor(i/width);
   if(x>0)push(i-1);if(x+1<width)push(i+1);
   if(y>0)push(i-width);if(y+1<height)push(i+width);
   // Also remove diagonally attached white exterior regions. This means
   // small white pockets inside a garment remain only if fully enclosed.
   if(x>0&&y>0)push(i-width-1);
   if(x+1<width&&y>0)push(i-width+1);
   if(x>0&&y+1<height)push(i+width-1);
   if(x+1<width&&y+1<height)push(i+width+1);
  }
  if(back/n<.18||back/n>.88)return untouched('uncertain-background-extent');
  const alpha=new Uint8ClampedArray(n);alpha.fill(255);
  for(let i=0;i<n;i++)if(visited[i])alpha[i]=0;
  return {eligible:true,reason:'verified-white-exterior',
   alpha,backgroundPixels:back,backgroundFraction:back/n,
   foregroundColoredPixels:colored,sourceAltered:false,
   garmentReconstructed:false,originalDetailsPreserved:true};
 }
 // Existing transparent garment PNGs/webp don't need white matting, but
 // must NOT be painted onto an opaque rectangle in the hanger carousel.
 function hasTransparentBackground(data,width,height){
  if(!Number.isInteger(width)||!Number.isInteger(height)||
     width<24||height<24||width*height>MAX_PIXELS||
     !(data instanceof Uint8Array||data instanceof Uint8ClampedArray)||
     data.length!==width*height*4)return false;
  let allClear=0,allOpaque=0,edgeClear=0,edgeTotal=0;
  for(let i=0;i<width*height;i++){
   const x=i%width,y=Math.floor(i/width),a=data[i*4+3];
   if(a<=24)allClear++;
   if(a>=230)allOpaque++;
   if(x===0||y===0||x===width-1||y===height-1){
    edgeTotal++;if(a<=24)edgeClear++;
   }
  }
  return allClear/(width*height)>=.08&&
   allOpaque/(width*height)>=.08&&
   edgeClear/edgeTotal>=.90;
 }
 root.ClosetWhiteMatte={analyze,hasTransparentBackground};
 if(typeof module!=='undefined')module.exports=root.ClosetWhiteMatte;
})(typeof window!=='undefined'?window:globalThis);
