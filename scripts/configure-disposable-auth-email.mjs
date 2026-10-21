// Edit ONLY an isolated, freshly initialized CLI config under RUNNER_TEMP.
// Never link Supabase projects, touch a hosted Auth setting or store credentials.
import {readFile,writeFile,realpath} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import assert from 'node:assert/strict';
export const github='https://nickhaney916-lang.github.io/Closet-Current/';
export const cloudflare='https://closet-current.pages.dev/';
export function configure(content) {
 if(typeof content!=='string'||!content.includes('[auth]')||!content.includes('[auth.email]'))
  throw Error('Expected fresh local CLI auth config');
 let section='',found=new Set();
 const lines=content.split('\n').map(line=>{
  const heading=line.match(/^\[([a-z._]+)]\s*$/);
  if(heading){section=heading[1];return line;}
  if(section==='auth'&&/^\s*site_url\s*=/.test(line)){
   found.add('site');return 'site_url = "http://127.0.0.1:3000"';
  }
  if(section==='auth'&&/^\s*additional_redirect_urls\s*=/.test(line)){
   found.add('redirect');return 'additional_redirect_urls = ["'+github+'", "'+cloudflare+'"]';
  }
  if(section==='auth.email'&&/^\s*enable_confirmations\s*=/.test(line)){
   found.add('confirmation');return 'enable_confirmations = true';
  }
  if(section==='auth.rate_limit'&&/^\s*email_sent\s*=/.test(line)){
   found.add('rate');return 'email_sent = 60';
  }
  return line;
 });
 for(const k of ['site','redirect','confirmation'])
  if(!found.has(k))throw Error('Local Auth config key absent: '+k);
 if(!found.has('rate')){
  const at=lines.findIndex(x=>x.trim()==='[auth.rate_limit]');
  if(at<0)throw Error('Local email rate-limit section absent');
  lines.splice(at+1,0,'email_sent = 60');
 }
 return lines.join('\n');
}
if(import.meta.url===new URL('file://'+resolve(process.argv[1]||'')).href){
 const root=process.env.RUNNER_TEMP;
 if(process.env.CI!=='true'||!root||!process.argv[2])
  throw Error('Disposable GitHub-runner configuration only');
 const realRoot=await realpath(root),target=await realpath(process.argv[2]);
 assert.ok(target.startsWith(realRoot+sep)&&target.endsWith('/supabase/config.toml'),
  'Refusing to edit any non-disposable Supabase config');
 const current=await readFile(target,'utf8'),next=configure(current);
 if(next===current)throw Error('Expected explicit fresh disposable Auth config changes');
 await writeFile(target,next);
 console.log('LOCAL_AUTH_EMAIL_CONFIG_READY '+JSON.stringify({
  confirmationsRequired:true,redirectTargets:2,localhostOnly:true,
  noRemoteProjectChanges:true
 }));
}
