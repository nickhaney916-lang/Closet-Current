import test from 'node:test';
import assert from 'node:assert/strict';
import {auditModelProposalSpatialRelations} from '../benchmark/instance-spatial-review.mjs';
const sha='a'.repeat(64),scene={id:'validation-0031',image:'validation-0031.jpg',sourceSha256:sha};
function encoded(box,w=384,h=384){
 const data=new Uint8Array(w*h);
 if(box)for(let y=box[1];y<box[3];y++)for(let x=box[0];x<box[2];x++)data[y*w+x]=1;
 const runs=[];let bit=0,count=0;
 for(const v of data){if(v!==bit){runs.push(count);bit=v;count=0;}count++;}
 runs.push(count);return {width:w,height:h,runs};
}
function seed(n,label,box){const id=scene.id+'-candidate-'+String(n).padStart(2,'0');return [id,{
 schemaVersion:1,modelProposalId:id,image:scene.image,sourceSha256:sha,
 modelGarmentLabel:label,reviewStatus:'prediction-unreviewed',
 independentReference:false,canSaveToCustomerCloset:false,approvedBy:null,
 sourceRgbChanged:false,garmentCountVerified:false,...encoded(box)
}];}
test('two separated jacket panels near each other are NOT declared two garments',()=>{
 const result=auditModelProposalSpatialRelations(scene,new Map([
  seed(1,'long_sleeve_outwear',[30,40,115,260]),
  seed(2,'long_sleeve_outwear',[123,40,210,260])
 ]));
 assert.equal(result.proposalCount,2);
 assert.equal(result.candidatePairs[0].actualModelOverlapPixels,0);
 assert.equal(result.candidatePairs[0].modelToModelIoU,0);
 assert.equal(result.candidatePairs[0].sameBroadModelCategory,true);
 assert.equal(result.candidatePairs[0].geometryReviewPriority,
  'possibly-connected-or-fragmented-same-class-pieces');
 assert.equal(result.disjointSameCategoryPairs,1);
 assert.equal(result.physicalGarmentCount,null);
 assert.equal(result.canPromoteModel,false);
 assert.equal(result.garmentRecall,null);
});
test('actual overlap of distinct garment classes is a layer conflict, not verified contamination',()=>{
 const result=auditModelProposalSpatialRelations(scene,new Map([
  seed(1,'skirt',[100,100,200,210]),
  seed(2,'short_sleeve_dress',[140,160,255,260])
 ]));
 assert.ok(result.candidatePairs[0].actualModelOverlapPixels>0);
 assert.ok(result.candidatePairs[0].modelToModelIoU>0);
 assert.equal(result.overlappingDifferentCategoryPairs,1);
 assert.equal(result.candidatePairs[0].geometryReviewPriority,
  'potential-overlapping-layer-or-label-conflict');
 assert.equal(result.candidatePairs[0].independentlyVerifiedDifferentGarments,false);
});
test('far apart labels never invent a combined clothing article',()=>{
 const result=auditModelProposalSpatialRelations(scene,new Map([
  seed(1,'long_sleeve_outwear',[10,10,85,85]),
  seed(2,'short_sleeve_outwear',[300,290,368,380])
 ]));
 assert.ok(result.candidatePairs[0].nearestOccupiedCoarseGridSteps>3);
 assert.equal(result.possiblyRelatedSameCategoryPairs,0);
 assert.equal(result.disjointSameCategoryPairs,1);
 assert.equal(result.candidatePairs[0].independentlyVerifiedSameGarment,false);
});
test('zero proposals does NOT mean verified empty outfit or model accuracy',()=>{
 const result=auditModelProposalSpatialRelations(scene,new Map());
 assert.equal(result.proposalCount,0);
 assert.equal(result.physicalGarmentCount,null);
 assert.equal(result.instanceAccuracy,null);
 assert.equal(result.candidatePairs.length,0);
});
test('fake approval, source swap, wrong mask and inconsistent shapes are blocked',()=>{
 const base=seed(1,'skirt',[20,20,100,100]);
 for(const changed of [
  {...base[1],sourceSha256:'b'.repeat(64)},
  {...base[1],canSaveToCustomerCloset:true},
  {...base[1],reviewStatus:'approved'},
  {...base[1],independentReference:true},
  {...base[1],approvedBy:'A reviewer'},
  {...base[1],garmentCountVerified:true},
  {...base[1],modelGarmentLabel:'Shoes'},
  {...base[1],runs:[4,6]}
 ])assert.throws(()=>auditModelProposalSpatialRelations(scene,new Map([[base[0],changed]])));
 assert.throws(()=>auditModelProposalSpatialRelations({...scene,sourceSha256:'x'},new Map()));
 assert.throws(()=>auditModelProposalSpatialRelations(scene,new Map([
  base,seed(2,'skirt',[100,110,170,210]).map((x,i)=>i?{...x,width:383}:x)
 ])));
});
