'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const report=JSON.parse(fs.readFileSync('artifacts/source-guided-boundaries/results.json'));
assert.equal(report.decoder,'Pillow 11.3.0');assert.equal(report.summary.realPhotos,12);
assert.equal(report.summary.automaticProposals,1);assert.equal(report.summary.newDisplayApprovals,0);
for(const row of report.cases){
 assert.equal(row.sourceUnchanged,true);assert.equal(row.sourceFileUnchanged,true);
 assert.equal(row.displayEligible,false);assert.equal(row.proposalAvailable,row.id==='commons-0002');
}
const c=report.cases.find(x=>x.proposalAvailable);
assert.equal(c.width,633);assert.equal(c.height,946);assert.equal(c.guideWidth,316);assert.equal(c.guideHeight,473);
assert.equal(c.rgbBytesChanged,0);assert.equal(c.outsideBandChanges,0);assert.equal(c.independentFullMaskReference,null);
assert.equal(c.clearedBoundaryPixels,0);assert.ok(c.restoredBoundaryPixels>0);
assert.ok(c.uncertainBoundaryPixels>c.clearedBoundaryPixels+c.restoredBoundaryPixels);
for(const p of c.partialWitnesses){
 if(p.role==='garment')assert.equal(p.opaque,p.pixels,p.name);
 if(p.role==='background')assert.equal(p.clear,p.pixels,p.name);
}
const core=c.partialWitnesses.filter(x=>x.role==='garment'),bg=c.partialWitnesses.filter(x=>x.role==='background');
console.log(JSON.stringify({width:c.width,height:c.height,clearedBoundaryPixels:c.clearedBoundaryPixels,
 restoredBoundaryPixels:c.restoredBoundaryPixels,uncertainBoundaryPixels:c.uncertainBoundaryPixels,
 garmentCorePixels:core.reduce((n,x)=>n+x.pixels,0),backgroundWitnessPixels:bg.reduce((n,x)=>n+x.pixels,0),
 sourceRgbEdits:0,outsideBandChanges:0,completeBoundaryQualityVerified:false,automaticDisplayApproved:false}));
