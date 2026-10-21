// New-source collection and fail-closed scoring; never customer inference code.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {localCandidates} from '../public/local-catalog.mjs';
export const DIRECTORY='benchmark/independent-source-holdout';
export const BASE='a6ee34a676030cff2a4fcf3b31185275c78371a7';
export const digest=b=>createHash('sha256').update(b).digest('hex');
export const sourceKey=value=>decodeURIComponent(new URL(value).pathname.split('/').at(-1)).replaceAll('_',' ').toLowerCase();
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
  assert.ok(!prior.some(p=>[p.downloadUrl,p.source].filter(Boolean).some(u=>sourceKey(u)===sourceKey(r.downloadUrl)||sourceKey(u)===sourceKey(r.source))||p.sha256&&p.sha256===r.sha256),'Prior photo leakage');
  assert.ok(r.family==='negative'?r.expectedCategory==='Uncategorized'&&r.acceptedTypes.length===0:
   r.acceptedTypes.length>0&&r.acceptedTypes.every(t=>localCandidates.some(c=>c.category===r.expectedCategory&&c.itemType===t)),'Unscorable category/type labels');
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
  assert.ok(!p.strong||!p.categoryConfirmed&&p.prediction.category&&p.prediction.category!=='Uncategorized'&&p.prediction.type&&p.prediction.type!=='Unknown','Malformed strong prediction');
  assert.ok(!p.categoryConfirmed||!p.strong&&p.prediction.category&&p.prediction.category!=='Uncategorized'&&p.prediction.type==='Unknown','Malformed review prediction');
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
  negativeEmittedClothing:perPhoto.filter(r=>r.family==='negative'&&(r.strong||r.categoryConfirmed||!r.abstained)).length,
  groups:Object.fromEntries([...new Set(rows.map(r=>r.family))].map(f=>{const a=perPhoto.filter(r=>r.family===f);return [f,{photos:a.length,familyCorrect:a.filter(r=>r.familyCorrect).length,strongAutos:a.filter(r=>r.strong).length,unsafeAutos:a.filter(r=>r.unsafeAutomatic).length}];})),
  perPhoto,productionPromotion:'BLOCKED',independentHumanGoldLabels:false,
  reason:'Small source/assistant-labeled discovery set; independent blind humans and untouched evaluation required. Never tune on these results.'};
}
export function blindManifest(rows){validateRows(rows,{locked:true});return rows.map(({id,image})=>({id,image,mode:'single'}));}
function priorSources(){return ['benchmark/locked-photo-sources.json','benchmark/manifest-fresh-11.json'].flatMap(p=>JSON.parse(fs.readFileSync(p)));}
async function prepare(){
 const locked=JSON.parse(fs.readFileSync(DIRECTORY+'/locked.json'));
 validateRows(locked.photos,{locked:true,prior:priorSources()});
 const source=process.env.HOLDOUT_OUTPUT||'/tmp/closet-independent-holdout';
 fs.mkdirSync('benchmark/photos',{recursive:true});
 for(const r of locked.photos){const b=fs.readFileSync(path.join(source,r.image));assert.equal(digest(b),r.sha256,'Original hash changed');fs.writeFileSync('benchmark/photos/'+r.image,b);}
 const out=process.env.HOLDOUT_RESULTS||'/tmp/closet-holdout-results';fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(out+'/blind-manifest.json',JSON.stringify(blindManifest(locked.photos)));
 fs.writeFileSync(out+'/source-lock.json',JSON.stringify({lockedManifestSha256:digest(fs.readFileSync(DIRECTORY+'/locked.json')),photos:locked.photos.map(r=>({id:r.id,sha256:r.sha256})),labelsGivenToModel:false},null,2));
 fs.writeFileSync(path.join(source,'review-template.json'),JSON.stringify({status:'UNREVIEWED',reviewer:null,
  instructions:'Independent person: review original images without consulting locked labels or model outputs. Record observed family, uncertainty and evidence; do not infer hidden garments.',
  photos:locked.photos.map(r=>({id:r.id,sha256:r.sha256,observedFamily:null,uncertain:null,note:null}))},null,2));
 fs.writeFileSync(path.join(source,'review.html'),'<!doctype html><meta charset="utf-8"><title>Blind source review</title><style>body{font:18px system-ui;margin:24px}img{max-width:100%;max-height:85vh}figure{margin:24px 0;border-top:1px solid #aaa;padding-top:20px}</style><h1>Independent original-photo review</h1><p>No model predictions or proposed labels appear here. Complete review-template.json independently. Families: sneakers, boots, dress, skirt, shorts, shirt, negative, uncertain. Inspect original pixels, mark ambiguity, and do not guess.</p>'+locked.photos.map(r=>'<figure><figcaption>'+r.id+'</figcaption><img src="'+r.image+'" alt="Original source '+r.id+'"></figure>').join(''));
}
async function independent(){
 const {MODEL,MODEL_REVISION,classifyIndependent}=await import('./independent-clip-subtype-trial.mjs');
 const {pipeline,RawImage}=await import('@huggingface/transformers');
 const model=await pipeline('zero-shot-image-classification',MODEL,{revision:MODEL_REVISION,device:'cpu',dtype:'q8'});
 const out=process.env.HOLDOUT_RESULTS||'/tmp/closet-holdout-results';
 // Deliberately read only the neutral ID/image manifest during inference.
 const blind=JSON.parse(fs.readFileSync(out+'/blind-manifest.json')),lock=JSON.parse(fs.readFileSync(out+'/source-lock.json'));
 const predictions=[];
 for(const row of blind){
  const file='benchmark/photos/'+row.image;assert.equal(digest(fs.readFileSync(file)),lock.photos.find(r=>r.id===row.id)?.sha256);
  const image=await RawImage.read(file),ranked=await model(image,localCandidates.map(c=>c.label),{hypothesis_template:'A photo of {}.'});
  const result=classifyIndependent(ranked);predictions.push({id:row.id,prediction:{category:result.category,type:result.type},score:result.score,margin:result.margin});
 }
 fs.writeFileSync(out+'/independent-clip.json',JSON.stringify({MODEL,MODEL_REVISION,predictions},null,2));
}
export function compareAgreement(rows,baseline,independentPredictions){
 const measured=evaluate(rows,baseline),map=new Map();
 assert.equal(independentPredictions.length,rows.length,'Incomplete independent inference');
 for(const p of independentPredictions){assert.ok(p?.prediction&&!map.has(p.id),'Malformed independent result');map.set(p.id,p);}
 let blockedWrong=0,blockedCorrect=0,remainingWrong=0;
 for(const p of measured.perPhoto){
  const second=map.get(p.id);assert.ok(second,'Missing independent row');
  const agree=p.prediction.category===second.prediction.category&&p.prediction.type===second.prediction.type;
  if(p.strong){if(!agree){if(p.unsafeAutomatic)blockedWrong++;else blockedCorrect++;}else if(p.unsafeAutomatic)remainingWrong++;}
 }
 return {...measured,agreementExperiment:{blockedWrong,blockedCorrect,remainingWrong,
  decision:'NOT_PROMOTABLE',reason:'Discovery set only; no independent human gold or untouched confirmation set'},customerModelChanged:false};
}
function verifyScope(){
 const git=(...a)=>execFileSync('git',a,{encoding:'utf8',maxBuffer:20_000_000}).trim();
 git('merge-base','--is-ancestor',BASE,'HEAD');
 const allowed=new Set(['scripts/independent-source-holdout.mjs','tests/independent-source-holdout.test.mjs',
  '.github/workflows/independent-source-holdout.yml','docs/INDEPENDENT-SOURCE-HOLDOUT-20261020.md']);
 for(const p of git('diff','--name-only',BASE,'--').split('\n').filter(Boolean)){
  if(p==='docs/PROGRESS-CHECKPOINT.md'){
   const old=execFileSync('git',['show',BASE+':'+p],{encoding:'utf8'});
   assert.ok(fs.readFileSync(p,'utf8').endsWith(old),'Historical checkpoint evidence changed');continue;
  }
  assert.ok(allowed.has(p)||p.startsWith(DIRECTORY+'/'),'Unexpected change outside isolated benchmark: '+p);
  const exists=execFileSync('git',['ls-tree',BASE,'--',p],{encoding:'utf8'}).trim();
  assert.equal(exists,'','An existing source file was modified: '+p);
 }
 console.log(JSON.stringify({sourceBase:BASE,customerAndExistingBenchmarksUnchanged:true,productionReleaseApproved:false}));
}
async function collect(){
 const input=JSON.parse(fs.readFileSync(DIRECTORY+(fs.existsSync(DIRECTORY+'/locked.json')?'/locked.json':'/candidates.json')));
 validateRows(input.photos);const out=process.env.HOLDOUT_OUTPUT||'/tmp/closet-independent-holdout';fs.mkdirSync(out,{recursive:true});
 const sharp=(await import('sharp')).default,rows=[];
 const cooldown=path.join(out,'retry-after.json');
 if(fs.existsSync(cooldown))assert.ok(Date.now()>=JSON.parse(fs.readFileSync(cooldown)).resumeAfter,
  'Source server cooldown has not expired; do not send another request');
 for(const r of input.photos){
  let bytes,last;
  const cached=path.join(out,r.image);
  if(fs.existsSync(cached)){
   const b=fs.readFileSync(cached);const meta=await sharp(b).metadata();
   if(meta.format==='jpeg'&&(!r.sha256||digest(b)===r.sha256))bytes=b;
  }
  for(let attempt=0;attempt<4&&!bytes;attempt++)try{
   if(attempt)await new Promise(ok=>setTimeout(ok,10000*attempt));
   const response=await fetch(r.downloadUrl,{headers:{'User-Agent':'ClosetCurrentResearch/1.0 (source provenance; github.com/nickhaney916-lang/Closet-Current)'},signal:AbortSignal.timeout(45000)});
   if(response.status===429){
    const header=response.headers.get('retry-after');
    const seconds=header&&Number.isFinite(Number(header))?Number(header):Math.max(0,(Date.parse(header)-Date.now())/1000)||60;
    fs.writeFileSync(cooldown,JSON.stringify({id:r.id,resumeAfter:Date.now()+seconds*1000}));
    console.log('SOURCE_RATE_LIMIT '+r.id+' waitSeconds='+Math.ceil(seconds));
    if(seconds>120){last='Source requires a longer cooldown; recorded retry-after.json';break;}
    if(seconds>0)await new Promise(ok=>setTimeout(ok,seconds*1000));
   }
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
  fs.writeFileSync(path.join(out,'source-bytes.json'),JSON.stringify({...input,photos:rows},null,2));
  console.log('SOURCE_COLLECTED '+r.id+' '+digest(bytes));
  await new Promise(ok=>setTimeout(ok,1500));
 }
 fs.writeFileSync(path.join(out,'source-bytes.json'),JSON.stringify({...input,photos:rows},null,2));
 console.log('Collected original JPEG bytes without model inference: '+rows.length);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const mode=process.argv[2];
 if(mode==='collect')await collect();
 else if(mode==='verify')verifyScope();
 else if(mode==='prepare')await prepare();
 else if(mode==='independent')await independent();
 else if(mode==='evaluate'){
  const locked=JSON.parse(fs.readFileSync(DIRECTORY+'/locked.json'));
  const predictions=JSON.parse(fs.readFileSync(process.argv[3]));
  const report=process.argv[4]?compareAgreement(locked.photos,predictions,JSON.parse(fs.readFileSync(process.argv[4])).predictions):evaluate(locked.photos,predictions);console.log(JSON.stringify(report,null,2));
 }else throw Error('Use collect or evaluate');
}
