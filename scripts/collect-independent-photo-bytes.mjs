import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const rows=JSON.parse(await readFile('benchmark/independent-candidates.json','utf8'));
await mkdir('benchmark/photo-collection',{recursive:true});
const report=[];
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
// Wikimedia may throttle sequential MediaWiki and upload requests. Retry only 429/503,
// honor bounded Retry-After, and avoid bursts between candidate downloads.
let lastRequestAt=0;
async function wikimediaFetch(url){
 for(let attempt=0;attempt<3;attempt++){
  const wait=Math.max(0,1200-(Date.now()-lastRequestAt));
  if(wait)await pause(wait);
  lastRequestAt=Date.now();
  const res=await fetch(url,{headers:{'User-Agent':'ClosetCurrentBenchmark/1.0 (https://github.com/nickhaney916-lang/Closet-Current)'},signal:AbortSignal.timeout(25000)});
  if(![429,503].includes(res.status)||attempt===2)return res;
  const retryAfter=Number(res.headers.get('retry-after'));
  const delay=Number.isFinite(retryAfter)&&retryAfter>=0?Math.min(30000,Math.max(3000,retryAfter*1000)):3000*(attempt+1);
  await res.body?.cancel();
  await pause(delay);
 }
}
for(const row of rows){
 if(row.reviewStatus?.startsWith('excluded-')){report.push({id:row.id,status:'excluded'});continue;}
 let originalUrl=row.downloadUrl;
 try{
  if(!originalUrl){
   const page=new URL(row.source);
   if(page.protocol!=='https:'||page.hostname!=='commons.wikimedia.org'||!page.pathname.startsWith('/wiki/File:'))throw Error('invalid-commons-source');
   const title=decodeURIComponent(page.pathname.slice('/wiki/'.length)).replaceAll('_',' ');
   const api=new URL('https://commons.wikimedia.org/w/api.php');
   api.searchParams.set('action','query');api.searchParams.set('format','json');
   api.searchParams.set('prop','imageinfo');api.searchParams.set('iiprop','url');api.searchParams.set('titles',title);
   const response=await wikimediaFetch(api);
   if(!response.ok)throw Error('commons-api-HTTP-'+response.status);
   const info=await response.json();
   const pageInfo=Object.values(info.query?.pages||{}).find(p=>p.ns===6&&!('missing' in p));
   originalUrl=pageInfo?.imageinfo?.[0]?.url;
   if(!originalUrl)throw Error('commons-image-url-unavailable');
  }
  const url=new URL(originalUrl);
  if(url.protocol!=='https:'||!['upload.wikimedia.org','thumb.wikimedia.org'].includes(url.hostname))throw Error('unsupported-host');
  const res=await fetch(url,{headers:{'User-Agent':'ClosetCurrentBenchmark/1.0 (https://github.com/nickhaney916-lang/Closet-Current)'},signal:AbortSignal.timeout(25000)});
  if(!res.ok)throw Error('HTTP '+res.status);
  if(!['upload.wikimedia.org','thumb.wikimedia.org'].includes(new URL(res.url).hostname))throw Error('redirected-host');
  const data=new Uint8Array(await res.arrayBuffer());
  if(data.length<1000||data.length>8*1024*1024)throw Error('invalid-size');
  const sig=[...data.slice(0,12)];
  const jpeg=sig[0]===255&&sig[1]===216&&sig[2]===255;
  const png=sig.slice(0,8).join(',')==='137,80,78,71,13,10,26,10';
  const webp=String.fromCharCode(...data.slice(0,4))==='RIFF'&&String.fromCharCode(...data.slice(8,12))==='WEBP';
  if(!jpeg&&!png&&!webp)throw Error('not-image');
  const sha256=createHash('sha256').update(data).digest('hex');
  const ext=jpeg?'jpg':png?'png':'webp';
  await writeFile('benchmark/photo-collection/'+row.id+'.'+ext,data);
  report.push({id:row.id,status:'downloaded-unreviewed',sha256,bytes:data.length,format:ext,downloadUrl:originalUrl});
 }catch(e){report.push({id:row.id,status:'download-failed',reason:String(e.message).slice(0,150)});}
}
await writeFile('benchmark/photo-collection/report.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
