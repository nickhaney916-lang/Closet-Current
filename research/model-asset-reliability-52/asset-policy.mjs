/**
 * MODEL52 research-only browser network policy for the PINNED local FashionCLIP
 * runtime. Explicitly allow Hugging Face's documented/observed 307 cache
 * redirect target; never allow arbitrary models, writes or any photo payload.
 *
 * This is a QA-network gate, not a production proxy or model-host override.
 */
export const MODEL52_REVISION='0f99955d944c39bfd9d035a02ac273c7a44a406b';
export function allowedFashionClipAsset52(request){
 if(!request||typeof request.method!=='function'||request.method()!=='GET')return false;
 let url;try{url=new URL(request.url());}catch{return false;}
 if(url.protocol!=='https:'||url.username||url.password)return false;
 const host=url.hostname,path=url.pathname;
 if(host==='cdn.jsdelivr.net')return path.startsWith('/npm/@huggingface/transformers@3.8.1/dist/');
 if(host==='huggingface.co'){
  return path.startsWith('/ff13/fashion-clip/resolve/'+MODEL52_REVISION+'/')||
   path.startsWith('/api/resolve-cache/models/ff13/fashion-clip/'+MODEL52_REVISION+'/');
 }
 if(/^(cas-bridge|cas-server|transfer)\.xethub\.hf\.co$/.test(host))return true;
 if(host==='us.aws.cdn.hf.co')return path.startsWith('/xet-bridge-us/');
 return false;
}

/**
 * Classify browser-QA failures without treating deliberately blocked optional
 * SegFormer detection as failed FashionCLIP type/category inference.
 * Never inspect a URL query or return token/owner/customer data.
 */
export const SEGFORMER52_REVISION='a2489ea8e7ec1ee912190546bad31a4906ccca76';
export function modelAssetFamily52(record){
 const host=record?.host,path=record?.path;
 if(typeof host!=='string'||typeof path!=='string')return 'unknown';
 if(host==='huggingface.co'){
  if(path.startsWith('/Xenova/segformer_b0_clothes/resolve/'+SEGFORMER52_REVISION+'/')||
     path.startsWith('/api/resolve-cache/models/Xenova/segformer_b0_clothes/'+SEGFORMER52_REVISION+'/'))return 'optional-segformer';
  if(path.startsWith('/ff13/fashion-clip/resolve/'+MODEL52_REVISION+'/')||
     path.startsWith('/api/resolve-cache/models/ff13/fashion-clip/'+MODEL52_REVISION+'/'))return 'fashionclip';
 }
 if(host==='cdn.jsdelivr.net'&&path.startsWith('/npm/@huggingface/transformers@3.8.1/dist/'))return 'shared-transformers-runtime';
 if(host==='us.aws.cdn.hf.co'&&path.startsWith('/xet-bridge-us/'))return 'shared-model-cdn';
 return 'unknown';
}
