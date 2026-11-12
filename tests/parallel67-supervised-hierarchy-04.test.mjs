import test from 'node:test';
import assert from 'node:assert/strict';
import {
 fitHierarchicalFashion67_04,predictHierarchicalFashion67_04,
 scoreHierarchicalFashion67_04,P67_04_DIMENSION
} from '../scripts/parallel67-hierarchical-prototypes-04.mjs';
import {compareSupervisedHierarchy67_04} from '../scripts/parallel67-compare-hierarchy-04.mjs';
import {P67_FASHION_MODEL,P67_FASHION_REVISION} from '../scripts/parallel67-independent-siglip-scoring.mjs';

const digest=id=>id.toString(16).padStart(64,'0');
function photo(id,category,type,{index,sha=digest(id)}={}){
 const map={Tops:0,Bottoms:1,Shoes:2,Outerwear:3,Dresses:4,Accessories:5,Uncategorized:6};
 const t={ 'T-shirt':12,Blouse:13,Sweatshirt:14,Jeans:15,Skirt:16,Shorts:17,
  Sneakers:18,Boots:19,Jacket:20,Coat:21,Dress:22,'Formal dress':23,Unknown:24};
 const v=new Float32Array(P67_04_DIMENSION);
 v[map[category]]=1;
 v[t[type]]=.45;
 if(index!==undefined)v[30+index]=.001;
 return {id:'commons-'+String(id).padStart(4,'0'),category,type,originalSha256:sha,
  shaVerified:true,embedding:v};
}
function typical(){
 const specs=[
  ['Tops','T-shirt'],['Tops','T-shirt'],['Tops','Blouse'],['Tops','Blouse'],
  ['Bottoms','Jeans'],['Bottoms','Jeans'],['Bottoms','Skirt'],['Bottoms','Skirt'],
  ['Shoes','Sneakers'],['Shoes','Sneakers'],['Shoes','Boots'],['Shoes','Boots'],
  ['Outerwear','Jacket'],['Outerwear','Jacket'],['Outerwear','Coat'],['Outerwear','Coat'],
  ['Dresses','Dress'],['Dresses','Dress']
 ];
 return specs.map(([category,type],i)=>photo(i+1,category,type,{index:i}));
}
function diagnostic(){
 return [
  photo(101,'Tops','T-shirt'),photo(102,'Tops','Blouse'),photo(103,'Tops','Sweatshirt'),
  photo(104,'Bottoms','Jeans'),photo(105,'Bottoms','Skirt'),
  photo(106,'Shoes','Sneakers'),photo(107,'Shoes','Boots'),
  photo(108,'Outerwear','Jacket'),photo(109,'Outerwear','Coat'),
  photo(110,'Dresses','Dress'),photo(111,'Dresses','Dress'),
  photo(112,'Accessories','Scarf'),photo(113,'Bottoms','Shorts'),
  photo(114,'Uncategorized','Unknown'),photo(115,'Uncategorized','Unknown'),
  photo(116,'Uncategorized','Unknown')
 ];
}
test('P67-04 actual supervised category/type heads learn different labels from source features',()=>{
 const fit=fitHierarchicalFashion67_04(typical());
 assert.equal(fit.categoryHeads.size,5);
 assert.equal(fit.subtypeHeads.size,4);
 assert.equal(fit.sourceCount,18);
 const top=predictHierarchicalFashion67_04(fit,photo(201,'Tops','T-shirt').embedding);
 const blouse=predictHierarchicalFashion67_04(fit,photo(202,'Tops','Blouse').embedding);
 assert.equal(top.category,'Tops');assert.equal(top.typeSuggestion,'T-shirt');
 assert.equal(blouse.typeSuggestion,'Blouse');
 assert.equal(top.automaticWardrobeSaveAllowed,false);
 assert.equal(top.uncalibratedCosineRanking,true);
 assert.equal(top.categoryRank.length,5);
 assert.ok(top.typeMargin>0,'learned contrasting subtype should rank');
});
test('P67-04 generic Boots/Dress labels NEVER become fabricated ankle-boot or specific dress type',()=>{
 const fit=fitHierarchicalFashion67_04(typical());
 const boot=predictHierarchicalFashion67_04(fit,photo(300,'Shoes','Boots').embedding);
 assert.equal(boot.category,'Shoes');
 assert.equal(boot.typeSuggestion,'Boots');
 assert.equal(boot.typeIsGeneric,true);
 assert.equal(boot.unsupportedSubtypesRequireReview,true);
 const dress=predictHierarchicalFashion67_04(fit,photo(301,'Dresses','Dress').embedding);
 assert.equal(dress.category,'Dresses');
 assert.equal(dress.typeSuggestion,null);
 assert.equal(dress.unsupportedSubtypesRequireReview,true);
 assert.equal(fit.availability.Dresses.subtypeHeadAvailable,false);
});
test('P67-04 no contrast within category means manual subtype review, not a trivial forced label',()=>{
 const rows=typical().filter(r=>!(r.category==='Tops'&&r.type==='Blouse'));
 const fit=fitHierarchicalFashion67_04(rows);
 assert.equal(fit.subtypeHeads.has('Tops'),false);
 const x=predictHierarchicalFashion67_04(fit,photo(200,'Tops','T-shirt').embedding);
 assert.equal(x.category,'Tops');
 assert.equal(x.typeSuggestion,null);
 assert.equal(x.automaticWardrobeSaveAllowed,false);
});
test('P67-04 score every held-out original including nonclothing without silent drops or false automatic admissions',()=>{
 const model=fitHierarchicalFashion67_04(typical());
 const report=scoreHierarchicalFashion67_04(model,diagnostic());
 assert.equal(report.count,16);
 assert.equal(report.garments,13);
 assert.equal(report.negatives,3);
 assert.equal(report.trainCount,18);
 assert.equal(report.sourceRows.length,16);
 assert.equal(report.automaticWardrobeSaved,0);
 assert.equal(report.automaticSaveAllowed,false);
 assert.equal(report.negativeTop1,0,'negative rejection cannot be learned with zero negatives');
 assert.equal(report.newBlindIndependentEvidence,false);
 assert.equal(report.trainingPhotoSHASeparated,true);
 assert.equal(report.colorNotMeasured,true);
 assert.equal(report.instanceSegmentationNotMeasured,true);
 assert.equal(report.sourceRows.find(x=>x.expectedType==='Dress').exactSubtypeTop1Correct,null);
});
test('P67-04 cannot accidentally use an evaluated original in training by source ID OR SHA',()=>{
 const model=fitHierarchicalFashion67_04(typical());
 const idLeak=diagnostic(),shaLeak=diagnostic();
 idLeak[0]={...idLeak[0],id:model.trainIds[0]};
 shaLeak[0]={...shaLeak[0],originalSha256:model.trainHashes[0]};
 assert.throws(()=>scoreHierarchicalFashion67_04(model,idLeak),/source leak/);
 assert.throws(()=>scoreHierarchicalFashion67_04(model,shaLeak),/source leak/);
});
test('P67-04 training fails closed on fabricated owner labels, missing sources and duplicate SHA',()=>{
 for(const edit of [
  rows=>rows[0].type='PRIVATE_OWNER',
  rows=>rows[0].category='Uncategorized',
  rows=>rows[0].originalSha256=rows[1].originalSha256,
  rows=>rows[0].id=rows[1].id,
  rows=>rows[0].shaVerified=false,
  rows=>rows[0].embedding=new Float32Array(10),
  rows=>rows[0].embedding[7]=Number.NaN,
  rows=>rows[0].embedding.fill(0),
 ]){
  const rows=typical();edit(rows);
  assert.throws(()=>fitHierarchicalFashion67_04(rows),/P67-04/);
 }
});
test('P67-04 negative controls are only evaluation, not magically trained as genuine clothing',()=>{
 const rows=typical();rows[0]=photo(1,'Uncategorized','Unknown');
 assert.throws(()=>fitHierarchicalFashion67_04(rows),/P67-04/);
});
test('P67-04 evaluator rejects changed unknown labels, missing originals and repeated images',()=>{
 const model=fitHierarchicalFashion67_04(typical());
 for(const mutate of [
  rows=>rows.pop(),
  rows=>rows[0].id=rows[1].id,
  rows=>rows[13].type='PRIVATE_PERSON',
  rows=>rows[8].type='PRIVATE_OWNER',
  rows=>rows[0].shaVerified=false,
  rows=>rows[1].embedding=new Float32Array(4)
 ]){
  const rows=diagnostic();mutate(rows);
  assert.throws(()=>scoreHierarchicalFashion67_04(model,rows),/P67-04/);
 }
});
test('P67-04 unsupported category and subtype training classes are explicitly listed as data gaps',()=>{
 const fit=fitHierarchicalFashion67_04(typical());
 assert.equal(fit.availability.Accessories.categoryExamples,0);
 assert.equal(fit.availability.Accessories.categoryHeadAvailable,false);
 assert.ok(fit.availability.Tops.missingFineTypeExamples.includes('Sweatshirt'));
 assert.ok(fit.availability.Dresses.missingFineTypeExamples.includes('Casual dress'));
 assert.equal(fit.availability.Shoes.exactSourceTypeCounts.Boots,2);
 assert.deepEqual(fit.availability.Shoes.trainedContrastingTypes.sort(),['Boots','Sneakers']);
});

function fakePair(){
 const train=fitHierarchicalFashion67_04(typical());
 const b=scoreHierarchicalFashion67_04(train,diagnostic());
 b.trainCount=32;
 b.model=P67_FASHION_MODEL;b.revision=P67_FASHION_REVISION;
 b.sourceIndexSha256='b'.repeat(64);
 b.evaluationManifestSha256='a'.repeat(64);
 b.trainingAndTestOriginalIDsDisjoint=true;
 b.trainingAndTestOriginalSHAsDisjoint=true;
 const rows=b.sourceRows.map(s=>({
  id:s.id,truthCategory:s.expectedCategory,truthSubtype:s.expectedType,
  categoryOnly:s.negative,categoryTop1Correct:s.categoryTop1Correct,
  subtypeTop1Correct:s.subtypeTop1Correct,
  predictedCategory:s.predictedCategory,predictedSubtype:s.predictedType,error:null
 }));
 const a={
  schema:'closet-current-parallel67-foreign-siglip-developer-exposed-v1',
  model:P67_FASHION_MODEL,revision:P67_FASHION_REVISION,
  originalCount:16,garments:13,negatives:3,
  categoryTop1:b.categoryTop1,broadSubtypeTop1:b.subtypeBroadTop1,
  negativeTop1:b.negativeTop1,developerExposedNotBlind:true,
  sourceIndexSha256:'b'.repeat(64),truthFileSha256:'a'.repeat(64),rows
 };
 return [a,b];
}
test('P67-04 baseline comparison reports changes on precisely original 16 IDs, not accepted save accuracy',()=>{
 const [a,b]=fakePair();
 const comparison=compareSupervisedHierarchy67_04(a,b);
 assert.equal(comparison.originalSources,16);
 assert.equal(comparison.trainingPhotos,32);
 assert.equal(comparison.garments,13);
 assert.equal(comparison.negatives,3);
 assert.equal(comparison.differenceCategory,0);
 assert.equal(comparison.differenceSubtype,0);
 assert.equal(comparison.noAutomaticClosetSave,true);
 assert.equal(comparison.notBlind,true);
});
test('P67-04 model comparison rejects fabricated source, wrong class or inflated success denominators',()=>{
 const variants=[
  ([,b])=>b.sourceRows.reverse(),
  ([a])=>a.rows[1].truthCategory='PRIVATE_OWNER',
  ([,b])=>b.sourceRows[0].predictedCategory='PRIVATE',
  ([,b])=>b.sourceRows[0].needsManualReview=false,
  ([,b])=>b.automaticSaveAllowed=true,
  ([,b])=>b.trainCount=16,
  ([a])=>a.categoryTop1=500,
  ([,b])=>b.subtypeBroadTop1=50,
  ([,b])=>b.evaluationManifestSha256='c'.repeat(64),
  ([,b])=>b.sourceRows.pop()
 ];
 for(const mutation of variants){
  const pair=fakePair();mutation(pair);
  assert.throws(()=>compareSupervisedHierarchy67_04(...pair),/P67-04/);
 }
});
