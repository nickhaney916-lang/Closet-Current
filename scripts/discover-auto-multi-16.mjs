// NO DEPLOY. Download exactly original Wikimedia bytes, SHA256-lock them,
// and generate separately identified PREVIEW thumbnails for human review.
// The preview is NOT original image, annotation, segmentation or model evidence.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join,resolve} from 'node:path';
import sharp from 'sharp';
const all=JSON.parse(await readFile('research/auto-multi-diversity-16/candidate-sources.json','utf8'));
const slice=process.env.AUTO_MULTI_16_SLICE;
const rows=slice===undefined?all:all.filter((_,index)=>Math.floor(index/3)===Number(slice));
if(!rows.length||rows.length>15)throw Error('Invalid source selection');
const out=resolve('benchmark/auto-multi-16-discovery');
const originals=join(out,'originals');
await mkdir(originals,{recursive:true});
const digest=(algorithm,bytes)=>createHash(algorithm).update(bytes).digest('hex');
const delay=ms=>new Promise(done=>setTimeout(done,ms));
const results=[],failures=[];
for(const [i,row] of rows.entries()){
 try{
  const filename=row.file.replaceAll(' ','_').normalize('NFC');
  const md5=digest('md5',Buffer.from(filename));
  const url='https://upload.wikimedia.org/wikipedia/commons/'+md5.slice(0,1)+'/'+md5.slice(0,2)+'/'+encodeURIComponent(filename);
  let buffer=null,lastError='';
  for(let attempt=0;attempt<5&&!buffer;attempt++){
   try{
    const response=await fetch(url,{headers:{'user-agent':'ClosetCurrentResearchEvidence/1.0 (Wikimedia licensed evaluation)'},signal:AbortSignal.timeout(45000)});
    if(!response.ok)throw Error('HTTP '+response.status);
    const contentLength=Number(response.headers.get('content-length')||0);
    if(contentLength>33000000)throw Error('source image too large');
    buffer=Buffer.from(await response.arrayBuffer());
    if(!buffer.length||buffer.length>33000000)throw Error('invalid length');
   }catch(e){lastError=e.message;if(attempt<4)await delay((attempt+1)*7000);}
  }
  if(!buffer)throw Error(lastError);
  const meta=await sharp(buffer).metadata();
  if(meta.format!=='jpeg'||!meta.width||!meta.height)throw Error('not original JPEG');
  const sha256=digest('sha256',buffer),sha1=digest('sha1',buffer);
  await writeFile(join(originals,row.id+'.jpg'),buffer);
  await delay(2500);
  const thumb=await sharp(buffer).rotate().resize({width:420,height:400,fit:'inside',withoutEnlargement:true}).jpeg({quality:81}).toBuffer();
  await writeFile(join(out,row.id+'-PREVIEW.jpg'),thumb);
  results.push({...row,sourceImage:url,sourceSha256:sha256,sourceSHA1:sha1,
   originalBytes:buffer.length,width:meta.width,height:meta.height,
   license:row.expectedLicense,originalJpeg:true,sourceVerified:true,
   previewDerivedOnly:true,annotationStatus:'PENDING_INDEPENDENT_VISUAL_REVIEW'});
  console.log('SOURCE_LOCK '+JSON.stringify({id:row.id,sourceSha256:sha256,bytes:buffer.length,width:meta.width,height:meta.height}));
 }catch(error){failures.push({id:row.id,error:String(error.message||error).slice(0,90)});console.error('SOURCE_UNAVAILABLE '+row.id+' '+String(error.message||error));}
}
await writeFile(join(out,'discovery-metadata.json'),JSON.stringify({priority:'AUTO-MULTI-DIVERSITY-16',sources:results,failures,originalSourcesNeverUploaded:true,readyForIndependentAnnotation:false},null,2));
if(results.length){
 const thumbnails=[];
 for(const r of results){
  const p=await readFile(join(out,r.id+'-PREVIEW.jpg'));
  const flat=await sharp({create:{width:450,height:450,channels:4,background:'#ffffff'}}).composite([
   {input:await sharp(p).resize({width:420,height:410,fit:'inside'}).toBuffer(),gravity:'north'},
   {input:Buffer.from('<svg width="450" height="34"><rect width="450" height="34" fill="white"/><text x="12" y="25" font-size="20" fill="#222">'+r.id+' '+r.scene.replaceAll('&','&amp;')+'</text></svg>'),top:416,left:0}
  ]).png().toBuffer();
  thumbnails.push(flat);
 }
 const columns=3,rowsCount=Math.ceil(thumbnails.length/columns);
 const composites=thumbnails.map((input,i)=>({input,left:i%columns*450,top:Math.floor(i/columns)*450}));
 await sharp({create:{width:columns*450,height:rowsCount*450,channels:4,background:'#fff'}}).composite(composites).jpeg({quality:84}).toFile(join(out,'CONTACT-PREVIEW-NOT-ANNOTATIONS.jpg'));
}
if(failures.length||results.length!==rows.length)process.exitCode=1;
