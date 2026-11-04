// Research-only: cheap objective COLOR-DRIFT WARNING for a source garment vs
// generated garment, using independently trusted foreground masks.
// This is NOT proof of garment fidelity, authenticity, fabric or construction.
// There is NO provider call, source/photo upload, account write or UI import.
const CATEGORIES=new Set(['Tops','Bottoms','Dresses','Outerwear','Shoes']);
function checkImage(x){
 const {width:w,height:h,data,mask}=x??{},n=w*h;
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<4||h<4||n>2_000_000||
   !(data instanceof Uint8Array||data instanceof Uint8ClampedArray)||
   !(mask instanceof Uint8Array||mask instanceof Uint8ClampedArray)||
   ![n*3,n*4].includes(data.length)||mask.length!==n)
  throw Error('Invalid source or generated garment pixels and masks');
 const channels=data.length/n;let foreground=0;
 for(const v of mask){
  if(v!==0&&v!==1&&v!==255)throw Error('Invalid binary garment mask');
  if(v)foreground++;
 }
 if(foreground<25||foreground/n<.003||foreground/n>.98)
  throw Error('Insufficient independent garment foreground evidence');
 return {width:w,height:h,n,data,mask,channels,foreground};
}
function summarize(x){
 const v=checkImage(x),{data,mask,n,channels}=v,values=[[],[],[]];
 let sumLuma=0,lowSignal=0,used=0;
 const step=Math.max(1,Math.floor(n/12_000));
 for(let i=0;i<n;i+=step){
  if(!mask[i])continue;
  const k=i*channels,r=data[k],g=data[k+1],b=data[k+2];
  const luma=(.2126*r+.7152*g+.0722*b)/255;
  sumLuma+=luma;used++;
  const sum=r+g+b;
  if(sum<48){lowSignal++;continue;}
  values[0].push(r/sum);values[1].push(g/sum);values[2].push(b/sum);
 }
 if(!used)throw Error('No garment samples');
 const median=a=>{if(!a.length)return null;a.sort((a,b)=>a-b);
   const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;};
 return {foregroundPixels:v.foreground,foregroundShare:v.foreground/n,
  sampledGarmentPixels:used,colorSignalPixels:values[0].length,
  darkGarmentFraction:lowSignal/used,
  chromaticity:values.map(median),
  averageLuminance:sumLuma/used};
}
export function compareGarmentColors({source,generated,category,sourceSha256,generatedSha256}){
 if(!CATEGORIES.has(category)||!(/^[a-f0-9]{64}$/.test(sourceSha256||''))||
  !(/^[a-f0-9]{64}$/.test(generatedSha256||''))||
  sourceSha256===generatedSha256)throw Error('Invalid garment identity or source hashes');
 const s=summarize(source),g=summarize(generated);
 const measurable=s.colorSignalPixels>=12&&g.colorSignalPixels>=12&&
   s.darkGarmentFraction<.75&&g.darkGarmentFraction<.75;
 const distance=measurable?Math.hypot(...s.chromaticity.map((v,i)=>v-g.chromaticity[i])):null;
 const delta=Math.abs(s.averageLuminance-g.averageLuminance);
 const warnings=[];
 if(!measurable)warnings.push('dark-or-inadequately-sampled-fabric');
 if(measurable&&distance>.085)warnings.push('dominant-color-chroma-drift');
 if(measurable&&delta>.34)warnings.push('strong-fabric-brightness-shift');
 // Even if the dominant color passes, a newly created logo/pocket is
 // undetectable by this check. Never approve a generated garment from it.
 return {sourceSha256,generatedSha256,category,
  chromaDistance:distance,luminanceDifference:delta,
  sourceSummary:s,generatedSummary:g,warnings,
  sourceImageModified:false,sourceMaskModified:false,
  imageBackgroundExcludedByCallerMask:true,
  garmentIdentityVerified:false,fabricPatternVerified:false,
  constructionDetailsVerified:false,groundTruthAvailable:false,
  outputCanReplaceClosetTile:false,requiresOwnerSourceComparison:true};
}
