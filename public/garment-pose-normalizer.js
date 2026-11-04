'use strict';
(function(root){
 // Experimental view-only category-aware garment axis straightening.
 // Requires strong evidence of an isolated nonwhite garment on a clean white
 // backdrop. Does NOT unfold fabric, synthesize hidden details, or crop source.
 const VALID=new Set(['Tops','Bottoms','Dresses','Outerwear']);
 const clean=(r,g,b)=>r>=240&&g>=240&&b>=240;
 const garment=(r,g,b,a)=>a>=225&&Math.min(r,g,b)<=192;
 function axisPlan(data,width,height,category){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<30||height<30
    ||width*height>150000||![3,4].includes(data?.length/(width*height)))
   throw Error('Invalid normalization pixels');
  const unsupported={action:'keep-original-or-centered',rotationDeg:0,verifiedCutout:false,
    newGarmentDetailsInvented:false,sourceAltered:false};
  if(!VALID.has(category))return {...unsupported,reason:'category-not-suitable'};
  const channels=data.length/(width*height);
  // Verify backdrop on all four margins, not merely four corners. Patterned
  // real-world scenes and worn clothing must not be auto-rotated.
  let perimeter=0,white=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   if(x>=3&&x<width-3&&y>=3&&y<height-3)continue;
   const p=(y*width+x)*channels;
   perimeter++;if(clean(data[p],data[p+1],data[p+2])&&
    (channels===3||data[p+3]>230))white++;
  }
  if(white/Math.max(1,perimeter)<.97)
   return {...unsupported,reason:'not-a-clean-isolated-background'};
  let xMin=width,yMin=height,xMax=-1,yMax=-1,count=0;
  const totals=new Float64Array(height),weights=new Uint32Array(height);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const p=(y*width+x)*channels;
   if(!garment(data[p],data[p+1],data[p+2],channels===3?255:data[p+3]))continue;
   count++;totals[y]+=x;weights[y]++;
   xMin=Math.min(x,xMin);xMax=Math.max(x,xMax);
   yMin=Math.min(y,yMin);yMax=Math.max(y,yMax);
  }
  if(count<width*height*.10||count>width*height*.75||xMax<0)
   return {...unsupported,reason:'garment-matte-uncertain'};
  const boxW=xMax-xMin+1,boxH=yMax-yMin+1;
  if(boxH/boxW<1.1||boxH<height*.44||boxW<width*.28||
     xMin<width*.02||xMax>width*.98)
   return {...unsupported,reason:'nonvertical-or-truncated-garment'};
  // Estimate lean from THREE robust vertical bands, not image corners.
  function band(from,to){
   let x=0,n=0,rows=0;
   const low=Math.floor(yMin+boxH*from),high=Math.ceil(yMin+boxH*to);
   for(let y=low;y<=Math.min(high,height-1);y++){
    if(weights[y]<boxW*.20)continue;
    x+=totals[y];n+=weights[y];rows++;
   }
   return rows>=Math.max(2,Math.floor(boxH*.06))&&n?x/n:null;
  }
  const upper=band(.17,.30),middle=band(.44,.56),lower=band(.70,.83);
  if([upper,middle,lower].some(v=>v===null))
   return {...unsupported,reason:'insufficient-torso-evidence'};
  const expectedMid=(upper+lower)/2;
  const drift=lower-upper,angle=Math.atan2(drift,boxH*.53)*180/Math.PI;
  if(Math.abs(middle-expectedMid)>boxW*.08)
   return {...unsupported,reason:'bent-or-occluded-centerline'};
  if(Math.abs(angle)<4||Math.abs(angle)>13)
   return {...unsupported,reason:'already-upright-or-strongly-distorted'};
  return {
   action:'rotate-derived-tile',rotationDeg:Math.round(angle*10)/10,
   verifiedCutout:true,originalPixelsOnly:true,sourceAltered:false,
   newGarmentDetailsInvented:false,needsGenerativeRepair:false,
   reason:'small-supported-garment-axis-lean',
   bbox:{left:xMin,top:yMin,width:boxW,height:boxH},
   foregroundShare:count/(width*height),
   whiteBorderShare:white/perimeter
  };
 }
 root.GarmentPoseNormalizer={axisPlan};
 if(typeof module!=='undefined')module.exports=root.GarmentPoseNormalizer;
})(typeof window!=='undefined'?window:globalThis);
