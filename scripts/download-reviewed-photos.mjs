import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
const allRows=JSON.parse(await readFile(process.argv[2]||'benchmark/manifest-fresh-11.json','utf8')),directory=process.argv[3]||'benchmark/photos';
const ids=process.argv[4]?.split(','),manifest=ids?allRows.filter(x=>ids.includes(x.id)):allRows;
if(ids&&manifest.length!==new Set(ids).size)throw Error('Requested photo not in locked manifest.');
if(!Array.isArray(manifest)||!manifest.length)throw Error('Invalid reviewed photo manifest.');
await mkdir(directory,{recursive:true});
for(const row of manifest){
 if(!row.verified||!/^(?:validation|commons)-[0-9]+\.(jpg|png|webp)$/.test(row.image)||!/^[a-f0-9]{64}$/.test(row.sha256))throw Error('Invalid reviewed photograph.');
 const allowedHosts=new Set(['upload.wikimedia.org','thumb.wikimedia.org']),urls=[row.downloadUrl,...(row.alternateDownloadUrls||[])];
 if(urls.length>3)throw Error('Too many source URLs.');
 for(const value of urls){const url=new URL(value);if(url.protocol!=='https:'||!allowedHosts.has(url.hostname))throw Error('Unexpected photo host.');}
 const path=join(directory,row.image),digest=bytes=>createHash('sha256').update(bytes).digest('hex');
 try{if(digest(await readFile(path))===row.sha256)continue;}catch{}
 let verified=false;
 for(const url of urls){try{
  const response=await fetch(url,{headers:{'User-Agent':'ClosetCurrentBenchmark/1.0 (https://github.com/nickhaney916-lang/Closet-Current)'},signal:AbortSignal.timeout(30000)});
  if(!response.ok||!allowedHosts.has(new URL(response.url).hostname))continue;
  const bytes=new Uint8Array(await response.arrayBuffer());if(bytes.length>8*1024*1024||digest(bytes)!==row.sha256)continue;
  await writeFile(path,bytes);verified=true;break;
 }catch{}}
 if(!verified)throw Error('Verified source photo unavailable or changed: '+row.id);
}
console.log('Verified '+manifest.length+' reviewed photographs.');
