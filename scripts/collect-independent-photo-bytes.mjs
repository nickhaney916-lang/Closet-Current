import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const rows=JSON.parse(await readFile('benchmark/independent-candidates.json','utf8'));
await mkdir('benchmark/photo-collection',{recursive:true});
const report=[];
for(const row of rows){
 if(row.reviewStatus?.startsWith('excluded-')){report.push({id:row.id,status:'excluded'});continue;}
 if(!row.downloadUrl){report.push({id:row.id,status:'missing-original-url'});continue;}
 try{
  const url=new URL(row.downloadUrl);
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
  report.push({id:row.id,status:'downloaded-unreviewed',sha256,bytes:data.length,format:ext,downloadUrl:row.downloadUrl});
 }catch(e){report.push({id:row.id,status:'download-failed',reason:String(e.message).slice(0,150)});}
}
await writeFile('benchmark/photo-collection/report.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
