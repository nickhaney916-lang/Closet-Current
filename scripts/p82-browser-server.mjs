import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
export async function server82(){
 const root=resolve('public');const server=createServer(async(req,res)=>{try{
  if(req.method!=='GET')throw Error('GET only');let p=new URL(req.url,'http://localhost').pathname;
  if(p==='/'){res.setHeader('Content-Type','text/html');return res.end('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>P82 local public-photo research</title><body><main></main></body></html>');}
  const asset=p.startsWith('/_dual82/'),base=asset?resolve('benchmark/p82-model-assets'):root;
  const path=resolve(base,'.'+decodeURIComponent(asset?p.slice('/_dual82'.length):p));if(!path.startsWith(base+'/'))throw Error('path');
  let b=await readFile(path);if(extname(path)==='.css')b=Buffer.from(b.toString().replace(/@import\s+url\([^;]+;/g,''));
  res.setHeader('Content-Type',({'.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.wasm':'application/wasm','.css':'text/css','.bin':'application/octet-stream','.onnx':'application/octet-stream'})[extname(path)]||'application/octet-stream');res.end(b);
 }catch{res.statusCode=404;res.end('Missing');}});await new Promise(r=>server.listen(0,'127.0.0.1',r));return {server,origin:'http://127.0.0.1:'+server.address().port};
}
