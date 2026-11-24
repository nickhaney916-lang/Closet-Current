// Check synthetic canaries without recording values, payloads, URLs or credentials.
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';

const modelRoot='/ff13/fashion-clip/resolve/0f99955d944c39bfd9d035a02ac273c7a44a406b/';
const publicReads={
 'https://fonts.googleapis.com':['/css2'],
 'https://raw.githubusercontent.com':['/nickhaney916-lang/Closet-Current/main/public/trend-data.json'],
 'https://cdn.jsdelivr.net':['/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js'],
 'https://huggingface.co':['preprocessor_config.json','config.json','onnx/vision_model_quantized.onnx'].map(name=>modelRoot+name),
};

export function createPhotoContainmentAudit(firstOwnerPhotos,secondOwnerPhoto){
 const canary='p1607-'+randomBytes(12).toString('hex');
 const secondCanary='p1607-'+randomBytes(12).toString('hex');
 const originals=[...firstOwnerPhotos,secondOwnerPhoto];
 const fingerprints=photos=>photos.flatMap(source=>[source.sha,source.url.split(',')[1]]);
 const firstOwnerSecrets=[canary,...fingerprints(firstOwnerPhotos)];
 const secrets=[...firstOwnerSecrets,secondCanary,...fingerprints([secondOwnerPhoto])];
 const findings=new Set();
 const counts={publicReads:0,localReads:0,syntheticAuth:0,websocket:0,workerStarts:0};
 const contains=text=>secrets.some(secret=>text.includes(secret));
 const report=()=>({counts:{...counts},findings:[...findings].sort()});
 return {
  canary,secondCanary,report,
  redact(value){
   let text=String(value);
   for(const secret of secrets)text=text.replaceAll(secret,'[redacted fixture]');
   return text;
  },
  request(request,origin,authOrigin){
   const url=new URL(request.url());
   if(url.protocol!=='http:'&&url.protocol!=='https:')return;
   const body=request.postDataBuffer();
   let requestTarget=request.url();
   try{requestTarget=decodeURIComponent(requestTarget);}catch{}
   if(contains(requestTarget)||
      Object.values(request.headers()).some(contains)||
      body&&(contains(body.toString())||originals.some(source=>body.includes(source.bytes))))
    findings.add('private fixture in HTTP request');
   if(url.origin===authOrigin&&/^\/auth\/v1\/(token|logout)$/.test(url.pathname)){
    ++counts.syntheticAuth;
    if(request.method()!=='POST')findings.add('unexpected auth method');
   }else if(url.origin===origin){
    ++counts.localReads;
    if(request.method()!=='GET'&&request.method()!=='HEAD')findings.add('non-read loopback request');
   }else{
    ++counts.publicReads;
    if(request.method()!=='GET'&&request.method()!=='HEAD')findings.add('unexpected off-origin method');
    const fontAsset=url.origin==='https://fonts.gstatic.com'&&
     /^\/s\/[a-z0-9/_-]+\.(woff2?|ttf)$/i.test(url.pathname);
    const allowed=fontAsset||publicReads[url.origin]?.includes(url.pathname);
    if(!allowed){
     // Publish only known public host classes, never addresses learned from data.
     const known=['fonts.googleapis.com','fonts.gstatic.com','raw.githubusercontent.com','cdn.jsdelivr.net','huggingface.co'];
     const host=known.includes(url.hostname)?url.hostname:'unclassified';
     findings.add('unexpected off-origin destination: '+host);
    }
   }
  },
  async watchObjectURLs(context){
   await context.addInitScript(()=>{
    const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL);
    const live=new Set();
    let created=0;
    URL.createObjectURL=value=>{
     const url=create(value);live.add(url);++created;return url;
    };
    URL.revokeObjectURL=url=>{live.delete(url);return revoke(url);};
    window.p1607ObjectURLCounts=()=>({created,live:live.size});
   });
  },
  async verifyObjectURLCleanup(page){
   await page.waitForFunction(()=>{const {created,live}=p1607ObjectURLCounts();return created>0&&live===0;},
    null,{timeout:5000});
  },
  attach(page){
   page.on('console',message=>{if(contains(message.text()))findings.add('private fixture in console');});
   page.on('pageerror',error=>{if(contains(String(error)))findings.add('private fixture in page error');});
   page.on('websocket',()=>{++counts.websocket;findings.add('unexpected WebSocket');});
   page.on('worker',()=>{++counts.workerStarts;});
  },
  async storage(page,{secondOwner=false}={}){
   const observed=await page.evaluate(async ({secrets,forbidden,publicReads,photoDigests})=>{
    const has=text=>secrets.some(secret=>String(text).includes(secret));
    const storagePrivate=[localStorage,sessionStorage].some(storage=>
     Object.keys(storage).some(key=>has(key)||has(storage.getItem(key))));
    let cacheEntries=0,modelCacheEntries=0,privateCache=false;
    const cachePolicy=new Set();
    for(const name of await caches.keys()){
     const cache=await caches.open(name);
     for(const request of await cache.keys()){
      ++cacheEntries;
      const response=await cache.match(request);
      const url=new URL(request.url);
      const publicModel=name==='transformers-cache'&&
       ['https://huggingface.co','https://cdn.jsdelivr.net'].includes(url.origin)&&
       publicReads[url.origin]?.includes(url.pathname);
      if(publicModel)++modelCacheEntries;
      if(request.method!=='GET')cachePolicy.add('non-GET cache key');
      if(url.origin!==location.origin&&!publicModel){
       const host=Object.hasOwn(publicReads,url.origin)?url.hostname:'unclassified';
       const family=name==='transformers-cache'?'model':name.startsWith('closet-current-')?'app static':'other';
       cachePolicy.add('unexpected off-origin '+family+' cache key: '+host);
      }
      if(/^\/(auth|rest|storage)\/v1\//.test(url.pathname))cachePolicy.add('private API cache key');
      if(has(name)||has(request.url)||
        (response&&[...response.headers.values()].some(has)))privateCache=true;
      if(!response)continue;
      const type=response.headers.get('content-type')||'';
      if(/^image\/(jpeg|png)/.test(type)){
       const bytes=new Uint8Array(await response.arrayBuffer());
       const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',bytes));
       const sha=[...digest].map(n=>n.toString(16).padStart(2,'0')).join('');
       if(photoDigests.includes(sha))privateCache=true;
      }else if(/(?:json|text|javascript)/i.test(type)&&has(await response.text()))privateCache=true;
     }
    }
    const view=document.documentElement.outerHTML+JSON.stringify({items,batch,currentBoard,savedOutfitBoards});
    const uiPrivate=forbidden.some(secret=>view.includes(secret));
    const ownerNamespace=db?.name==='closet-current-user-'+window.closetAuth?.user?.id;
    return {storagePrivate,privateCache,cacheEntries,modelCacheEntries,cachePolicy:[...cachePolicy],uiPrivate,ownerNamespace};
   },{secrets,forbidden:secondOwner?firstOwnerSecrets:[],publicReads,photoDigests:originals.map(source=>source.sha)});
   assert.equal(observed.storagePrivate,false,'shared browser storage kept a private fixture');
   assert.equal(observed.privateCache,false,'public cache contained a private fixture');
   assert.deepEqual(observed.cachePolicy,[],'public cache violated the static/model key policy');
   assert.equal(observed.uiPrivate,false,'second owner UI exposed a private fixture');
   assert.equal(observed.ownerNamespace,true,'active store must use the current owner namespace');
   return {cacheEntries:observed.cacheEntries,modelCacheEntries:observed.modelCacheEntries};
  },
  verify(){
   assert.deepEqual([...findings],[],'private photograph containment check failed');
   assert.ok(counts.localReads>0&&counts.syntheticAuth>=2,'network observation did not cover the signed journey');
   return report();
  }
 };
}
