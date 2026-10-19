#!/usr/bin/env node
import fs from 'node:fs';
import {dirname} from 'node:path';
import {blindOriginalFormReviewPacket} from '../benchmark/blind-original-form-review.mjs';
const [queueFile,outputDir]=process.argv.slice(2);
if(!queueFile||!outputDir)throw Error('Usage: node scripts/stage-blind-original-form-review.mjs review-queue.json output-directory');
const q=JSON.parse(fs.readFileSync(queueFile,'utf8'));
fs.mkdirSync(outputDir,{recursive:true});
for(const slot of ['first','second']){
 const packet=blindOriginalFormReviewPacket(q,slot);
 fs.writeFileSync(outputDir+'/blind-'+slot+'-reviewer.json',JSON.stringify(packet,null,2));
}
console.log('BLIND_ORIGINAL_PHOTO_REVIEW '+JSON.stringify({photos:q.originalSourcePhotos,
 reviewers:2,answersLeaked:false,completedReviews:0,modelPromoted:false}));
