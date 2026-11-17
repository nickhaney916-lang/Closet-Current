#!/usr/bin/env node
// Local-only HTTPS phone probe. Does NOT serve the app, auth, account or cloud API.
import {createServer} from 'node:https';
import {readFile} from 'node:fs/promises';
import {isIP} from 'node:net';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const isPrivate=host=>host==='127.0.0.1'||host==='::1'||
 /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)||
 /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host)||
 /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(host);
export function parseArgs(args){
 const x={host:'127.0.0.1',port:8443};
 for(let i=0;i<args.length;i+=2){
  if(!['--host','--port','--cert','--key'].includes(args[i])||!args[i+1])
   throw Error('usage: --cert cert.pem --key key.pem [--host private-LAN-IP] [--port 8443]');
  x[args[i].slice(2)]=args[i+1];
 }
 x.port=Number(x.port);
 if(!x.cert||!x.key)throw Error('trusted local HTTPS cert and key required');
 if(!isIP(x.host)||!isPrivate(x.host))throw Error('only explicit private-LAN/loopback listening is allowed');
 if(!Number.isInteger(x.port)||x.port<1024||x.port>65535)throw Error('invalid port');
 return x;
}
export async function serve(options){
 const content=await readFile(resolve('research/parallel97-device-kit/probe.html'));
 const server=createServer({cert:await readFile(options.cert),key:await readFile(options.key)},(req,res)=>{
  const pathname=new URL(req.url,'https://localhost').pathname;
  if(req.method!=='GET'||(pathname!=='/probe'&&pathname!=='/health')){
   res.writeHead(404,{'cache-control':'no-store'});res.end();return;
  }
  if(pathname==='/health'){
   res.writeHead(200,{'content-type':'application/json','cache-control':'no-store'});
   res.end('{"ok":true,"noDeploy":true}');return;
  }
  res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store',
   'x-content-type-options':'nosniff','referrer-policy':'no-referrer',
   'content-security-policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src blob:; connect-src 'none'; form-action 'none'; base-uri 'none'"});
  res.end(content);
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(options.port,options.host,resolve)});
 return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
 serve(parseArgs(process.argv.slice(2))).then(()=>console.log('HTTPS local device probe on private network; no app files or private data served')).catch(e=>{
  console.error('P97_SERVER_REFUSED:',e.message);process.exitCode=1;
 });
