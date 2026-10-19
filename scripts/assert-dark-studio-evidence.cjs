'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const r=JSON.parse(fs.readFileSync('artifacts/dark-studio-extraction/results.json'));
assert.equal(r.summary.realPhotos,12);assert.equal(r.summary.automaticProposals,1);
assert.equal(r.summary.approvedAutomaticDisplay,0);assert.equal(r.summary.independentlyScoredFullMasks,0);
assert.equal(r.decoder,'Pillow 11.3.0');
for(const c of r.cases){
 assert.equal(c.originalFileUnchanged,true);assert.equal(c.sourceUnchanged,true);
 assert.equal(c.displayEligible,false);assert.equal(c.fullMaskPrecision,null);assert.equal(c.fullMaskRecall,null);
 assert.equal(c.proposalAvailable,c.id==='commons-0002');
}
const c=r.cases.find(x=>x.proposalAvailable),garment=c.partialSourceWitnesses.filter(x=>x.role==='garment'),
 background=c.partialSourceWitnesses.filter(x=>x.role==='background');
assert.equal(c.rgbBytesChanged,0);assert.ok(c.backgroundPixelsRemoved>80000);
assert.equal(garment.length,8);assert.equal(background.length,4);
for(const patch of garment)assert.equal(patch.retained,patch.pixels,patch.name);
for(const patch of background)assert.equal(patch.removed,patch.pixels,patch.name);
assert.equal(c.partialSourceWitnesses.filter(x=>x.role==='boundary-ambiguous').length,3);
console.log(JSON.stringify({candidate:c.id,garmentCoreWitnessPixels:garment.reduce((n,x)=>n+x.pixels,0),
 retainedGarmentCorePixels:garment.reduce((n,x)=>n+x.retained,0),backgroundWitnessPixels:background.reduce((n,x)=>n+x.pixels,0),
 removedBackgroundWitnessPixels:background.reduce((n,x)=>n+x.removed,0),rgbBytesChanged:c.rgbBytesChanged,
 fullMaskFidelityMeasured:false,automaticDisplayApproved:false}));
