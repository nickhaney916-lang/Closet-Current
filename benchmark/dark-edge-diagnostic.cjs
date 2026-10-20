'use strict';
// Diagnostic counts are unlabelled risks, never false-negative measurements.
module.exports=function darkEdgeRisk(rgba,alpha,width,height){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>600000||rgba?.length!==width*height*4||alpha?.length!==width*height)throw Error('Invalid diagnostic grid');
 const overlay=new Uint8Array(width*height);let count=0;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=y*width+x,hi=Math.max(rgba[i*4],rgba[i*4+1],rgba[i*4+2]),lo=Math.min(rgba[i*4],rgba[i*4+1],rgba[i*4+2]);
  if(alpha[i]!==0||hi>85||hi-lo>16)continue;
  let adjacent=false;
  for(let dy=-2;dy<=2&&!adjacent;dy++)for(let dx=-2;dx<=2;dx++){
   const xx=x+dx,yy=y+dy;if(xx>=0&&xx<width&&yy>=0&&yy<height&&alpha[yy*width+xx]>0){adjacent=true;break;}
  }
  if(adjacent){overlay[i]=1;count++;}
 }
 return {overlay,removedDarkPixelsNearRetainedEdge:count,radiusPixels:2,independentErrorCount:null,maskAltered:false,
  meaning:'Unlabelled risk: indistinguishable dark background or garment trim; manual reference required'};
};
