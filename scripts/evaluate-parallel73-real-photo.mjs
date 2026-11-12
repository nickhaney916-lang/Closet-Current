/** Genuine-source, non-accuracy image quality receipt evaluator. NO images logged.
 * Requires SHA-verified lawful photos in benchmark/photos and sharp (CI only).
 * Does not fabricate human blur/framing labels or infer recognition gains. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const require=createRequire(import.meta.url);
const sharp=(await import('sharp')).default;
const quality=require('../public/photo-quality-research.js');
const source=await readFile('public/photo-check.js','utf8'),context={};
vm.createContext(context);vm.runInContext(source,context);
const all=JSON.parse(await readFile('benchmark/locked-photo-sources.json','utf8'));
const ids=(process.env.P73_PHOTO_IDS||'commons-0003,commons-0014,commons-0021,commons-0033,commons-0049,commons-0060,commons-0077,commons-0082,commons-0094,validation-0001,validation-0019').split(',');
const selected=ids.map(id=>{const r=all.find(p=>p.id===id);if(!r||!r.verified||!r.attribution?.license||!r.attribution?.source||!r.sha256)throw Error('Unverified source: '+id);return r;});
const outcomes=[];
for(const row of selected){
 const bytes=await readFile(join('benchmark/photos',row.image));
 const sha=createHash('sha256').update(bytes).digest('hex');
 if(sha!==row.sha256)throw Error('Source SHA mismatch: '+row.id);
 const metadata=await sharp(bytes).metadata();
 const rotated=sharp(bytes).rotate();
 const current=await rotated.clone().resize(256,256,{fit:'inside',withoutEnlargement:true}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const legacy=await sharp(bytes).rotate().resize(16,16,{fit:'fill'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const old=context.photoQuality(legacy.data);
 const now=quality.analyzePixels(current.data,current.info.width,current.info.height,metadata.width,metadata.height);
 outcomes.push({id:row.id,sourceSha256:sha,sourceLicense:row.attribution.license,
 sourcePage:row.attribution.source,sourceWidth:metadata.width,sourceHeight:metadata.height,
 exifOrientation:metadata.orientation||1,legacy16x16Blank:old.blank,
 advisoryCodes:now.advice.map(a=>a.code),metrics:now.metrics});
}
const warned=code=>outcomes.filter(x=>x.advisoryCodes.includes(code)).length;
const summary={evaluation:'source-verified real-photo descriptive pixel receipts (no human quality truth)',
 cohort:outcomes.length,sourceShaVerified:outcomes.length,
 preexistingFlat16x16:outcomes.filter(x=>x.legacy16x16Blank).length,
 newPixelAdvisoryCount:outcomes.filter(x=>x.advisoryCodes.length).length,
 advisoryByCode:Object.fromEntries(['limited-resolution','low-light','bright-detail','highlights','possible-softness'].map(code=>[code,warned(code)])),
 recognitionAccuracyBefore:null,recognitionAccuracyAfter:null,
 independentlyRatedHumanQualityCount:0,matchedRecapturePairs:0,
 qualityPrecision:null,qualityRecall:null,falsePositiveRetakeRate:null,
 causalImprovement:'UNKNOWN — no human-rated matched real-photo pairs and unchanged recognition model not rerun',
 photos:outcomes};
await mkdir('research/parallel73-photo-quality',{recursive:true});
await writeFile('research/parallel73-photo-quality/runtime-real-photo-metrics.json',JSON.stringify(summary,null,2)+'\n');
console.log('P73_GENUINE_PHOTO_PIXEL_RECEIPTS '+JSON.stringify({
 cohort:summary.cohort,verified:summary.sourceShaVerified,legacyBlank:summary.preexistingFlat16x16,
 newAdvisory:summary.newPixelAdvisoryCount,byCode:summary.advisoryByCode,
 humanTruth:0,recognitionGain:'UNKNOWN'}));
