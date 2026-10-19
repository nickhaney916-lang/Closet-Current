#!/usr/bin/env node
// Only use after two REAL, separate blind submissions. Never create fake
// reviewer content or place the adjudicator report in the third reviewer ZIP.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {prepareIndependentAdjudication} from '../benchmark/independent-photo-adjudication.mjs';
const files=process.argv.slice(2);
if(files.length!==5)throw Error('Usage: node scripts/prepare-independent-photo-adjudication.mjs first-packet.json first-review.json second-packet.json second-review.json output-directory');
const [a,first,b,second]=await Promise.all(files.slice(0,4).map(f=>readFile(f,'utf8').then(JSON.parse)));
const handoff=prepareIndependentAdjudication(a,first,b,second);
const out=resolve(files[4]);await mkdir(out,{recursive:true});
await writeFile(join(out,'ADJUDICATOR-PRIVATE-comparison.json'),
 JSON.stringify(handoff.adjudicatorOnly,null,2));
if(handoff.thirdBlindPacket)await writeFile(join(out,'third-blind-source-only.json'),
 JSON.stringify(handoff.thirdBlindPacket,null,2));
console.log('ORIGINAL_SOURCE_ADJUDICATION_HANDOFF '+JSON.stringify({
 verifiedOriginalPhotos:handoff.adjudicatorOnly.sourcePhotos,
 unresolvedUnknownOrPartial:handoff.adjudicatorOnly.photos.filter(x=>
  x.flaggedReasons.includes('unknown-or-partially-visible-item')).map(x=>x.sourceId),
 needsIndependentThird:handoff.adjudicatorOnly.flaggedForBlindThirdReview,
 thirdBlindPacketCreated:Boolean(handoff.thirdBlindPacket),
 independentlyApprovedMasks:0,measuredFormAccuracy:null,releaseAllowed:false
}));
