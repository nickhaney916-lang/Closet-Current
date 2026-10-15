export function validateVectorBundle(metadata,vectors){
 if(metadata?.version!==1||metadata?.model!=='ff13/fashion-clip'||metadata.dimensions!==512||!Number.isFinite(metadata.scale)||metadata.scale<=0||metadata.scale>200||!Array.isArray(metadata.labels)||!metadata.labels.length||metadata.labels.length>3000||new Set(metadata.labels).size!==metadata.labels.length||metadata.labels.some(x=>typeof x!=='string'||!x))throw Error('Invalid recognition assets.');
 if(!(vectors instanceof Float32Array)||vectors.length!==metadata.labels.length*metadata.dimensions||vectors.some(x=>!Number.isFinite(x)))throw Error('Invalid recognition vectors.');
}
export function normalizedVector(values,dimensions){
 if(!values||values.length!==dimensions)throw Error('Invalid image features.');
 let norm=0;for(const x of values){if(!Number.isFinite(x))throw Error('Invalid image features.');norm+=x*x;}
 norm=Math.sqrt(norm);if(norm<1e-8)throw Error('Invalid image features.');
 return Float32Array.from(values,x=>x/norm);
}
export function makeVectorScorer(encode,metadata,vectors){
 validateVectorBundle(metadata,vectors);const positions=new Map(metadata.labels.map((label,i)=>[label,i*metadata.dimensions])),cache=new WeakMap();
 const features=image=>{if(!image||typeof image!=='object')throw Error('Invalid feature image.');if(!cache.has(image))cache.set(image,Promise.resolve().then(()=>encode(image)).then(x=>normalizedVector(x,metadata.dimensions)).catch(error=>{cache.delete(image);throw error;}));return cache.get(image);};
 const score=async function(image,labels){
  if(!image||typeof image!=='object'||!Array.isArray(labels)||!labels.length||new Set(labels).size!==labels.length||labels.some(x=>!positions.has(x)))throw Error('Invalid recognition labels or image.');
  const embedding=await features(image),logits=labels.map(label=>{const start=positions.get(label);let dot=0;for(let i=0;i<metadata.dimensions;i++)dot+=embedding[i]*vectors[start+i];return dot*metadata.scale;});
  const maximum=Math.max(...logits),weights=logits.map(x=>Math.exp(x-maximum)),sum=weights.reduce((a,b)=>a+b,0);
  return labels.map((label,i)=>({label,score:weights[i]/sum})).sort((a,b)=>b.score-a.score);
 };
 score.features=async image=>Array.from(await features(image));return score;
}

export async function loadVectorAssets(metadataUrl,binaryUrl,{fetcher=fetch,digest=bytes=>crypto.subtle.digest('SHA-256',bytes)}={}){
 const [manifestResponse,binaryResponse]=await Promise.all([fetcher(metadataUrl),fetcher(binaryUrl)]);
 if(!manifestResponse.ok||!binaryResponse.ok)throw Error('Recognition assets could not load.');
 const metadata=await manifestResponse.json(),bytes=await binaryResponse.arrayBuffer();
 if(!/^[a-f0-9]{40}$/.test(metadata.revision||'')||!/^[a-f0-9]{64}$/.test(metadata.sha256||'')||bytes.byteLength%4)throw Error('Invalid recognition assets.');
 const hash=Array.from(new Uint8Array(await digest(bytes)),x=>x.toString(16).padStart(2,'0')).join('');
 if(hash!==metadata.sha256)throw Error('Recognition asset integrity check failed.');
 const vectors=new Float32Array(bytes);validateVectorBundle(metadata,vectors);return {metadata,vectors};
}
