'use strict';
(function(root){
 // Original-pixel proposal for saturated garments on dark neutral studio
 // backgrounds. Ambiguous material remains opaque; never reconstruct fabric.
 const MAX=160000;
 function analyze(data,width,height,{category,primaryColor}={}){
  const hold=reason=>({eligible:false,displayEligible:false,proposalAvailable:false,reason,sourceAltered:false,garmentReconstructed:false});
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<40||height<40||width*height>MAX||
   !(data instanceof Uint8Array||data instanceof Uint8ClampedArray)||data.length!==width*height*4)
   throw Error('Invalid dark-studio pixels');
  if(!['Tops','Dresses','Outerwear'].includes(category))return hold('unsupported-garment-category');
  if(!['Red','Orange','Pink','Yellow','Green','Blue','Purple'].includes(primaryColor))return hold('ambiguous-dark-or-neutral-fabric');
  const n=width*height,background=new Uint8Array(n);let border=0,darkBorder=0,saturated=0;
  for(let i=0;i<n;i++){
   const at=i*4,r=data[at],g=data[at+1],b=data[at+2];
   if(data[at+3]!==255)return hold('native-alpha-use-existing-path');
   const hi=Math.max(r,g,b),lo=Math.min(r,g,b),spread=hi-lo;
   if(hi<=85&&spread<=16)background[i]=1;
   if(spread>=55&&hi>=110)saturated++;
   const x=i%width,y=(i-x)/width;
   if(x===0||y===0||x===width-1||y===height-1){border++;if(background[i])darkBorder++;}
  }
  if(darkBorder/border<.985)return hold('nonuniform-dark-neutral-exterior');
  if(saturated/n<.15||saturated/n>.7)return hold('insufficient-distinct-saturated-fabric');
  const seen=new Uint8Array(n),queue=new Int32Array(n);let front=0,back=0;
  const push=i=>{if(background[i]&&!seen[i]){seen[i]=1;queue[back++]=i;}};
  for(let x=0;x<width;x++){push(x);push((height-1)*width+x);}
  for(let y=1;y<height-1;y++){push(y*width);push(y*width+width-1);}
  while(front<back){
   const i=queue[front++],x=i%width,y=(i-x)/width;
   if(x>0)push(i-1);if(x+1<width)push(i+1);if(y>0)push(i-width);if(y+1<height)push(i+width);
  }
  if(back/n<.2||back/n>.85)return hold('uncertain-dark-background-share');
  const alpha=new Uint8ClampedArray(n);alpha.fill(255);
  let left=width,right=-1,top=height,bottom=-1,retained=0;
  for(let i=0;i<n;i++)if(seen[i])alpha[i]=0;else{
   retained++;const x=i%width,y=(i-x)/width;
   left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
  }
  if(left<width*.025||right>=width*.975||top<height*.025||bottom>=height*.975)
   return hold('foreground-or-scene-touches-border');
  // More than one distinct foreground component may be another item, body
  // part or background object. Do not erase it to force a cleaner silhouette.
  const componentSeen=new Uint8Array(n);let largest=0,components=0;
  for(let seed=0;seed<n;seed++)if(alpha[seed]&&!componentSeen[seed]){
   let begin=0,end=1;queue[0]=seed;componentSeen[seed]=1;
   while(begin<end){
    const i=queue[begin++],x=i%width,y=(i-x)/width;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
     const xx=x+dx,yy=y+dy;if(xx<0||xx>=width||yy<0||yy>=height)continue;
     const j=yy*width+xx;if(alpha[j]&&!componentSeen[j]){componentSeen[j]=1;queue[end++]=j;}
    }
   }
   components++;largest=Math.max(largest,end);
  }
  if(largest/retained<.995)return hold('multiple-foreground-regions');
  // A useful automatic proposal is not proof of a garment-only boundary.
  // Keep it held until independent full-mask/composite evidence is available.
  return {eligible:false,displayEligible:false,proposalAvailable:true,requiresIndependentMaskReview:true,
   reason:'dark-neutral-exterior-saturated-garment-proposal',alpha,components,
   backgroundPixels:back,foregroundPixels:retained,bounds:{left,top,width:right-left+1,height:bottom-top+1},
   sourceAltered:false,garmentReconstructed:false,garmentIdentityVerified:false};
 }
 function applyAlpha(data,alpha){
  if(!(data instanceof Uint8ClampedArray||data instanceof Uint8Array)||
   !(alpha instanceof Uint8ClampedArray||alpha instanceof Uint8Array)||data.length!==alpha.length*4)
   throw Error('Invalid original RGBA/alpha');
  const out=new Uint8ClampedArray(data);
  for(let i=0;i<alpha.length;i++)out[i*4+3]=Math.min(data[i*4+3],alpha[i]);
  return out;
 }
 root.ClosetDarkStudioMask=Object.freeze({analyze,applyAlpha});
 if(typeof module!=='undefined')module.exports=root.ClosetDarkStudioMask;
})(typeof window!=='undefined'?window:globalThis);
