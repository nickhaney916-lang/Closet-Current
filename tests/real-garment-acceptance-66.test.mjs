import test from 'node:test';
import assert from 'node:assert/strict';
import {measureRegisteredBoundaries66,verifyRegisteredBoundaries66} from '../research/real-garment-acceptance-66/boundary-evidence.mjs';
import {verifyDecodedSourceContour191} from '../research/owner-source-mask-topology-191/source-contour-integrity.mjs';
const width=96,height=128;
function mask(inset=0,tips=true){
 const p=new Uint8Array(width*height);
 for(let y=20;y<110;y++)for(let x=25+inset;x<=70-inset;x++)p[y*width+x]=1;
 for(let y=24;y<27;y++)for(let x=tips?5:20;x<=(tips?90:75);x++)p[y*width+x]=1;
 return p;
}
const args=(sourcePixels,ownerPixels)=>({sourcePixels,ownerPixels,width,height});
const rgba=p=>{const a=new Uint8ClampedArray(p.length*4);p.forEach((v,i)=>a[i*4+3]=v*255);return a;};
test('P66 identical raster has exact boundary counts and perfect source-relative metrics',()=>{
 const a=mask(),r=measureRegisteredBoundaries66(args(a,a));
 assert.equal(r.boundaryF1,1);assert.equal(r.maxDistancePixels,0);
 assert.equal(r.sourceBoundaryMatched,r.sourceBoundaryPixels);
 assert.equal(r.independentGroundTruth,false);assert.equal(r.photographTo3DAccuracy,null);
});
test('P66 symmetric distances preserve normal bounded contour edits',()=>{
 const a=mask(),b=mask(2),r=verifyRegisteredBoundaries66(args(a,b));
 assert.ok(r.maxDistancePixels<=2);assert.equal(r.boundaryF1,1);
 const reversed=measureRegisteredBoundaries66(args(b,a));
 assert.equal(r.meanSymmetricDistancePixels,reversed.meanSymmetricDistancePixels);
 assert.equal(r.sourceBoundaryRecall,reversed.ownerBoundaryPrecision);
});
test('P66 catches small-area lost paired tips after inherited area/registration/topology/local/hairline gates',()=>{
 const source=mask(),owner=mask(1,false);
 const r=measureRegisteredBoundaries66(args(source,owner));
 assert.ok(r.maxDistanceFraction>.08);
 assert.throws(()=>verifyDecodedSourceContour191({sourceData:rgba(source),ownerData:rgba(owner),width,height,
  sourceSHA256:'e0510f06c475fa048585e6ff437359cb4255ce3a425e40a69dc54cc337f5ab24',
  ownerMaskSHA256:'6'.repeat(64)}),/PARALLEL66 localized source boundary loss/);
});
test('P66 validates binary values, empty masks, dimensions and distance tolerance',()=>{
 for(const input of [{...args(mask(),mask()),width:193},{...args(mask(),mask()),tolerance:NaN},
  args(new Uint8Array(width*height),mask()),args(new Uint8Array(width*height).fill(2),mask()),
  args([],mask())])assert.throws(()=>measureRegisteredBoundaries66(input),/PARALLEL66/);
});
