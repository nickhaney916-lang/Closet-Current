/**
 * Mission 1 P881: horizontal mirror and equal-weight SigLIP embedding mean.
 * Research-only, same pretrained model (NOT a third independent voter).
 * No modification of the source/original image, masks or owner records.
 */
export function mirrorRGB881(image,RawImageClass){
 const {width,height,channels,data}=image||{};
 if(!Number.isSafeInteger(width)||!Number.isSafeInteger(height)||
   width<1||height<1||width*height>20_000_000||channels!==3||
   !data||data.length!==width*height*3||typeof RawImageClass!=='function')
  throw Error('P881_INVALID_RGB_IMAGE');
 const flipped=new Uint8ClampedArray(data.length);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const from=(y*width+x)*3,to=(y*width+width-1-x)*3;
  flipped[to]=data[from];flipped[to+1]=data[from+1];flipped[to+2]=data[from+2];
 }
 return new RawImageClass(flipped,width,height,3);
}
export function meanUnitEmbeddings881(a,b){
 if(!a||!b||a.length!==768||b.length!==768||
   Array.from(a).some(v=>!Number.isFinite(v))||
   Array.from(b).some(v=>!Number.isFinite(v)))
  throw Error('P881_INVALID_EMBEDDINGS');
 const result=new Float32Array(768);
 let lengthSquared=0;
 for(let i=0;i<768;i++){result[i]=(a[i]+b[i])/2;lengthSquared+=result[i]*result[i];}
 if(!(lengthSquared>1e-12))throw Error('P881_CANCELLED_EMBEDDINGS');
 const inv=1/Math.sqrt(lengthSquared);
 for(let i=0;i<768;i++)result[i]*=inv;
 return result;
}
