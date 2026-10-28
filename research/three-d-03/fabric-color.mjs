/**
 * 3D-03: source-RGB representative garment color.
 * Median of sufficiently opaque original pixels; excludes transparent
 * background. Analysis only: no pixel editing, generation or cloud.
 */
export function representativeFabricColor({data,width,height}={}){
 if(!(data instanceof Uint8ClampedArray)||
  !Number.isSafeInteger(width)||!Number.isSafeInteger(height)||
  width<16||height<16||width*height>240*240||data.length!==width*height*4)
  throw Error('Bounded reviewed RGBA sample required');
 const hist=[new Uint32Array(256),new Uint32Array(256),new Uint32Array(256)];
 let n=0;
 for(let p=0;p<data.length;p+=4){
  if(data[p+3]<224)continue;
  for(let c=0;c<3;c++)hist[c][data[p+c]]++;
  n++;
 }
 if(n<64||n>width*height*.98)throw Error('Fabric source missing or opaque rectangle');
 const color=hist.map(h=>{
  let count=0;for(let v=0;v<256;v++){count+=h[v];if(count>n/2)return v;}
  return 255;
 });
 return Object.freeze({rgb:color,baseColor:color.map(c=>c/255),
  sampledPixels:n,method:'opaque-original-RGB-median',
  generatedFabric:false,ownerApproved:false,humanVisualApproval:false});
}
