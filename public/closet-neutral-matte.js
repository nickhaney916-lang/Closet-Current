'use strict';
(function(root){
 // Free original-pixel shoe cutout on a proven light neutral studio backdrop.
 // No model call, fabricated detail or stored-photo change. Fail closed for
 // pale shoes, cluttered scenes, border-touching items and other categories.
 const MAX=160000;
 function analyze(data,width,height,category){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<40||height<40||
    width*height>MAX||!(data instanceof Uint8Array||data instanceof Uint8ClampedArray)||
    ![width*height*3,width*height*4].includes(data.length))
   throw Error('Invalid garment preview');
  const fail=reason=>({eligible:false,reason,sourceAltered:false,
    garmentIdentityVerified:false});
  if(category!=='Shoes')return fail('not-validated-for-category');
  const n=width*height,channels=data.length/n,backdrop=new Uint8Array(n),
   trim=Math.max(2,Math.ceil(Math.min(width,height)*.02));
  let border=0,plainBorder=0,candidate=0,dark=0,saturated=0;
  let minX=width,maxX=-1,minY=height,maxY=-1;
  for(let i=0;i<n;i++){
   const j=i*channels,r=data[j],g=data[j+1],b=data[j+2],
    high=Math.max(r,g,b),low=Math.min(r,g,b),spread=high-low;
   if(channels===4&&data[j+3]<245)return fail('source-already-has-alpha');
   const neutral=low>=158&&spread<=22;
   if(neutral)backdrop[i]=1;
   const x=i%width,y=(i-x)/width;
   if(x<trim||x>=width-trim||y<trim||y>=height-trim){
    border++;if(neutral)plainBorder++;
   }
   if(!neutral){
    candidate++;
    if(low<=100&&high<=160)dark++;
    if(spread>=65&&high>=130)saturated++;
    minX=Math.min(x,minX);maxX=Math.max(x,maxX);
    minY=Math.min(y,minY);maxY=Math.max(y,maxY);
   }
  }
  if(plainBorder/Math.max(border,1)<.95)return fail('non-neutral-photo-border');
  if(candidate/n<.12||candidate/n>.64||dark/n<.12||saturated/n<.025)
   return fail('insufficient-dark-and-colored-shoe-evidence');
  if(minX<width*.025||maxX>=width*.975||minY<height*.025||maxY>=height*.975)
   return fail('foreground-touches-image-edge');
  const boundArea=(maxX-minX+1)*(maxY-minY+1);
  let neutralInside=0;
  for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++)
   if(backdrop[y*width+x])neutralInside++;
  if(boundArea/n<.12||neutralInside/boundArea>.56)
   return fail('possible-pale-shoe-fabric-or-unclear-shoe');
  const visited=new Uint8Array(n),queue=new Int32Array(n);let start=0,end=0;
  const push=i=>{
   if(backdrop[i]&&!visited[i]){visited[i]=1;queue[end++]=i;}
  };
  for(let x=0;x<width;x++){push(x);push((height-1)*width+x);}
  for(let y=1;y<height-1;y++){push(y*width);push(y*width+width-1);}
  while(start<end){
   const i=queue[start++],x=i%width,y=(i-x)/width;
   if(x>0)push(i-1);if(x+1<width)push(i+1);
   if(y>0)push(i-width);if(y+1<height)push(i+width);
   if(x>0&&y>0)push(i-width-1);if(x+1<width&&y>0)push(i-width+1);
   if(x>0&&y+1<height)push(i+width-1);
   if(x+1<width&&y+1<height)push(i+width+1);
  }
  if(end/n<.25||end/n>.78)return fail('uncertain-background-share');
  const alpha=new Uint8ClampedArray(n);alpha.fill(255);
  for(let i=0;i<n;i++)if(visited[i])alpha[i]=0;
  // A pale sole can connect to the exterior and disappear while its darker
  // shadow remains below it. Widespread vertical gaps are ambiguous fabric,
  // not proof of background: keep the original instead of erasing the sole.
  let verticalGapPixels=0,splitColumns=0;
  for(let x=0;x<width;x++){
   let first=height,last=-1,gaps=0;
   for(let y=0;y<height;y++)if(alpha[y*width+x]){
    first=Math.min(first,y);last=y;
   }
   for(let y=first;y<=last;y++)if(!alpha[y*width+x])gaps++;
   verticalGapPixels+=gaps;
   if(gaps>=Math.max(3,Math.ceil(height*.015)))splitColumns++;
  }
  if(verticalGapPixels/n>.025&&splitColumns/width>.3)
   return fail('possible-pale-sole-or-separated-shadow');
  return {eligible:true,reason:'light-neutral-exterior-on-dark-colorful-shoes',
   alpha,backgroundFraction:end/n,sourceAltered:false,
   garmentIdentityVerified:false,originalPixelColorsOnly:true,
   automaticGarmentReconstruction:false};
 }
 root.ClosetNeutralMatte={analyze};
 if(typeof module!=='undefined')module.exports=root.ClosetNeutralMatte;
})(typeof window!=='undefined'?window:globalThis);
