// One-time source verification for two openly licensed visible-layer photos.
// SHA-256 becomes pinned in a follow-up commit after this first audited download.
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import sharp from 'sharp';
const rows=JSON.parse((await import('node:fs')).readFileSync('benchmark/visible-legwear-source-candidates.json','utf8'));
if(rows.length!==2||new Set(rows.map(x=>x.id)).size!==2)throw Error('Invalid real-photo candidate list');
const dir=process.argv[2]||'benchmark/visible-legwear-source-audit';
await mkdir(dir,{recursive:true});
const out={status:'running',rawPhotoPixelsVerified:false,manualMaskAnnotationsAvailable:false,
  categoriesObservedByModel:false,realPhonePhotos:false,cases:[]};
const write=()=>writeFile(join(dir,'manifest.json'),JSON.stringify(out,null,2));
await write();
for(const row of rows){
 const url=new URL(row.downloadUrl);
 if(url.protocol!=='https:'||!['upload.wikimedia.org','thumb.wikimedia.org'].includes(url.hostname)
 ||!/^[a-z0-9-]+$/.test(row.id)
 ||!row.attribution?.author||!row.attribution?.license||!row.attribution?.licenseUrl
 ||!row.attribution?.source?.startsWith('https://commons.wikimedia.org/wiki/File:'))
  throw Error('Invalid source or attribution');
 let res,lastError;
 for(let i=0;i<3;i++){
  try{
   res=await fetch(url,{signal:AbortSignal.timeout(25000),
     headers:{'User-Agent':'ClosetCurrentResearch/1.0 (https://github.com/nickhaney916-lang/Closet-Current)'}});
   if(res.ok)break;
   lastError='HTTP '+res.status;
  }catch(err){lastError=err.message}
  if(i<2)await new Promise(done=>setTimeout(done,700*(i+1)));
 }
 if(!res?.ok)throw Error(row.id+' download failed: '+lastError);
 if(!['upload.wikimedia.org','thumb.wikimedia.org'].includes(new URL(res.url).hostname))
  throw Error('Untrusted image redirect');
 const bytes=Buffer.from(await res.arrayBuffer());
 if(bytes.length<10_000||bytes.length>8_000_000)throw Error('Unexpected image size '+row.id);
 const metadata=await sharp(bytes).metadata();
 if(metadata.format!=='jpeg'||metadata.width<600||metadata.height<600||metadata.width*metadata.height>12_000_000)
  throw Error('Unexpected image format or dimensions '+row.id);
 const sha256=createHash('sha256').update(bytes).digest('hex');
 await writeFile(join(dir,row.image),bytes);
 out.cases.push({...row,sha256,bytes:bytes.length,width:metadata.width,height:metadata.height,
  checksumVerifiedAtDownload:true,pixelGroundTruthAvailable:false,
  measuredClassificationAccuracy:null});
 await write();
 console.log('VISIBLE_SOURCE_AUDIT '+JSON.stringify({id:row.id,sha256,
  bytes:bytes.length,width:metadata.width,height:metadata.height,license:row.attribution.license}));
}
out.status='complete';
out.rawPhotoPixelsVerified=true;
await write();
