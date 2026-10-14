import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
const manifest=JSON.parse(await readFile(process.argv[2]||'benchmark/manifest-fresh-11.json','utf8')),directory=process.argv[3]||'benchmark/photos';
if(!Array.isArray(manifest)||!manifest.length)throw Error('Invalid reviewed photo manifest.');
await mkdir(directory,{recursive:true});
for(const row of manifest){
 if(!row.verified||!/^validation-[0-9]+\.(jpg|png|webp)$/.test(row.image)||!/^[a-f0-9]{64}$/.test(row.sha256))throw Error('Invalid reviewed photograph.');
 const url=new URL(row.downloadUrl);if(url.protocol!=='https:'||url.hostname!=='upload.wikimedia.org')throw Error('Unexpected photo host.');
 const path=join(directory,row.image),digest=bytes=>createHash('sha256').update(bytes).digest('hex');
 try{if(digest(await readFile(path))===row.sha256)continue;}catch{}
 const response=await fetch(url,{headers:{'User-Agent':'ClosetCurrentBenchmark/1.0 (https://github.com/nickhaney916-lang/Closet-Current)'}});
 if(!response.ok)throw Error('Photo download failed: '+row.id+' HTTP '+response.status);
 if(new URL(response.url).hostname!=='upload.wikimedia.org')throw Error('Unexpected photo redirect.');
 const bytes=new Uint8Array(await response.arrayBuffer());if(bytes.length>8*1024*1024||digest(bytes)!==row.sha256)throw Error('Photo contents changed: '+row.id);
 await writeFile(path,bytes);
}
console.log('Verified '+manifest.length+' reviewed photographs.');
