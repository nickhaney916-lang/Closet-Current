'use strict';
/* Parallel #73 isolated research. Advisory only; never alters or stores source pixels. */
(function(root){
 const VERSION='P73-1';
 const number=(value)=>Math.round(value*1000)/1000;
 function analyzePixels(pixels,width,height,sourceWidth=width,sourceHeight=height){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<8||height<8||width>512||height>512||
     !pixels||pixels.length!==width*height*4||!Number.isInteger(sourceWidth)||!Number.isInteger(sourceHeight)||
     sourceWidth<1||sourceHeight<1||sourceWidth>100000||sourceHeight>100000)
   throw Error('Invalid bounded quality sample.');
  const gray=new Uint8Array(width*height),opaque=new Uint8Array(width*height);
  const hist=new Uint32Array(256);let count=0,sum=0,dark=0,bright=0;
  for(let i=0;i<gray.length;i++){
   if(pixels[i*4+3]<224)continue;
   const r=pixels[i*4],g=pixels[i*4+1],b=pixels[i*4+2];
   const lum=Math.min(255,Math.round(.2126*r+.7152*g+.0722*b));
   gray[i]=lum;opaque[i]=1;hist[lum]++;count++;sum+=lum;
   if(lum<45)dark++;
   if(lum>245)bright++;
  }
  const percentile=p=>{
   if(!count)return null;
   const target=Math.ceil(count*p);let total=0;
   for(let i=0;i<256;i++){total+=hist[i];if(total>=target)return i;}
   return 255;
  };
  let edges=0,edgeSum=0,edgeStrong=0;
  // Adjacent-pixel contrast is a focus *proxy*, not a blur diagnosis.
  for(let y=1;y<height;y++)for(let x=1;x<width;x++){
   const i=y*width+x;
   if(!opaque[i]||!opaque[i-1]||!opaque[i-width])continue;
   const magnitude=(Math.abs(gray[i]-gray[i-1])+Math.abs(gray[i]-gray[i-width]))/2;
   edges++;edgeSum+=magnitude;if(magnitude>=20)edgeStrong++;
  }
  const p10=percentile(.1),p90=percentile(.9);
  const metrics={sourceWidth,sourceHeight,sampledWidth:width,sampledHeight:height,
   opaqueFraction:number(count/(width*height)),meanLuma:count?number(sum/count):null,
   lumaP10:p10,lumaP90:p90,darkFraction:count?number(dark/count):null,
   highlightFraction:count?number(bright/count):null,
   adjacentContrast:edges?number(edgeSum/edges):null,
   edgeFraction:edges?number(edgeStrong/edges):null};
  const advice=[];
  function add(code,text,evidence){advice.push({code,text,evidence});}
  if(Math.min(sourceWidth,sourceHeight)<640)
   add('limited-resolution','This photo has limited resolution. If details are hard to see, try a higher-resolution photo.','shortest side under 640 pixels');
  if(count>=width*height*.65&&p90!==null){
   if(p90<105&&dark/count>.7)
    add('low-light','Much of the photo is very dark. Try more even light, then check the garment color in Adjust.','upper brightness percentile below 105');
   if(p10>215&&bright/count>.6)
    add('bright-detail','Much of the photo is very bright. Check that white fabric, seams, and edges are visible.','lower brightness percentile above 215');
   if(bright/count>.35&&p10<165)
    add('highlights','Bright areas may hide fabric detail. Check for reflections or glare before deciding to retake.','more than 35% near-white pixels and mixed brightness');
   if(edges>1000&&p90-p10>=50&&edgeSum/edges<4&&edgeStrong/edges<.022)
    add('possible-softness','Fine details may be soft. Check focus on seams or logos; a steady retake may help.','low adjacent contrast despite broad tonal range');
  }
  return {version:VERSION,kind:'advisory-only',metrics,advice,
   notMeasured:['garment boundary or cut-off hems','background clutter','actual motion blur','true garment color','multiple garments','human-rated usability']};
 }
 function enabled(){return root.document?.getElementById('photoQualityResearch73')?.checked===true;}
 const api={VERSION,enabled,analyzePixels};
 root.PhotoQualityResearch=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
