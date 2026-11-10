import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
import {
 buildExposureLedger,screenProspectiveImages
} from '../research/mission1-visual-source-overlap-769/original-perceptual-ledger.mjs';
const sha=x=>createHash('sha256').update(x).digest('hex');
let shared;
function originals(){
 if(shared)return shared;
 shared=(async()=>{
  const rows=[],bytes=new Map(),width=144,height=136;
  for(let k=0;k<65;k++){
   const pixels=Buffer.alloc(width*height*3);
   for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const offset=(y*width+x)*3;
    const noise=(Math.imul(x+7,k*157+13)^Math.imul(y+3,k*311+51)^Math.imul(x*y+71,k+297))>>>0;
    pixels[offset]=(noise^((x*17+y*11+k*19)>>>0))&255;
    pixels[offset+1]=((noise>>>8)^((x*3+y*23+k*13)>>>0))&255;
    pixels[offset+2]=((noise>>>16)^((x*31+y*7+k*23)>>>0))&255;
   }
   const jpeg=await sharp(pixels,{raw:{width,height,channels:3}})
    .jpeg({quality:87}).toBuffer();
   const row={image:'fixture-'+k+'.jpg',sha256:sha(jpeg)};
   rows.push(row);bytes.set(row.image,jpeg);
  }
  const ledger=await buildExposureLedger({
   historical59:rows.slice(0,59),published6:rows.slice(59),
   readOriginal:async row=>bytes.get(row.image)
  });
  return {rows,bytes,ledger};
 })();
 return shared;
}
test('Mission1 65 actual decoded synthetic unit-fixture JPEGs produce 65 SHA-pinned multicrop receipts, not human annotations',async()=>{
 const a=await originals();
 assert.equal(a.ledger.realSourcePhotos,65);
 assert.equal(a.ledger.historicalSourcePhotos,59);
 assert.equal(a.ledger.publishedHumanMaskSourcePhotos,6);
 assert.equal(a.ledger.fingerprints.length,65);
 assert.ok(a.ledger.fingerprints.every(x=>x.views.length===7));
 assert.equal(a.ledger.independentGroundTruthNewlyCreated,0);
 assert.equal(a.ledger.familyAlpha,'HOLD');
});
test('Mission1 exact byte-identical original already in 59-source known cohort never accepted under a different image name',async()=>{
 const a=await originals(),img=a.bytes.get(a.rows[5].image);
 const result=await screenProspectiveImages({
  ledger:a.ledger,known65:a.rows.map(x=>x.sha256),
  candidates:[{image:'not-original-name.jpg',sha256:sha(img)}],
  readCandidate:async()=>img
 });
 assert.equal(result.verifiedExposedSources,65);
 assert.equal(result.nearDuplicateFlagCount,1);
 assert.equal(result.outcomes[0].minimumHammingDistance,0);
 assert.equal(result.candidatesApprovedAsUnseen,0);
});
test('Mission1 genuine recompressed copy of an exposed original is quarantined despite changed JPEG SHA',async()=>{
 const a=await originals(),src=a.bytes.get(a.rows[7].image);
 const jpeg=await sharp(src).jpeg({quality:65}).toBuffer();
 assert.notEqual(sha(jpeg),a.rows[7].sha256);
 const out=await screenProspectiveImages({
  ledger:a.ledger,known65:a.rows.map(x=>x.sha256),
  candidates:[{image:'recompressed.jpg',sha256:sha(jpeg)}],
  readCandidate:async()=>jpeg
 });
 assert.equal(out.nearDuplicateFlagCount,1);
 assert.ok(out.outcomes[0].minimumHammingDistance<=8);
 assert.equal(out.outcomes[0].status,'QUARANTINE_SOURCE_OVERLAP');
});
test('Mission1 full-source centre crop and recompression cannot masquerade as unseen garment',async()=>{
 const a=await originals(),src=a.bytes.get(a.rows[12].image);
 const meta=await sharp(src).metadata();
 const crop={left:Math.round(.14*meta.width),top:Math.round(.14*meta.height),
  width:Math.round(.72*meta.width),height:Math.round(.72*meta.height)};
 const jpeg=await sharp(src).extract(crop).jpeg({quality:81}).toBuffer();
 const out=await screenProspectiveImages({
  ledger:a.ledger,known65:a.rows.map(x=>x.sha256),
  candidates:[{image:'cropped.jpg',sha256:sha(jpeg)}],
  readCandidate:async()=>jpeg
 });
 assert.equal(out.nearDuplicateFlagCount,1);
 assert.ok(out.outcomes[0].minimumHammingDistance<=8);
});
test('Mission1 never certifies a visually different synthetic candidate solely because no image hash matched',async()=>{
 const a=await originals(),width=156,height=140,
  pixels=Buffer.alloc(width*height*3);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*3;
  pixels[i]=(x*11+y*3)&255;
  pixels[i+1]=(y*17+x*9)&255;
  pixels[i+2]=(x*y*7)&255;
 }
 const img=await sharp(pixels,{raw:{width,height,channels:3}}).jpeg().toBuffer();
 const out=await screenProspectiveImages({
  ledger:a.ledger,known65:a.rows.map(x=>x.sha256),
  candidates:[{image:'a-new-test.jpg',sha256:sha(img)}],
  readCandidate:async()=>img
 });
 assert.equal(out.candidatesApprovedAsUnseen,0);
 assert.equal(out.rightsAndTrainingExposureIndependentlyVerified,false);
 assert.equal(out.releaseAuthorized,false);
 assert.equal(out.familyAlpha,'HOLD');
});
test('Mission1 refuses incomplete reference cohort, altered known65 receipt or duplicate candidate SHA',async()=>{
 const a=await originals(),img=a.bytes.get(a.rows[3].image);
 const base={
  ledger:a.ledger,known65:a.rows.map(x=>x.sha256),
  candidates:[{image:'foo.jpg',sha256:sha(img)}],readCandidate:async()=>img
 };
 await assert.rejects(screenProspectiveImages({...base,
  known65:a.rows.slice(0,64).map(x=>x.sha256)}),/all 59 historical plus six/);
 await assert.rejects(screenProspectiveImages({...base,
  known65:[...base.known65.slice(0,64),'0'.repeat(64)]}),/65-source SHA set|all 65 distinct external previously exposed originals/);
 await assert.rejects(screenProspectiveImages({...base,
  candidates:[base.candidates[0],{...base.candidates[0]}]}),/duplicate or unverified/);
});
test('Mission1 refuses forged image content and corrupted incomplete exposure ledger',async()=>{
 const a=await originals(),img=a.bytes.get(a.rows[1].image);
 await assert.rejects(screenProspectiveImages({
  ledger:a.ledger,known65:a.rows.map(x=>x.sha256),
  candidates:[{image:'wrong.jpg',sha256:'f'.repeat(64)}],
  readCandidate:async()=>img
 }),/complete SHA-pinned JPEG/);
 const fake={...a.ledger,fingerprints:a.ledger.fingerprints.slice(1)};
 await assert.rejects(screenProspectiveImages({
  ledger:fake,known65:a.rows.map(x=>x.sha256),
  candidates:[{image:'foo.jpg',sha256:sha(img)}],
  readCandidate:async()=>img
 }),/all 65 distinct/);
});
test('Mission1 distinct reproduced JPEG sources must be decoded, not claimed as human masks or full training exclusion',async()=>{
 const a=await originals(),b=await buildExposureLedger({
  historical59:a.rows.slice(0,59),published6:a.rows.slice(59),
  readOriginal:async row=>a.bytes.get(row.image)
 });
 assert.deepEqual(b.fingerprints,a.ledger.fingerprints);
 const wrong=new Map(a.bytes);wrong.set(a.rows[2].image,Buffer.from('not a JPEG'));
 await assert.rejects(buildExposureLedger({
  historical59:a.rows.slice(0,59),published6:a.rows.slice(59),
  readOriginal:async row=>wrong.get(row.image)
 }),/complete SHA-pinned JPEG/);
});
