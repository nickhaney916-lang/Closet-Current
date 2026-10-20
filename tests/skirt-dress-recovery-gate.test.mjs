import test from 'node:test';
import assert from 'node:assert/strict';
import {recognizeWithRecovery,categoryCandidates} from '../public/recognition-engine.mjs';
import {localCandidates} from '../public/local-catalog.mjs';

const image={width:1200,height:1600,kind:'unclipped-original-rgb'};
const category=(name,score)=>({label:categoryCandidates.find(x=>x.category===name).label,score});
const garment=(type,score)=>({label:localCandidates.find(x=>x.itemType===type).label,score});
const score=(a,b)=>[a,b];
function harness({narrow='Skirt',fullFirst='Casual dress',fullSecond='Skirt',weakBranch=true}={}){
 const calls=[],identified=[];
 const primary=async(photo,labels)=>{
  assert.equal(photo,image,'never process a preview/cropped-output replacement');
  const categoryLabels=categoryCandidates.map(x=>x.label);
  if(labels.includes(categoryLabels[0])){
   calls.push('broad');
   return score(category('Bottoms',.96),category('Dresses',.02));
  }
  calls.push('branch');
  return score(garment('Skirt',.52),garment('Shorts',.44));
 };
 const recovery=(which)=>async(photo,labels)=>{
  assert.equal(photo,image,'all comparisons must use the same original image');
  const hasDress=labels.includes(garment('Casual dress',.5).label);
  const hasOther=labels.includes(garment('T-shirt',.5).label);
  const stage=hasDress?(hasOther?'full-catalog':'balanced'):'bottoms-only';
  calls.push(which+':'+stage);
  const type=stage==='bottoms-only'?narrow:which==='original'?fullFirst:fullSecond;
  const challenger=type==='Casual dress'?'Skirt':type==='Skirt'?'Casual dress':'Skirt';
  return score(garment(type,.95),garment(challenger,.025));
 };
 const settings={recoveryModel:recovery('original'),recoveryConfirmationModel:recovery('independent'),
  confirmationModel:async()=>{throw Error('Optional category confirmation does not exist in this controlled case');},
  onIdentified:choice=>identified.push(choice)};
 return {calls,identified,scan:()=>recognizeWithRecovery(primary,image,settings)};
}
test('independent Bottoms-only skirt votes must NOT auto-index a short dress',async()=>{
 const h=harness({narrow:'Skirt',fullFirst:'Casual dress',fullSecond:'Skirt'});
 const result=await h.scan();
 assert.equal(result.strong,false,'a vocabulary without dresses must never be enough to save Skirt');
 assert.equal(h.identified.length,0,'not even provisional identification may promote the narrow skirt');
 assert.ok(h.calls.includes('original:balanced'));
 assert.ok(h.calls.includes('independent:balanced'));
 assert.equal(result.diagnostics?.skirtDressConflict?.requiresManualReview,true);
 assert.ok(h.calls.some(v=>v==='original:full-catalog'), 'two full-catalog confirmation views remain available');
});
test('a skirt may be recovered only when two dress-inclusive original-photo views agree',async()=>{
 const h=harness({narrow:'Skirt',fullFirst:'Skirt',fullSecond:'Skirt'});
 const result=await h.scan();
 assert.equal(result.strong,true);
 assert.equal(result.choices[0].category,'Bottoms');
 assert.equal(result.choices[0].itemType,'Skirt');
 assert.equal(result.reason,'skirt_dress_independent_agreement');
 assert.equal(h.identified.length,1);
 assert.ok(h.calls.includes('original:balanced'));
 assert.ok(h.calls.includes('independent:balanced'));
});
test('short dresses are not silently converted to skirts by restricted Bottoms comparisons',async()=>{
 const h=harness({narrow:'Skirt',fullFirst:'Casual dress',fullSecond:'Casual dress'});
 const result=await h.scan();
 assert.equal(result.strong,true);
 assert.equal(result.choices[0].category,'Dresses');
 assert.equal(result.choices[0].itemType,'Casual dress');
 assert.equal(result.reason,'skirt_dress_independent_agreement');
 assert.equal(h.identified.length,1);
});
test('strong independent Shorts recovery still works when skirt and dress are considered alternatives',async()=>{
 const h=harness({narrow:'Shorts',fullFirst:'Casual dress',fullSecond:'Skirt'});
 const result=await h.scan();
 assert.equal(result.strong,true);
 assert.equal(result.choices[0].category,'Bottoms');
 assert.equal(result.choices[0].itemType,'Shorts');
 assert.equal(result.reason,'bottoms_independent_agreement');
 assert.equal(h.identified.length,1);
 assert.equal(h.calls.includes('original:balanced'),false,'unneeded model retries are not introduced');
});
