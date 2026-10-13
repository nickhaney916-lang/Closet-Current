export function fitPhotoDimensions(width,height,size=224){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0||!Number.isInteger(size)||size<=0)throw Error('Invalid photo dimensions.');
 const scale=size/Math.max(width,height),w=Math.max(1,Math.min(size,Math.round(width*scale))),h=Math.max(1,Math.min(size,Math.round(height*scale)));
 return {width:w,height:h,left:Math.floor((size-w)/2),top:Math.floor((size-h)/2),size};
}
export function padPhotoPixels(data,channels,fit){
 if(![3,4].includes(channels)||data.length!==fit.width*fit.height*channels)throw Error('Invalid photo pixels.');
 const result=new Uint8ClampedArray(fit.size*fit.size*3);result.fill(255);
 for(let y=0;y<fit.height;y++)for(let x=0;x<fit.width;x++){
  const source=(y*fit.width+x)*channels,destination=((y+fit.top)*fit.size+x+fit.left)*3,alpha=channels===4?data[source+3]/255:1;
  for(let c=0;c<3;c++)result[destination+c]=data[source+c]*alpha+255*(1-alpha);
 }
 return result;
}
export async function fitWholePhoto(image,RawImageClass){
 const fit=fitPhotoDimensions(image.width,image.height),resized=await image.resize(fit.width,fit.height);
 return new RawImageClass(padPhotoPixels(resized.data,resized.channels,fit),fit.size,fit.size,3);
}
