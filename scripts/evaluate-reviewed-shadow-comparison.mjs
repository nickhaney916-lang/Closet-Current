import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {compareApprovedShadowCleanup} from '../benchmark/compare-approved-shadow-cleanup.mjs';

// Explicit, local-only analysis. Never approves annotations, trains a model,
// changes wardrobe photos, or edits deployed app files.
const [imageId,annotationPath,baselinePath,candidatePath]=process.argv.slice(2);
if(!imageId||!annotationPath||!baselinePath||!candidatePath){
 console.error('Usage: node scripts/evaluate-reviewed-shadow-comparison.mjs <image-id> <approved-outline.json> <baseline-mask.json> <candidate-mask.json>');
 process.exitCode=2;
}else{
 const manifest=JSON.parse(await readFile('benchmark/segmentation-review-manifest.json','utf8'));
 const entry=manifest.cases.find(item=>item.id===imageId);
 if(!entry)throw Error('Unknown benchmark image '+imageId);
 const read=async p=>JSON.parse(await readFile(resolve(p),'utf8'));
 const [annotation,baseline,candidate]=await Promise.all([read(annotationPath),read(baselinePath),read(candidatePath)]);
 const result=compareApprovedShadowCleanup({annotation,entry,baseline,candidate});
 console.log('APPROVED_SHADOW_COMPARISON '+JSON.stringify(result));
}
