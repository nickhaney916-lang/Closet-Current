// Offline research comparison. Obtain inputs separately from the pinned
// DeepFashion and actual outfit-worker GitHub Actions artifacts.
// Never deploy model inference, upload photographs or write to user closets.
import {readFile,writeFile} from 'node:fs/promises';
import {compareRealOutfitModelEvidence} from '../benchmark/real-outfit-cross-model-evidence.mjs';
const [deepFile,semanticFile,output]=process.argv.slice(2);
if(!deepFile||!semanticFile||!output)throw Error(
 'Usage: node scripts/audit-real-outfit-model-disagreement.mjs <deepfashion-summary.json> <real-whole-outfit-flow.json> <output.json>');
const [deep,semantic]=await Promise.all([deepFile,semanticFile].map(
 path=>readFile(path,'utf8').then(JSON.parse)));
const report=compareRealOutfitModelEvidence(deep,semantic);
await writeFile(output,JSON.stringify(report,null,2)+'\n');
console.log('CROSS_MODEL_OUTFIT_REVIEW '+JSON.stringify({
 sourceId:report.sourceId,sourceHashMatched:report.sourcePhotosMatch,
 modelProposals:report.deepFashionProposals.length,
 disagreements:report.deepFashionProposals.filter(
  x=>x.evidenceRelation==='semantic-class-not-predicted').map(x=>x.proposedType),
 realPhotoAccuracyMeasured:false,autoSaved:report.wardrobeItemsAutoSavedByAudit,
 productionReady:false
}));
