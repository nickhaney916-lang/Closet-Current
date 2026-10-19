import {readFile,writeFile} from 'node:fs/promises';
import {compareObservedOutfitSuite} from '../benchmark/real-outfit-suite-disagreement.mjs';
const [deepFile,semanticFile,destination]=process.argv.slice(2);
if(!deepFile||!semanticFile||!destination)throw Error(
 'Usage: node scripts/audit-real-outfit-suite-disagreement.mjs <deepfashion-summary.json> <semantic-summary.json> <output.json>');
const [deep,semantic]=await Promise.all([deepFile,semanticFile].map(
 path=>readFile(path,'utf8').then(JSON.parse)));
const result=compareObservedOutfitSuite(deep,semantic);
await writeFile(destination,JSON.stringify(result,null,2)+'\n');
console.log('MULTI_PHOTO_MODEL_DISAGREEMENT '+JSON.stringify({
 sharedSources:result.sharedSources,
 sourceRows:result.sourceRows.map(({id,modelDisagreementTypes,flatLayOrNonPersonRoutingRisk})=>({
  id,modelDisagreementTypes,flatLayOrNonPersonRoutingRisk
 })),
 realPhotoAccuracyMeasured:false,canPromoteModel:false
}));
