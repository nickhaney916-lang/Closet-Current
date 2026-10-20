'use strict';
// Conservative source-supported risk check for ALREADY-transparent DISPLAY cutouts.
// A transparent backdrop does not prove that a mannequin neck/hanger is absent.
// Never infer a real human silhouette, supply missing pixels, or alter saved RGB.
(function(root){
 const MAX_PIXELS=1024*1024;
 function inspect(pixels,width,height,category){
  const safe=reason=>Object.freeze({hold:false,reason,sourcePixelsChanged:false,
   independentHumanMaskValidated:false,physicalFitValidated:false});
  const held=reason=>Object.freeze({hold:true,reason,sourcePixelsChanged:false,
   independentHumanMaskValidated:false,physicalFitValidated:false});
  if(!['Tops','Dresses','Outerwear'].includes(category))return safe('not-upper-garment');
  if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||
   width<40||height<60||width*height>MAX_PIXELS||
   !(pixels instanceof Uint8Array||pixels instanceof Uint8ClampedArray)||
   pixels.length!==width*height*4)return safe('unsupported-source-grid');
  // Get actual alpha silhouette bounds; full-rectangle photographs are NOT
  // approved by this test. The caller separately requires true transparent edges.
  let left=width,top=height,right=-1,bottom=-1;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   if(pixels[(y*width+x)*4+3]<128)continue;
   if(x<left)left=x;if(x>right)right=x;
   if(y<top)top=y;if(y>bottom)bottom=y;
  }
  if(right<=left||bottom-top<60)return safe('no-meaningful-alpha-silhouette');
  const bw=right-left+1,bh=bottom-top+1;
  function band(a,b){
   const rows=[],colors=[0,0,0];let samples=0;
   const from=top+Math.floor(bh*a),end=Math.min(bottom+1,top+Math.ceil(bh*b));
   for(let y=from;y<end;y++){
    let first=width,last=-1,seen=0,rowSum=[0,0,0];
    for(let x=left;x<=right;x++){
     const at=(y*width+x)*4;if(pixels[at+3]<128)continue;
     if(x<first)first=x;last=x;seen++;
     rowSum[0]+=pixels[at];rowSum[1]+=pixels[at+1];rowSum[2]+=pixels[at+2];
    }
    if(last<first||seen<Math.max(3,bw*.035))continue;
    const span=last-first+1;
    // Reject split shoulders as a single neck. Only a compact central
    // connected-looking section is evidence of attached upper protrusion.
    if(seen/span<.80)continue;
    rows.push({width:span,center:(first+last)/2});
    for(let k=0;k<3;k++)colors[k]+=rowSum[k];
    samples+=seen;
   }
   if(!rows.length||!samples)return null;
   rows.sort((x,y)=>x.width-y.width);
   const middle=rows[Math.floor(rows.length/2)].width;
   const center=rows.reduce((s,x)=>s+x.center,0)/rows.length;
   return {width:middle,center,rows:rows.length,available:end-from,
    rgb:colors.map(c=>c/samples)};
  }
  const upper=band(0,.12),body=band(.22,.40);
  if(!upper||!body||upper.rows<Math.max(4,Math.floor(upper.available*.55))||
   body.rows<Math.max(6,Math.floor(body.available*.55)))
   return safe('no-stable-attachment-profile');
  if(upper.width>body.width*.46||body.width<bw*.48||
   Math.abs(upper.center-body.center)>bw*.13)
   return safe('upper-contour-not-a-narrow-centered-protrusion');
  const hi=Math.max(...upper.rgb),lo=Math.min(...upper.rgb);
  if(lo<122||hi-lo>32)return safe('upper-fabric-not-pale-neutral');
  const contrast=Math.sqrt(upper.rgb.reduce((sum,n,k)=>
   sum+(n-body.rgb[k])**2,0));
  if(contrast<80)return safe('no-separate-neutral-attachment-evidence');
  return held('possible-attached-neutral-neck-or-hanger');
 }
 const api=Object.freeze({inspect,MAX_PIXELS});
 root.ClosetTransparentForegroundSafety=api;
 if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
