import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcileGarmentSubtype as subtype,reconcileOutfitInstances as outfit} from '../benchmark/garment-subtype-consensus.mjs';
const hash='a'.repeat(64),region='upper-1';
const view=(category,itemType,frame,score=.81,secondScore=.2)=>({category,itemType,frame,score,secondScore,sourceSha256:hash});
const scan=(cls,one,two)=>subtype({sourceSha256:hash,semanticClass:cls,regionId:region,whole:one,confirmation:two});
test('two image framings can agree on top subtype without creating inventory',()=>{
 const result=scan(4,view('Tops','Blouse','whole'),view('Tops','Blouse','center'));
 assert.equal(result.status,'candidate-for-review');
 assert.equal(result.catalogType,'Blouse');assert.equal(result.category,'Tops');
 assert.equal(result.canAutoCreateItems,false);
});
test('jacket and shirt predictions inside shared class 4 must not turn into two items',()=>{
 const s=scan(4,view('Outerwear','Jacket','whole'),view('Tops','T-shirt','center'));
 assert.equal(s.catalogType,null);assert.equal(s.reason,'two-framings-disagree');
 const a=scan(4,view('Outerwear','Jacket','whole'),view('Outerwear','Jacket','center'));
 const b=scan(4,view('Tops','T-shirt','whole'),view('Tops','T-shirt','center'));
 const r=outfit({sourceSha256:hash,regions:[{regionId:region,semanticClass:4}],subtypes:[a,b]});
 assert.equal(r.garmentCandidates,0);assert.equal(r.autoCreatedItems,0);
 assert.equal(r.cases[0].conflict,'multiple-subtypes-for-one-semantic-region');
});
test('shorts and trousers share semantic class six; agreement alone is not instance separation',()=>{
 const p=scan(6,view('Bottoms','Shorts','whole'),view('Bottoms','Shorts','center'));
 assert.equal(p.catalogType,'Shorts');
 const r=outfit({sourceSha256:hash,regions:[{regionId:region,semanticClass:6}],subtypes:[p]});
 assert.equal(r.garmentCandidates,1);
 assert.equal(r.cases[0].independentInstancesVerified,false);
 assert.equal(r.autoCreatedItems,0);
});
test('skirts and pants are separate semantic classes; wrong class labels fail',()=>{
 const skirt=scan(5,view('Bottoms','Skirt','whole'),view('Bottoms','Skirt','center'));
 assert.equal(skirt.catalogType,'Skirt');
 const wrong=scan(6,view('Bottoms','Skirt','whole'),view('Bottoms','Skirt','center'));
 assert.equal(wrong.catalogType,null);
 assert.equal(wrong.reason,'semantic-class-disagrees-with-candidate');
});
test('unsupported dress subtype and conflicting shoe types do not get autosaved',()=>{
 const dress=scan(7,view('Dresses','Jacket','whole'),view('Dresses','Jacket','center'));
 const shoe=scan(9,view('Shoes','Sneakers','whole'),view('Shoes','Sandals','center'));
 assert.equal(dress.catalogType,null);assert.equal(shoe.catalogType,null);
});
test('source hash and framing identity are strict',()=>{
 const bad=scan(4,view('Tops','T-shirt','whole'),view('Tops','T-shirt','whole'));
 assert.equal(bad.reason,'same-framing-not-independent-confirmation');
 const mismatch=scan(4,view('Tops','T-shirt','whole'),{...view('Tops','T-shirt','center'),sourceSha256:'b'.repeat(64)});
 assert.equal(mismatch.reason,'source-photo-mismatch');
 assert.throws(()=>subtype({sourceSha256:'bad',semanticClass:4,regionId:'r'}));
});
test('close scores and one missing view fail to review',()=>{
 assert.equal(scan(4,view('Tops','T-shirt','whole',.66,.6),
    view('Tops','T-shirt','center')).reason,'weak-or-close-subtype-prediction');
 assert.equal(scan(4,view('Tops','T-shirt','whole'),null).reason,'missing-or-invalid-independent-view');
});
test('outfit accepts distinct classes without inventing instance identity',()=>{
 const top=subtype({sourceSha256:hash,semanticClass:4,regionId:'r1',
  whole:view('Tops','Blouse','whole'),confirmation:view('Tops','Blouse','center')});
 const skirt=subtype({sourceSha256:hash,semanticClass:5,regionId:'r2',
  whole:view('Bottoms','Skirt','whole'),confirmation:view('Bottoms','Skirt','center')});
 const r=outfit({sourceSha256:hash,
  regions:[{regionId:'r1',semanticClass:4},{regionId:'r2',semanticClass:5}],subtypes:[top,skirt]});
 assert.equal(r.garmentCandidates,2);assert.equal(r.autoCreatedItems,0);
 assert.equal(r.sourcePhotoPreserved,true);
});
test('reject duplicated regions, bad hashes and mismatched photograph evidence',()=>{
 assert.throws(()=>outfit({sourceSha256:hash,regions:[
   {regionId:'r1',semanticClass:4},{regionId:'r1',semanticClass:4}],subtypes:[]}),/Duplicate/);
 const result=scan(4,view('Tops','T-shirt','whole'),view('Tops','T-shirt','center'));
 assert.throws(()=>outfit({sourceSha256:'b'.repeat(64),regions:[{regionId:region,semanticClass:4}],subtypes:[result]}),/other photographs/);
});
