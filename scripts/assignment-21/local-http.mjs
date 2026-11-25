import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const config=Object.fromEntries((await readFile(process.env.SUPABASE_TEST_ENV,'utf8')).split('\n')
 .filter(line=>/^[A-Z_]+=/.test(line)).map(line=>{const i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1).replace(/^"|"$/g,'')];}));
export const endpoint=new URL(config.API_URL);
assert.equal(endpoint.hostname,'127.0.0.1','Disposable IPv4 loopback only');
assert.equal(endpoint.protocol,'http:');
assert.equal(endpoint.pathname,'/');
assert.ok(endpoint.port && !endpoint.username && !endpoint.password && !endpoint.search && !endpoint.hash, 'Expected local HTTP origin');

export const key=config.ANON_KEY||config.PUBLISHABLE_KEY;
assert.ok(key,'Missing local public key');
const legacyRole=key.startsWith('ey') ? JSON.parse(Buffer.from(key.split('.')[1],'base64url')).role : null;
assert.ok(legacyRole==='anon'||key.startsWith('sb_publishable_'),'Expected a public endpoint credential');
export async function request(path,token,method='GET',body,extraHeaders={}){
 const target=new URL(path,endpoint);
 assert.equal(target.origin,endpoint.origin,'Refusing nonlocal HTTP request');
 const headers={...extraHeaders,apikey:key,...(token?{authorization:'Bearer '+token}:{})};
 if(target.pathname==='/rest/v1/closet_backups'&&['PATCH','DELETE'].includes(method))headers.prefer='return=representation';
 if(body!==undefined)headers['content-type']=Buffer.isBuffer(body)?'image/jpeg':'application/json';
 const response=await fetch(target,{headers,method,body:body===undefined?undefined:Buffer.isBuffer(body)?body:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(20000)});
 return {status:response.status,ok:response.ok,bytes:Buffer.from(await response.arrayBuffer())};
}
export const json=r=>JSON.parse(r.bytes);
