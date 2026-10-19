// Read experimental six-photo model artifacts from the same Actions run.
// Never scores photographic precision/recall or changes customer inference.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {summarizeLockedEdgeReadiness} from '../benchmark/locked-edge-support-evidence.mjs';
import {compareCutoutMasks} from '../benchmark/object-cutout-mask.mjs';
const out=process.argv[2]||'benchmark/strong-alpha-evidence';
const manifest=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
const baseline=new Map(),candidates=new Map(),subsetChecks=[];
for(const x of manifest.cases){
 const prior=JSON.parse(await readFile(join('benchmark/modnet-predictions',x.id+'.modnet-prediction.json'),'utf8'));
 const regular=JSON.parse(await readFile(join('benchmark/object-cutout-comparison',x.id+'.candidate.json'),'utf8'));
 const strict=JSON.parse(await readFile(join('benchmark/object-cutout-comparison',x.id+'.strict-candidate.json'),'utf8'));
 const diff=compareCutoutMasks(regular,strict);
 if(regular.foregroundThreshold!==128||strict.foregroundThreshold!==224||
    diff.addedPixels!==0||prior.image!==x.image)throw Error('Invalid native alpha threshold or source: '+x.id);
 baseline.set(x.id,prior);candidates.set(x.id,strict);
 subsetChecks.push({id:x.id,threshold128:regular.foregroundPixels,
  threshold224:strict.foregroundPixels,removedOnly:diff.addedPixels===0,
  pixelsRemovedAt224:diff.removedPixels,notAccuracy:true});
}
const audit=summarizeLockedEdgeReadiness(manifest,baseline,candidates);
await mkdir(out,{recursive:true});
await writeFile(join(out,'summary.json'),JSON.stringify({...audit,subsetChecks,
 sourceRgbPreserved:true,modelNotPromoted:true,productionAuthorized:false},null,2)+'\n');
console.log('SIX_PHOTO_STRONG_ALPHA_AUDIT '+JSON.stringify({
 photos:audit.photos,highConfidenceMaskCases:audit.highConfidenceMaskCases,
 independentlyApprovedReferenceCases:audit.independentlyApprovedReferenceCases,
 status:audit.status,backgroundRemovalVerified:false,productionAuthorized:false}));
