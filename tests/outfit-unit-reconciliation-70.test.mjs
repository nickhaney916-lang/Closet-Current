import test from 'node:test';
import assert from 'node:assert/strict';
import {canSuggestShoePair70,reconcileWardrobeUnits70,confirmWardrobePair70,keepSeparate70,unpairComponents70,ownerMaySaveUnit70} from '../public/outfit-unit-reconciliation-70.mjs';
const sha=n=>n.toString(16).padStart(64,'0'),source=sha(2),owner='private-owner';
function piece(id,{color='Black',support=.94,x=0.1,y=.7,width=.12,height=.11,category='Shoes',type='Sneakers',clipped=false,maskId=Number(id),sourceHash=source,sourceId='outfit1',status='unresolved'}={}){
 return {id,outfitSourceId:sourceId,image:'data:image/jpeg;base64,'+id,recognitionPhoto:{image:'data:image/jpeg;base64,xyz'+id},
  originalPhoto:{image:'data:image/jpeg;base64,SOURCE'},segmentHint:{categories:[category],clipped,types:[]},category,itemType:type,
  cropBounds:{x,y,width,height},reconciliation70:{ownerId:owner,sourceSha256:sourceHash,maskSha256:sha(maskId),colorEstimate:{color,support}},reconciliation70Status:status,requiresOwnershipConfirmation:true};
}
const shoes=()=>[piece('A',{maskId:11,x:.17}),piece('B',{maskId:12,x:.4})];
test('review-only pair suggestion never silently merges or saves the two original regions',()=>{
 const p=shoes(),r=reconcileWardrobeUnits70(p);
 assert.equal(r.suggestedPairs.length,1);assert.equal(r.suggestedPairs[0].status,'suggested_pair');
 assert.deepEqual(r.suggestedPairs[0].ids,['A','B']);
 assert.equal(p.length,2);assert.ok(p.every(x=>x.reconciliation70Status==='unresolved'));
 assert.ok(p.every(x=>!ownerMaySaveUnit70(x,[])));
});
test('one shoe, different colors, unknown color, clipped, overlapping, wrong type and cross-image shoes never suggest a pair',()=>{
 const [a,b]=shoes();
 for(const wrong of [{color:'Red'},{support:.3},{clipped:true},{x:.18},{type:'Boots'},{sourceHash:sha(19)},{sourceId:'another'}]){
  const updated=piece('B',{maskId:12,x:.4,...wrong});
  assert.equal(canSuggestShoePair70(a,updated),false,JSON.stringify(wrong));
 }
 assert.equal(reconcileWardrobeUnits70([a]).suggestedPairs.length,0);
 assert.equal(canSuggestShoePair70(a,piece('B',{maskId:11,x:.4})),false,'identical mask not distinct');
});
test('two color-separated pairs suggest exactly two independent owner decisions',()=>{
 const [a,b]=shoes(),c=piece('C',{maskId:13,x:.65,color:'Blue'}),d=piece('D',{maskId:14,x:.83,color:'Blue'});
 const r=reconcileWardrobeUnits70([a,b,c,d]);assert.equal(r.suggestedPairs.length,2);
 assert.equal(new Set(r.suggestedPairs.flatMap(x=>x.ids)).size,4);
});
test('ambiguous three same-color shoes never force a global match',()=>{
 const a=piece('A',{maskId:1,x:.22}),b=piece('B',{maskId:2,x:.42}),c=piece('C',{maskId:3,x:.62});
 const r=reconcileWardrobeUnits70([a,b,c]);assert.ok(r.suggestedPairs.length<=1);
 assert.ok(r.unpairedFootwearIds.length>=1,'retain ambiguous shoe for owner review');
});
test('two separate identically colored shirts are not merged based on similarity',()=>{
 const a=piece('A',{category:'Tops',type:'T-shirt'}),b=piece('B',{category:'Tops',type:'T-shirt',maskId:31,x:.4});
 const r=reconcileWardrobeUnits70([a,b]);assert.equal(r.suggestedPairs.length,0);assert.equal(r.unresolvedIds.length,2);
});
test('duplicate source/mask remains visible for owner decision, and exact previously saved item cannot silently repeat',()=>{
 const a=piece('A',{maskId:7}),b=piece('B',{maskId:7,x:.4});
 assert.deepEqual(reconcileWardrobeUnits70([a],[b]).suspectedDuplicateIds,['A']);
 assert.equal(ownerMaySaveUnit70({...a,reconciliation70Status:'separate_confirmed'},[b]),false);
});
test('owner-confirmed shoe pair makes exactly one draft retaining all source and companion pixels; does not bypass save approval',()=>{
 const p=shoes(),next=confirmWardrobePair70(p,'A','B',owner);assert.equal(next.length,1);
 assert.equal(next[0].shoePair.confirmedByOwner,true);
 assert.equal(next[0].shoePair.companion.image,p[1].image);
 assert.equal(next[0].originalPhoto.image,p[0].originalPhoto.image);
 assert.equal(next[0].requiresOwnershipConfirmation,true);
 assert.equal(next[0].reconciliation70Status,'paired_confirmed');
 assert.equal(ownerMaySaveUnit70(next[0],[]),true);
 const result=unpairComponents70(next,'A',owner);
 assert.equal(result.companion.image,p[1].image);
 assert.equal(result.first.reconciliation70Status,'separate_confirmed');
});
test('explicit keep separate, combine actual same-category fragments, reject mismatched source and owner',()=>{
 const p=shoes();const separate=keepSeparate70(p,['A','B'],owner);
 assert.ok(separate.every(x=>x.reconciliation70Status==='separate_confirmed'));
 assert.throws(()=>confirmWardrobePair70(p,'A','B','other'));
 assert.throws(()=>confirmWardrobePair70(p,'A','A',owner));
 assert.throws(()=>confirmWardrobePair70([p[0],piece('B',{sourceHash:sha(55),maskId:12})],'A','B',owner));
 const tops=[piece('A',{category:'Tops',maskId:33}),piece('B',{category:'Tops',maskId:34})];
 const merged=confirmWardrobePair70(tops,'A','B',owner,{fragments:true});
 assert.equal(merged.length,1);assert.ok(merged[0].combinedFragments70.confirmedByOwner);
 assert.throws(()=>confirmWardrobePair70([tops[0],piece('B',{category:'Outerwear',maskId:34})],'A','B',owner,{fragments:true}));
});
