#!/usr/bin/env node
/** M32 local trusted-HTTPS physical-device handoff, public photos + synthetic owner.
 * Never a deployment, never a physical device verification or release decision.
 * Browser sends no photos or evidence back to the server; all requests GET.
 */
import {createServer} from 'node:https';
import {readFile} from 'node:fs/promises';
import {createHash,timingSafeEqual} from 'node:crypto';
import {resolve,extname} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=resolve('public'),lab=resolve('research/master-consolidation-1054');
const exactHead=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const SHA=/^[a-f0-9]{64}$/;
const check=(v,m)=>{if(!v)throw Error('M32_STARTUP_'+m);};
const hash=b=>createHash('sha256').update(b).digest('hex');
const ids=['commons-0035','commons-0062','commons-0078','commons-0059'];
const manifest=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const photos={};
for(const id of ids){
 const p=manifest.find(x=>x.id===id);
 check(p?.verified===true&&SHA.test(p?.sha256||'')&&
  p.attribution?.source?.startsWith('https://commons.wikimedia.org/wiki/File:'),
  'LICENSED_PUBLIC_ORIGINAL');
 const bytes=await readFile(resolve('benchmark/photos',p.image));
 check(bytes.length>1000&&bytes.length<8*1024*1024&&hash(bytes)===p.sha256,
  'ORIGINAL_BYTES_SHA');
 photos[id]={id,sha256:p.sha256,image:p.image,license:p.attribution.license};
}
const cpuRuntime={
 'ort.wasm.min.mjs':'0cb5ac5be2c414d5b9e361f857108630c6d6e24a5ab9be3cf5f761de55289e94',
 'ort-wasm-simd-threaded.wasm':'f061472c6e77d6d50d079aacdc0ff9b63fee287ddd2cbf46cf62438d3891de2b'
};
for(const [name,digest] of Object.entries(cpuRuntime)){
 const b=await readFile(resolve('node_modules/onnxruntime-web/dist',name));
 check(hash(b)===digest,'PINNED_CPU_RUNTIME');
}
const access=process.env.M32_ACCESS_TOKEN||'';
check(/^[A-Za-z0-9_-]{32,128}$/.test(access),'ACCESS_TOKEN_REQUIRED');
const cert=process.env.M32_TLS_CERT,key=process.env.M32_TLS_KEY;
check(!!cert&&!!key,'OWNER_TRUSTED_TLS_REQUIRED');
const bind=process.env.M32_BIND||'127.0.0.1';
check(/^(?:localhost|127\.0\.0\.1|(?:\d{1,3}\.){3}\d{1,3})$/.test(bind),'VALID_IP_BIND');
check(['127.0.0.1','localhost'].includes(bind)||process.env.M32_ALLOW_LAN==='1',
  'EXPLICIT_LAN_APPROVAL_REQUIRED');
const port=Number(process.env.M32_PORT||8443);
check(Number.isInteger(port)&&port>=1024&&port<=65535,'VALID_PORT');
const originalHarness=await readFile('scripts/test-main1054-native-runtime-parity-m31-browser.mjs','utf8');
const tick=String.fromCharCode(96);
const anchor='const boot='+tick,end=tick+';\n/** Continuous native editor';
const start=originalHarness.indexOf(anchor),stop=originalHarness.indexOf(end,start+anchor.length);
check(start>0&&stop>start&&originalHarness.indexOf(anchor,start+1)<0,'ORIGINAL_NATIVE_HARNESS_CHANGED');
const app=await readFile(root+'/app.js','utf8');
const from=app.indexOf('function node('),to=app.indexOf('function cropClothingPhoto(');
check(from>0&&to>from,'ORIGINAL_OWNER_FIELD_BOUNDARY');
const pieces={
 taxonomy:await readFile(root+'/taxonomy.js','utf8'),
 details:await readFile(root+'/clothing-details.js','utf8'),
 nativeFields:app.slice(from,to)
};
check(/function clothingFields\(/.test(pieces.nativeFields),'NATIVE_OWNER_FIELDS_MISSING');
let boot=originalHarness.slice(start+anchor.length,stop);
for(const [key,value] of Object.entries(pieces)){
 const slot='$'+'{'+key+'}';
 check(boot.split(slot).length===2,'NATIVE_SCRIPT_TEMPLATE_'+key);
 boot=boot.replace(slot,value);
}
check(!boot.includes('$'+'{'),'UNEXPECTED_DYNAMIC_NATIVE_TEMPLATE');
const oldImport="'/m25/cpu-browser-request-m25.mjs'";
check(boot.includes(oldImport),'ORIGINAL_CPU_OWNER_ADAPTER_MISSING');
boot=boot.replace(oldImport,"(window.m32CancelMode?'/m28/cpu-browser-request-m28.mjs':'/m25/cpu-browser-request-m25.mjs')");
const ownerBoot="window.runtimeVariantM30='cpu';window.m32CancelMode=false;\n"+boot;
const html=await readFile(lab+'/physical-device-m32.html','utf8');
const client=await readFile(lab+'/physical-device-m32-client.mjs','utf8');
const tls={cert:await readFile(resolve(cert)),key:await readFile(resolve(key))};
const types={
 '.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.json':'application/json; charset=utf-8','.onnx':'application/octet-stream',
 '.wasm':'application/wasm','.bin':'application/octet-stream'
};
const equal=(a,b)=>{
 const x=Buffer.from(a||''),y=Buffer.from(b||'');
 return x.length===y.length&&timingSafeEqual(x,y);
};
const send=(res,status,type,data)=>{
 res.writeHead(status,{'content-type':type,'cache-control':'no-store',
  'x-content-type-options':'nosniff','referrer-policy':'no-referrer',
  'cross-origin-resource-policy':'same-origin',
  'permissions-policy':'camera=(),microphone=(),geolocation=()',
  'x-frame-options':'DENY','content-security-policy':[
   "default-src 'self' blob: data:","base-uri 'none'","object-src 'none'",
   "frame-ancestors 'none'","form-action 'none'","worker-src 'self' blob:",
   "connect-src 'self' blob:","img-src 'self' data:",
   "script-src 'self' blob: 'wasm-unsafe-eval'"].join('; ')});
 res.end(data);
};
const safeFile=async(base,relative)=>{
 const path=resolve(base,relative);
 if(!path.startsWith(base+'/'))throw Error('out of scope');
 return readFile(path);
};
const server=createServer(tls,async(req,res)=>{
 try{
  const u=new URL(req.url,'https://localhost'),path=decodeURIComponent(u.pathname);
  if(req.method!=='GET'||path.includes('\\')||path.includes('\0')||path.split('/').includes('..')){
   return send(res,405,'text/plain','not available');
  }
  if(u.searchParams.has('access')){
   if(!equal(u.searchParams.get('access'),access))return send(res,403,'text/plain','not authorized');
   res.writeHead(302,{location:'/',
    'set-cookie':'__Host-ccm32='+access+'; Path=/; Secure; HttpOnly; SameSite=Strict',
    'cache-control':'no-store'});return res.end();
  }
  const c=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('__Host-ccm32='));
  if(!equal(c?.slice('__Host-ccm32='.length),access))return send(res,403,'text/plain','not authorized');
  let data,type='application/octet-stream';
  if(path==='/'){data=html;type='text/html; charset=utf-8';}
  else if(path==='/device/client.mjs'){data=client;type=types['.mjs'];}
  else if(path==='/device/owner-boot.js'){data=ownerBoot;type=types['.js'];}
  else if(path==='/device/manifest.json'){
   data=JSON.stringify({schema:'main1054-physical-device-handoff-m32-v1',
    codeCommit:exactHead,familyAlpha:'HOLD',releaseAuthorized:false,
    privateOwner:false,hostedWrites:0,cpuRuntime:'m25-cpu-only-wasm',
    sources:ids.map(id=>({id,sha256:photos[id].sha256,license:photos[id].license}))});
   type=types['.json'];
  }
  else if(path.startsWith('/device/jpeg/')){
   const id=path.slice('/device/jpeg/'.length);
   if(!photos[id])throw Error('not a source');
   data=await readFile(resolve('benchmark/photos',photos[id].image));type='image/jpeg';
  }else{
   const routes=[
    ['/_dual82/',resolve('benchmark/p82-model-assets')],
    ['/_cpu25/runtime/',resolve('node_modules/onnxruntime-web/dist')],
    ['/m25/',lab],['/m28/',lab],['/',root]
   ];
   const [prefix,base]=routes.find(([x])=>path.startsWith(x))||[];
   if(!prefix)throw Error('no route');
   data=await safeFile(base,path.slice(prefix.length));
   type=types[extname(path)]||'application/octet-stream';
  }
  send(res,200,type,data);
 }catch{send(res,404,'text/plain','not found');}
});
server.listen(port,bind,()=>console.log(JSON.stringify({
 status:'M32_LOCAL_HTTPS_OWNER_ACTION_REQUIRED',url:'https://'+bind+':'+port,
 codeCommit:exactHead,publicOriginals:ids,releaseAuthorized:false,
 hosted:false,privateWardrobes:false,accessTokenLogged:false,
 familyAlpha:'HOLD'
})));
const shutdown=()=>server.close();
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
