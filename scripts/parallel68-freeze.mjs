// Run once before acceptance. Later reproduction verifies these receipts;
// changing a candidate requires new source-disjoint acceptance evidence.
import {readFile,writeFile,access} from 'node:fs/promises';import {createHash} from 'node:crypto';
const scope=process.argv[2];if(!['mask','color'].includes(scope))throw Error('Unknown protocol scope');
const path='research/parallel68/'+scope+'-protocol-lock.json';
try{await access(path);throw Error('Protocol already frozen; do not overwrite');}catch(e){if(e.code!=='ENOENT')throw e;}
const files=scope==='mask'?['research/parallel68/semantic-instances.mjs','research/parallel68/footwear.mjs','scripts/parallel68-semantic.mjs','scripts/parallel68-reference.mjs','scripts/parallel68-evaluate.py','research/parallel67-reference/florence-grounder.mjs','research/parallel67-reference/sam2-mask.mjs','public/outfit-segmentation.mjs']:['research/parallel68/color.mjs','research/parallel68/color-mask.mjs','scripts/parallel68-color-run.mjs','scripts/parallel68-color-select.mjs','research/parallel67/color.mjs','research/parallel67-reference/sam2-mask.mjs'];
files.push('research/parallel68/acceptance-guard.mjs');
const manifest=scope==='mask'?'research/parallel68/data/acceptance-manifest.json':'research/parallel68/color-data/acceptance.json';
const sha=b=>createHash('sha256').update(b).digest('hex'),codeSha256={};for(const file of files)codeSha256[file]=sha(await readFile(file));
const lock={schema:'closet-current-parallel68-prospective-acceptance-lock/v1',scope,status:'FROZEN_BEFORE_ACCEPTANCE_INFERENCE',frozenAtUTC:new Date().toISOString(),primaryCandidate:scope==='mask'?'Florence/SAM2 with visible-footwear instance repair; fast semantic repair reported separately':'model foreground selection + conservative masked color estimator; existing palette retained as comparison',manifests:{[manifest]:sha(await readFile(manifest))},codeSha256,automaticSaveAllowed:false,thresholds:scope==='mask'?{maskMatchingIoU:.5,duplicateMaskIoU:.85,footwearMajorFraction:.1}:{estimatorFrozenSeparately:true},knownLimits:['Public source dataset pretraining exposure unknown','No physical-device acceptance','No automatic confidence calibration','Do not count abstention as correct']};
await writeFile(path,JSON.stringify(lock,null,2)+'\n');console.log(scope,sha(await readFile(path)));
