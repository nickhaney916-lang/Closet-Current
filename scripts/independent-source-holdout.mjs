// New-source collection and fail-closed scoring; never customer inference code.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
export const DIRECTORY='benchmark/independent-source-holdout';
export const digest=b=>createHash('sha256').update(b).digest('hex');
export function validateRows(rows,{locked=false,prior=[]}={}){
 assert.ok(Array.isArray(rows)&&rows.length>=13,'Incomplete source collection');
 const ids=new Set(),urls=new Set(),hashes=new Set();
 for(const r of rows){
  assert.match(r.id,/^newholdout-\d{4}$/);assert.equal(r.image,r.id+'.jpg');
  assert.ok(!ids.has(r.id)&&!urls.has(r.downloadUrl),'Duplicate source');ids.add(r.id);urls.add(r.downloadUrl);
  const url=new URL(r.downloadUrl);assert.equal(url.protocol,'https:');assert.equal(url.hostname,'upload.wikimedia.org');
  assert.ok(!url.search&&!url.hash&&!url.username&&!url.password,'Only canonical original source URLs');
  assert.ok(!url.pathname.includes('/thumb/')&&url.pathname.startsWith('/wikipedia/commons/'),'Thumbnail is not an original');
  assert.ok(r.source.startsWith('https://commons.wikimedia.org/wiki/File:'));
  assert.ok(r.attribution?.author&&r.attribution?.license&&r.attribution?.licenseUrl,'Missing license evidence');
  assert.ok(Array.isArray(r.acceptedTypes)&&Array.isArray(r.humanReviews));
  assert.ok(!prior.some(p=>p.downloadUrl===r.downloadUrl||p.source===r.source||p.sha256&&p.sha256===r.sha256),'Prior photo leakage');
  if(locked){
   assert.equal(r.verified,true);assert.match(r.sha256,/^[a-f0-9]{64}$/);
   assert.ok(!hashes.has(r.sha256),'Duplicate image bytes');hashes.add(r.sha256);
   assert.ok(r.visualReview?.reviewer==='assistant'&&r.visualReview?.beforeInference===true,'Missing blind visual review');
   assert.ok(r.visualReview?.note,'Missing visible garment evidence');
  }
 }
 for(const family of ['sneakers','boots','dress','skirt','shorts','shirt'])
  assert.ok(rows.filter(x=>x.family===family).length>=2,'Missing priority family '+family);
 assert.ok(rows.some(x=>x.family==='negative'),'Missing non-garment control');
 return rows;
}
export function evaluate(rows,predictions){
 validateRows(rows,{locked:true});
 assert.equal(predictions.length,rows.length,'Incomplete inference');const map=new Map();
 for(const p of predictions){assert.ok(p?.id&&!map.has(p.id),'Duplicate result');assert.ok(!p.error,'Inference error');map.set(p.id,p);}
 const perPhoto=rows.map(r=>{
  const p=map.get(r.id);assert.ok(p&&p.prediction,'Missing prediction');
  assert.equal(typeof p.strong,'boolean');assert.equal(typeof p.categoryConfirmed,'boolean');
  const negative=r.family==='negative';
  const emitted=p.prediction.category&&p.prediction.category!=='Uncategorized';
  const categoryCorrect=p.prediction.category===r.expectedCategory;
  const familyCorrect=!negative&&categoryCorrect&&r.acceptedTypes.includes(p.prediction.type);
  const unsafeAutomatic=p.strong&&(negative||!familyCorrect);
  return {id:r.id,family:r.family,prediction:p.prediction,strong:p.strong,categoryConfirmed:p.categoryConfirmed,
   categoryCorrect:!!categoryCorrect,familyCorrect:!!familyCorrect,unsafeAutomatic:!!unsafeAutomatic,
   abstained:!emitted,sourceSha256:r.sha256,labelEvidence:'source + assistant visual; not independent human gold'};
 });
 const positive=perPhoto.filter(r=>r.family!=='negative'),auto=perPhoto.filter(r=>r.strong);
 return {photoCount:rows.length,positiveCount:positive.length,
  categoryCorrect:positive.filter(r=>r.categoryCorrect).length,familyCorrect:positive.filter(r=>r.familyCorrect).length,
  strongAutos:auto.length,unsafeAutos:auto.filter(r=>r.unsafeAutomatic).length,
  correctStrongAutos:auto.filter(r=>!r.unsafeAutomatic).length,
  negativeFalseAutos:perPhoto.filter(r=>r.family==='negative'&&r.strong).length,
  groups:Object.fromEntries([...new Set(rows.map(r=>r.family))].map(f=>{const a=perPhoto.filter(r=>r.family===f);return [f,{photos:a.length,familyCorrect:a.filter(r=>r.familyCorrect).length,strongAutos:a.filter(r=>r.strong).length,unsafeAutos:a.filter(r=>r.unsafeAutomatic).length}];})),
  perPhoto,productionPromotion:'BLOCKED',independentHumanGoldLabels:false,
  reason:'Small source/assistant-labeled discovery set; independent blind humans and untouched evaluation required. Never tune on these results.'};
}
async function collect(){
 const input=JSON.parse(fs.readFileSync(DIRECTORY+'/candidates.json'));
 validateRows(input.photos);const out=process.env.HOLDOUT_OUTPUT||'/tmp/closet-independent-holdout';fs.mkdirSync(out,{recursive:true});
 const sharp=(await import('sharp')).default,rows=[];
 for(const r of input.photos){
  let bytes,last;
  for(let attempt=0;attempt<3&&!bytes;attempt++)try{
   const response=await fetch(r.downloadUrl,{headers:{'User-Agent':'ClosetCurrentResearch/1.0 (source provenance; github.com/nickhaney916-lang/Closet-Current)'},signal:AbortSignal.timeout(45000)});
   assert.ok(response.ok,'HTTP '+response.status);assert.equal(new URL(response.url).hostname,'upload.wikimedia.org');
   const b=Buffer.from(await response.arrayBuffer());assert.ok(b.length>1000&&b.length<16*1024*1024);
   const meta=await sharp(b).metadata();assert.equal(meta.format,'jpeg');assert.ok(meta.width>=300&&meta.height>=300);
   if(r.sha256)assert.equal(digest(b),r.sha256,'Locked source changed');bytes=b;
  }catch(e){last=e.message;}
  assert.ok(bytes,'Original source unavailable: '+r.id+' '+last);
  fs.writeFileSync(path.join(out,r.image),bytes);
  const meta=await sharp(bytes).metadata();
  rows.push({...r,sha256:digest(bytes),byteLength:bytes.length,width:meta.width,height:meta.height});
  await sharp(bytes).rotate().resize(260,320,{fit:'inside'}).jpeg({quality:85}).toFile(path.join(out,r.id+'-review.jpg'));
 }
 fs.writeFileSync(path.join(out,'source-bytes.json'),JSON.stringify({...input,photos:rows},null,2));
 console.log('Collected original JPEG bytes without model inference: '+rows.length);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const mode=process.argv[2];
 if(mode==='collect')await collect();
 else if(mode==='evaluate'){
  const locked=JSON.parse(fs.readFileSync(DIRECTORY+'/locked.json'));
  const predictions=JSON.parse(fs.readFileSync(process.argv[3]));
  const report=evaluate(locked.photos,predictions);console.log(JSON.stringify(report,null,2));
 }else throw Error('Use collect or evaluate');
}
