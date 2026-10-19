// Review-only, offline cross-study audit. Nothing is sent to a remote AI
// endpoint. The LIP findings are historical licensed observations (not
// same-photo side-by-side evidence or ground-truth segmentation).
import {readFile,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {assessFootwearModelReadiness} from '../benchmark/footwear-readiness.mjs';
const path=resolve(process.argv[2]||'benchmark/deepfashion-instance-review');
const [deepfashion,lip,suite]=await Promise.all([
 readFile(join(path,'summary.json'),'utf8').then(JSON.parse),
 readFile('benchmark/LIP-SOCKS-REAL-REVIEW-20261017.json','utf8').then(JSON.parse),
 readFile('benchmark/deepfashion-real-photo-suite.json','utf8').then(JSON.parse)
]);
const audit=assessFootwearModelReadiness(deepfashion,lip,suite);
await writeFile(join(path,'footwear-hosiery-readiness-audit.json'),JSON.stringify(audit,null,2)+'\n');
console.log('FOOTWEAR_MODEL_READINESS '+JSON.stringify({
 negativeControls:audit.negativeFootwearControls.length,
 priorLIPReviewSources:audit.lipHistoricImages.length,
 actualFootwearAccuracy:null,footwearModelPromotionAllowed:false,
 originalRgbModified:false,paidInferenceUsed:false
}));
