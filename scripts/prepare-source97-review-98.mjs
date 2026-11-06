#!/usr/bin/env node
/**
 * P98 research ONLY: turn independently SHA-pinned P97 Commons JPEGs into
 * separate, blinded, offline A/B/C human-annotation workspaces.
 * Photos stay in private OS temporary directories, never git/Actions artifacts.
 * NO model scoring, no automatic "human" annotations and no release promotion.
 */
import {readFile,writeFile,mkdir,mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,basename} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createServer} from 'node:http';
import {setTimeout as sleep} from 'node:timers/promises';
import {verifyProvenance97,verifySourceOriginal97}
 from '../research/new-real-commons-candidate-cohort-97/source-gate.mjs';
import {makeInstancePacket94,verifyPacket94}
 from '../research/independent-instance-ground-truth-94/instance-evidence.mjs';

export const HOLD98='SOURCE98: research only, quarantined and NOT a locked benchmark; Family Alpha HOLD';
const roles=['A','B','C'];
const fail=msg=>{throw Error('SOURCE98 '+msg);};
const sha=/^[a-f0-9]{64}$/;
function exactOriginalURL(raw){
 const u=new URL(raw);
 if(u.protocol!=='https:'||u.hostname!=='upload.wikimedia.org'||
  !u.pathname.startsWith('/wikipedia/commons/')||u.search||u.hash||
  u.username||u.password||u.port)fail('original Commons HTTPS URL required');
 return u.href;
}
let nextDownload=0;
export async function downloadOriginal98(candidate){
 const url=exactOriginalURL(candidate.originalURL);
 let error='not requested';
 for(let retry=0;retry<5;retry++){
  const wait=nextDownload-Date.now();
  if(wait>0)await sleep(wait);
  nextDownload=Date.now()+18000;
  try{
   const response=await fetch(url,{redirect:'manual',
    headers:{'User-Agent':'ClosetCurrentScienceReviewHandoff98/1.0 (public photo human annotation, no upload)'},
    signal:AbortSignal.timeout(70000)});
   if(response.status===429||response.status===503){
    const secs=Number(response.headers.get('retry-after')||0);
    nextDownload=Math.max(nextDownload,Date.now()+Math.max(30000*(retry+1),
     Number.isFinite(secs)?Math.min(180000,secs*1000):0));
    throw Error('upstream rate limit '+response.status);
   }
   if(response.status!==200||response.redirected||
     !String(response.headers.get('content-type')||'').toLowerCase().includes('image/jpeg'))
     fail('source response not an unredirected original JPEG 200');
   const length=Number(response.headers.get('content-length')||0);
   if(length>15*1024*1024)fail('refuse oversized content length');
   const bytes=Buffer.from(await response.arrayBuffer());
   await verifySourceOriginal97(candidate,bytes,{requirePinned:true});
   return bytes;
  }catch(e){error=String(e?.message||e);}
 }
 fail('could not verify original JPEG '+candidate.id+' '+error);
}
function sourceRecord(c){
 if(!/^r97-[a-z-]{6,50}$/.test(c.id||'')||!sha.test(c.pinnedSourceSHA256||''))
  fail('invalid pinned P97 identity');
 return {id:c.id,image:c.id+'.jpg',sha256:c.pinnedSourceSHA256,
  verified:true,attribution:{source:c.commonsPage,license:c.license}};
}
export async function makeVerifiedHumanWorkspaces98({candidates,fetchBytes,html,
 root=null}={}){
 if(!Array.isArray(candidates)||candidates.length!==7||
  typeof fetchBytes!=='function'||typeof html!=='string'||
  !html.includes('closet-current-blind-instance-packet-94/v1'))
  fail('seven locked candidates and the existing source-locked original annotation UI are required');
 const seen=new Set(),seenNames=new Set(),verified=[];
 for(const c of candidates){
  const row=sourceRecord(c);
  if(seen.has(row.sha256)||seenNames.has(row.id))fail('duplicate original source');
  const bytes=Buffer.from(await fetchBytes(c));
  await verifySourceOriginal97(c,bytes,{requirePinned:true});
  verified.push({row,bytes,originalURL:exactOriginalURL(c.originalURL),
   license:c.license,author:c.author,source:c.commonsPage});
  seen.add(row.sha256);seenNames.add(row.id);
 }
 // An automatically created OS temp directory prevents accidental repository writes.
 // Tests may pass a fresh explicit temp directory; never accept a git/repo path.
 const folder=root?resolve(root):await mkdtemp(join(tmpdir(),'closet-current-source98-'));
 const cwd=resolve(process.cwd());
 if(folder===cwd||folder.startsWith(cwd+'/'))fail('refuse photos inside repository');
 if(root)await mkdir(folder,{recursive:false,mode:0o700});
 const result={schema:'source97-independent-human-handoff-98/v1',root:folder,
  originalPhotoCount:7,sourceSHA256Verified:7,
  actualHumanReviewers:0,humanInstanceMasks:0,scientificallyAccepted:0,
  candidateState:'SHA_PINNED_QUARANTINED_NOT_UNSEEN',
  phoneHardwareAccepted:false,familyAlpha:'HOLD',releaseAuthorized:false,
  roles:{}};
 for(const role of roles){
  const dir=join(folder,'reviewer-'+role);
  const photoDir=join(dir,'benchmark','fixtures');
  const htmlDir=join(dir,'research','independent-instance-ground-truth-94');
  await mkdir(photoDir,{recursive:true,mode:0o700});
  await mkdir(htmlDir,{recursive:true,mode:0o700});
  const packet=makeInstancePacket94({sources:verified.map(x=>x.row),role});
  verifyPacket94(packet);
  await writeFile(join(htmlDir,'annotate.html'),html,{mode:0o600,flag:'wx'});
  await writeFile(join(dir,'packet-'+role+'.json'),JSON.stringify(packet,null,2)+'\n',
   {mode:0o600,flag:'wx'});
  for(const x of verified)await writeFile(join(photoDir,x.row.image),x.bytes,
   {mode:0o600,flag:'wx'});
  const credits=verified.map(x=>x.row.id+': '+x.author+' | '+x.license+' | '+x.source).join('\n');
  const guide='# Research-only independent original-photo garment annotation\n\n'+
   'Role '+role+'. Give THIS folder only to one actual human reviewer. Do not share peer answers, model predictions, or historical labels.\n\n'+
   'Run from the Closet Current repository: node scripts/prepare-source97-review-98.mjs --serve "'+dir+'"\n'+
   'Then open http://127.0.0.1:8787/research/independent-instance-ground-truth-94/annotate.html and import packet-'+role+'.json using the file picker.\n'+
   'Personally trace individual garment polygons, category, subtype, primary and secondary colors; explicitly note any inspected image without garments. Export the JSON before leaving. There is NO autosave.\n'+
   'The server is read-only and loopback-only; review exports remain solely with the reviewer. The UI does not prove identity or independence.\n'+
   'These seven samples remain QUARANTINED, not independent unseen locked evaluation. No scores or release approval result from this packet.\n'+
   'Copy exported review JSON back through an approved private channel; never put it or private photos in a public GitHub issue.\n\n'+
   'Original photo attributions and provisional license statements (independent legal audit pending):\n'+credits+'\n';
  await writeFile(join(dir,'README.txt'),guide,{mode:0o600,flag:'wx'});
  result.roles[role]={directory:dir,packetId:packet.packetId,
   count:packet.total,sourceSHA256Only:true,independentHumanIdentityVerified:false};
 }
 return result;
}
export function readonlyReviewServer98({roleDir,port=8787}={}){
 if(!roleDir||!Number.isInteger(port)||port<0||port>65535)fail('invalid local server settings');
 const dir=resolve(roleDir);
 const server=createServer(async(req,res)=>{
  const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',
   'Referrer-Policy':'no-referrer',
   'Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src blob:; connect-src 'self'; base-uri 'none'; form-action 'none'"};
  function reply(code,body='Not available'){res.writeHead(code,headers);res.end(body);}
  if(!['GET','HEAD'].includes(req.method)){reply(405);return;}
  let part;
  try{part=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}
  catch{reply(400);return;}
  const htmlPath='/research/independent-instance-ground-truth-94/annotate.html';
  if(part!==htmlPath&&!/^\/benchmark\/fixtures\/r97-[a-z-]{6,50}\.jpg$/.test(part)){
   reply(404);return;
  }
  try{
   const file=await readFile(join(dir,part.substring(1)));
   res.writeHead(200,{...headers,'Content-Type':part===htmlPath?
    'text/html; charset=utf-8':'image/jpeg','Content-Length':file.length});
   res.end(req.method==='HEAD'?undefined:file);
  }catch{reply(404);}
 });
 return {server,listen:()=>new Promise((done,reject)=>{
  server.once('error',reject);
  server.listen(port,'127.0.0.1',()=>done(server.address()));
 })};
}
async function main(){
 const serveAt=process.argv.indexOf('--serve');
 if(serveAt!==-1){
  const dir=process.argv[serveAt+1];
  if(!dir||basename(dir)==='.')fail('provide exact single reviewer directory');
  const p=process.argv.indexOf('--port');
  const port=p!==-1?Number(process.argv[p+1]):8787;
  const s=readonlyReviewServer98({roleDir:dir,port});
  const addr=await s.listen();
  console.log(HOLD98+'; read-only local reviewer page http://127.0.0.1:'+addr.port+
   '/research/independent-instance-ground-truth-94/annotate.html');
  return;
 }
 if(!process.argv.includes('--build'))fail('choose --build or --serve <reviewer folder>');
 const manifest=JSON.parse(await readFile('research/new-real-commons-candidate-cohort-97/source-candidates.json','utf8'));
 const old=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
 const earlier=JSON.parse(await readFile('research/real-multigarment-candidate-intake-96/candidate-manifest.json','utf8'));
 verifyProvenance97({manifest,original59:old,quarantined96:earlier.candidates,requirePinned:true});
 const html=await readFile('research/independent-instance-ground-truth-94/annotate.html','utf8');
 const workspaces=await makeVerifiedHumanWorkspaces98({
  candidates:manifest.candidates,fetchBytes:downloadOriginal98,html
 });
 const receipt=process.env.SOURCE98_RECEIPT;
 if(receipt)await writeFile(receipt,JSON.stringify(workspaces,null,2)+'\n',
  {mode:0o600,flag:'wx'});
 console.log(HOLD98+' '+JSON.stringify(workspaces));
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)
 main().catch(e=>{console.error(String(e?.stack||e));process.exitCode=1;});
