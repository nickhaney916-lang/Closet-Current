// Separate from production vector-scorer: never reinterpret FashionCLIP weights.
export const MODELS67=Object.freeze({
 marqo:{model:'Marqo/marqo-fashionSigLIP',revision:'c56244cc94f92419e8369fa71efdaf403b124ce8',dimensions:768},
 marqoclip:{model:'Marqo/marqo-fashionCLIP',revision:'44f4c655124ed71e90cbf528d82f508d69d8a81b',dimensions:512}
});
export function independentScorer67(encode,metadata,vectors){
 const spec=Object.values(MODELS67).find(x=>x.model===metadata?.model);
 if(!spec||metadata.version!==67||metadata.revision!==spec.revision||metadata.dimensions!==spec.dimensions||metadata.scale!==100||
  !Array.isArray(metadata.labels)||!metadata.labels.length||new Set(metadata.labels).size!==metadata.labels.length||metadata.labels.some(x=>typeof x!=='string'||!x)||
  !(vectors instanceof Float32Array)||vectors.length!==metadata.labels.length*metadata.dimensions||vectors.some(x=>!Number.isFinite(x)))throw Error('Invalid independent vector bundle');
 const positions=new Map(metadata.labels.map((label,i)=>[label,i*metadata.dimensions])),cache=new WeakMap();
 const features=async image=>{
  if(!image||typeof image!=='object')throw Error('Invalid photo');
  if(!cache.has(image))cache.set(image,Promise.resolve().then(()=>encode(image)).then(values=>{
   if(values?.length!==metadata.dimensions||Array.from(values).some(x=>!Number.isFinite(x)))throw Error('Invalid independent image embedding');
   const norm=Math.hypot(...values);if(norm<1e-8)throw Error('Zero image embedding');return Float32Array.from(values,x=>x/norm);
  }).catch(error=>{cache.delete(image);throw error;}));
  return cache.get(image);
 };
 const score=async(image,labels)=>{
  if(!Array.isArray(labels)||!labels.length||new Set(labels).size!==labels.length||labels.some(x=>!positions.has(x)))throw Error('Unknown independent label');
  const feature=await features(image),logits=labels.map(label=>{let dot=0;const start=positions.get(label);for(let j=0;j<feature.length;j++)dot+=feature[j]*vectors[start+j];return 100*dot;});
  const maximum=Math.max(...logits),weights=logits.map(x=>Math.exp(x-maximum)),sum=weights.reduce((a,b)=>a+b,0);
  return labels.map((label,i)=>({label,score:weights[i]/sum})).sort((a,b)=>b.score-a.score);
 };
 score.features=async image=>Array.from(await features(image));return score;
}
export async function loadIndependentVectors67(metadataURL,binaryURL,{fetcher=fetch}={}){
 const [a,b]=await Promise.all([fetcher(metadataURL),fetcher(binaryURL)]);
 if(!a.ok||!b.ok)throw Error('Independent assets unavailable');
 const metadata=await a.json(),bytes=await b.arrayBuffer();
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
 if(!/^[a-f0-9]{64}$/.test(metadata.sha256||'')||digest!==metadata.sha256||bytes.byteLength%4)throw Error('Independent assets SHA mismatch');
 const vectors=new Float32Array(bytes);independentScorer67(()=>{},metadata,vectors);return {metadata,vectors};
}
// Candidate scores are not calibrated probabilities. All candidate results
// stay manual-review proposals until sealed acceptance establishes safety.
export function reviewOnly67(result,model){
 if(!Object.hasOwn(MODELS67,model))throw Error('Unknown independent model');
 const proposal=structuredClone(result);
 return {...proposal,strong:false,categoryConfirmed:false,categoryOnly:false,details:{},
  reason:'independent_model_requires_review',requiresReview:true,
  independent67:{model,...MODELS67[model],proposalStrong:proposal.strong===true,proposalDetails:proposal.details||{}}};
}
