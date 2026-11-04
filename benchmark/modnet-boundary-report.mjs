// Experimental diagnostic: locate pixels removed by stricter opacity threshold.
// This never modifies the mask or implies that removed pixels are background.
export function thresholdBoundaryReport(data,width,height,channels,channel,low=128,high=192){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||!Number.isInteger(channels)||channels<1||!Number.isInteger(channel)||channel<0||channel>=channels||data?.length!==width*height*channels||!(low>=0&&low<high&&high<=255))throw Error('Invalid opacity mask');
 let removed=0,adjacentToHigh=0,isolated=0;
 const at=i=>data[i*channels+channel];
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=y*width+x,v=at(i);if(v<low||v>=high)continue;
  removed++;
  let adjacent=false;
  for(const n of [x>0?i-1:-1,x+1<width?i+1:-1,y>0?i-width:-1,y+1<height?i+width:-1]){
   if(n>=0&&at(n)>=high){adjacent=true;break;}
  }
  if(adjacent)adjacentToHigh++;else isolated++;
 }
 return {removed,adjacentToHigh,isolated,adjacentFraction:removed?adjacentToHigh/removed:null,low,high};
}
